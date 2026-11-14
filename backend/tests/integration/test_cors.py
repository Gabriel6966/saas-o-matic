import os
import subprocess
import sys
import textwrap

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_session
from app.config import BACKEND_DIR, Settings
from app.main import create_app, wrap_with_cors

ALLOWED_ORIGIN = "http://localhost:4200"
REJECTED_ORIGIN = "https://untrusted.example"


@pytest.mark.parametrize(
    ("origin", "expected_origin"),
    [(ALLOWED_ORIGIN, ALLOWED_ORIGIN), (REJECTED_ORIGIN, None)],
    ids=["allowed", "rejected"],
)
def test_unexpected_error_keeps_json_and_cors_policy(
    application, client, monkeypatch, origin, expected_origin,
):
    def unavailable_session():
        raise RuntimeError("SQL internals: private@example.com 00000023T")

    monkeypatch.setitem(application.dependency_overrides, get_session, unavailable_session)
    response = client.get("/customers", headers={"Origin": origin})

    assert response.status_code == 500
    assert response.json() == {"error": {
        "code": "internal_error", "message": "Se ha producido un error interno.", "details": [],
    }}
    assert response.headers.get("access-control-allow-origin") == expected_origin
    assert "access-control-allow-credentials" not in response.headers


def test_validation_error_remains_readable_from_allowed_origin(client):
    response = client.get("/customers", params={"limit": "0"}, headers={"Origin": ALLOWED_ORIGIN})

    assert response.status_code == 422
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert response.json()["error"]["code"] == "validation_error"
    assert response.json()["error"]["details"][0]["code"] == "out_of_range"
    assert "access-control-allow-credentials" not in response.headers


def test_success_keeps_cors_and_location(client, customer_payload):
    response = client.post("/customers", json=customer_payload, headers={"Origin": ALLOWED_ORIGIN})

    assert response.status_code == 201
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert response.headers["access-control-expose-headers"] == "Location"
    assert response.headers["location"] == f"/customers/{response.json()['id']}"
    assert "access-control-allow-credentials" not in response.headers


def test_allowed_preflight_preserves_method_and_header_restrictions(client):
    response = client.options("/customers", headers={
        "Origin": ALLOWED_ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert {method.strip() for method in response.headers["access-control-allow-methods"].split(",")} == {"GET", "POST"}
    assert "*" not in response.headers["access-control-allow-headers"]
    assert "access-control-allow-credentials" not in response.headers


@pytest.mark.parametrize(
    "headers",
    [
        {"Origin": REJECTED_ORIGIN, "Access-Control-Request-Method": "POST"},
        {"Origin": ALLOWED_ORIGIN, "Access-Control-Request-Method": "DELETE"},
        {"Origin": ALLOWED_ORIGIN, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization"},
    ],
    ids=["origin", "method", "header"],
)
def test_disallowed_preflight_is_not_relaxed(client, headers):
    response = client.options("/customers", headers=headers)

    assert response.status_code == 400
    if headers["Origin"] == REJECTED_ORIGIN:
        assert "access-control-allow-origin" not in response.headers


def test_documented_entrypoint_preserves_docs_and_dependency_overrides():
    # Import the real entrypoint with isolated settings, regardless of the user's env.
    script = textwrap.dedent("""
        from fastapi.testclient import TestClient
        from app.api.dependencies import get_session
        from app.main import api_app, app

        called = []
        def unavailable_session():
            called.append(True)
            raise RuntimeError("Simulated persistence failure")

        api_app.dependency_overrides[get_session] = unavailable_session
        with TestClient(app, raise_server_exceptions=False) as client:
            assert client.get("/docs").status_code == 200
            assert set(client.get("/openapi.json").json()["paths"]) == {
                "/customers", "/customers/{customer_id}",
            }
            response = client.get("/customers", headers={"Origin": "http://localhost:4200"})
        assert called == [True]
        assert response.status_code == 500
        assert response.json()["error"]["code"] == "internal_error"
        assert response.headers["access-control-allow-origin"] == "http://localhost:4200"
    """)
    result = subprocess.run(
        [sys.executable, "-B", "-c", script], cwd=BACKEND_DIR,
        env={**os.environ, "DATABASE_URL": "sqlite:///:memory:", "CORS_ORIGINS": ALLOWED_ORIGIN},
        capture_output=True, text=True, timeout=20,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_wrapper_preserves_application_lifespan(application, monkeypatch):
    disposed = []
    original_dispose = application.state.engine.dispose

    def dispose():
        disposed.append(True)
        original_dispose()

    monkeypatch.setattr(application.state.engine, "dispose", dispose)
    with TestClient(wrap_with_cors(application)) as client:
        assert client.get("/docs").status_code == 200
        assert disposed == []
    assert disposed == [True]


def test_wrapper_respects_configured_origins():
    origin = "http://127.0.0.1:4300"
    api = create_app(Settings(database_url="sqlite:///:memory:", cors_origins=(origin,)))
    with TestClient(wrap_with_cors(api)) as client:
        allowed = client.get("/docs", headers={"Origin": origin})
        rejected = client.get("/docs", headers={"Origin": ALLOWED_ORIGIN})
    assert allowed.headers["access-control-allow-origin"] == origin
    assert "access-control-allow-origin" not in rejected.headers
