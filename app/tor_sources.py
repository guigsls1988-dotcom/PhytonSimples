from __future__ import annotations

import asyncio
import ipaddress
import time
from dataclasses import dataclass
from datetime import UTC, datetime

import httpx

from app.config import Settings


@dataclass(frozen=True)
class TorSnapshot:
    ips: tuple[str, ...]
    fetched_at: str
    sources_ok: tuple[str, ...]
    source_errors: dict[str, str]
    stale: bool = False


class NoSourceAvailable(RuntimeError):
    pass


class TorSourceService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._cached: TorSnapshot | None = None
        self._cached_at = 0.0
        self._lock = asyncio.Lock()

    async def get_snapshot(self, force_refresh: bool = False) -> TorSnapshot:
        if not force_refresh and self._cache_is_fresh():
            return self._cached  # type: ignore[return-value]

        async with self._lock:
            if not force_refresh and self._cache_is_fresh():
                return self._cached  # type: ignore[return-value]
            try:
                snapshot = await self._fetch_all()
            except NoSourceAvailable:
                if self._cached:
                    return TorSnapshot(**{**self._cached.__dict__, "stale": True})
                raise
            self._cached = snapshot
            self._cached_at = time.monotonic()
            return snapshot

    def _cache_is_fresh(self) -> bool:
        return bool(
            self._cached
            and time.monotonic() - self._cached_at < self.settings.cache_ttl_seconds
        )

    async def _fetch_all(self) -> TorSnapshot:
        async with httpx.AsyncClient(
            timeout=self.settings.request_timeout_seconds,
            follow_redirects=True,
            headers={"User-Agent": "tor-ip-aggregator/1.0"},
        ) as client:
            results = await asyncio.gather(
                *(
                    self._fetch_source(client, name, url)
                    for name, url in self.settings.tor_sources
                ),
                return_exceptions=True,
            )

        all_ips: set[str] = set()
        sources_ok: list[str] = []
        errors: dict[str, str] = {}
        for (name, _), result in zip(self.settings.tor_sources, results, strict=True):
            if isinstance(result, BaseException):
                errors[name] = self._safe_error(result)
            else:
                all_ips.update(result)
                sources_ok.append(name)

        if not sources_ok:
            raise NoSourceAvailable(
                "No fue posible consultar ninguna fuente de nodos Tor"
            )

        return TorSnapshot(
            ips=tuple(sorted(all_ips, key=self._sort_key)),
            fetched_at=datetime.now(UTC).isoformat(),
            sources_ok=tuple(sources_ok),
            source_errors=errors,
        )

    async def _fetch_source(
        self, client: httpx.AsyncClient, name: str, url: str
    ) -> set[str]:
        response = await client.get(url)
        response.raise_for_status()
        ips = self.parse_ips(response.text)
        if not ips:
            raise ValueError(f"{name} devolvió una respuesta sin IPs válidas")
        return ips

    @staticmethod
    def parse_ips(text: str) -> set[str]:
        ips: set[str] = set()
        for line in text.splitlines():
            candidate = line.strip().split("#", 1)[0].strip()
            if not candidate:
                continue
            try:
                address = ipaddress.ip_address(candidate)
            except ValueError:
                continue
            if address.is_global:
                ips.add(str(address))
        return ips

    @staticmethod
    def _sort_key(value: str) -> tuple[int, int]:
        address = ipaddress.ip_address(value)
        return address.version, int(address)

    @staticmethod
    def _safe_error(error: BaseException) -> str:
        if isinstance(error, httpx.HTTPStatusError):
            return f"HTTP {error.response.status_code}"
        if isinstance(error, httpx.TimeoutException):
            return "timeout"
        return error.__class__.__name__
