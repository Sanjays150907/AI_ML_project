import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent
DATA_DIR = ROOT_DIR

# Load .env from backend or root directory
load_dotenv(BASE_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "Dynamic Railway ETA Forecast using PCA & ML"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "railway-eta-super-secret-key-production-ready-2026-x9z8")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours

    # Database
    # Standard PostgreSQL URL, with SQLite fallback if PostgreSQL is not active locally
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR / 'railway_eta.db'}"
    )

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    # Dataset paths
    DATASET_DIR: Path = DATA_DIR
    TRAIN_CSV: Path = DATA_DIR / "ir_train.csv"
    TEST_CSV: Path = DATA_DIR / "ir_test.csv"
    DATA_DICT_CSV: Path = DATA_DIR / "ir_data_dictionary.csv"
    SAMPLE_SUB_CSV: Path = DATA_DIR / "ir_sample_submission.csv"

    # Artifacts
    ARTIFACTS_DIR: Path = BASE_DIR / "artifacts"
    MODEL_PATH: Path = BASE_DIR / "artifacts" / "pca_delay_model.joblib"
    METADATA_PATH: Path = BASE_DIR / "artifacts" / "model_metadata.json"

settings = Settings()
settings.ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
