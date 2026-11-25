import pytest
from app.core.security import create_access_token

def test_predict_and_isolate_history(client, regular_user, other_user):
    token_user1 = create_access_token(subject=str(regular_user.id), role=regular_user.role)
    token_user2 = create_access_token(subject=str(other_user.id), role=other_user.role)

    headers_user1 = {"Authorization": f"Bearer {token_user1}"}
    headers_user2 = {"Authorization": f"Bearer {token_user2}"}

    payload = {
        "train_number": "22416",
        "train_type": "Vande Bharat Express",
        "departure_date": "2024-09-01",
        "departure_hour": 15,
        "distance_km": 449.0,
        "num_scheduled_stops": 6,
        "scheduled_travel_hours": 4.73,
        "season": "Monsoon",
        "zone": "Northern Railway (NR)",
        "track_doubled": 1,
        "is_hdn_route": 1,
        "is_electrified": 1,
        "psr_count": 2,
        "fog_risk_score": 0.0,
        "zone_fog_index": 0.1,
        "zone_congestion_index": 0.6,
        "season_severity_score": 0.5,
        "loco_age_years": 4.0,
        "coach_age_years": 3.0,
        "maintenance_score": 9.0,
        "seat_utilisation_pct": 95.0,
        "late_incoming_rake": 0,
        "is_special_train": 0,
        "route_historical_ontime_pct": 85.0
    }

    # User 1 performs a prediction
    pred_res = client.post("/api/predictions/predict", json=payload, headers=headers_user1)
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert "predicted_delay_minutes" in pred_data
    assert pred_data["estimated_arrival"] is not None

    # User 1 views their history
    hist1 = client.get("/api/predictions/history", headers=headers_user1)
    assert hist1.status_code == 200
    assert hist1.json()["total"] == 1
    item_id = hist1.json()["items"][0]["id"]

    # User 2 views their history -> MUST BE EMPTY (User-isolation!)
    hist2 = client.get("/api/predictions/history", headers=headers_user2)
    assert hist2.status_code == 200
    assert hist2.json()["total"] == 0

    # User 2 attempts to delete User 1's prediction -> MUST BE 404/Denied
    del_res = client.delete(f"/api/predictions/history/{item_id}", headers=headers_user2)
    assert del_res.status_code == 404

    # User 1 deletes their own prediction -> MUST BE 200
    del_res_own = client.delete(f"/api/predictions/history/{item_id}", headers=headers_user1)
    assert del_res_own.status_code == 200

    # Verify history is now 0
    hist1_after = client.get("/api/predictions/history", headers=headers_user1)
    assert hist1_after.json()["total"] == 0
