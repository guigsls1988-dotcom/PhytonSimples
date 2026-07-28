import hashlib
import html
import ipaddress
import json
import re
from collections import Counter
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree

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

LATAM_FEEDS = (
    {
        "name": "CSIRT Panamá",
        "country_code": "PA",
        "country_name": "Panamá",
        "url": "https://cert.pa/?tag=alertas",
        "homepage": "https://cert.pa/",
        "format": "html",
        "link_pattern": r"\?p=\d+",
    },
    {
        "name": "CERT-PY",
        "country_code": "PY",
        "country_name": "Paraguai",
        "url": "https://www.cert.gov.py/feed/",
        "homepage": "https://www.cert.gov.py/",
        "format": "feed",
    },
    {
        "name": "CSIRT Universidad Nacional de Córdoba",
        "country_code": "AR",
        "country_name": "Argentina",
        "url": "https://csirt.unc.edu.ar/noticias/",
        "homepage": "https://csirt.unc.edu.ar/noticias/",
        "format": "html",
        "link_pattern": r"/csirt_noticias/",
    },
    {
        "name": "CTIR Gov",
        "country_code": "BR",
        "country_name": "Brasil",
        "url": "https://www.gov.br/ctir/pt-br/assuntos/alertas-e-recomendacoes/recomendacoes/2026",
        "homepage": "https://www.gov.br/ctir/pt-br/",
        "format": "html",
        "link_pattern": r"/alertas-e-recomendacoes/(?:alertas|recomendacoes)/2026/",
    },
    {
        "name": "ColCERT",
        "country_code": "CO",
        "country_name": "Colômbia",
        "url": "https://www.colcert.gov.co/800/w3-propertyvalue-412601.html",
        "homepage": "https://www.colcert.gov.co/",
        "format": "html",
        "link_pattern": r"(?:w3-article-\d+\.html|articles-[^\"']+\.pdf)",
    },
)


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


async def extract_iocs_with_ai(path: Path, settings: Settings) -> list[dict]:
    """Combine deterministic extraction with an optional LLM analyst pass."""
    deterministic = extract_iocs_from_pdf(path)
    if not settings.openai_api_key:
        return deterministic
    text = "\n".join(page.extract_text() or "" for page in PdfReader(path).pages)[:30_000]
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": settings.openai_model,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "Extraia somente IOCs explícitos. Responda JSON no formato "
                                '{"iocs":[{"type":"ipv4|ipv6|domain|url|email|md5|sha1|sha256",'
                                '"value":"...","confidence":0-100}]}. Não invente dados.'
                            ),
                        },
                        {"role": "user", "content": text},
                    ],
                },
            )
            response.raise_for_status()
        payload = json.loads(response.json()["choices"][0]["message"]["content"])
    except (httpx.HTTPError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        return deterministic
    merged = {(item["type"], item["value"]): item for item in deterministic}
    for item in payload.get("iocs", []):
        try:
            kind = IOCType(item["type"])
            value = normalize_ioc(kind, str(item["value"]))
            merged[(kind.value, value)] = {
                "type": kind.value,
                "value": value,
                "confidence": max(0, min(100, int(item.get("confidence", 75)))),
                "method": "ai",
            }
        except (KeyError, TypeError, ValueError):
            continue
    return list(merged.values())


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


async def collect_latam_feeds() -> tuple[list[dict], list[dict]]:
    """Collect official LATAM CSIRT RSS/Atom feeds with partial-failure isolation."""
    items: list[dict] = []
    statuses: list[dict] = []
    async with httpx.AsyncClient(
        timeout=20,
        follow_redirects=True,
        headers={"User-Agent": "Palmer-CTI-Investigate/1.0"},
    ) as client:
        for source in LATAM_FEEDS:
            try:
                response = await client.get(source["url"])
                response.raise_for_status()
                parsed = (
                    _parse_html_listing(response.text, source)
                    if source["format"] == "html"
                    else _parse_feed(response.content, source)
                )
                items.extend(parsed)
                statuses.append(
                    {"source": source["name"], "status": "ok", "items": len(parsed)}
                )
            except (httpx.HTTPError, ElementTree.ParseError, ValueError) as exc:
                statuses.append(
                    {"source": source["name"], "status": "error", "error": str(exc)}
                )
    return items, statuses


def _parse_feed(content: bytes, source: dict) -> list[dict]:
    root = ElementTree.fromstring(content)
    entries = root.findall(".//item")
    atom = False
    if not entries:
        entries = root.findall(".//{http://www.w3.org/2005/Atom}entry")
        atom = True
    parsed: list[dict] = []
    for entry in entries[:50]:
        if atom:
            title = _xml_text(entry, "{http://www.w3.org/2005/Atom}title")
            link_node = entry.find("{http://www.w3.org/2005/Atom}link")
            link = link_node.get("href", "") if link_node is not None else ""
            summary = _xml_text(entry, "{http://www.w3.org/2005/Atom}summary")
            published = _xml_text(entry, "{http://www.w3.org/2005/Atom}updated")
        else:
            title = _xml_text(entry, "title")
            link = _xml_text(entry, "link")
            summary = _xml_text(entry, "description")
            published = _xml_text(entry, "pubDate")
        if not title or not link:
            continue
        clean_summary = _clean_html(summary)
        combined = f"{title} {clean_summary}"
        parsed.append(
            {
                "title": html.unescape(title).strip()[:500],
                "summary": clean_summary[:4000] or None,
                "source_name": source["name"],
                "source_url": link[:2048],
                "country_code": source["country_code"],
                "country_name": source["country_name"],
                "severity": _infer_severity(combined),
                "sectors": _infer_sectors(combined),
                "tags": sorted(set(re.findall(r"CVE-\d{4}-\d{4,}", combined, re.I))),
                "published_at": _parse_feed_date(published),
            }
        )
    return parsed


def _parse_html_listing(content: str, source: dict) -> list[dict]:
    """Extract alert links from official sites that do not publish a valid feed."""
    parsed: list[dict] = []
    seen: set[str] = set()
    pattern = re.compile(
        r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',
        re.I | re.S,
    )
    for link, raw_title in pattern.findall(content):
        title = _clean_html(raw_title)
        link = urljoin(source["homepage"], link)
        if (
            not re.search(source["link_pattern"], link)
            or link in seen
            or len(title) < 18
        ):
            continue
        seen.add(link)
        parsed.append(
            {
                "title": title[:500],
                "summary": None,
                "source_name": source["name"],
                "source_url": link[:2048],
                "country_code": source["country_code"],
                "country_name": source["country_name"],
                "severity": _infer_severity(title),
                "sectors": _infer_sectors(title),
                "tags": sorted(set(re.findall(r"CVE-\d{4}-\d{4,}", title, re.I))),
                "published_at": datetime.now(timezone.utc),
            }
        )
        if len(parsed) == 50:
            break
    return parsed


def _xml_text(element: ElementTree.Element, name: str) -> str:
    node = element.find(name)
    return "".join(node.itertext()).strip() if node is not None else ""


def _clean_html(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def _parse_feed_date(value: str) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return datetime.now(timezone.utc)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _infer_severity(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ("crítica", "critica", "critical", "zero-day", "0-day")):
        return "critical"
    if any(word in lowered for word in ("alta", "high", "ransomware", "explotada", "explorada")):
        return "high"
    if any(word in lowered for word in ("baja", "baixa", "low")):
        return "low"
    return "medium"


def _infer_sectors(text: str) -> list[str]:
    keywords = {
        "financeiro": ("banco", "bank", "financ", "fintech"),
        "governo": ("gobierno", "governo", "government", "municipal"),
        "saúde": ("salud", "saúde", "hospital", "health"),
        "energia": ("energía", "energia", "power", "oil", "petróleo"),
        "telecom": ("telecom", "internet provider", "isp"),
        "varejo": ("retail", "varejo", "comercio", "comércio"),
    }
    lowered = text.lower()
    return [sector for sector, terms in keywords.items() if any(term in lowered for term in terms)]
