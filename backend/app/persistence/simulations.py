from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Simulation


def insert_simulation(session: Session, **values) -> Simulation:
    simulation = Simulation(**values)
    session.add(simulation)
    session.flush()
    return simulation


def list_simulations(session: Session, customer_id: int, limit: int, offset: int):
    matches = Simulation.customer_id == customer_id
    total_count = session.scalar(select(func.count()).select_from(Simulation).where(matches))
    items = session.scalars(
        select(Simulation).where(matches)
        .order_by(Simulation.created_at.desc(), Simulation.id.desc())
        .limit(limit).offset(offset)
    ).all()
    return items, total_count
