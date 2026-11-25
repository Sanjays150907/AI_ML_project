import pytest
from app.core.security import verify_password

def test_register_creates_regular_user(client):
    payload = {
        "email": "newuser@railway.in",
        "password": "ValidPassword123!",
        "full_name": "New Passenger",
        "role": "admin" # Attacking registration by attempting to self-assign admin
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@railway.in"
    # Registration MUST always enforce role == "user", ignoring any client claim!
    assert data["role"] == "user"
    assert "password" not in data
    assert "password_hash" not in data

def test_register_duplicate_email_fails(client, regular_user):
    payload = {
        "email": regular_user.email,
        "password": "AnotherPassword123!",
        "full_name": "Imposter"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_success(client, regular_user):
    payload = {
        "email": regular_user.email,
        "password": "UserPassword123!"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "user"

def test_login_invalid_password(client, regular_user):
    payload = {
        "email": regular_user.email,
        "password": "WrongPassword!"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401

def test_deactivated_user_cannot_login(client, regular_user, db):
    regular_user.is_active = False
    regular_user.disabled_reason = "Policy violation"
    db.commit()

    payload = {
        "email": regular_user.email,
        "password": "UserPassword123!"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 403
    assert "deactivated" in response.json()["detail"]
