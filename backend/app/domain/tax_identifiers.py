"""D-07/A-06: algorithmic consistency, never identity or census verification.

DNI/NIE: Interior's published modulo-23 algorithm.
Entity keys: Orden EHA/451/2008, arts. 2-5 and AEAT's composition guide.
Control type: AEAT D.I.T. note, pp. 4-6 (copy hosted by CAIB):
https://www.caib.es/sites/civitasmanualsisuport/f/41519
Arithmetic: SEPE, teletraining data model (2019), p. 21; see README sources.
No province-code checks, separator removal or historical-format conversion.
"""

import re

_DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE"
_NUMERIC_ENTITY_KEYS = frozenset("ABCDEFGHJUV")
_ALPHABETIC_ENTITY_KEYS = frozenset("NPQRSW")


class TaxIdentifierError(ValueError):
    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def normalize_tax_identifier(value: str) -> str:
    """Shared by creation and exact search, without validating search text."""
    return value.strip().upper()


def validate_tax_identifier(value: str, country_code: str) -> str:
    if not isinstance(value, str) or not value.strip().isascii():
        raise TaxIdentifierError("invalid_tax_identifier_format")
    canonical = normalize_tax_identifier(value)
    if country_code != "ES":
        if not re.fullmatch(r"[A-Z0-9 ./-]{1,32}", canonical):
            raise TaxIdentifierError("invalid_tax_identifier_format")
        return canonical

    if (
        re.fullmatch(r"[KLM][0-9]{7}[A-Z]", canonical)
        or re.fullmatch(r"[0-9]{8}", canonical)
        or re.fullmatch(r"X[0-9]{8}[A-Z]", canonical)
    ):
        raise TaxIdentifierError("unsupported_tax_identifier")

    if re.fullmatch(r"[0-9]{8}[A-Z]", canonical):
        expected = _DNI_LETTERS[int(canonical[:8]) % 23]
    elif re.fullmatch(r"[XYZ][0-9]{7}[A-Z]", canonical):
        number = str("XYZ".index(canonical[0])) + canonical[1:8]
        expected = _DNI_LETTERS[int(number) % 23]
    elif re.fullmatch(r"[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-Z]", canonical):
        digits = [int(digit) for digit in canonical[1:8]]
        even_sum = sum(digits[1::2])
        odd_sum = sum((2 * digit) // 10 + (2 * digit) % 10 for digit in digits[::2])
        control = (10 - (even_sum + odd_sum) % 10) % 10
        if canonical[0] in _NUMERIC_ENTITY_KEYS:
            expected = str(control)
        elif canonical[0] in _ALPHABETIC_ENTITY_KEYS:
            expected = "JABCDEFGHI"[control]
    else:
        raise TaxIdentifierError("invalid_tax_identifier_format")

    if canonical[-1] != expected:
        raise TaxIdentifierError("invalid_tax_identifier_checksum")
    return canonical
