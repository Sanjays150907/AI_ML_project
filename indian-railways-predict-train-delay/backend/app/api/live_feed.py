import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_user
from app.models import User, OperationalObservation
from app.ml.inference import inference_service

router = APIRouter(prefix="/live", tags=["Operational Railway Feed"])

class OperationalFeedPayload(BaseModel):
    journey_id: str
    train_number: str
    observation_time: datetime.datetime
    current_station: Optional[str] = None
    next_station: Optional[str] = None
    delay_estimate_minutes: Optional[float] = None
    telemetry_token: Optional[str] = None
    raw_payload: Optional[Dict[str, Any]] = None

@router.get("/status")
def get_live_feed_status(current_user: User = Depends(require_user)):
    """
    Honest reporting of operational feed status.
    Clearly indicates whether an authorized railway live API is connected.
    """
    return {
        "feed_active": False,
        "feed_provider": "Indian Railways FOIS / NTES API (Unconnected)",
        "feed_status": "DISCONNECTED",
        "message": (
            "No authorized real-time GPS operational feed is configured. "
            "Displaying high-fidelity delay forecasting based on historical coaching train data. "
            "To enable live telemetry, configure RAILWAY_FEED_API_KEY in environment variables."
        ),
        "last_observation_received": None
    }

@router.post("/ingest")
def ingest_operational_observation(
    payload: OperationalFeedPayload,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Extensible ingestion endpoint for authentic railway operations data.
    Validates timestamps and rejects stale (>6h) packets.
    """
    now = datetime.datetime.utcnow()
    # Reject packets older than 6 hours
    if payload.observation_time < (now - datetime.timedelta(hours=6)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Observation rejected: telemetry packet timestamp is stale (> 6 hours old)."
        )

    obs = OperationalObservation(
        journey_id=payload.journey_id,
        train_number=payload.train_number,
        observation_time=payload.observation_time,
        current_station=payload.current_station,
        next_station=payload.next_station,
        delay_estimate_minutes=payload.delay_estimate_minutes,
        raw_payload=payload.raw_payload or {},
        received_at=now
    )
    db.add(obs)
    db.commit()

    return {
        "status": "ACCEPTED",
        "observation_id": obs.id,
        "timestamp": now.isoformat()
    }
