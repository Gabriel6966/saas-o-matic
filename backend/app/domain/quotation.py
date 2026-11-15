"""One pure calculator to be shared by future preview and save use cases."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Context, Decimal, localcontext

from .money import amount_to_cents, cents_to_amount
from .pricing import calculate_base_cents
from .taxes import DEFAULT_TAX_RATES, resolve_tax_policy


@dataclass(frozen=True)
class BillingQuote:
    """Immutable original EUR calculation, ready for future cents persistence."""

    active_users: int
    country_code: str
    base_cents: int
    tax_rate: Decimal
    tax_cents: int
    total_cents: int

    @property
    def base_amount(self) -> Decimal:
        return cents_to_amount(self.base_cents)

    @property
    def tax_amount(self) -> Decimal:
        return cents_to_amount(self.tax_cents)

    @property
    def total_amount(self) -> Decimal:
        return cents_to_amount(self.total_cents)


def calculate_quote(
    active_users: int,
    country_code: str,
    *,
    tax_rates: Mapping[str, Decimal] = DEFAULT_TAX_RATES,
) -> BillingQuote:
    """Calculate from approved user tiers and an explicit simplified tax policy."""
    base_cents = calculate_base_cents(active_users)
    country, rate = resolve_tax_policy(country_code, tax_rates)
    base_amount = cents_to_amount(base_cents)
    precision = max(28, len(base_amount.as_tuple().digits) + len(rate.as_tuple().digits))
    with localcontext(Context(prec=precision, rounding=ROUND_HALF_UP)):
        tax_cents = amount_to_cents(base_amount * rate)
    return BillingQuote(
        active_users=active_users,
        country_code=country,
        base_cents=base_cents,
        tax_rate=rate,
        tax_cents=tax_cents,
        total_cents=base_cents + tax_cents,
    )
