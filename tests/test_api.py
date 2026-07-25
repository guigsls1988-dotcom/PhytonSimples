from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.tor_sources import TorSnapshot


@pytest.fixture
def client(tmp_path: Path):
    settings = Settings(
        database_path=str(tmp_path / "test.db"),
        cache_ttl_seconds=300,
        request_timeout_seconds=1,
        reader_api_keys=frozenset({"reader"}),
        admin_api_keys=frozenset({"admin"}),
        tor_sources=(("test", "https://example.test/list"),),
    )
    app = create_app(settings)

    async def snapshot(_: bool = False) -> TorSnapshot:
        return TorSnapshot(
            ips=("1.1.1.1", "8.8.8.8", "2001:4860:4860::8888"),
            fetched_at="2026-01-01T00:00:00+00:00",
            sources_ok=("test",),
            source_errors={},
        )

    app.state.source_service.get_snapshot = snapshot
    with TestClient(app) as test_client:
        yield test_client


def test_authentication_is_required(client: TestClient):
    response = client.get("/v1/tor-ips")
    assert response.status_code == 401


def test_reader_can_list_aggregated_ips(client: TestClient):
    response = client.get("/v1/tor-ips", headers={"X-API-Key": "reader"})
    assert response.status_code == 200
    assert response.json()["count"] == 3


def test_admin_can_exclude_and_filtered_list_omits_ip(client: TestClient):
    created = client.post(
        "/v1/exclusions",
        headers={"X-API-Key": "admin"},
        json={"ip": "8.8.8.8", "reason": "allowlisted scanner"},
    )
    assert created.status_code == 201
    assert created.json()["created"] is True

    duplicate = client.post(
        "/v1/exclusions",
        headers={"X-API-Key": "admin"},
        json={"ip": "8.8.8.8", "reason": "duplicate"},
    )
    assert duplicate.status_code == 200
    assert duplicate.json()["created"] is False

    filtered = client.get("/v1/tor-ips/filtered", headers={"X-API-Key": "reader"})
    assert filtered.status_code == 200
    assert filtered.json()["ips"] == ["1.1.1.1", "2001:4860:4860::8888"]
    assert filtered.json()["excluded_count"] == 1


def test_reader_cannot_change_exclusions(client: TestClient):
    response = client.post(
        "/v1/exclusions",
        headers={"X-API-Key": "reader"},
        json={"ip": "1.1.1.1"},
    )
    assert response.status_code == 403


def test_invalid_ip_is_rejected(client: TestClient):
    response = client.post(
        "/v1/exclusions",
        headers={"X-API-Key": "admin"},
        json={"ip": "not-an-ip"},
    )
    assert response.status_code == 422


def test_delete_exclusion(client: TestClient):
    client.post(
        "/v1/exclusions",
        headers={"X-API-Key": "admin"},
        json={"ip": "1.1.1.1"},
    )
    response = client.delete("/v1/exclusions/1.1.1.1", headers={"X-API-Key": "admin"})
    assert response.status_code == 204
