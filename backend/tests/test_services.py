import pytest

from app.models import IOCType
from app.services import _parse_feed, calculate_risk, normalize_ioc


def test_normalizes_defanged_domain() -> None:
    assert normalize_ioc(IOCType.domain, "EXAMPLE[.]COM") == "example.com"


def test_rejects_invalid_url() -> None:
    with pytest.raises(ValueError):
        normalize_ioc(IOCType.url, "file:///etc/passwd")


def test_risk_is_bounded_and_weighted() -> None:
    assert calculate_risk("critical", 100) == 93.0
    assert 0 <= calculate_risk("low", 0) <= 100


def test_parses_and_classifies_latam_csirt_feed() -> None:
    content = b"""<?xml version="1.0"?>
    <rss><channel><item>
      <title>Alerta critica de ransomware CVE-2026-12345 para bancos</title>
      <link>https://cert.example/alerta-1</link>
      <description>Campanha explorada contra el sector financiero.</description>
      <pubDate>Tue, 28 Jul 2026 12:00:00 +0000</pubDate>
    </item></channel></rss>"""
    source = {
        "name": "CERT Teste",
        "country_code": "BR",
        "country_name": "Brasil",
    }
    result = _parse_feed(content, source)
    assert result[0]["severity"] == "critical"
    assert result[0]["tags"] == ["CVE-2026-12345"]
    assert result[0]["sectors"] == ["financeiro"]
