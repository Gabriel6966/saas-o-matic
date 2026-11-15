from decimal import Decimal
import os
import subprocess
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, inspect, select
from sqlalchemy.exc import IntegrityError

from app.config import BACKEND_DIR, Settings
from app.main import create_app, wrap_with_cors
from app.persistence.database import create_database_engine, create_session_factory
from app.persistence.models import Customer, Simulation


def stored_values(customer_id):
    return {
        "customer_id": customer_id, "active_users": 15, "storage_gb": 100, "api_calls": 1000,
        "country_snapshot": "ES", "plan_snapshot": "Plan de prueba",
        "base_cents": 14000, "tax_rate_applied": "0.21", "tax_cents": 2940,
        "total_cents": 16940, "currency": "EUR",
    }


def test_new_session_and_physical_types_are_exact(application, client, simulation_payload):
    response = client.post("/simulations", json=simulation_payload)
    assert response.status_code == 201, response.text
    saved = response.json()
    with application.state.session_factory() as session:
        row = session.get(Simulation, saved["id"])
        assert row.customer_id == simulation_payload["customer_id"]
        assert (row.active_users, row.storage_gb, row.api_calls) == (15, 100, 1000)
        assert row.country_snapshot == "ES" and row.plan_snapshot == "Plan de prueba"
        assert (row.base_cents, row.tax_cents, row.total_cents) == (14000, 2940, 16940)
        assert type(row.base_cents) is type(row.tax_cents) is type(row.total_cents) is int
        assert row.tax_rate_applied == "0.21" and type(row.tax_rate_applied) is str
        assert row.created_at == saved["created_at"]
        assert row.currency == "EUR"
    with application.state.engine.connect() as connection:
        kinds = connection.exec_driver_sql(
            "SELECT typeof(base_cents), typeof(tax_cents), typeof(total_cents), "
            "typeof(tax_rate_applied), typeof(created_at), typeof(storage_gb) FROM simulations"
        ).one()
        assert kinds == ("integer", "integer", "integer", "text", "text", "integer")


def test_fractional_tax_rate_is_preserved_as_text(application, client, simulation_payload, monkeypatch):
    from app.application import simulations as service

    original = service.calculate_quote
    rate = Decimal("0.0005000000000000000001")
    monkeypatch.setattr(service, "calculate_quote", lambda users, country: original(users, country, tax_rates={"ES": rate}))
    saved = client.post("/simulations", json={**simulation_payload, "active_users": 1})
    assert saved.status_code == 201
    assert saved.json()["tax_rate"] == "0.0005000000000000000001"
    assert saved.json()["tax_amount"] == "0.01"
    with application.state.session_factory() as session:
        assert session.get(Simulation, saved.json()["id"]).tax_rate_applied == str(rate)


def test_history_survives_reconnection_without_recalculation(application, client, simulation_payload, monkeypatch):
    from app.application import simulations as service

    saved = client.post("/simulations", json=simulation_payload).json()

    def forbidden(*_args, **_kwargs):
        raise AssertionError("Historical reads must not calculate")

    monkeypatch.setattr(service, "calculate_quote", forbidden)
    application.state.engine.dispose()
    reopened = create_app(Settings(database_url=str(application.state.engine.url)))
    with TestClient(wrap_with_cors(reopened), raise_server_exceptions=False) as other:
        response = other.get(f"/customers/{simulation_payload['customer_id']}/simulations")
        assert response.status_code == 200
        assert response.json()["items"] == [saved]


@pytest.mark.parametrize("patch", [
    {"active_users": -1}, {"active_users": 1_000_001}, {"active_users": 1.5},
    {"storage_gb": -1}, {"storage_gb": 1_000_001}, {"storage_gb": 1.5},
    {"api_calls": -1}, {"api_calls": 1_000_001}, {"api_calls": 1.5},
    {"base_cents": -1}, {"tax_cents": -1}, {"total_cents": -1},
    {"base_cents": 14000.5}, {"tax_cents": 2940.5}, {"total_cents": 16940.5},
    {"total_cents": 1}, {"currency": "USD"}, {"tax_rate_applied": ""},
])
def test_sqlite_constraints_reject_invalid_rows(application, customer, patch):
    with application.state.session_factory() as session:
        with pytest.raises(IntegrityError):
            with session.begin():
                session.add(Simulation(**{**stored_values(customer["id"]), **patch}))
                session.flush()
        assert not session.in_transaction()
        assert session.scalar(select(func.count()).select_from(Simulation)) == 0


def test_fk_rejects_unknown_customer_and_preserves_history_on_delete(application, client, simulation_payload):
    with application.state.session_factory() as session:
        with pytest.raises(IntegrityError):
            with session.begin():
                session.add(Simulation(**stored_values(999)))
                session.flush()
    saved = client.post("/simulations", json=simulation_payload).json()
    with application.state.session_factory() as session:
        with pytest.raises(IntegrityError):
            with session.begin():
                session.execute(delete(Customer).where(Customer.id == simulation_payload["customer_id"]))
        assert session.get(Customer, simulation_payload["customer_id"]) is not None
        assert session.get(Simulation, saved["id"]) is not None
    inspector = inspect(application.state.engine)
    foreign_key = inspector.get_foreign_keys("simulations")[0]
    assert foreign_key["referred_table"] == "customers"
    assert foreign_key["options"]["ondelete"] == "RESTRICT"
    assert "ix_simulations_customer_history" in {item["name"] for item in inspector.get_indexes("simulations")}


def test_explicit_init_adds_table_to_customer_database_without_losing_data(tmp_path, customer_payload):
    path = tmp_path / "legacy-customer.sqlite3"
    url = f"sqlite:///{path}"
    engine = create_database_engine(url)
    Customer.__table__.create(engine)
    factory = create_session_factory(engine)
    with factory() as session, session.begin():
        session.add(Customer(
            id=7, company_name=customer_payload["company_name"],
            tax_identifier_normalized=customer_payload["tax_identifier"],
            email=customer_payload["email"], country_code="ES", plan=customer_payload["plan"],
        ))
    assert inspect(engine).get_table_names() == ["customers"]
    engine.dispose()
    command = [sys.executable, "-B", str(BACKEND_DIR / "init_db.py")]
    environment = {**os.environ, "DATABASE_URL": url}
    first = subprocess.run(command, cwd=tmp_path, env=environment, capture_output=True, text=True, timeout=20)
    assert first.returncode == 0, first.stdout + first.stderr
    assert inspect(engine).get_table_names() == ["customers", "simulations"]
    with factory() as session, session.begin():
        assert session.get(Customer, 7).email == customer_payload["email"]
        session.add(Simulation(**stored_values(7)))
    engine.dispose()
    second = subprocess.run(command, cwd=tmp_path, env=environment, capture_output=True, text=True, timeout=20)
    assert second.returncode == 0, second.stdout + second.stderr
    with factory() as session:
        assert session.scalar(select(func.count()).select_from(Customer)) == 1
        assert session.scalar(select(func.count()).select_from(Simulation)) == 1
    engine.dispose()


def test_preview_works_without_simulation_table_and_does_not_initialize_it(tmp_path, customer_payload):
    application = create_app(Settings(database_url=f"sqlite:///{tmp_path / 'preview-only.sqlite3'}"))
    Customer.__table__.create(application.state.engine)
    with TestClient(wrap_with_cors(application), raise_server_exceptions=False) as client:
        customer = client.post("/customers", json=customer_payload)
        assert customer.status_code == 201
        inputs = {"customer_id": customer.json()["id"], "active_users": 15, "storage_gb": 100, "api_calls": 1000}
        assert client.post("/simulations/preview", json=inputs).status_code == 200
        assert client.post("/simulations", json=inputs).status_code == 500
        assert inspect(application.state.engine).get_table_names() == ["customers"]
