from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.dependencies import require_user
from app.models import User
from app.ml.train_search import train_search_service
from app.schemas.train import PaginatedTrainsResponse

router = APIRouter(prefix="/trains", tags=["Trains & Journeys"])

@router.get("/search", response_model=PaginatedTrainsResponse)
def search_trains(
    query: Optional[str] = Query(None, description="Train number, name, or journey ID"),
    train_type: Optional[str] = Query(None, description="Train type filter"),
    zone: Optional[str] = Query(None, description="Railway zone filter"),
    min_distance: Optional[float] = Query(None, description="Minimum distance in km"),
    max_distance: Optional[float] = Query(None, description="Maximum distance in km"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    current_user: User = Depends(require_user)
):
    """
    Search and paginate trains from the Indian Railways dataset.
    Requires authentication.
    """
    results = train_search_service.search_trains(
        query=query,
        train_type=train_type,
        zone=zone,
        min_distance=min_distance,
        max_distance=max_distance,
        page=page,
        page_size=page_size
    )
    return results

@router.get("/journey/{journey_id}")
def get_journey_details(journey_id: str, current_user: User = Depends(require_user)):
    """
    Retrieves full operational features for a specific journey ID.
    """
    journey = train_search_service.get_journey_by_id(journey_id)
    if not journey:
        raise HTTPException(
            status_code=404,
            detail=f"Journey with ID '{journey_id}' was not found in dataset."
        )
    return journey
