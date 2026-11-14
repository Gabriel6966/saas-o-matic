from typing import Annotated

from fastapi import APIRouter, Query

from ...application import simulations as service
from ..dependencies import SessionDependency
from ..routing import JsonRoute
from ..schemas import (
    CustomerId, ErrorEnvelope, NoQuery, PaginationQuery,
    SimulationCreate, SimulationList, SimulationPreview, SimulationRead,
)

router = APIRouter(route_class=JsonRoute, responses={
    404: {"model": ErrorEnvelope}, 422: {"model": ErrorEnvelope},
    500: {"model": ErrorEnvelope},
})
_POST_ERRORS = {400: {"model": ErrorEnvelope}, 415: {"model": ErrorEnvelope}}


@router.post("/simulations/preview", response_model=SimulationPreview, responses=_POST_ERRORS)
def preview_simulation(
    inputs: SimulationCreate, session: SessionDependency,
    parameters: Annotated[NoQuery, Query()],
):
    return service.preview_simulation(session, **inputs.model_dump())


@router.post("/simulations", status_code=201, response_model=SimulationRead, responses=_POST_ERRORS)
def save_simulation(
    inputs: SimulationCreate, session: SessionDependency,
    parameters: Annotated[NoQuery, Query()],
):
    return service.save_simulation(session, **inputs.model_dump())


@router.get("/customers/{customer_id}/simulations", response_model=SimulationList)
def list_simulations(
    customer_id: CustomerId, parameters: Annotated[PaginationQuery, Query()],
    session: SessionDependency,
):
    items, total_count = service.list_simulations(
        session, customer_id, parameters.limit, parameters.offset,
    )
    return SimulationList(
        items=items, limit=parameters.limit, offset=parameters.offset, total_count=total_count,
    )
