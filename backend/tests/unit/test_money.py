from decimal import Decimal

import pytest

from app.domain.money import amount_to_cents, cents_to_amount


@pytest.mark.parametrize(
    ("amount", "expected_cents"),
    [
        ("0.004", 0),
        ("0.005", 1),
        ("0.006", 1),
        ("1.004", 100),
        ("1.005", 101),
        ("1.015", 102),
        ("-0.005", -1),
    ],
)
def test_rounds_half_up_to_cents(amount, expected_cents):
    assert amount_to_cents(Decimal(amount)) == expected_cents


@pytest.mark.parametrize(("cents", "amount"), [(0, "0.00"), (16940, "169.40")])
def test_cents_have_an_exact_decimal_representation(cents, amount):
    actual = cents_to_amount(cents)
    assert actual == Decimal(amount)
    assert actual.as_tuple().exponent == -2
