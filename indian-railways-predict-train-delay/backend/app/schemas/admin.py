import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class AdminUserItem(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    disabled_reason: Optional[str]
    created_at: datetime.datetime
    last_login_at: Optional[datetime.datetime]
    prediction_count: int = 0

    class Config:
        from_attributes = True

class UserStatusUpdate(BaseModel):
    is_active: bool
    disabled_reason: Optional[str] = None

class SystemHealthResponse(BaseModel):
    status: str
    database_connected: bool
    database_type: str
    model_loaded: bool
    active_model_version: Optional[str]
    active_model_type: Optional[str]
    total_users: int
    active_users: int
    disabled_users: int
    total_predictions: int
    avg_latency_ms: float
    error_rate_pct: float
    uptime_seconds: float
    timestamp: datetime.datetime

class ModelComparisonItem(BaseModel):
    model_name: str
    model_type: str
    has_pca: bool
    mae: float
    rmse: float
    r2: float
    training_time_seconds: Optional[float] = None
    retained_components: Optional[int] = None
    is_primary: bool

class PCAAnalyticsResponse(BaseModel):
    n_original_features: int
    n_components_retained: int
    variance_threshold: float
    explained_variance_ratio: List[float]
    cumulative_variance: List[float]
    feature_names: List[str]
    top_loadings: Optional[Dict[str, Dict[str, float]]] = None

class MLMonitoringResponse(BaseModel):
    active_model: Optional[Dict[str, Any]]
    model_comparisons: List[ModelComparisonItem]
    pca_analytics: Optional[PCAAnalyticsResponse]
    actual_vs_predicted: Optional[List[Dict[str, float]]] = None
    error_distribution: Optional[List[Dict[str, Any]]] = None
    dataset_row_count: int
    dataset_col_count: int

class AuditLogItem(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    action: str
    endpoint: str
    ip_address: Optional[str]
    status_code: Optional[int]
    response_time_ms: Optional[float]
    created_at: datetime.datetime

    class Config:
        from_attributes = True
