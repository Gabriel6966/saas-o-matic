from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..domain.tax_identifiers import normalize_tax_identifier
from .models import Customer


def insert_customer(session: Session, **values) -> Customer:
    customer = Customer(**values)
    session.add(customer)
    session.flush()
    return customer


def find_customer(session: Session, customer_id: int) -> Customer | None:
    return session.get(Customer, customer_id)


def search_customers(session: Session, q: str, limit: int, offset: int):
    query = select(Customer)
    count = select(func.count()).select_from(Customer)
    if q:
        matches = or_(
            func.instr(func.unicode_casefold(Customer.company_name), q.casefold()) > 0,
            Customer.tax_identifier_normalized == normalize_tax_identifier(q),
        )
        query = query.where(matches)
        count = count.where(matches)
    total_count = session.scalar(count)
    items = session.scalars(query.order_by(Customer.id).limit(limit).offset(offset)).all()
    return items, total_count
