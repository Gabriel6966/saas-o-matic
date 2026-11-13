import pytest

from app.domain.pricing import calculate_base_cents


@pytest.mark.parametrize(
    ("users", "expected_cents"),
    [
        (0, 0),
        (1, 1000),
        (9, 9000),
        (10, 10000),
        (11, 10800),
        (15, 14000),
        (49, 41200),
        (50, 42000),
        (51, 42500),
        (100, 67000),
        (1_000_000, 500_017_000),
    ],
)
def test_prices_are_cumulative(users, expected_cents):
    assert calculate_base_cents(users) == expected_cents
