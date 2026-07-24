from __future__ import annotations

from contextlib import contextmanager
from datetime import UTC, datetime
import hashlib
import json
from pathlib import Path
import sqlite3
from typing import Iterator


class Database:
    def __init__(self, path: str) -> None:
        self.path = path

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()

    def initialize(self) -> None:
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS exclusions (
                    ip TEXT PRIMARY KEY,
                    reason TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    created_by TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    occurred_at TEXT NOT NULL,
                    method TEXT NOT NULL,
                    path TEXT NOT NULL,
                    status_code INTEGER NOT NULL,
                    principal_hash TEXT NOT NULL,
                    client_ip_hash TEXT NOT NULL,
                    details TEXT NOT NULL DEFAULT '{}'
                );
                CREATE INDEX IF NOT EXISTS idx_audit_occurred_at
                    ON audit_log(occurred_at);
                """
            )

    def add_exclusion(self, ip: str, reason: str, principal: str) -> bool:
        with self.connect() as connection:
            cursor = connection.execute(
                """
                INSERT OR IGNORE INTO exclusions(ip, reason, created_at, created_by)
                VALUES (?, ?, ?, ?)
                """,
                (ip, reason, datetime.now(UTC).isoformat(), self._hash(principal)),
            )
            return cursor.rowcount == 1

    def remove_exclusion(self, ip: str) -> bool:
        with self.connect() as connection:
            cursor = connection.execute("DELETE FROM exclusions WHERE ip = ?", (ip,))
            return cursor.rowcount == 1

    def list_exclusions(self) -> list[dict[str, str]]:
        with self.connect() as connection:
            rows = connection.execute(
                "SELECT ip, reason, created_at FROM exclusions ORDER BY ip"
            ).fetchall()
        return [dict(row) for row in rows]

    def excluded_ips(self) -> set[str]:
        with self.connect() as connection:
            rows = connection.execute("SELECT ip FROM exclusions").fetchall()
        return {row["ip"] for row in rows}

    def audit(
        self,
        method: str,
        path: str,
        status_code: int,
        principal: str,
        client_ip: str,
        details: dict[str, str] | None = None,
    ) -> None:
        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO audit_log(
                    occurred_at, method, path, status_code, principal_hash,
                    client_ip_hash, details
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    datetime.now(UTC).isoformat(),
                    method,
                    path,
                    status_code,
                    self._hash(principal),
                    self._hash(client_ip),
                    json.dumps(details or {}, separators=(",", ":")),
                ),
            )

    @staticmethod
    def _hash(value: str) -> str:
        return hashlib.sha256(value.encode()).hexdigest()[:16] if value else "anonymous"
