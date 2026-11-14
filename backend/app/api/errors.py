"""Small exception handlers; no request values or internal errors are exposed."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from ..application.customers import CustomerAlreadyExistsError, CustomerNotFoundError
from ..domain.tax_identifiers import TaxIdentifierError

_SAFE_FIELDS = {
    "company_name", "tax_identifier", "email", "country_code", "plan",
    "q", "limit", "offset", "customer_id",
}
_TAX_MESSAGES = {
    "invalid_tax_identifier_format": "El identificador fiscal no tiene un formato admitido.",
    "invalid_tax_identifier_checksum": "El carácter de control fiscal es incorrecto.",
    "unsupported_tax_identifier": "La familia fiscal no está soportada en este alcance.",
}
_DETAIL_MESSAGES = {
    "required": "Campo requerido.",
    "invalid_type": "Tipo de dato no válido.",
    "invalid_format": "Formato no válido.",
    "out_of_range": "Valor fuera del rango admitido.",
    "too_long": "Longitud superior al máximo admitido.",
    "unknown_field": "Campo no definido en el contrato.",
    "unknown_parameter": "Parámetro no definido en el contrato.",
}


def error_response(status: int, code: str, message: str, details=None) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={"error": {"code": code, "message": message, "details": details or []}},
    )


def _detail(error: dict) -> dict:
    kind = error["type"]
    location = error.get("loc", ())
    area = location[0] if location and location[0] in {"body", "query", "path"} else "body"
    field = location[1] if len(location) > 1 and location[1] in _SAFE_FIELDS else area
    if kind == "extra_forbidden":
        code = "unknown_parameter" if area == "query" else "unknown_field"
        field = area
    elif kind == "missing":
        code = "required"
    elif kind in {"string_too_long", "too_long"}:
        code = "too_long"
    elif kind in {"greater_than", "greater_than_equal", "less_than", "less_than_equal", "out_of_range"}:
        code = "out_of_range"
    elif kind.endswith("_type") or kind == "model_attributes_type":
        code = "invalid_type"
    else:
        code = "invalid_format"
    return {"field": field, "code": code, "message": _DETAIL_MESSAGES[code]}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, error: RequestValidationError):
        if any(item["type"] == "json_invalid" for item in error.errors()):
            return error_response(400, "invalid_json", "El cuerpo no contiene JSON válido.")
        return error_response(
            422, "validation_error", "La solicitud contiene valores no válidos.",
            [_detail(item) for item in error.errors()],
        )

    @app.exception_handler(TaxIdentifierError)
    async def tax_identifier_error(_request: Request, error: TaxIdentifierError):
        message = _TAX_MESSAGES[error.code]
        return error_response(422, error.code, message, [
            {"field": "tax_identifier", "code": error.code, "message": message}
        ])

    @app.exception_handler(CustomerAlreadyExistsError)
    async def duplicate(_request: Request, _error: CustomerAlreadyExistsError):
        return error_response(409, "customer_already_exists", "El cliente ya existe.")

    @app.exception_handler(CustomerNotFoundError)
    async def not_found(_request: Request, _error: CustomerNotFoundError):
        return error_response(404, "customer_not_found", "El cliente no existe.")

    @app.exception_handler(HTTPException)
    async def http_error(_request: Request, error: HTTPException):
        code, message = {
            400: ("invalid_json", "El cuerpo no contiene JSON válido."),
            404: ("not_found", "El recurso no existe."),
            405: ("method_not_allowed", "Método no admitido."),
        }.get(error.status_code, ("http_error", "La solicitud no puede procesarse."))
        response = error_response(error.status_code, code, message)
        if error.status_code == 405 and error.headers and "Allow" in error.headers:
            response.headers["Allow"] = error.headers["Allow"]
        return response

    @app.exception_handler(Exception)
    async def unexpected(_request: Request, _error: Exception):
        return error_response(500, "internal_error", "Se ha producido un error interno.")
