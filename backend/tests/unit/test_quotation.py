from dataclasses import FrozenInstanceError
from decimal import ROUND_DOWN, Decimal, localcontext

import pytest

from app.domain import (
    InvalidBillingInputError,
    InvalidTaxPolicyError,
    TaxPolicyNotConfiguredError,
    calculate_quote,
)


@pytest.mark.parametrize(
    ("country", "rate", "tax", "total"),
    [
        ("ES", "0.21", "29.40", "169.40"),
        ("FR", "0.20", "28.00", "168.00"),
        ("DE", "0.19", "26.60", "166.60"),
    ],
)
def test_approved_country_calculations(country, rate, tax, total):
    quote = calculate_quote(15, country)
    assert quote.base_amount == Decimal("140.00")
    assert quote.tax_rate == Decimal(rate)
    assert quote.tax_amount == Decimal(tax)
    assert quote.total_amount == Decimal(total)
    assert quote.total_cents == quote.base_cents + quote.tax_cents
    assert type(quote.base_cents) is type(quote.tax_cents) is type(quote.total_cents) is int


@pytest.mark.parametrize("country", ["ES", "FR", "DE"])
def test_zero_users_remain_a_valid_zero_quote(country):
    quote = calculate_quote(0, country)
    assert (quote.base_cents, quote.tax_cents, quote.total_cents) == (0, 0, 0)


@pytest.mark.parametrize(
    ("raw", "canonical"), [(" es ", "ES"), (" fR ", "FR"), ("dE", "DE")]
)
def test_normalizes_country_as_in_the_contract(raw, canonical):
    assert calculate_quote(15, raw).country_code == canonical


@pytest.mark.parametrize("country", ["US", "GB", "ZZ"])
def test_unknown_country_does_not_get_an_implicit_zero_tax(country):
    with pytest.raises(TaxPolicyNotConfiguredError) as error:
        calculate_quote(15, country)
    assert error.value.country_code == country


def test_unknown_country_is_rejected_even_for_zero_users():
    with pytest.raises(TaxPolicyNotConfiguredError):
        calculate_quote(0, "US")


@pytest.mark.parametrize(
    "users", [-1, 1_000_001, True, False, "15", 15.0, 15.5, Decimal("15"), None, []]
)
def test_rejects_invalid_user_counts_without_coercion(users):
    with pytest.raises(InvalidBillingInputError) as error:
        calculate_quote(users, "ES")
    assert error.value.field == "active_users"


@pytest.mark.parametrize("country", [None, True, 123, "", "ESP", "1E", "E S", "eſ", "\tES\n"])
def test_rejects_malformed_country_codes(country):
    with pytest.raises(InvalidBillingInputError) as error:
        calculate_quote(15, country)
    assert error.value.field == "country_code"


@pytest.mark.parametrize(
    "rate",
    ["0.21", 0.21, None, Decimal("-0.01"), Decimal("NaN"),
     Decimal("sNaN"), Decimal("Infinity")],
)
def test_rejects_invalid_tax_configuration(rate):
    with pytest.raises(InvalidTaxPolicyError):
        calculate_quote(15, "ES", tax_rates={"ES": rate})


def test_explicit_policy_is_used_without_mutating_defaults():
    quote = calculate_quote(15, "ES", tax_rates={"ES": Decimal("0.20")})
    assert quote.tax_cents == 2800
    assert calculate_quote(15, "ES").tax_rate == Decimal("0.21")


def test_quote_rounds_half_cent_tax_up_and_adds_integer_cents():
    test_rate = Decimal("0.0005")
    quote = calculate_quote(1, "ES", tax_rates={"ES": test_rate})
    assert quote.base_amount * test_rate == Decimal("0.005")
    assert quote.base_cents == 1000
    assert quote.tax_cents == 1
    assert quote.total_cents == 1001
    assert type(quote.base_cents) is type(quote.tax_cents) is type(quote.total_cents) is int
    assert quote.total_cents == quote.base_cents + quote.tax_cents
    assert quote.tax_amount == Decimal("0.01")
    assert quote.total_amount == Decimal("10.01")


def test_result_is_immutable():
    quote = calculate_quote(15, "ES")
    with pytest.raises(FrozenInstanceError):
        quote.total_cents = 0


def test_upper_limit_is_exact_and_independent_of_callers_decimal_context():
    with localcontext() as context:
        context.prec = 2
        context.rounding = ROUND_DOWN
        quote = calculate_quote(1_000_000, "ES")
        assert quote.base_amount == Decimal("5000170.00")
        assert quote.tax_amount == Decimal("1050035.70")
        assert quote.total_amount == Decimal("6050205.70")
        assert quote.total_cents == quote.base_cents + quote.tax_cents
        assert context.prec == 2
        assert context.rounding == ROUND_DOWN
