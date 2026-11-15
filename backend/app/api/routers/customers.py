from typing import Annotated

from fastapi import APIRouter, Query, Response

from ...application import customers as service
from ..dependencies import SessionDependency
from ..routing import JsonRoute
from ..schemas import (
    CustomerCreate, CustomerId, CustomerList, CustomerQuery,
    CustomerRead, ErrorEnvelope, NoQuery,
)


router = APIRouter(
    prefix="/customers", route_class=JsonRoute,
    responses={422: {"model": ErrorEnvelope}, 500: {"model": ErrorEnvelope}},
)


@router.post("", status_code=201, response_model=CustomerRead, responses={
    201: {"headers": {"Location": {"schema": {"type": "string"}, "description": "Recurso creado."}}},
    400: {"model": ErrorEnvelope}, 415: {"model": ErrorEnvelope}, 409: {"model": ErrorEnvelope},
})
def create_customer(
    customer: CustomerCreate, response: Response, session: SessionDependency,
    parameters: Annotated[NoQuery, Query()],
):
    created = service.create_customer(session, **customer.model_dump())
    response.headers["Location"] = f"/customers/{created.id}"
    return created


@router.get("", response_model=CustomerList)
def list_customers(parameters: Annotated[CustomerQuery, Query()], session: SessionDependency):
    items, total_count = service.list_customers(
        session, parameters.q, parameters.limit, parameters.offset
    )
    return CustomerList(
        items=items, limit=parameters.limit,
        offset=parameters.offset, total_count=total_count,
    )


@router.get("/{customer_id}", response_model=CustomerRead, responses={404: {"model": ErrorEnvelope}})
def get_customer(
    customer_id: CustomerId, session: SessionDependency,
    parameters: Annotated[NoQuery, Query()],
):
    return service.get_customer(session, customer_id)
