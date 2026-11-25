import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class PredictionInput(BaseModel):
    journey_id: Optional[str] = None
    train_number: str = Field(..., description="5-digit train number")
    train_type: str = Field(..., description="Train type (Superfast, Express, Vande Bharat, etc.)")
    departure_date: Optional[str] = Field(None, description="Scheduled departure date YYYY-MM-DD")
    departure_hour: int = Field(12, ge=0, le=23)
    year: Optional[int] = None
    month: Optional[int] = None
    day_of_week: Optional[int] = None
    
    distance_km: float = Field(..., gt=0)
    num_scheduled_stops: int = Field(..., ge=0)
    scheduled_travel_hours: float = Field(..., gt=0)
    
    season: str = Field("Monsoon")
    zone: str = Field("Northern Railway (NR)")
    zone_abbr: Optional[str] = None
    source_station_category: Optional[str] = "A"
    destination_station_category: Optional[str] = "B"
    traction_type: Optional[str] = "Electric (25kV AC)"
    
    track_doubled: int = Field(1, ge=0, le=1)
    is_hdn_route: int = Field(0, ge=0, le=1)
    is_electrified: int = Field(1, ge=0, le=1)
    psr_count: int = Field(2, ge=0)
    is_circular_route: int = Field(0, ge=0, le=1)
    is_monsoon_season: int = Field(0, ge=0, le=1)
    is_fog_risk: int = Field(0, ge=0, le=1)
    fog_risk_score: float = Field(0.0, ge=0.0, le=1.0)
    zone_fog_index: float = Field(0.2, ge=0.0, le=1.0)
    zone_congestion_index: float = Field(0.7, ge=0.0, le=1.0)
    season_severity_score: float = Field(0.5, ge=0.0, le=1.0)
    loco_age_years: float = Field(10.0, ge=0.0)
    coach_age_years: float = Field(8.0, ge=0.0)
    has_lhb_coaches: int = Field(1, ge=0, le=1)
    is_rake_shared: int = Field(0, ge=0, le=1)
    maintenance_score: float = Field(7.0, ge=1.0, le=10.0)
    seat_utilisation_pct: float = Field(80.0, ge=0.0)
    is_overloaded: int = Field(0, ge=0, le=1)
    late_incoming_rake: int = Field(0, ge=0, le=1)
    is_special_train: int = Field(0, ge=0, le=1)
    route_historical_ontime_pct: float = Field(75.0, ge=0.0, le=100.0)
    
    is_weekend: Optional[int] = 0
    is_night_departure: Optional[int] = 0
    is_peak_hour: Optional[int] = 0
    is_festival_season: Optional[int] = 0

class PredictionResponse(BaseModel):
    predicted_delay_minutes: float
    is_delayed: bool
    scheduled_departure: Optional[str] = None
    scheduled_arrival: Optional[str] = None
    estimated_arrival: Optional[str] = None
    model_version: str
    model_type: str
    prediction_timestamp: datetime.datetime
    confidence_interval: Optional[Dict[str, float]] = None
    delay_severity: str # "On Time", "Minor Delay (<30m)", "Moderate Delay (30-120m)", "Severe Delay (>120m)"
    factors_summary: Optional[Dict[str, Any]] = None

class PredictionHistoryItem(BaseModel):
    id: int
    journey_id: Optional[str]
    train_number: str
    train_type: Optional[str]
    departure_date: Optional[str]
    distance_km: Optional[float]
    scheduled_travel_hours: Optional[float]
    predicted_delay_minutes: float
    is_delayed_predicted: bool
    scheduled_arrival: Optional[str]
    estimated_arrival: Optional[str]
    model_version: str
    created_at: datetime.datetime
    inputs_snapshot: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class PaginatedHistoryResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[PredictionHistoryItem]
