import pytest
from app.ml.inference import inference_service
from app.ml.pipeline import NUMERICAL_FEATURES, CATEGORICAL_FEATURES, EXCLUDED_LEAKAGE_COLUMNS

def test_model_is_loaded():
    assert inference_service.is_model_loaded() is True
    metadata = inference_service.get_model_metadata()
    assert metadata is not None
    assert "pca_analytics" in metadata

def test_pca_variance_and_components():
    metadata = inference_service.get_model_metadata()
    pca_data = metadata["pca_analytics"]
    
    assert pca_data["n_original_features"] == len(NUMERICAL_FEATURES)
    # Dimensionality reduction must genuinely reduce components
    assert pca_data["n_components_retained"] < pca_data["n_original_features"]
    # Retained variance must be >= 95%
    cum_var = pca_data["cumulative_variance"][-1]
    assert cum_var >= 0.95

def test_target_leakage_prevented():
    # Verify no prohibited leakage column is in numerical or categorical features
    all_features = set(NUMERICAL_FEATURES + CATEGORICAL_FEATURES)
    for leakage_col in EXCLUDED_LEAKAGE_COLUMNS:
        assert leakage_col not in all_features, f"Critical Leakage: {leakage_col} found in predictor features!"

def test_inference_delay_and_eta():
    sample_data = {
        "train_number": "12536",
        "train_type": "Superfast Express",
        "departure_date": "2024-08-15",
        "departure_hour": 7,
        "distance_km": 620.0,
        "num_scheduled_stops": 12,
        "scheduled_travel_hours": 10.33,
        "zone": "North Western Railway (NWR)",
        "season": "Monsoon",
        "traction_type": "Dual",
        "track_doubled": 1,
        "is_hdn_route": 0,
        "is_electrified": 1,
        "psr_count": 3,
        "is_circular_route": 0,
        "is_monsoon_season": 1,
        "is_fog_risk": 0,
        "fog_risk_score": 0.0,
        "zone_fog_index": 0.58,
        "zone_congestion_index": 0.75,
        "season_severity_score": 0.78,
        "loco_age_years": 16.7,
        "coach_age_years": 7.8,
        "has_lhb_coaches": 0,
        "is_rake_shared": 1,
        "maintenance_score": 5.5,
        "seat_utilisation_pct": 88.8,
        "is_overloaded": 0,
        "late_incoming_rake": 0,
        "is_special_train": 0,
        "route_historical_ontime_pct": 67.8
    }

    result = inference_service.predict(sample_data)
    assert "predicted_delay_minutes" in result
    assert isinstance(result["predicted_delay_minutes"], float)
    assert result["predicted_delay_minutes"] >= 0.0
    assert result["scheduled_departure"] == "2024-08-15 07:00"
    assert result["scheduled_arrival"] is not None
    assert result["estimated_arrival"] is not None
    assert "model_version" in result
