import sqlite3

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..domain.tax_identifiers import validate_tax_identifier
from ..persistence import customers as repository


class CustomerAlreadyExistsError(Exception):
    pass


class CustomerNotFoundError(Exception):
    pass


def create_customer(
    session: Session, *, company_name: str, tax_identifier: str,
    email: str, country_code: str, plan: str,
):
    normalized = validate_tax_identifier(tax_identifier, country_code)
    try:
        with session.begin():
            customer = repository.insert_customer(
                session, company_name=company_name,
                tax_identifier_normalized=normalized, email=email,
                country_code=country_code, plan=plan,
            )
        return customer
    except IntegrityError as error:
        if (
            isinstance(error.orig, sqlite3.IntegrityError)
            and error.orig.sqlite_errorcode == sqlite3.SQLITE_CONSTRAINT_UNIQUE
        ):
            raise CustomerAlreadyExistsError() from None
        raise


def get_customer(session: Session, customer_id: int):
    customer = repository.find_customer(session, customer_id)
    if customer is None:
        raise CustomerNotFoundError()
    return customer


def list_customers(session: Session, q: str, limit: int, offset: int):
    return repository.search_customers(session, q, limit, offset)
