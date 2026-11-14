"""Preview and explicit save share the existing domain calculator."""

from sqlalchemy.orm import Session

from ..domain.quotation import calculate_quote
from ..persistence import simulations as repository
from .customers import get_customer


def _calculation(
    session: Session, *, customer_id: int, active_users: int,
    storage_gb: int, api_calls: int,
) -> dict:
    customer = get_customer(session, customer_id)
    quote = calculate_quote(active_users, customer.country_code)
    return {
        "customer_id": customer.id,
        "active_users": active_users,
        "storage_gb": storage_gb,
        "api_calls": api_calls,
        "country_snapshot": quote.country_code,
        "plan_snapshot": customer.plan,
        "base_cents": quote.base_cents,
        "tax_rate_applied": format(quote.tax_rate, "f"),
        "tax_cents": quote.tax_cents,
        "total_cents": quote.total_cents,
        "currency": "EUR",
    }


def preview_simulation(session: Session, **inputs) -> dict:
    # Only loads the customer and calculates. No ORM writes or commit.
    return _calculation(session, **inputs)


def save_simulation(session: Session, **inputs):
    with session.begin():
        values = _calculation(session, **inputs)
        simulation = repository.insert_simulation(session, **values)
    return simulation


def list_simulations(session: Session, customer_id: int, limit: int, offset: int):
    get_customer(session, customer_id)
    return repository.list_simulations(session, customer_id, limit, offset)
