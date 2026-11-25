import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings

class DatasetManager:
    """
    Manages loading, validation, and querying of the Indian Railways dataset.
    """
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or settings.DATASET_DIR
        self.train_csv = self.data_dir / "ir_train.csv"
        self.test_csv = self.data_dir / "ir_test.csv"
        self.data_dict_csv = self.data_dir / "ir_data_dictionary.csv"
        self.sample_sub_csv = self.data_dir / "ir_sample_submission.csv"

    def validate_files(self) -> Dict[str, Any]:
        """Validates that all required dataset files exist and are readable."""
        results = {}
        for name, path in [
            ("train", self.train_csv),
            ("test", self.test_csv),
            ("dictionary", self.data_dict_csv),
            ("sample_submission", self.sample_sub_csv),
        ]:
            exists = path.exists()
            size_mb = (path.stat().st_size / (1024 * 1024)) if exists else 0
            results[name] = {
                "path": str(path),
                "exists": exists,
                "size_mb": round(size_mb, 2)
            }
        return results

    def load_data_dictionary(self) -> pd.DataFrame:
        """Loads and returns the official data dictionary."""
        if not self.data_dict_csv.exists():
            raise FileNotFoundError(f"Data dictionary not found at {self.data_dict_csv}")
        return pd.read_csv(self.data_dict_csv)

    def validate_dataset_schema(self, sample_rows: int = 5000) -> Dict[str, Any]:
        """
        Validates column names, data types, missing value percentages,
        and target availability on a representative slice of ir_train.csv.
        """
        if not self.train_csv.exists():
            return {
                "status": "ERROR",
                "message": f"Train dataset not found at {self.train_csv}"
            }

        df_sample = pd.read_csv(self.train_csv, nrows=sample_rows)
        dict_df = self.load_data_dictionary()
        expected_cols = set(dict_df["column"].tolist())
        actual_cols = set(df_sample.columns.tolist())

        missing_cols = list(expected_cols - actual_cols)
        extra_cols = list(actual_cols - expected_cols)

        # Missing values check
        missing_counts = df_sample.isnull().sum()
        missing_pct = (missing_counts / len(df_sample) * 100).to_dict()

        # Target statistics
        target_stats = {}
        if "delay_minutes" in df_sample.columns:
            target_stats = {
                "mean_delay": float(df_sample["delay_minutes"].mean()),
                "median_delay": float(df_sample["delay_minutes"].median()),
                "max_delay": float(df_sample["delay_minutes"].max()),
                "min_delay": float(df_sample["delay_minutes"].min()),
                "delayed_trains_pct": float((df_sample["delay_minutes"] > 15).mean() * 100)
            }

        status = "VALID"
        if missing_cols:
            status = "WARNING"

        return {
            "status": status,
            "total_columns": len(actual_cols),
            "expected_columns": len(expected_cols),
            "missing_expected_columns": missing_cols,
            "unexpected_columns": extra_cols,
            "missing_values_pct": {k: round(v, 2) for k, v in missing_pct.items() if v > 0},
            "target_stats": target_stats,
            "sample_rows_analyzed": sample_rows
        }

    def load_train_partition(self, max_rows: Optional[int] = 100000) -> pd.DataFrame:
        """
        Loads the training dataset with memory-conscious data types.
        If max_rows is provided, loads the first max_rows.
        """
        if not self.train_csv.exists():
            raise FileNotFoundError(f"ir_train.csv not found at {self.train_csv}")

        dtypes = {
            "journey_id": "string",
            "train_number": "string",
            "train_type": "string",
            "season": "string",
            "zone": "string",
            "zone_abbr": "string",
            "source_station_category": "string",
            "destination_station_category": "string",
            "traction_type": "string",
            "primary_delay_cause": "string",
            "year": "int32",
            "month": "int32",
            "day_of_week": "int32",
            "departure_hour": "int32",
            "distance_km": "float32",
            "num_scheduled_stops": "int32",
            "scheduled_travel_hours": "float32",
            "track_doubled": "int8",
            "is_hdn_route": "int8",
            "is_electrified": "int8",
            "psr_count": "int32",
            "is_circular_route": "int8",
            "is_monsoon_season": "int8",
            "is_fog_risk": "int8",
            "fog_risk_score": "float32",
            "zone_fog_index": "float32",
            "zone_congestion_index": "float32",
            "season_severity_score": "float32",
            "loco_age_years": "float32",
            "coach_age_years": "float32",
            "has_lhb_coaches": "int8",
            "is_rake_shared": "int8",
            "maintenance_score": "float32",
            "seat_utilisation_pct": "float32",
            "is_overloaded": "int8",
            "late_incoming_rake": "int8",
            "is_special_train": "int8",
            "route_historical_ontime_pct": "float32",
            "delay_minutes": "float32",
            "is_delayed": "int8"
        }

        print(f"Loading {max_rows if max_rows else 'all'} rows from {self.train_csv}...")
        df = pd.read_csv(self.train_csv, nrows=max_rows, dtype={k: v for k, v in dtypes.items() if k in dtypes})
        return df

dataset_manager = DatasetManager()
