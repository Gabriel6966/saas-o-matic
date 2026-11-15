"""Domain errors; translation to an HTTP response belongs to a future layer."""


class InvalidBillingInputError(ValueError):
    """An input does not satisfy the billing contract."""

    def __init__(self, field: str, message: str) -> None:
        self.field = field
        super().__init__(message)


class TaxPolicyNotConfiguredError(ValueError):
    """No tax policy is configured for a syntactically valid country code."""

    def __init__(self, country_code: str) -> None:
        self.country_code = country_code
        super().__init__(f"Tax policy is not configured for {country_code}.")


class InvalidTaxPolicyError(ValueError):
    """Tax configuration contains an invalid type or rate."""
