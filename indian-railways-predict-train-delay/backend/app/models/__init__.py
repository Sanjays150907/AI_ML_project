import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, JSON, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="user", nullable=False) # 'user' or 'admin'
    is_active = Column(Boolean, default=True, nullable=False)
    disabled_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    predictions = relationship("PredictionHistory", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    journey_id = Column(String(50), nullable=True, index=True)
    train_number = Column(String(50), nullable=False, index=True)
    train_type = Column(String(100), nullable=True)
    departure_date = Column(String(50), nullable=True)
    distance_km = Column(Float, nullable=True)
    scheduled_travel_hours = Column(Float, nullable=True)
    predicted_delay_minutes = Column(Float, nullable=False)
    is_delayed_predicted = Column(Boolean, default=False)
    scheduled_arrival = Column(String(100), nullable=True)
    estimated_arrival = Column(String(100), nullable=True)
    model_version = Column(String(50), nullable=False)
    inputs_snapshot = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="predictions")

class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(100), nullable=False) # e.g. "RandomForest_PCA", "RandomForest_Baseline", "XGBoost"
    version = Column(String(50), unique=True, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2 = Column(Float, nullable=True)
    pca_n_components = Column(Integer, nullable=True)
    pca_explained_variance_ratio = Column(JSON, nullable=True)
    pca_cumulative_variance = Column(JSON, nullable=True)
    feature_names = Column(JSON, nullable=True)
    hyperparameters = Column(JSON, nullable=True)
    training_samples = Column(Integer, nullable=True)
    artifact_path = Column(String(255), nullable=True)
    trained_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class TrainingRun(Base):
    __tablename__ = "training_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(100), unique=True, nullable=False, index=True)
    model_type = Column(String(100), nullable=False)
    status = Column(String(50), default="RUNNING") # RUNNING, COMPLETED, FAILED
    metrics = Column(JSON, nullable=True)
    log_summary = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

class DatasetIngestionRun(Base):
    __tablename__ = "dataset_ingestion_runs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    row_count = Column(Integer, nullable=False)
    column_count = Column(Integer, nullable=False)
    validation_status = Column(String(50), nullable=False) # VALID, WARNING, INVALID
    missing_values_summary = Column(JSON, nullable=True)
    target_stats = Column(JSON, nullable=True)
    ingested_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    endpoint = Column(String(255), nullable=False)
    ip_address = Column(String(50), nullable=True)
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")

class ApiMetric(Base):
    __tablename__ = "api_metrics"

    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(255), nullable=False, index=True)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    latency_ms = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

class OperationalObservation(Base):
    __tablename__ = "operational_observations"

    id = Column(Integer, primary_key=True, index=True)
    journey_id = Column(String(50), nullable=False, index=True)
    train_number = Column(String(50), nullable=False)
    observation_time = Column(DateTime, nullable=False)
    current_station = Column(String(100), nullable=True)
    next_station = Column(String(100), nullable=True)
    delay_estimate_minutes = Column(Float, nullable=True)
    raw_payload = Column(JSON, nullable=True)
    received_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
