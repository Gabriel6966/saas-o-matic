"""Simplified commercial tax policy, not complete B2B or territorial tax law."""

from __future__ import annotations

from collections.abc import Mapping
from decimal import Decimal
from types import MappingProxyType

from .errors import (
    InvalidBillingInputError,
    InvalidTaxPolicyError,
    TaxPolicyNotConfiguredError,
)

DEFAULT_TAX_RATES: Mapping[str, Decimal] = MappingProxyType(
    {"ES": Decimal("0.21"), "FR": Decimal("0.20"), "DE": Decimal("0.19")}
)


def resolve_tax_policy(
    country_code: str,
    tax_rates: Mapping[str, Decimal] = DEFAULT_TAX_RATES,
) -> tuple[str, Decimal]:
    """Normalize a country and resolve its explicit rate, never a fallback 0%."""
    if not isinstance(country_code, str):
        raise InvalidBillingInputError("country_code", "country_code must be a string.")
    if any(ord(char) < 32 or 127 <= ord(char) <= 159 for char in country_code):
        raise InvalidBillingInputError(
            "country_code", "country_code must not contain control characters."
        )
    country = country_code.strip()
    if len(country) != 2 or not country.isascii() or not country.isalpha():
        raise InvalidBillingInputError(
            "country_code", "country_code must contain two ASCII letters."
        )
    country = country.upper()

    if not isinstance(tax_rates, Mapping):
        raise InvalidTaxPolicyError("tax_rates must be a country-to-Decimal mapping.")
    try:
        rate = tax_rates[country]
    except KeyError:
        raise TaxPolicyNotConfiguredError(country) from None
    if not isinstance(rate, Decimal) or not rate.is_finite() or rate < 0:
        raise InvalidTaxPolicyError("Tax rates must be finite, non-negative Decimals.")
    return country, rate
