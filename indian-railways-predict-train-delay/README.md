# Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains Using PCA and Machine Learning

Production-oriented railway delay forecasting web application powered by **1.5 million historical Indian Railways coaching train records**, built with a **FastAPI** backend, **Scikit-Learn Principal Component Analysis (PCA)**, **Random Forest & XGBoost** regression benchmarking, **Argon2id** password hashing, **PostgreSQL/SQLite** persistence with **Alembic** migrations, and a responsive **React 19 + TypeScript + Vite + Tailwind CSS** frontend.

---

## 1. Project Overview & Architecture

Railway punctuality and Expected Time of Arrival (ETA) prediction in complex multi-zone railway networks face severe challenges from collinear operational parameters: route distance, scheduled stops, speed restrictions, fog susceptibility, zone network congestion, and incoming rake delays.

This application provides:
1. **Mandatory PCA Pipeline**: Applies median imputation, `StandardScaler`, and `PCA(n_components=0.95)` on 27 numerical operational features, reducing dimensionality down to **21 decorrelated principal components** while retaining **95.70% of cumulative explained variance**.
2. **Multi-Model Benchmark**: Evaluates **Random Forest with PCA** (Primary Production Pipeline) against a **Random Forest Baseline (without PCA)** and an **XGBoost Regressor** benchmark on an out-of-time chronological validation partition.
3. **Target Leakage Prevention**: Strict exclusion of identifiers (`journey_id`), targets (`delay_minutes`), and train-set delay cause indicators (`is_delayed`, `primary_delay_cause`) from predictor inputs.
4. **Honest ETA Semantics**: Derives mathematical arrival times (`ETA = Scheduled Arrival + Predicted Delay`). Transparently reports real-time telemetry status as disconnected rather than synthesizing fake GPS positions.
5. **Role-Based Access Control (RBAC)**: Enforces server-side authorization boundaries separating regular **Passengers** from **Operations Controllers / Administrators**.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| **Machine Learning** | Scikit-learn 1.6+ (`StandardScaler`, `PCA`, `RandomForestRegressor`), XGBoost, Pandas, NumPy, Joblib |
| **Database & ORM** | PostgreSQL (Production/Docker), SQLite (Local Dev fallback), SQLAlchemy 2.0, Alembic |
| **Security & Auth** | Argon2id (`argon2-cffi`), JSON Web Tokens (`PyJWT`), Secure Session Cookies |
| **Testing** | Pytest 9.1+, FastAPI TestClient |

---

## 3. Dataset Integration

Primary dataset files located in the root project directory:
- `ir_train.csv`: 1,500,001 historical coaching journey records (45 columns)
- `ir_test.csv`: 375,001 journey records (42 columns)
- `ir_data_dictionary.csv`: Official field specifications
- `ir_sample_submission.csv`: Benchmark format

### Key Feature Groups
- **Route & Infrastructure**: `distance_km`, `num_scheduled_stops`, `scheduled_travel_hours`, `track_doubled`, `is_hdn_route`, `is_electrified`, `psr_count` (Permanent Speed Restrictions).
- **Environmental & Seasonal**: `fog_risk_score`, `zone_fog_index`, `zone_congestion_index`, `season_severity_score`, `is_monsoon_season`.
- **Rolling Stock & Operations**: `loco_age_years`, `coach_age_years`, `has_lhb_coaches`, `maintenance_score`, `seat_utilisation_pct`, `late_incoming_rake`, `route_historical_ontime_pct`.
- **Categorical**: `train_type`, `zone`, `zone_abbr`, `season`, `traction_type`, `source_station_category`, `destination_station_category`.

---

## 4. Measured Machine Learning Evaluation Results

Evaluated on an **out-of-time chronological validation split** (Train: 40,000 journeys through 2023-08-12; Validation: 10,000 journeys through 2024-12-30):

| Model | PCA Applied | Numerical Components | MAE (mins) | RMSE (mins) | R² Score | Train Time |
|---|---|---|---|---|---|---|
| **Random Forest + PCA** *(Primary)* | **Yes (95% Var)** | **21 (from 27)** | **37.06** | **50.28** | **0.4289** | 7.91s |
| **Random Forest Baseline** | No | 27 (All) | 35.79 | 49.38 | 0.4492 | 2.93s |
| **XGBoost Regressor** | No | 27 (All) | 35.14 | 48.14 | 0.4763 | 0.50s |

> **PCA Variance Diagnostic**: The fitted Scikit-Learn PCA step retained **21 principal components** reaching **95.70% cumulative explained variance**, satisfying the required $\ge 95\%$ threshold. The fitted PCA object is serialized directly inside `pca_delay_model.joblib` and applied identically during real-time inference.

---

## 5. Quick Start & Execution Instructions

### A. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### B. Environment Configuration
```bash
# Copy template into .env
cp .env.example .env
```

### C. Backend Setup & Dependencies
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt
```

### D. Apply Database Migrations (Alembic)
```bash
# Run migrations to initialize all tables
alembic upgrade head
```

### E. Bootstrap Initial Administrator
Public registration is strictly constrained to standard passenger accounts. Create the initial administrator via the secure CLI tool:
```bash
# In the project root or backend (with PYTHONPATH set)
$env:PYTHONPATH="backend"
python -m app.bootstrap --email admin@railway.gov.in --password AdminSecure2026! --name "Chief Operations Controller"
```

### F. Train & Persist PCA Machine Learning Model
```bash
# Train PCA pipeline, baseline, and XGBoost models
$env:PYTHONPATH="backend"
python -m app.ml.train --sample-size 50000
```
This generates:
- `backend/artifacts/pca_delay_model.joblib`
- `backend/artifacts/model_metadata.json`
- Logs training run and schema ingestion into the database.

### G. Run Automated Test Suite
```bash
# Run pytest covering Auth, RBAC boundaries, PCA pipeline, and User isolation
pytest -v backend/tests
```
All 13 unit and integration tests pass successfully.

### H. Start Backend Server
```bash
$env:PYTHONPATH="backend"
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (OpenAPI / Swagger UI) is available at:
`http://127.0.0.1:8000/docs`

### I. Start Frontend Development Server
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Pre-Configured Access Roles

| Role | Email | Password | Privileges |
|---|---|---|---|
| **Administrator** | `admin@railway.gov.in` | `AdminSecure2026!` | User management (disable/re-enable), ML & PCA diagnostics, Recharts scree plots, API telemetry health, audit logs |
| **Passenger / User** | Any registered email | Min 8 characters | Train search (1.5M dataset), Dynamic ETA forecasting, personal history management |

---

## 7. Dynamic ETA & Live Telemetry Extensibility

- **Historical Forecasting**: Uses the fitted Scikit-Learn PCA model to estimate arrival delays based on verified journey characteristics.
- **Dynamic Telemetry Endpoint** (`/api/live/ingest`): Ready for operational Indian Railways FOIS / NTES observation feeds. Rejects stale packets ($> 6\text{h}$) and updates forecasts upon arrival of validated observations.
- **Integrity Guarantee**: Displays transparent status: `"No authorized real-time GPS operational feed is configured. Displaying high-fidelity delay forecasting based on historical coaching train data."`

---

## 8. Docker Deployment (Optional)

```bash
docker-compose up --build -d
```
Starts PostgreSQL 16 on port 5432, FastAPI on port 8000, and Nginx frontend on port 5173.
