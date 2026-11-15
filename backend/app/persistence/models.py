from datetime import UTC, datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint(
            "country_code", "tax_identifier_normalized", name="uq_customers_country_tax"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    tax_identifier_normalized: Mapped[str] = mapped_column(String(32), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False)
    plan: Mapped[str] = mapped_column(String(100), nullable=False)


def utc_timestamp() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")


class Simulation(Base):
    __tablename__ = "simulations"
    __table_args__ = (
        CheckConstraint(
            "typeof(customer_id) = 'integer' AND customer_id BETWEEN 1 AND 9007199254740991",
            name="ck_simulations_customer_id",
        ),
        *(
            CheckConstraint(
                f"typeof({field}) = 'integer' AND {field} BETWEEN 0 AND 1000000",
                name=f"ck_simulations_{field}",
            )
            for field in ("active_users", "storage_gb", "api_calls")
        ),
        *(
            CheckConstraint(
                f"typeof({field}) = 'integer' AND {field} >= 0",
                name=f"ck_simulations_{field}",
            )
            for field in ("base_cents", "tax_cents", "total_cents")
        ),
        CheckConstraint("total_cents = base_cents + tax_cents", name="ck_simulations_total"),
        CheckConstraint("currency = 'EUR'", name="ck_simulations_currency"),
        CheckConstraint(
            "typeof(tax_rate_applied) = 'text' AND length(tax_rate_applied) > 0",
            name="ck_simulations_tax_rate_text",
        ),
        Index("ix_simulations_customer_history", "customer_id", "created_at", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False,
    )
    active_users: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_gb: Mapped[int] = mapped_column(Integer, nullable=False)
    api_calls: Mapped[int] = mapped_column(Integer, nullable=False)
    country_snapshot: Mapped[str] = mapped_column(String(2), nullable=False)
    plan_snapshot: Mapped[str] = mapped_column(String(100), nullable=False)
    base_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    tax_rate_applied: Mapped[str] = mapped_column(String, nullable=False)
    tax_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    total_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    created_at: Mapped[str] = mapped_column(String(20), nullable=False, default=utc_timestamp)
