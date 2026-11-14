import pytest


def assert_error(response, status, code):
    assert response.status_code == status, response.text
    payload = response.json()
    assert set(payload) == {"error"}
    assert set(payload["error"]) == {"code", "message", "details"}
    assert payload["error"]["code"] == code
    assert isinstance(payload["error"]["message"], str)
    assert isinstance(payload["error"]["details"], list)
    for detail in payload["error"]["details"]:
        assert set(detail) == {"field", "code", "message"}
    return payload["error"]


def test_create_normalizes_and_persists(client, customer_payload):
    raw = {key: " " + value + " " for key, value in customer_payload.items()}
    raw.update(tax_identifier=" 00000023t ", country_code=" es ", email=" Pruebas@EXAMPLE.COM ")
    response = client.post("/customers", json=raw)
    assert response.status_code == 201, response.text
    expected = {"id": 1, **customer_payload}
    assert response.json() == expected
    assert response.headers["location"] == "/customers/1"
    assert client.get(response.headers["location"]).json() == expected
    collection = client.get("/customers").json()
    assert collection == {
        "items": [{key: expected[key] for key in ("id", "company_name", "tax_identifier", "country_code")}],
        "limit": 20, "offset": 0, "total_count": 1,
    }


def test_uniqueness_is_country_and_tax_not_email(client, customer_payload):
    assert client.post("/customers", json=customer_payload).status_code == 201
    duplicate = {**customer_payload, "tax_identifier": " 00000023t ", "email": "otro@example.com"}
    assert_error(client.post("/customers", json=duplicate), 409, "customer_already_exists")
    another_country = {**customer_payload, "country_code": "FR"}
    assert client.post("/customers", json=another_country).status_code == 201
    another_tax = {**customer_payload, "tax_identifier": "00000000T"}
    assert client.post("/customers", json=another_tax).status_code == 201
    assert client.get("/customers").json()["total_count"] == 3


@pytest.mark.parametrize("country", ["US", "GB", "ZZ"])
def test_registration_does_not_require_a_tax_policy(client, customer_payload, country):
    response = client.post("/customers", json={**customer_payload, "country_code": country})
    assert response.status_code == 201
    assert response.json()["country_code"] == country


@pytest.mark.parametrize(("identifier", "code"), [
    ("00000023R", "invalid_tax_identifier_checksum"),
    ("Y0000000T", "invalid_tax_identifier_checksum"),
    ("B0000006G", "invalid_tax_identifier_checksum"),
    ("P00000067", "invalid_tax_identifier_checksum"),
    ("ES00000023T", "invalid_tax_identifier_format"),
    ("0000 0023T", "invalid_tax_identifier_format"),
    ("K0000001R", "unsupported_tax_identifier"),
    ("L0000001R", "unsupported_tax_identifier"),
    ("M0000001R", "unsupported_tax_identifier"),
    ("X00000000T", "unsupported_tax_identifier"),
])
def test_fiscal_errors_are_explicit_and_do_not_insert(client, customer_payload, identifier, code):
    response = client.post("/customers", json={**customer_payload, "tax_identifier": identifier})
    assert_error(response, 422, code)
    assert identifier not in response.text
    assert client.get("/customers").json()["total_count"] == 0


@pytest.mark.parametrize("identifier", ["X0000000T", "Y0000000Z", "Z0000000M", "B00000067", "P0000006G"])
def test_accepted_families_pass_through_http(client, customer_payload, identifier):
    response = client.post("/customers", json={**customer_payload, "tax_identifier": identifier})
    assert response.status_code == 201
    assert response.json()["tax_identifier"] == identifier


@pytest.mark.parametrize(("field", "value"), [
    ("company_name", ""), ("company_name", "   "), ("company_name", "a" * 201),
    ("company_name", 123), ("company_name", True), ("company_name", "Empresa\nFicticia"),
    ("tax_identifier", ""), ("tax_identifier", "A" * 33), ("tax_identifier", 23),
    ("email", "x"), ("email", "no-es-un-correo"),
    ("email", "Nombre <prueba@example.com>"), ("email", "a" * 255),
    ("email", "p\nrueba@example.com"),
    ("country_code", "ESP"), ("country_code", "E1"), ("country_code", "eſ"),
    ("plan", ""), ("plan", "a" * 101), ("plan", 3.5), ("plan", []),
])
def test_invalid_fields_fail_without_persisting(client, customer_payload, field, value):
    response = client.post("/customers", json={**customer_payload, field: value})
    assert_error(response, 422, "validation_error")
    assert client.get("/customers").json()["total_count"] == 0


@pytest.mark.parametrize("field", ["company_name", "tax_identifier", "email", "country_code", "plan"])
@pytest.mark.parametrize("missing", [False, True])
def test_null_and_missing_fields(client, customer_payload, field, missing):
    payload = {**customer_payload, field: None}
    if missing:
        payload.pop(field)
    assert_error(client.post("/customers", json=payload), 422, "validation_error")


def test_extra_fields_are_rejected_without_echoing_sensitive_names(client, customer_payload):
    secret = "private@example.com"
    response = client.post("/customers", json={**customer_payload, secret: "00000023T"})
    error = assert_error(response, 422, "validation_error")
    assert error["details"] == [{
        "field": "body", "code": "unknown_field", "message": "Campo no definido en el contrato."
    }]
    for value in (secret, customer_payload["email"], customer_payload["tax_identifier"]):
        assert value not in response.text


@pytest.mark.parametrize("body", ['{"company_name":', '{', b'\xff', '', 'NaN', 'Infinity', '{"plan":NaN}'])
def test_malformed_json(client, body):
    assert_error(client.post("/customers", content=body, headers={"Content-Type": "application/json"}), 400, "invalid_json")


@pytest.mark.parametrize("media_type", [None, "text/plain", "application/x-www-form-urlencoded", "application/problem+json"])
def test_unsupported_content_type(client, media_type):
    headers = {"Content-Type": media_type} if media_type else {}
    assert_error(client.post("/customers", content="{}", headers=headers), 415, "unsupported_media_type")


def test_json_charset_is_accepted(client, customer_payload):
    import json
    response = client.post("/customers", content=json.dumps(customer_payload), headers={"Content-Type": "application/json; charset=utf-8"})
    assert response.status_code == 201


@pytest.mark.parametrize("body", [None, [], "texto", 1, True])
def test_valid_json_with_wrong_body_shape(client, body):
    import json
    response = client.post("/customers", content=json.dumps(body), headers={"Content-Type": "application/json"})
    assert_error(response, 422, "validation_error")


def test_boundary_lengths_and_foreign_characters(client, customer_payload):
    response = client.post("/customers", json={
        **customer_payload, "company_name": "Á" * 200, "plan": "p" * 100,
        "country_code": "US", "tax_identifier": "a" * 32,
    })
    assert response.status_code == 201
    assert response.json()["tax_identifier"] == "A" * 32
    invalid = {**customer_payload, "country_code": "US", "tax_identifier": "AB_1"}
    assert_error(client.post("/customers", json=invalid), 422, "invalid_tax_identifier_format")


def test_unicode_literal_search_pagination_and_exact_tax(client, customer_payload):
    names = ["Ábaco Ficticio", "Straße Ficticia", "Empresa 100%", "Empresa_A", "EmpresaXA", "00000023T"]
    for index, name in enumerate(names):
        response = client.post("/customers", json={
            **customer_payload, "company_name": name, "country_code": "US",
            "tax_identifier": "00000023T" if index == 5 else f"TEST-{index}",
        })
        assert response.status_code == 201
    for term, expected in [("ÁBACO", names[0]), ("STRASSE", names[1]), ("%", names[2]), ("_", names[3]), (" test-1 ", names[1])]:
        result = client.get("/customers", params={"q": term}).json()
        assert result["total_count"] == 1
        assert result["items"][0]["company_name"] == expected
    assert client.get("/customers", params={"q": "TEST-"}).json()["total_count"] == 0
    assert client.get("/customers", params={"q": "00000023t"}).json()["total_count"] == 1
    assert client.get("/customers", params={"q": "' OR 1=1 --"}).json()["total_count"] == 0
    page = client.get("/customers", params={"q": "empresa", "limit": 1, "offset": 1}).json()
    assert page["total_count"] == 3
    assert page["items"][0]["company_name"] == names[3]
    assert page["limit"] == 1 and page["offset"] == 1
    after = client.get("/customers", params={"q": "empresa", "offset": 100}).json()
    assert after["items"] == [] and after["total_count"] == 3
    all_items = client.get("/customers", params={"q": "  "}).json()
    assert [item["id"] for item in all_items["items"]] == list(range(1, 7))
    assert all_items["total_count"] == 6
    assert client.get("/customers", params={"q": "inexistente"}).json()["items"] == []


@pytest.mark.parametrize("params", [
    {"limit": "0"}, {"limit": "101"}, {"limit": "1.0"}, {"limit": "true"},
    {"limit": "+1"}, {"offset": "-1"}, {"offset": "9007199254740992"},
    {"offset": "1" * 5000}, {"q": "a" * 201}, {"q": "\n"},
    {"private@example.com": "00000023T"},
])
def test_invalid_query(client, params):
    response = client.get("/customers", params=params)
    assert_error(response, 422, "validation_error")
    assert "private@example.com" not in response.text


@pytest.mark.parametrize("path", ["0", "-1", "1.0", "true", "abc", "9007199254740992"])
def test_malformed_resource_id(client, path):
    assert_error(client.get("/customers/" + path), 422, "validation_error")


def test_missing_customer_and_unknown_query(client, customer_payload):
    assert_error(client.get("/customers/1"), 404, "customer_not_found")
    assert_error(client.get("/customers/1", params={"q": "x"}), 422, "validation_error")
    assert_error(client.post("/customers", params={"q": "x"}, json=customer_payload), 422, "validation_error")
    assert client.get("/customers").json() == {"items": [], "limit": 20, "offset": 0, "total_count": 0}


def test_cors_is_explicit_and_location_is_exposed(client, customer_payload):
    allowed = client.options("/customers", headers={
        "Origin": "http://localhost:4200", "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:4200"
    assert "access-control-allow-credentials" not in allowed.headers
    created = client.post("/customers", json=customer_payload, headers={"Origin": "http://localhost:4200"})
    assert created.headers["access-control-expose-headers"] == "Location"
    denied = client.get("/customers", headers={"Origin": "https://untrusted.example"})
    assert "access-control-allow-origin" not in denied.headers


def test_openapi_describes_the_actual_error_envelope_and_location(client):
    paths = client.get("/openapi.json").json()["paths"]
    assert set(paths) == {"/customers", "/customers/{customer_id}"}
    post = paths["/customers"]["post"]["responses"]
    assert "Location" in post["201"]["headers"]
    for operation in (paths["/customers"]["post"], paths["/customers"]["get"], paths["/customers/{customer_id}"]["get"]):
        assert operation["responses"]["422"]["content"]["application/json"]["schema"] == {
            "$ref": "#/components/schemas/ErrorEnvelope"
        }
