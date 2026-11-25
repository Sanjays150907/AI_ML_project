from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class TrainRecord(BaseModel):
    journey_id: str
    train_number: str
    train_type: str
    departure_date: str
    departure_hour: int
    distance_km: float
    num_scheduled_stops: int
    scheduled_travel_hours: float
    zone: str
    zone_abbr: Optional[str] = None
    season: str
    traction_type: Optional[str] = None
    source_station_category: Optional[str] = None
    destination_station_category: Optional[str] = None
    is_hdn_route: Optional[int] = 0
    route_historical_ontime_pct: Optional[float] = None
    historical_delay_minutes: Optional[int] = None

class PaginatedTrainsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    trains: List[TrainRecord]
    filter_options: Optional[Dict[str, List[str]]] = None
