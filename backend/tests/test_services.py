import pytest

from app.models import IOCType
from app.services import calculate_risk, normalize_ioc


def test_normalizes_defanged_domain() -> None:
    assert normalize_ioc(IOCType.domain, "EXAMPLE[.]COM") == "example.com"


def test_rejects_invalid_url() -> None:
    with pytest.raises(ValueError):
        normalize_ioc(IOCType.url, "file:///etc/passwd")


def test_risk_is_bounded_and_weighted() -> None:
    assert calculate_risk("critical", 100) == 93.0
    assert 0 <= calculate_risk("low", 0) <= 100
