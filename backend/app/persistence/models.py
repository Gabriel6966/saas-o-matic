from sqlalchemy import Integer, String, UniqueConstraint
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
