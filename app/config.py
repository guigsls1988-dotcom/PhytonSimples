from dataclasses import dataclass
from functools import lru_cache
import os


@dataclass(frozen=True)
class Settings:
    database_path: str
    cache_ttl_seconds: int
    request_timeout_seconds: float
    reader_api_keys: frozenset[str]
    admin_api_keys: frozenset[str]
    tor_sources: tuple[tuple[str, str], ...]


def _keys(name: str, default: str) -> frozenset[str]:
    return frozenset(value.strip() for value in os.getenv(name, default).split(",") if value.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings(
        database_path=os.getenv("DATABASE_PATH", "data/tor.db"),
        cache_ttl_seconds=int(os.getenv("CACHE_TTL_SECONDS", "300")),
        request_timeout_seconds=float(os.getenv("REQUEST_TIMEOUT_SECONDS", "10")),
        reader_api_keys=_keys("READER_API_KEYS", "reader-local-key"),
        admin_api_keys=_keys("ADMIN_API_KEYS", "admin-local-key"),
        tor_sources=(
            ("torproject", "https://check.torproject.org/torbulkexitlist"),
            ("dan_me", "https://www.dan.me.uk/torlist/?exit"),
        ),
    )
