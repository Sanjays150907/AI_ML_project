import os
import sys
import time
import json
import argparse
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.core.config import settings
from app.core.database import SessionLocal, Base, engine
from app.models import ModelRegistry, TrainingRun, DatasetIngestionRun
from app.ml.dataset import dataset_manager
from app.ml.pipeline import (
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES,
    TARGET_COLUMN,
    build_pca_random_forest_pipeline,
    build_baseline_random_forest_pipeline,
    build_xgboost_pipeline
)

def train_and_evaluate_models(sample_size: int = 60000):
    """
    Main training function that:
    1. Loads dataset with chronological holdout split.
    2. Trains RF + PCA (Primary), RF Baseline, and XGBoost Benchmark.
    3. Computes MAE, RMSE, R².
    4. Extracts genuine PCA diagnostics.
    5. Persists model artifact and registers into database.
    """
    start_time = time.time()
    run_id = f"train_run_{int(start_time)}"
    print(f"\n=======================================================")
    print(f"Starting ML Training & PCA Pipeline Evaluation [{run_id}]")
    print(f"Sample Size: {sample_size} rows")
    print(f"=======================================================\n")

    # Ensure DB tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create training run record
    training_run = TrainingRun(
        run_id=run_id,
        model_type="RandomForest_PCA_Suite",
        status="RUNNING",
        started_at=datetime.utcnow()
    )
    db.add(training_run)
    db.commit()

    try:
        # Step 1: Load and inspect dataset
        schema_validation = dataset_manager.validate_dataset_schema(sample_rows=min(sample_size, 5000))
        df = dataset_manager.load_train_partition(max_rows=sample_size)
        
        # Log ingestion
        ingestion_run = DatasetIngestionRun(
            filename="ir_train.csv",
            row_count=len(df),
            column_count=len(df.columns),
            validation_status=schema_validation.get("status", "VALID"),
            missing_values_summary=schema_validation.get("missing_values_pct", {}),
            target_stats=schema_validation.get("target_stats", {})
        )
        db.add(ingestion_run)
        db.commit()

        # Step 2: Chronological holdout partition
        print("Sorting chronologically by departure_date for realistic out-of-time evaluation...")
        df["departure_date_dt"] = pd.to_datetime(df["departure_date"], errors="coerce")
        df = df.sort_values("departure_date_dt").reset_index(drop=True)

        split_idx = int(len(df) * 0.8)
        train_df = df.iloc[:split_idx]
        val_df = df.iloc[split_idx:]

        print(f"Train samples: {len(train_df)} ({train_df['departure_date'].min()} to {train_df['departure_date'].max()})")
        print(f"Validation samples: {len(val_df)} ({val_df['departure_date'].min()} to {val_df['departure_date'].max()})")

        X_train = train_df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
        y_train = train_df[TARGET_COLUMN].values

        X_val = val_df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
        y_val = val_df[TARGET_COLUMN].values

        # Ensure no target leakage
        for col in ["delay_minutes", "is_delayed", "primary_delay_cause"]:
            assert col not in X_train.columns, f"Target leakage detected: {col} present in features!"
            assert col not in X_val.columns, f"Target leakage detected: {col} present in features!"

        # Step 3: Train Primary Model: Random Forest + PCA (95% Variance)
        print("\n--- Training Model 1: Random Forest with PCA (Primary Pipeline) ---")
        pca_pipeline = build_pca_random_forest_pipeline(pca_variance_ratio=0.95, n_estimators=60, max_depth=15)
        
        t0 = time.time()
        pca_pipeline.fit(X_train, y_train)
        pca_train_time = round(time.time() - t0, 2)
        print(f"Random Forest + PCA trained in {pca_train_time}s")

        # Extract fitted PCA details
        pca_step = pca_pipeline.named_steps["preprocessor"].named_transformers_["num"].named_steps["pca"]
        n_orig_num = len(NUMERICAL_FEATURES)
        n_components = int(pca_step.n_components_)
        explained_variance_ratio = [round(float(x), 4) for x in pca_step.explained_variance_ratio_]
        cumulative_variance = [round(float(x), 4) for x in np.cumsum(pca_step.explained_variance_ratio_)]

        print(f"PCA reduced numerical features from {n_orig_num} down to {n_components} components.")
        print(f"Cumulative explained variance: {cumulative_variance[-1] * 100:.2f}% (Threshold: >=95%)")

        # Evaluate Model 1
        y_pred_pca = pca_pipeline.predict(X_val)
        mae_pca = round(float(mean_absolute_error(y_val, y_pred_pca)), 3)
        rmse_pca = round(float(np.sqrt(mean_squared_error(y_val, y_pred_pca))), 3)
        r2_pca = round(float(r2_score(y_val, y_pred_pca)), 4)
        print(f"RF + PCA Validation Results -> MAE: {mae_pca:.2f} mins | RMSE: {rmse_pca:.2f} mins | R²: {r2_pca:.4f}")

        # Step 4: Train Baseline Model: Random Forest without PCA
        print("\n--- Training Model 2: Random Forest Baseline (Without PCA) ---")
        baseline_pipeline = build_baseline_random_forest_pipeline(n_estimators=60, max_depth=15)
        
        t0 = time.time()
        baseline_pipeline.fit(X_train, y_train)
        baseline_train_time = round(time.time() - t0, 2)
        print(f"Random Forest Baseline trained in {baseline_train_time}s")

        y_pred_base = baseline_pipeline.predict(X_val)
        mae_base = round(float(mean_absolute_error(y_val, y_pred_base)), 3)
        rmse_base = round(float(np.sqrt(mean_squared_error(y_val, y_pred_base))), 3)
        r2_base = round(float(r2_score(y_val, y_pred_base)), 4)
        print(f"RF Baseline Validation Results -> MAE: {mae_base:.2f} mins | RMSE: {rmse_base:.2f} mins | R²: {r2_base:.4f}")

        # Step 5: Train Benchmark Model: XGBoost Regressor
        print("\n--- Training Model 3: XGBoost Regressor Benchmark ---")
        xgb_pipeline = build_xgboost_pipeline(n_estimators=80, max_depth=6)

        t0 = time.time()
        xgb_pipeline.fit(X_train, y_train)
        xgb_train_time = round(time.time() - t0, 2)
        print(f"XGBoost Regressor trained in {xgb_train_time}s")

        y_pred_xgb = xgb_pipeline.predict(X_val)
        mae_xgb = round(float(mean_absolute_error(y_val, y_pred_xgb)), 3)
        rmse_xgb = round(float(np.sqrt(mean_squared_error(y_val, y_pred_xgb))), 3)
        r2_xgb = round(float(r2_score(y_val, y_pred_xgb)), 4)
        print(f"XGBoost Validation Results -> MAE: {mae_xgb:.2f} mins | RMSE: {rmse_xgb:.2f} mins | R²: {r2_xgb:.4f}")

        # Step 6: Persist Artifacts
        print(f"\nPersisting trained PCA pipeline artifact to {settings.MODEL_PATH}...")
        joblib.dump(pca_pipeline, settings.MODEL_PATH)

        # Build PCA Top Loadings table
        loadings = pca_step.components_ # shape: (n_components, n_features)
        top_loadings = {}
        for comp_i in range(min(n_components, 5)):
            comp_name = f"PC{comp_i+1}"
            comp_weights = loadings[comp_i]
            top_feats_idx = np.argsort(np.abs(comp_weights))[::-1][:5]
            top_loadings[comp_name] = {
                NUMERICAL_FEATURES[idx]: round(float(comp_weights[idx]), 3)
                for idx in top_feats_idx
            }

        # Actual vs Predicted sample data for Admin Chart
        val_sample_indices = np.random.choice(len(y_val), size=min(100, len(y_val)), replace=False)
        actual_vs_predicted = [
            {"actual": round(float(y_val[i]), 1), "predicted": round(float(y_pred_pca[i]), 1)}
            for i in val_sample_indices
        ]

        # Error distribution histogram bins
        errors = (y_pred_pca - y_val)
        bins = [-60, -30, -15, -5, 0, 5, 15, 30, 60, 120]
        hist_counts, _ = np.histogram(errors, bins=bins)
        error_distribution = [
            {"bin": f"[{bins[i]}m, {bins[i+1]}m)", "count": int(hist_counts[i])}
            for i in range(len(bins)-1)
        ]

        # Full metadata payload
        model_version = f"v1.0-pca-{datetime.utcnow().strftime('%Y%m%d%H%M')}"
        metadata = {
            "version": model_version,
            "trained_at": datetime.utcnow().isoformat(),
            "sample_size": sample_size,
            "train_size": len(train_df),
            "val_size": len(val_df),
            "primary_model": {
                "name": "Random Forest Regressor with PCA (95%)",
                "type": "RandomForest_PCA",
                "mae": mae_pca,
                "rmse": rmse_pca,
                "r2": r2_pca,
                "train_time_seconds": pca_train_time,
                "is_primary": True
            },
            "comparisons": [
                {
                    "model_name": "Random Forest + PCA",
                    "model_type": "RandomForest_PCA",
                    "has_pca": True,
                    "mae": mae_pca,
                    "rmse": rmse_pca,
                    "r2": r2_pca,
                    "training_time_seconds": pca_train_time,
                    "retained_components": n_components,
                    "is_primary": True
                },
                {
                    "model_name": "Random Forest Baseline",
                    "model_type": "RandomForest_Baseline",
                    "has_pca": False,
                    "mae": mae_base,
                    "rmse": rmse_base,
                    "r2": r2_base,
                    "training_time_seconds": baseline_train_time,
                    "retained_components": None,
                    "is_primary": False
                },
                {
                    "model_name": "XGBoost Regressor",
                    "model_type": "XGBoost_Benchmark",
                    "has_pca": False,
                    "mae": mae_xgb,
                    "rmse": rmse_xgb,
                    "r2": r2_xgb,
                    "training_time_seconds": xgb_train_time,
                    "retained_components": None,
                    "is_primary": False
                }
            ],
            "pca_analytics": {
                "n_original_features": n_orig_num,
                "n_components_retained": n_components,
                "variance_threshold": 0.95,
                "explained_variance_ratio": explained_variance_ratio,
                "cumulative_variance": cumulative_variance,
                "feature_names": NUMERICAL_FEATURES,
                "top_loadings": top_loadings
            },
            "actual_vs_predicted": actual_vs_predicted,
            "error_distribution": error_distribution,
            "features": {
                "numerical": NUMERICAL_FEATURES,
                "categorical": CATEGORICAL_FEATURES
            }
        }

        with open(settings.METADATA_PATH, "w") as f:
            json.dump(metadata, f, indent=2)

        # Register in DB ModelRegistry
        # Set previous active models to False
        db.query(ModelRegistry).update({ModelRegistry.is_active: False})
        
        reg_entry = ModelRegistry(
            model_name="Random Forest Regressor with PCA (95%)",
            model_type="RandomForest_PCA",
            version=model_version,
            is_active=True,
            mae=mae_pca,
            rmse=rmse_pca,
            r2=r2_pca,
            pca_n_components=n_components,
            pca_explained_variance_ratio=explained_variance_ratio,
            pca_cumulative_variance=cumulative_variance,
            feature_names=NUMERICAL_FEATURES + CATEGORICAL_FEATURES,
            training_samples=len(train_df),
            artifact_path=str(settings.MODEL_PATH),
            trained_at=datetime.utcnow()
        )
        db.add(reg_entry)

        # Complete training run
        training_run.status = "COMPLETED"
        training_run.metrics = {
            "mae_pca": mae_pca,
            "rmse_pca": rmse_pca,
            "r2_pca": r2_pca,
            "mae_base": mae_base,
            "rmse_base": rmse_base,
            "r2_base": r2_base,
            "mae_xgb": mae_xgb,
            "rmse_xgb": rmse_xgb,
            "r2_xgb": r2_xgb,
            "pca_components": n_components
        }
        training_run.log_summary = f"Successfully trained and evaluated on {len(df)} records. Model persisted as {model_version}."
        training_run.completed_at = datetime.utcnow()
        db.commit()

        print(f"\nTraining pipeline completed successfully in {round(time.time() - start_time, 2)}s.")
        print(f"Artifacts saved: {settings.MODEL_PATH} and {settings.METADATA_PATH}")

    except Exception as e:
        db.rollback()
        training_run.status = "FAILED"
        training_run.error_message = str(e)
        training_run.completed_at = datetime.utcnow()
        db.commit()
        print(f"Error during training: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train and evaluate Railway ETA PCA models")
    parser.add_argument("--sample-size", type=int, default=50000, help="Number of rows to use for training (default: 50,000)")
    args = parser.parse_args()

    train_and_evaluate_models(sample_size=args.sample_size)
