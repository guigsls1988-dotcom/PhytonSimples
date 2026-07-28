from fastapi.testclient import TestClient

from app.main import app


def test_dashboard_is_available_without_login() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/dashboard")
    assert response.status_code == 200
    assert "counts" in response.json()
