import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models import ApiMetric
from app.api import auth, trains, predictions, admin, live_feed
from app.ml.inference import inference_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("railway_eta")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and attempt to load model
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    logger.info("Checking ML model artifact...")
    if inference_service.is_model_loaded():
        logger.info("ML Model with PCA successfully loaded.")
    else:
        logger.warning("No trained ML model found at startup. Train via 'python -m app.ml.train'.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Dynamic Expected Time of Arrival (ETA) Forecasting for Coaching Trains using PCA and Machine Learning",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Monitoring Middleware
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)

    # Record metric for API endpoints (excluding static files / docs)
    path = request.url.path
    if path.startswith("/api"):
        try:
            db = SessionLocal()
            metric = ApiMetric(
                endpoint=path,
                method=request.method,
                status_code=response.status_code,
                latency_ms=duration_ms
            )
            db.add(metric)
            db.commit()
            db.close()
        except Exception:
            pass

    return response

# Mount API routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(trains.router, prefix=settings.API_V1_STR)
app.include_router(predictions.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(live_feed.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "title": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "status": "ONLINE"
    }

@app.get("/api/health")
def health():
    return {
        "status": "OK",
        "model_loaded": inference_service.is_model_loaded(),
        "database": "CONNECTED"
    }
