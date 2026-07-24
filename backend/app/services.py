import hashlib
import ipaddress
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

import httpx
from pypdf import PdfReader

from app.core import Settings
from app.models import IOCType

PATTERNS = {
    IOCType.ipv4: re.compile(r"(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])"),
    IOCType.domain: re.compile(
        r"(?<![@\w.-])(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}(?![\w.-])"
    ),
    IOCType.url: re.compile(r"https?://[^\s<>'\"\])}]+"),
    IOCType.email: re.compile(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}"),
    IOCType.md5: re.compile(r"(?<![a-fA-F0-9])[a-fA-F0-9]{32}(?![a-fA-F0-9])"),
    IOCType.sha1: re.compile(r"(?<![a-fA-F0-9])[a-fA-F0-9]{40}(?![a-fA-F0-9])"),
    IOCType.sha256: re.compile(r"(?<![a-fA-F0-9])[a-fA-F0-9]{64}(?![a-fA-F0-9])"),
}


def normalize_ioc(ioc_type: IOCType | str, value: str) -> str:
    value = value.strip().replace("[.]", ".").replace("hxxp://", "http://").replace(
        "hxxps://", "https://"
    )
    kind = IOCType(ioc_type)
    if kind == IOCType.ipv4:
        return str(ipaddress.ip_address(value))
    if kind in {IOCType.domain, IOCType.email, IOCType.md5, IOCType.sha1, IOCType.sha256}:
        return value.lower()
    if kind == IOCType.url:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("URL inválida")
    return value


def calculate_risk(severity: str, confidence: int) -> float:
    base = {"low": 20, "medium": 45, "high": 70, "critical": 90}.get(severity, 45)
    return round(min(100, base * 0.7 + confidence * 0.3), 1)


def extract_iocs_from_pdf(path: Path) -> list[dict]:
    text = "\n".join(page.extract_text() or "" for page in PdfReader(path).pages)
    findings: set[tuple[str, str]] = set()
    for kind, pattern in PATTERNS.items():
        for match in pattern.findall(text):
            try:
                value = normalize_ioc(kind, match.rstrip(".,;:"))
                if kind == IOCType.ipv4 and ipaddress.ip_address(value).is_private:
                    continue
                findings.add((kind.value, value))
            except ValueError:
                continue
    return [
        {"type": kind, "value": value, "confidence": 85, "method": "pdf-pattern"}
        for kind, value in sorted(findings)
    ]


class EnrichmentService:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def lookup(self, observable: str, providers: list[str]) -> list[dict]:
        async with httpx.AsyncClient(timeout=15) as client:
            results = []
            for provider in providers:
                try:
                    data = await self._provider(client, provider.lower(), observable)
                    results.append({"provider": provider, "status": "ok", "data": data})
                except ValueError as exc:
                    results.append({"provider": provider, "status": "unavailable", "error": str(exc)})
                except httpx.HTTPError as exc:
                    results.append({"provider": provider, "status": "error", "error": str(exc)})
            return results

    async def _provider(
        self, client: httpx.AsyncClient, provider: str, observable: str
    ) -> dict:
        if provider == "shodan":
            if not self.settings.shodan_api_key:
                raise ValueError("SHODAN_API_KEY não configurada")
            response = await client.get(
                f"https://api.shodan.io/shodan/host/{observable}",
                params={"key": self.settings.shodan_api_key},
            )
        elif provider == "virustotal":
            if not self.settings.virustotal_api_key:
                raise ValueError("VIRUSTOTAL_API_KEY não configurada")
            resource = "ip_addresses" if _is_ip(observable) else "domains"
            response = await client.get(
                f"https://www.virustotal.com/api/v3/{resource}/{observable}",
                headers={"x-apikey": self.settings.virustotal_api_key},
            )
        elif provider == "abuseipdb":
            if not self.settings.abuseipdb_api_key:
                raise ValueError("ABUSEIPDB_API_KEY não configurada")
            response = await client.get(
                "https://api.abuseipdb.com/api/v2/check",
                params={"ipAddress": observable, "maxAgeInDays": 90},
                headers={"Key": self.settings.abuseipdb_api_key, "Accept": "application/json"},
            )
        elif provider == "greynoise":
            if not self.settings.greynoise_api_key:
                raise ValueError("GREYNOISE_API_KEY não configurada")
            response = await client.get(
                f"https://api.greynoise.io/v3/community/{observable}",
                headers={"key": self.settings.greynoise_api_key},
            )
        elif provider == "censys":
            if not self.settings.censys_api_id or not self.settings.censys_api_secret:
                raise ValueError("Credenciais Censys não configuradas")
            response = await client.get(
                f"https://search.censys.io/api/v2/hosts/{observable}",
                auth=(self.settings.censys_api_id, self.settings.censys_api_secret),
            )
        elif provider == "misp":
            if not self.settings.misp_url or not self.settings.misp_api_key:
                raise ValueError("MISP_URL/MISP_API_KEY não configuradas")
            response = await client.post(
                f"{self.settings.misp_url.rstrip('/')}/attributes/restSearch",
                headers={
                    "Authorization": self.settings.misp_api_key,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                json={"value": observable, "returnFormat": "json"},
            )
        else:
            raise ValueError(f"Provedor desconhecido: {provider}")
        response.raise_for_status()
        return response.json()


def _is_ip(value: str) -> bool:
    try:
        ipaddress.ip_address(value)
        return True
    except ValueError:
        return False


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def severity_counts(values: list[str]) -> dict[str, int]:
    return dict(Counter(values))
