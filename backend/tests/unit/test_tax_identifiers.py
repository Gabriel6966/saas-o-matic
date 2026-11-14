"""Synthetic algorithm cases, not documents collected from real people."""

import pytest

from app.domain.tax_identifiers import TaxIdentifierError, validate_tax_identifier


@pytest.mark.parametrize("value", [
    "00000023T", "00000000T", "X0000000T", "Y0000000Z", "Z0000000M",
    "B00000067", "P0000006G", "B00000000", "P0000000J",
])
def test_recognized_synthetic_identifiers(value):
    assert validate_tax_identifier(" " + value.lower() + " ", "ES") == value


@pytest.mark.parametrize("prefix", list("ABCDEFGHJUV"))
def test_every_numeric_entity_family(prefix):
    assert validate_tax_identifier(prefix + "00000018", "ES") == prefix + "00000018"
    with pytest.raises(TaxIdentifierError) as error:
        validate_tax_identifier(prefix + "0000001H", "ES")
    assert error.value.code == "invalid_tax_identifier_checksum"


@pytest.mark.parametrize("prefix", list("NPQRSW"))
def test_every_alphabetic_entity_family(prefix):
    assert validate_tax_identifier(prefix + "0000001H", "ES") == prefix + "0000001H"
    with pytest.raises(TaxIdentifierError) as error:
        validate_tax_identifier(prefix + "00000018", "ES")
    assert error.value.code == "invalid_tax_identifier_checksum"


@pytest.mark.parametrize(("value", "code"), [
    ("00000023R", "invalid_tax_identifier_checksum"),
    ("Y0000000T", "invalid_tax_identifier_checksum"),
    ("B00000068", "invalid_tax_identifier_checksum"),
    ("P0000006J", "invalid_tax_identifier_checksum"),
    ("0000023T", "invalid_tax_identifier_format"),
    ("00000023-T", "invalid_tax_identifier_format"),
    ("0000 0023T", "invalid_tax_identifier_format"),
    ("ES00000023T", "invalid_tax_identifier_format"),
    ("I0000001H", "invalid_tax_identifier_format"),
    ("B0000001-", "invalid_tax_identifier_format"),
    ("00000023ſ", "invalid_tax_identifier_format"),
    ("００００００２３T", "invalid_tax_identifier_format"),
    ("K0000001R", "unsupported_tax_identifier"),
    ("L0000001R", "unsupported_tax_identifier"),
    ("M0000001R", "unsupported_tax_identifier"),
    ("00000023", "unsupported_tax_identifier"),
    ("X00000000T", "unsupported_tax_identifier"),
])
def test_distinguishes_format_checksum_and_unsupported(value, code):
    with pytest.raises(TaxIdentifierError) as error:
        validate_tax_identifier(value, "ES")
    assert error.value.code == code


def test_foreign_identifier_has_only_basic_validation():
    assert validate_tax_identifier(" ab-001 /x.2 ", "US") == "AB-001 /X.2"
    with pytest.raises(TaxIdentifierError):
        validate_tax_identifier("AB_001", "US")
