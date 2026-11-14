"""Shared JSON transport checks for the approved POST endpoints."""

import json

from fastapi import Request
from fastapi.routing import APIRoute

from .errors import error_response


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
