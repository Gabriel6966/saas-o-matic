import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app, wrap_with_cors
from app.persistence.database import initialize_schema


@pytest.fixture
def application(tmp_path):
    application = create_app(Settings(
        database_url=f"sqlite:///{tmp_path / 'customers.sqlite3'}",
        cors_origins=("http://localhost:4200",),
    ))
    initialize_schema(application.state.engine)
    yield application
    application.state.engine.dispose()


@pytest.fixture
def client(application):
    with TestClient(wrap_with_cors(application), raise_server_exceptions=False) as client:
        yield client


@pytest.fixture
def customer_payload():
    return {
        "company_name": "Empresa Ficticia Alfa",
        "tax_identifier": "00000023T",
        "email": "Pruebas@example.com",
        "country_code": "ES",
        "plan": "Plan de prueba",
    }


@pytest.fixture
def customer(client, customer_payload):
    response = client.post("/customers", json=customer_payload)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
def simulation_payload(customer):
    return {
        "customer_id": customer["id"], "active_users": 15,
        "storage_gb": 100, "api_calls": 1000,
    }
