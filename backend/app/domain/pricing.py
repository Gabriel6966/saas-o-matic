"""Approved cumulative user pricing, expressed as integer EUR cents."""

from .errors import InvalidBillingInputError

MAX_ACTIVE_USERS = 1_000_000


def calculate_base_cents(active_users: int) -> int:
    """Price each group of users at its own tier's rate."""
    if type(active_users) is not int:
        raise InvalidBillingInputError(
            "active_users", "active_users must be an integer, without coercion."
        )
    if not 0 <= active_users <= MAX_ACTIVE_USERS:
        raise InvalidBillingInputError(
            "active_users", "active_users must be between 0 and 1000000."
        )

    first_tier = min(active_users, 10)
    second_tier = min(max(active_users - 10, 0), 40)
    third_tier = max(active_users - 50, 0)
    return first_tier * 1000 + second_tier * 800 + third_tier * 500
