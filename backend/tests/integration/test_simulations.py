from datetime import UTC, datetime
from decimal import Decimal
import re

import pytest
from sqlalchemy import event, func, select

from app.application import simulations as service
from app.persistence import simulations as repository
from app.persistence.models import Customer, Simulation

POST_PATHS = ["/simulations/preview", "/simulations"]


def row_count(application):
    with application.state.session_factory() as session:
        return session.scalar(select(func.count()).select_from(Simulation))


def assert_error(response, status, code):
    assert response.status_code == status, response.text
    error = response.json()["error"]
    assert set(response.json()) == {"error"}
    assert set(error) == {"code", "message", "details"}
    assert error["code"] == code
    assert isinstance(error["details"], list)
    for detail in error["details"]:
        assert set(detail) == {"field", "code", "message"}
    return error


@pytest.mark.parametrize("path", POST_PATHS)
@pytest.mark.parametrize(("users", "base"), [
    (0, "0.00"), (1, "10.00"), (10, "100.00"), (11, "108.00"),
    (15, "140.00"), (50, "420.00"), (51, "425.00"),
])
@pytest.mark.parametrize(("country", "rate"), [("ES", "0.21"), ("FR", "0.20"), ("DE", "0.19")])
def test_approved_tiers_and_countries(client, customer_payload, path, users, base, country, rate):
    customer = client.post("/customers", json={**customer_payload, "country_code": country}).json()
    response = client.post(path, json={
        "customer_id": customer["id"], "active_users": users, "storage_gb": 100, "api_calls": 1000,
    })
    assert response.status_code == (200 if path.endswith("preview") else 201), response.text
    quote = response.json()
    assert quote["base_amount"] == base
    assert quote["tax_rate"] == rate
    # These approved whole-EUR bases produce exact cents at all three rates.
    expected_tax = Decimal(base) * Decimal(rate)
    assert quote["tax_amount"] == format(expected_tax, ".2f")
    assert quote["total_amount"] == format(Decimal(base) + expected_tax, ".2f")
    assert quote["currency"] == "EUR"
    for field in ("base_amount", "tax_amount", "total_amount"):
        assert isinstance(quote[field], str)
        assert re.fullmatch(r"[0-9]+\.[0-9]{2}", quote[field])


def test_preview_matches_save_and_has_no_persistence_fields(client, customer, simulation_payload):
    preview = client.post("/simulations/preview", json=simulation_payload)
    assert preview.status_code == 200
    expected = {
        **simulation_payload, "country_code": "ES", "plan": customer["plan"],
        "base_amount": "140.00", "tax_rate": "0.21", "tax_amount": "29.40",
        "total_amount": "169.40", "currency": "EUR",
    }
    assert preview.json() == expected
    before = datetime.now(UTC).replace(microsecond=0)
    saved = client.post("/simulations", json=simulation_payload)
    after = datetime.now(UTC).replace(microsecond=0)
    assert saved.status_code == 201, saved.text
    result = saved.json()
    assert {key: result[key] for key in expected} == expected
    assert set(result) == set(expected) | {"id", "created_at"}
    assert "location" not in saved.headers
    assert before <= datetime.fromisoformat(result["created_at"]) <= after
    assert result["created_at"].endswith("Z")


def test_repeated_preview_does_not_write_or_change_saved_rows(application, client, simulation_payload):
    saved = client.post("/simulations", json=simulation_payload).json()
    operations = []

    def capture(_connection, _cursor, statement, _parameters, _context, _many):
        operations.append(statement.lstrip().split()[0].upper())

    event.listen(application.state.engine, "before_cursor_execute", capture)
    try:
        for users in (0, 15, 51):
            response = client.post("/simulations/preview", json={**simulation_payload, "active_users": users})
            assert response.status_code == 200
            assert "id" not in response.json() and "created_at" not in response.json()
    finally:
        event.remove(application.state.engine, "before_cursor_execute", capture)
    assert not {"INSERT", "UPDATE", "DELETE"}.intersection(operations)
    assert row_count(application) == 1
    assert client.get(f"/customers/{simulation_payload['customer_id']}/simulations").json()["items"] == [saved]


def test_save_recalculates_with_current_policy_and_context(client, application, simulation_payload, monkeypatch):
    original = service.calculate_quote
    rates, calls = {"ES": Decimal("0.21"), "DE": Decimal("0.19")}, []

    def calculate(users, country):
        calls.append((users, country))
        return original(users, country, tax_rates=rates)

    monkeypatch.setattr(service, "calculate_quote", calculate)
    preview = client.post("/simulations/preview", json=simulation_payload).json()
    rates["ES"] = Decimal("0.20")  # Synthetic in-test policy update, not a business-rule change.
    saved = client.post("/simulations", json=simulation_payload)
    assert saved.status_code == 201
    assert preview["tax_amount"] == "29.40"
    assert saved.json()["tax_amount"] == "28.00" and saved.json()["tax_rate"] == "0.20"
    with application.state.session_factory() as session, session.begin():
        customer = session.get(Customer, simulation_payload["customer_id"])
        customer.country_code, customer.plan = "DE", "Otro plan de prueba"
    changed = client.post("/simulations", json=simulation_payload).json()
    assert changed["country_code"] == "DE" and changed["plan"] == "Otro plan de prueba"
    assert changed["tax_amount"] == "26.60"
    assert calls == [(15, "ES"), (15, "ES"), (15, "DE")]


@pytest.mark.parametrize("path", POST_PATHS)
def test_half_cent_and_exact_rate_through_shared_engine(client, simulation_payload, monkeypatch, path):
    original = service.calculate_quote
    monkeypatch.setattr(service, "calculate_quote", lambda users, country: original(users, country, tax_rates={"ES": Decimal("0.0005")}))
    response = client.post(path, json={**simulation_payload, "active_users": 1})
    assert response.status_code == (200 if path.endswith("preview") else 201)
    assert response.json()["tax_rate"] == "0.0005"
    assert response.json()["tax_amount"] == "0.01"
    assert response.json()["total_amount"] == "10.01"


@pytest.mark.parametrize("path", POST_PATHS)
@pytest.mark.parametrize("field", ["active_users", "storage_gb", "api_calls"])
@pytest.mark.parametrize("value", [True, False, "1", 1.0, 1.5, None, -1, 1_000_001, [], {}])
def test_strict_consumption_fields(application, client, simulation_payload, path, field, value):
    response = client.post(path, json={**simulation_payload, field: value})
    error = assert_error(response, 422, "validation_error")
    assert any(detail["field"] == field for detail in error["details"])
    assert row_count(application) == 0


@pytest.mark.parametrize("path", POST_PATHS)
@pytest.mark.parametrize("value", [True, False, "1", 1.0, 1.5, None, 0, -1, 9_007_199_254_740_992, [], {}])
def test_strict_customer_id(application, client, simulation_payload, path, value):
    assert_error(client.post(path, json={**simulation_payload, "customer_id": value}), 422, "validation_error")
    assert row_count(application) == 0


@pytest.mark.parametrize("path", POST_PATHS)
@pytest.mark.parametrize("field", ["customer_id", "active_users", "storage_gb", "api_calls"])
def test_missing_input(application, client, simulation_payload, path, field):
    inputs = dict(simulation_payload)
    inputs.pop(field)
    assert_error(client.post(path, json=inputs), 422, "validation_error")
    assert row_count(application) == 0


@pytest.mark.parametrize("path", POST_PATHS)
@pytest.mark.parametrize("field", ["base_amount", "total_amount", "tax_rate", "country_code", "plan", "currency", "id", "created_at", "private@example.com"])
def test_extra_fields_rejected_before_calculation(application, client, simulation_payload, monkeypatch, path, field):
    def forbidden(*_args, **_kwargs):
        raise AssertionError("Calculation must not run with invalid fields")

    monkeypatch.setattr(service, "calculate_quote", forbidden)
    response = client.post(path, json={**simulation_payload, field: "untrusted"})
    error = assert_error(response, 422, "validation_error")
    assert error["details"][0]["code"] == "unknown_field"
    assert error["details"][0]["field"] == "body"
    assert "private@example.com" not in response.text and "untrusted" not in response.text
    assert row_count(application) == 0


@pytest.mark.parametrize("path", POST_PATHS)
def test_maximums_are_accepted_without_additional_charges(client, simulation_payload, path):
    response = client.post(path, json={**simulation_payload, "active_users": 1_000_000, "storage_gb": 1_000_000, "api_calls": 1_000_000})
    assert response.status_code == (200 if path.endswith("preview") else 201)
    assert response.json()["base_amount"] == "5000170.00"
    assert response.json()["tax_amount"] == "1050035.70"
    assert response.json()["total_amount"] == "6050205.70"


@pytest.mark.parametrize("path", POST_PATHS)
def test_unknown_customer_is_404_and_no_calculation(application, client, monkeypatch, path):
    def forbidden(*_args, **_kwargs):
        raise AssertionError("Calculation must not run without a customer")

    monkeypatch.setattr(service, "calculate_quote", forbidden)
    inputs = {"customer_id": 9_007_199_254_740_991, "active_users": 0, "storage_gb": 0, "api_calls": 0}
    assert_error(client.post(path, json=inputs), 404, "customer_not_found")
    assert row_count(application) == 0


@pytest.mark.parametrize("path", POST_PATHS)
@pytest.mark.parametrize("users", [0, 15])
def test_country_without_policy_is_422(application, client, customer_payload, path, users):
    customer = client.post("/customers", json={**customer_payload, "country_code": "GB"})
    assert customer.status_code == 201
    inputs = {"customer_id": customer.json()["id"], "active_users": users, "storage_gb": 0, "api_calls": 0}
    response = client.post(path, json=inputs)
    assert_error(response, 422, "tax_policy_not_configured")
    assert row_count(application) == 0


@pytest.mark.parametrize("path", POST_PATHS)
def test_transport_and_unknown_query(application, client, simulation_payload, path):
    assert_error(client.post(path, content="{}", headers={"Content-Type": "text/plain"}), 415, "unsupported_media_type")
    assert_error(client.post(path, content="{", headers={"Content-Type": "application/json"}), 400, "invalid_json")
    assert_error(client.post(path, params={"q": "x"}, json=simulation_payload), 422, "validation_error")
    assert row_count(application) == 0


def test_failed_save_rolls_back_and_keeps_cors(application, client, simulation_payload, monkeypatch):
    original = repository.insert_simulation

    def fail_after_flush(*args, **kwargs):
        original(*args, **kwargs)
        raise RuntimeError("SQL private@example.com 00000023T")

    with monkeypatch.context() as patch:
        patch.setattr(repository, "insert_simulation", fail_after_flush)
        response = client.post("/simulations", json=simulation_payload, headers={"Origin": "http://localhost:4200"})
    error = assert_error(response, 500, "internal_error")
    assert error["details"] == []
    assert response.headers["access-control-allow-origin"] == "http://localhost:4200"
    assert "private@example.com" not in response.text and "00000023T" not in response.text
    assert row_count(application) == 0
    assert client.post("/simulations", json=simulation_payload).status_code == 201
    assert row_count(application) == 1


def test_history_is_snapshot_and_never_recalculates(application, client, simulation_payload, monkeypatch):
    saved = client.post("/simulations", json=simulation_payload).json()
    with application.state.session_factory() as session, session.begin():
        customer = session.get(Customer, simulation_payload["customer_id"])
        customer.country_code, customer.plan = "GB", "Nuevo plan sin política"

    def forbidden(*_args, **_kwargs):
        raise AssertionError("History must never call the calculator or current policy")

    monkeypatch.setattr(service, "calculate_quote", forbidden)
    history = client.get(f"/customers/{simulation_payload['customer_id']}/simulations")
    assert history.status_code == 200
    assert history.json()["items"] == [saved]
    assert saved["country_code"] == "ES" and saved["tax_rate"] == "0.21"
    assert saved["plan"] == "Plan de prueba"


def test_repeated_posts_create_distinct_records(application, client, simulation_payload):
    first = client.post("/simulations", json=simulation_payload)
    second = client.post("/simulations", json=simulation_payload)
    assert first.status_code == second.status_code == 201
    assert first.json()["id"] != second.json()["id"]
    assert row_count(application) == 2


def test_history_filters_counts_orders_and_paginates(application, client, customer_payload, simulation_payload):
    saved = [client.post("/simulations", json=simulation_payload).json() for _ in range(5)]
    timestamps = ["2026-11-14T12:00:00Z", "2026-11-14T13:00:00Z", "2026-11-14T11:00:00Z", "2026-11-14T13:00:00Z", "2026-11-14T10:00:00Z"]
    with application.state.session_factory() as session, session.begin():
        for record, timestamp in zip(saved, timestamps):
            session.get(Simulation, record["id"]).created_at = timestamp
    other = client.post("/customers", json={**customer_payload, "tax_identifier": "00000000T"}).json()
    for _ in range(2):
        assert client.post("/simulations", json={**simulation_payload, "customer_id": other["id"]}).status_code == 201
    url = f"/customers/{simulation_payload['customer_id']}/simulations"
    expected_ids = [saved[index]["id"] for index in (3, 1, 0, 2, 4)]
    result = client.get(url).json()
    assert [item["id"] for item in result["items"]] == expected_ids
    assert result["limit"] == 20 and result["offset"] == 0 and result["total_count"] == 5
    page = client.get(url, params={"limit": 2, "offset": 1}).json()
    assert [item["id"] for item in page["items"]] == expected_ids[1:3]
    assert page["total_count"] == 5 and page["limit"] == 2 and page["offset"] == 1
    beyond = client.get(url, params={"offset": 100}).json()
    assert beyond["items"] == [] and beyond["total_count"] == 5
    other_history = client.get(f"/customers/{other['id']}/simulations").json()
    assert other_history["total_count"] == 2
    assert all(item["customer_id"] == other["id"] for item in other_history["items"])


def test_empty_and_missing_customer_history(client, customer):
    assert client.get(f"/customers/{customer['id']}/simulations").json() == {"items": [], "limit": 20, "offset": 0, "total_count": 0}
    assert_error(client.get("/customers/999/simulations"), 404, "customer_not_found")


@pytest.mark.parametrize("params", [{"limit": "0"}, {"limit": "101"}, {"limit": "1.0"}, {"limit": "true"}, {"offset": "-1"}, {"offset": "9007199254740992"}, {"q": "x"}, {"private@example.com": "secret"}])
def test_history_query_validation(client, customer, params):
    response = client.get(f"/customers/{customer['id']}/simulations", params=params)
    assert_error(response, 422, "validation_error")
    assert "private@example.com" not in response.text and "secret" not in response.text


@pytest.mark.parametrize("customer_id", ["0", "-1", "abc", "1.0", "true", "9007199254740992"])
def test_history_id_validation(client, customer_id):
    assert_error(client.get(f"/customers/{customer_id}/simulations"), 422, "validation_error")


def test_new_contracts_and_cors(client, simulation_payload):
    headers = {"Origin": "http://localhost:4200"}
    for path in POST_PATHS:
        response = client.post(path, json=simulation_payload, headers=headers)
        assert response.status_code == (200 if path.endswith("preview") else 201)
        assert response.headers["access-control-allow-origin"] == headers["Origin"]
        assert "access-control-allow-credentials" not in response.headers
    paths = client.get("/openapi.json").json()["paths"]
    assert set(paths) == {"/customers", "/customers/{customer_id}", "/customers/{customer_id}/simulations", "/simulations/preview", "/simulations"}
    assert sum(len(operations) for operations in paths.values()) == 6
    for path in POST_PATHS:
        assert paths[path]["post"]["responses"]["422"]["content"]["application/json"]["schema"] == {"$ref": "#/components/schemas/ErrorEnvelope"}
