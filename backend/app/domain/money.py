"""Exact Decimal/cents conversion with explicit ROUND_HALF_UP rounding."""

from decimal import ROUND_HALF_UP, Context, Decimal

_CENT = Decimal("0.01")


def amount_to_cents(amount: Decimal) -> int:
    """Round a Decimal EUR amount to cents without using the caller's context."""
    if not isinstance(amount, Decimal) or not amount.is_finite():
        raise ValueError("amount must be a finite Decimal.")
    precision = max(28, len(amount.as_tuple().digits), amount.adjusted() + 3)
    context = Context(prec=precision, rounding=ROUND_HALF_UP)
    rounded = amount.quantize(_CENT, context=context)
    return int(rounded.scaleb(2, context=context))


def cents_to_amount(cents: int) -> Decimal:
    """Represent integer cents as an exact Decimal with two decimal places."""
    if type(cents) is not int:
        raise ValueError("cents must be an integer.")
    context = Context(prec=max(28, len(str(abs(cents)))), rounding=ROUND_HALF_UP)
    return Decimal(cents).scaleb(-2, context=context)
