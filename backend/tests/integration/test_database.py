import os
from pathlib import Path
import sqlite3
import subprocess
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.config import BACKEND_DIR, Settings
from app.main import create_app
from app.persistence import customers as repository
from app.persistence.database import create_database_engine
from app.persistence.models import Customer


def test_reconnection_preserves_data_without_reinitializing(application, client, customer_payload):
    created = client.post("/customers", json=customer_payload).json()
    database_url = str(application.state.engine.url)
    application.state.engine.dispose()
    reopened = create_app(Settings(database_url=database_url))
    with TestClient(reopened) as other_client:
        assert other_client.get(f"/customers/{created['id']}").json() == created
        assert inspect(reopened.state.engine).get_table_names() == ["customers", "simulations"]


def test_database_enforces_composite_uniqueness(application, client, customer_payload):
    assert client.post("/customers", json=customer_payload).status_code == 201
    with application.state.session_factory() as session:
        with pytest.raises(IntegrityError) as error:
            with session.begin():
                session.add(Customer(
                    company_name="Otra empresa ficticia", tax_identifier_normalized="00000023T",
                    email="otro@example.com", country_code="ES", plan="Otro",
                ))
                session.flush()
        assert error.value.orig.sqlite_errorcode == sqlite3.SQLITE_CONSTRAINT_UNIQUE
        assert not session.in_transaction()
    assert client.get("/customers").json()["total_count"] == 1


def test_each_connection_has_foreign_keys_and_unicode_function(application):
    engine = application.state.engine
    with engine.connect() as first, engine.connect() as second:
        assert first.connection.driver_connection is not second.connection.driver_connection
        for connection in (first, second):
            assert connection.exec_driver_sql("PRAGMA foreign_keys").scalar() == 1
            assert connection.exec_driver_sql("SELECT unicode_casefold('Straße')").scalar() == "strasse"
            assert connection.exec_driver_sql("SELECT unicode_casefold('ÁBACO')").scalar() == "ábaco"
    engine.dispose()
    with engine.connect() as reconnected:
        assert reconnected.exec_driver_sql("PRAGMA foreign_keys").scalar() == 1
        assert reconnected.exec_driver_sql("SELECT unicode_casefold('Straße')").scalar() == "strasse"


def test_sessions_are_independent_and_closed_on_success_and_conflict(application, customer_payload):
    created, closed = [], []

    class TrackedSession(Session):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            created.append(self)

        def close(self):
            super().close()
            closed.append(self)

    application.state.session_factory = sessionmaker(
        bind=application.state.engine, class_=TrackedSession, expire_on_commit=False,
    )
    with TestClient(application) as client:
        assert client.post("/customers", json=customer_payload).status_code == 201
        assert client.get("/customers/1").status_code == 200
        assert client.post("/customers", json=customer_payload).status_code == 409
    assert len(created) == 3
    assert len({id(session) for session in created}) == 3
    assert closed == created
    assert all(not session.in_transaction() for session in closed)


def test_unexpected_failure_rolls_back_and_does_not_leak(client, customer_payload, monkeypatch):
    original = repository.insert_customer

    def fail_after_flush(*args, **kwargs):
        original(*args, **kwargs)
        raise RuntimeError("private@example.com 00000023T SQL driver internals")

    with monkeypatch.context() as patch:
        patch.setattr(repository, "insert_customer", fail_after_flush)
        response = client.post("/customers", json=customer_payload)
    assert response.status_code == 500
    assert response.json() == {"error": {
        "code": "internal_error", "message": "Se ha producido un error interno.", "details": [],
    }}
    assert client.get("/customers").json()["total_count"] == 0
    assert client.post("/customers", json=customer_payload).status_code == 201


def test_schema_is_never_created_by_startup_or_requests(tmp_path):
    path = tmp_path / "not-initialized.sqlite3"
    application = create_app(Settings(database_url=f"sqlite:///{path}"))
    assert not path.exists()
    with TestClient(application, raise_server_exceptions=False) as client:
        assert client.get("/customers").status_code == 500
        assert inspect(application.state.engine).get_table_names() == []


def test_relative_database_path_does_not_depend_on_working_directory(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    engine = create_database_engine("sqlite:///data/path-check.sqlite3")
    assert Path(engine.url.database) == BACKEND_DIR / "data" / "path-check.sqlite3"
    engine.dispose()


def test_explicit_init_command_is_reproducible_from_another_directory(tmp_path):
    path = tmp_path / "cli" / "customers.sqlite3"
    environment = {**os.environ, "DATABASE_URL": f"sqlite:///{path}"}
    command = [sys.executable, "-B", str(BACKEND_DIR / "init_db.py")]
    for _ in range(2):
        result = subprocess.run(command, cwd=tmp_path, env=environment, capture_output=True, text=True, timeout=20)
        assert result.returncode == 0, result.stdout + result.stderr
    engine = create_database_engine(f"sqlite:///{path}")
    try:
        assert inspect(engine).get_table_names() == ["customers", "simulations"]
    finally:
        engine.dispose()


def test_environment_configuration_and_cors_validation(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///data/config-check.sqlite3")
    monkeypatch.setenv("CORS_ORIGINS", " http://localhost:4200, http://127.0.0.1:4200 ")
    settings = Settings.from_env()
    assert settings.database_url == "sqlite:///data/config-check.sqlite3"
    assert settings.cors_origins == ("http://localhost:4200", "http://127.0.0.1:4200")
    with pytest.raises(ValueError):
        Settings(cors_origins=("*",))
