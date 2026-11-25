from typing import List, Tuple
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestRegressor
import xgboost as xgb

# Core numerical predictor columns
NUMERICAL_FEATURES: List[str] = [
    "distance_km",
    "num_scheduled_stops",
    "scheduled_travel_hours",
    "departure_hour",
    "month",
    "day_of_week",
    "psr_count",
    "fog_risk_score",
    "zone_fog_index",
    "zone_congestion_index",
    "season_severity_score",
    "loco_age_years",
    "coach_age_years",
    "maintenance_score",
    "seat_utilisation_pct",
    "route_historical_ontime_pct",
    "track_doubled",
    "is_hdn_route",
    "is_electrified",
    "is_circular_route",
    "is_monsoon_season",
    "is_fog_risk",
    "has_lhb_coaches",
    "is_rake_shared",
    "is_overloaded",
    "late_incoming_rake",
    "is_special_train"
]

# Categorical predictor columns
CATEGORICAL_FEATURES: List[str] = [
    "train_type",
    "season",
    "zone_abbr",
    "source_station_category",
    "destination_station_category",
    "traction_type"
]

# Target column
TARGET_COLUMN: str = "delay_minutes"

# Strictly prohibited target leakage / non-feature columns
EXCLUDED_LEAKAGE_COLUMNS: List[str] = [
    "journey_id",
    "departure_date",
    "primary_delay_cause",
    "is_delayed",
    "delay_minutes"
]

def build_preprocessor(use_pca: bool = True, pca_variance_ratio: float = 0.95) -> Tuple[ColumnTransformer, PCA]:
    """
    Constructs the ColumnTransformer pipeline.
    If use_pca is True, numerical features are imputed, standardized,
    and transformed with PCA retaining pca_variance_ratio (default 95%).
    Categorical features are imputed and one-hot encoded.
    """
    pca_step = None
    if use_pca:
        pca_step = PCA(n_components=pca_variance_ratio, random_state=42)
        num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("pca", pca_step)
        ])
    else:
        num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])

    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, NUMERICAL_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )

    return preprocessor, pca_step

def build_pca_random_forest_pipeline(
    pca_variance_ratio: float = 0.95,
    n_estimators: int = 60,
    max_depth: int = 15,
    n_jobs: int = -1
) -> Pipeline:
    """
    Builds the compulsory primary PCA-based prediction pipeline.
    StandardScaler -> PCA(0.95) -> RandomForestRegressor
    """
    preprocessor, _ = build_preprocessor(use_pca=True, pca_variance_ratio=pca_variance_ratio)
    rf = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=42,
        n_jobs=n_jobs
    )
    return Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", rf)
    ])

def build_baseline_random_forest_pipeline(
    n_estimators: int = 60,
    max_depth: int = 15,
    n_jobs: int = -1
) -> Pipeline:
    """
    Builds the baseline non-PCA Random Forest pipeline for fair comparison.
    """
    preprocessor, _ = build_preprocessor(use_pca=False)
    rf = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=42,
        n_jobs=n_jobs
    )
    return Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", rf)
    ])

def build_xgboost_pipeline(
    n_estimators: int = 100,
    max_depth: int = 6,
    learning_rate: float = 0.1,
    n_jobs: int = -1
) -> Pipeline:
    """
    Builds an XGBoost benchmark pipeline.
    """
    preprocessor, _ = build_preprocessor(use_pca=False)
    xgb_model = xgb.XGBRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        learning_rate=learning_rate,
        random_state=42,
        n_jobs=n_jobs,
        tree_method="hist"
    )
    return Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", xgb_model)
    ])
