import pandas as pd
from typing import Dict, Any, List, Optional
from app.core.config import settings

class TrainSearchService:
    def __init__(self):
        self._cached_trains: Optional[pd.DataFrame] = None
        self._unique_train_types: List[str] = []
        self._unique_zones: List[str] = []

    def _ensure_cache(self):
        """Loads and indexes a rich sample of 25,000 real journeys for responsive search."""
        if self._cached_trains is not None:
            return

        if not settings.TRAIN_CSV.exists():
            self._cached_trains = pd.DataFrame()
            return

        print("Indexing train records from ir_train.csv for train search...")
        cols = [
            "journey_id", "train_number", "train_type", "departure_date",
            "departure_hour", "distance_km", "num_scheduled_stops",
            "scheduled_travel_hours", "zone", "zone_abbr", "season",
            "source_station_category", "destination_station_category",
            "traction_type", "is_hdn_route", "route_historical_ontime_pct",
            "delay_minutes", "track_doubled", "is_electrified", "psr_count",
            "is_circular_route", "is_monsoon_season", "is_fog_risk",
            "fog_risk_score", "zone_fog_index", "zone_congestion_index",
            "season_severity_score", "loco_age_years", "coach_age_years",
            "has_lhb_coaches", "is_rake_shared", "maintenance_score",
            "seat_utilisation_pct", "is_overloaded", "late_incoming_rake",
            "is_special_train"
        ]

        df = pd.read_csv(
            settings.TRAIN_CSV,
            nrows=30000,
            usecols=lambda c: c in cols
        )
        self._cached_trains = df
        self._unique_train_types = sorted(df["train_type"].dropna().unique().tolist())
        self._unique_zones = sorted(df["zone"].dropna().unique().tolist())

    def search_trains(
        self,
        query: Optional[str] = None,
        train_type: Optional[str] = None,
        zone: Optional[str] = None,
        min_distance: Optional[float] = None,
        max_distance: Optional[float] = None,
        page: int = 1,
        page_size: int = 15
    ) -> Dict[str, Any]:
        """
        Filters and returns paginated real train journeys from the dataset.
        """
        self._ensure_cache()
        df = self._cached_trains

        if df is None or df.empty:
            return {
                "total": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 0,
                "trains": [],
                "filter_options": {"train_types": [], "zones": []}
            }

        filtered = df

        if query:
            q = str(query).strip().lower()
            filtered = filtered[
                filtered["train_number"].astype(str).str.lower().str.contains(q, na=False) |
                filtered["journey_id"].astype(str).str.lower().str.contains(q, na=False) |
                filtered["train_type"].astype(str).str.lower().str.contains(q, na=False)
            ]

        if train_type and train_type != "All":
            filtered = filtered[filtered["train_type"] == train_type]

        if zone and zone != "All":
            filtered = filtered[filtered["zone"] == zone]

        if min_distance is not None:
            filtered = filtered[filtered["distance_km"] >= min_distance]

        if max_distance is not None:
            filtered = filtered[filtered["distance_km"] <= max_distance]

        total = len(filtered)
        total_pages = max(1, (total + page_size - 1) // page_size)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        page_df = filtered.iloc[start_idx:end_idx]

        train_records = []
        for _, row in page_df.iterrows():
            train_records.append({
                "journey_id": str(row["journey_id"]),
                "train_number": str(row["train_number"]),
                "train_type": str(row["train_type"]),
                "departure_date": str(row["departure_date"]),
                "departure_hour": int(row["departure_hour"]),
                "distance_km": float(row["distance_km"]),
                "num_scheduled_stops": int(row["num_scheduled_stops"]),
                "scheduled_travel_hours": float(row["scheduled_travel_hours"]),
                "zone": str(row["zone"]),
                "zone_abbr": str(row.get("zone_abbr", "")),
                "season": str(row["season"]),
                "traction_type": str(row.get("traction_type", "Electric (25kV AC)")),
                "source_station_category": str(row.get("source_station_category", "A")),
                "destination_station_category": str(row.get("destination_station_category", "B")),
                "is_hdn_route": int(row.get("is_hdn_route", 0)),
                "route_historical_ontime_pct": float(row.get("route_historical_ontime_pct", 70.0)),
                "historical_delay_minutes": int(row.get("delay_minutes", 0)) if "delay_minutes" in row else None,
                # All raw attributes for autofill
                "full_attributes": {k: (None if pd.isna(v) else v) for k, v in row.to_dict().items()}
            })

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "trains": train_records,
            "filter_options": {
                "train_types": self._unique_train_types,
                "zones": self._unique_zones
            }
        }

    def get_journey_by_id(self, journey_id: str) -> Optional[Dict[str, Any]]:
        """Look up full features for a specific journey ID."""
        self._ensure_cache()
        df = self._cached_trains
        if df is None or df.empty:
            return None

        matches = df[df["journey_id"] == journey_id]
        if matches.empty:
            return None

        row = matches.iloc[0]
        return {k: (None if pd.isna(v) else v) for k, v in row.to_dict().items()}

train_search_service = TrainSearchService()
