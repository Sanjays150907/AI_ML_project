import pytest
from app.core.security import create_access_token

def test_unauthenticated_request_rejected(client):
    response = client.get("/api/admin/users")
    assert response.status_code == 401

def test_regular_user_cannot_access_admin_endpoints(client, regular_user):
    token = create_access_token(subject=str(regular_user.id), role=regular_user.role)
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to view users as regular user
    res1 = client.get("/api/admin/users", headers=headers)
    assert res1.status_code == 403
    assert "Administrator privileges required" in res1.json()["detail"]

    # Attempt to view system health as regular user
    res2 = client.get("/api/admin/system-health", headers=headers)
    assert res2.status_code == 403

    # Attempt to view ML monitoring as regular user
    res3 = client.get("/api/admin/ml-monitoring", headers=headers)
    assert res3.status_code == 403

def test_admin_user_can_access_admin_endpoints(client, admin_user):
    token = create_access_token(subject=str(admin_user.id), role=admin_user.role)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/admin/users", headers=headers)
    assert res.status_code == 200
    assert "users" in res.json()

    health_res = client.get("/api/admin/system-health", headers=headers)
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "HEALTHY"
