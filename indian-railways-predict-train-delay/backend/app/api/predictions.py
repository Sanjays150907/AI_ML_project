import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_user
from app.models import User, PredictionHistory, AuditLog
from app.ml.inference import inference_service
from app.schemas.prediction import (
    PredictionInput,
    PredictionResponse,
    PredictionHistoryItem,
    PaginatedHistoryResponse
)

router = APIRouter(prefix="/predictions", tags=["Predictions & Forecasts"])

@router.post("/predict", response_model=PredictionResponse)
def predict_delay_and_eta(
    req: PredictionInput,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Executes genuine delay forecasting using the fitted PCA Machine Learning pipeline.
    Derives ETA timestamp and records forecast into the authenticated user's history.
    """
    if not inference_service.is_model_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Trained ML model artifact is not available. Please ensure model training has been completed."
        )

    try:
        input_dict = req.model_dump()
        forecast = inference_service.predict(input_dict)

        # Store in user's prediction history
        history_entry = PredictionHistory(
            user_id=current_user.id,
            journey_id=req.journey_id,
            train_number=req.train_number,
            train_type=req.train_type,
            departure_date=req.departure_date,
            distance_km=req.distance_km,
            scheduled_travel_hours=req.scheduled_travel_hours,
            predicted_delay_minutes=forecast["predicted_delay_minutes"],
            is_delayed_predicted=forecast["is_delayed"],
            scheduled_arrival=forecast["scheduled_arrival"],
            estimated_arrival=forecast["estimated_arrival"],
            model_version=forecast["model_version"],
            inputs_snapshot=input_dict,
            created_at=datetime.datetime.utcnow()
        )
        db.add(history_entry)
        db.commit()

        # Audit entry
        audit = AuditLog(
            user_id=current_user.id,
            action="FORECAST_GENERATED",
            endpoint="/api/predictions/predict",
            status_code=200
        )
        db.add(audit)
        db.commit()

        return forecast

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )

@router.get("/history", response_model=PaginatedHistoryResponse)
def get_prediction_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves paginated forecast history for the currently authenticated user only.
    Users cannot view other users' records.
    """
    query = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id)
    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)

    items = (
        query.order_by(PredictionHistory.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": items
    }

@router.delete("/history/{prediction_id}")
def delete_prediction_history_item(
    prediction_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a specific forecast record belonging to the authenticated user.
    """
    entry = db.query(PredictionHistory).filter(
        PredictionHistory.id == prediction_id,
        PredictionHistory.user_id == current_user.id
    ).first()

    if not entry:
        raise HTTPException(
            status_code=404,
            detail="Forecast history record not found or access denied."
        )

    db.delete(entry)
    db.commit()

    return {"message": "Forecast history record deleted successfully"}

@router.delete("/history")
def clear_all_user_history(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Clears all forecast history for the authenticated user.
    """
    deleted_count = db.query(PredictionHistory).filter(
        PredictionHistory.user_id == current_user.id
    ).delete()
    db.commit()

    return {"message": f"Cleared {deleted_count} forecast history records."}
