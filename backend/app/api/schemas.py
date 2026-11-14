import re
import unicodedata
from typing import Annotated

from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, field_validator
from pydantic_core import PydanticCustomError

MAX_RESOURCE_ID = 9_007_199_254_740_991


def trim_text(value):
    if isinstance(value, str):
        if any(unicodedata.category(char) == "Cc" for char in value):
            raise PydanticCustomError("invalid_format", "No se admiten caracteres de control.")
        return value.strip()
    return value


Text = Annotated[str, BeforeValidator(trim_text)]


def parse_decimal_parameter(value):
    """HTTP route/query text accepts ASCII decimal digits, never coercion."""
    if isinstance(value, str):
        if not re.fullmatch(r"[0-9]+", value):
            raise PydanticCustomError("invalid_format", "Debe contener dígitos decimales.")
        digits = value.lstrip("0") or "0"
        if len(digits) > 16:
            raise PydanticCustomError("out_of_range", "Fuera del rango admitido.")
        return int(digits)
    return value


class CustomerCreate(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    company_name: Text = Field(min_length=1, max_length=200)
    tax_identifier: Text = Field(min_length=1, max_length=32)
    email: Text = Field(min_length=3, max_length=254)
    country_code: Text = Field(min_length=2, max_length=2)
    plan: Text = Field(min_length=1, max_length=100)

    @field_validator("country_code")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        if not re.fullmatch(r"[A-Za-z]{2}", value):
            raise PydanticCustomError("invalid_format", "País no válido.")
        return value.upper()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        try:
            validate_email(value, check_deliverability=False, allow_display_name=False)
        except EmailNotValidError:
            raise PydanticCustomError("invalid_format", "Correo no válido.") from None
        local, domain = value.rsplit("@", 1)
        return local + "@" + domain.lower()


class CustomerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    company_name: str
    tax_identifier: str = Field(validation_alias="tax_identifier_normalized")
    country_code: str


class CustomerRead(CustomerSummary):
    email: str
    plan: str


class CustomerList(BaseModel):
    items: list[CustomerSummary]
    limit: int
    offset: int
    total_count: int


class ErrorDetail(BaseModel):
    field: str
    code: str
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail]


class ErrorEnvelope(BaseModel):
    error: ErrorBody


class CustomerQuery(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    q: Text = Field(default="", max_length=200)
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0, le=MAX_RESOURCE_ID)

    @field_validator("limit", "offset", mode="before")
    @classmethod
    def parse_pagination(cls, value):
        return parse_decimal_parameter(value)


class NoQuery(BaseModel):
    model_config = ConfigDict(extra="forbid")


CustomerId = Annotated[
    int, Field(strict=True, ge=1, le=MAX_RESOURCE_ID),
    BeforeValidator(parse_decimal_parameter),
]
