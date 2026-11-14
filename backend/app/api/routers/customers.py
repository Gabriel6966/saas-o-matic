import json
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session

from ...application import customers as service
from ..dependencies import get_session
from ..errors import error_response
from ..schemas import (
    CustomerCreate, CustomerId, CustomerList, CustomerQuery,
    CustomerRead, ErrorEnvelope, NoQuery,
)


class JsonRoute(APIRoute):
    def get_route_handler(self):
        original_handler = super().get_route_handler()

        async def handler(request: Request):
            if request.method == "POST":
                media_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
                if media_type != "application/json":
                    return error_response(415, "unsupported_media_type", "Se requiere application/json.")
                try:
                    json.loads(await request.body(), parse_constant=reject_non_finite_json)
                except (ValueError, UnicodeError):
                    return error_response(400, "invalid_json", "El cuerpo no contiene JSON válido.")
            return await original_handler(request)

        return handler


def reject_non_finite_json(_value):
    raise ValueError("Non-finite values are not JSON numbers.")


router = APIRouter(
    prefix="/customers", route_class=JsonRoute,
    responses={422: {"model": ErrorEnvelope}, 500: {"model": ErrorEnvelope}},
)
SessionDependency = Annotated[Session, Depends(get_session)]


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
