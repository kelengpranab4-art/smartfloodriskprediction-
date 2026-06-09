# pyright: reportMissingImports=false, reportMissingModuleSource=false

# ============================================================
# GUWAHATI FLOOD PREDICTION SYSTEM
# Fixed Complete Version
# ============================================================

import os
import json
import warnings

import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_val_score,
    RandomizedSearchCV
)

from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    VotingClassifier
)

from sklearn.linear_model import LogisticRegression

from sklearn.pipeline import make_pipeline

from sklearn.preprocessing import StandardScaler

from sklearn.metrics import (
    classification_report,
    accuracy_score,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score
)

warnings.filterwarnings("ignore")

# ============================================================
# CONFIGURATION
# ============================================================

FEATURE_COLS = [
    "river_level",
    "rainfall",
    "humidity",
    "soil_moisture",
    "drainage_cap",
    "temp"
]

TARGET_COL = "risk_score"

CLASS_NAMES = ["Low", "Medium", "High"]

# ============================================================
# HYPERPARAMETERS
# ============================================================

RF_PARAM_DIST = {
    "n_estimators": [100, 200],
    "max_depth": [None, 10, 20],
    "min_samples_split": [2, 5],
    "min_samples_leaf": [1, 2],
    "max_features": ["sqrt", "log2"],
    "class_weight": ["balanced"]
}

GB_PARAM_DIST = {
    "n_estimators": [100, 200],
    "learning_rate": [0.05, 0.1],
    "max_depth": [3, 5],
    "subsample": [0.8, 1.0]
}

# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    csv_path = "../data/flood_dataset.csv"

    if not os.path.exists(csv_path):
        # Alternative path for different run contexts
        csv_path = "data/flood_dataset.csv"
        if not os.path.exists(csv_path):
            raise FileNotFoundError(
                f"\nDataset not found:\n{csv_path}"
            )

    df = pd.read_csv(csv_path)

    required_cols = FEATURE_COLS + [TARGET_COL]

    missing = [c for c in required_cols if c not in df.columns]

    if missing:
        raise ValueError(
            f"\nMissing Columns:\n{missing}"
        )

    print("\nDataset Loaded Successfully")
    print(df.head())

    return df

# ============================================================
# TUNE MODEL
# ============================================================

def tune_model(estimator, param_dist, X_train, y_train, name):

    print(f"\nTuning {name}...")

    skf = StratifiedKFold(
        n_splits=3,
        shuffle=True,
        random_state=42
    )

    search = RandomizedSearchCV(
        estimator=estimator,
        param_distributions=param_dist,
        n_iter=5,
        cv=skf,
        scoring="f1_weighted",
        n_jobs=-1,
        random_state=42
    )

    search.fit(X_train, y_train)

    print("Best Score:", search.best_score_)
    print("Best Params:", search.best_params_)

    return search.best_estimator_

# ============================================================
# EVALUATION
# ============================================================
def evaluate(model, X_test, y_test):
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print("\nMODEL PERFORMANCE")
    print("Accuracy :", accuracy)
    print("Precision:", precision)
    print("Recall   :", recall)
    print("F1 Score :", f1)

    print("\nClassification Report")
    print(classification_report(y_test, y_pred))

    cm = confusion_matrix(y_test, y_pred)
    
    per_class = []
    for i, name in enumerate(CLASS_NAMES):
        # Calculate indices that belong to this class in y_test
        class_mask = (y_test == i)
        if class_mask.sum() > 0:
            p = precision_score(y_test, y_pred, labels=[i], average='weighted', zero_division=0)
            r = recall_score(y_test, y_pred, labels=[i], average='weighted', zero_division=0)
            f = f1_score(y_test, y_pred, labels=[i], average='weighted', zero_division=0)
        else:
            p, r, f = 0.0, 0.0, 0.0
            
        per_class.append({
            "class": name,
            "precision": round(float(p) * 100, 2),
            "recall": round(float(r) * 100, 2),
            "f1": round(float(f) * 100, 2)
        })

    return {
        "accuracy": round(accuracy * 100, 2),
        "precision": round(precision * 100, 2),
        "recall": round(recall * 100, 2),
        "f1_score": round(f1 * 100, 2),
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "class_labels": CLASS_NAMES,
        "class_counts": [int((y_test == i).sum()) for i in range(len(CLASS_NAMES))],
        "test_samples": len(y_test)
    }

# ============================================================
# FEATURE IMPORTANCE
# ============================================================

def feature_importance(rf_model, gb_model):

    rf_imp = rf_model.feature_importances_
    gb_imp = gb_model.feature_importances_

    avg_imp = (rf_imp + gb_imp) / 2

    print("\nFeature Importances")

    for feature, importance in sorted(
        zip(FEATURE_COLS, avg_imp),
        key=lambda x: -x[1]
    ):
        print(f"{feature:<20} {importance:.4f}")

# ============================================================
# TRAINING
# ============================================================

def train():

    print("GUWAHATI FLOOD PREDICTION SYSTEM")
    print("=" * 60)

    # LOAD DATA
    df = load_data()

    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    # SPLIT DATA
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    print("\nTrain Samples:", len(X_train))
    print("Test Samples :", len(X_test))

    # RANDOM FOREST
    best_rf = tune_model(
        RandomForestClassifier(random_state=42),
        RF_PARAM_DIST,
        X_train,
        y_train,
        "Random Forest"
    )

    # GRADIENT BOOSTING
    best_gb = tune_model(
        GradientBoostingClassifier(random_state=42),
        GB_PARAM_DIST,
        X_train,
        y_train,
        "Gradient Boosting"
    )

    # LOGISTIC REGRESSION
    lr_pipeline = make_pipeline(
        StandardScaler(),
        LogisticRegression(
            max_iter=5000,
            solver="lbfgs",
            random_state=42,
            class_weight="balanced"
        )
    )

    # ENSEMBLE MODEL
    ensemble = VotingClassifier(
        estimators=[
            ("rf", best_rf),
            ("gb", best_gb),
            ("lr", lr_pipeline)
        ],
        voting="soft",
        weights=[2, 2, 1]
    )

    print("\nTraining Ensemble Model...")

    ensemble.fit(X_train, y_train)

    print("Ensemble Model Trained Successfully")

    # EVALUATE
    metrics = evaluate(
        ensemble,
        X_test,
        y_test
    )

    # CROSS VALIDATION
    print("\nRunning Cross Validation...")

    skf = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42
    )

    cv_scores = cross_val_score(
        ensemble,
        X,
        y,
        cv=skf,
        scoring="f1_weighted",
        n_jobs=-1
    )

    print("CV Mean:", cv_scores.mean())
    print("CV Std :", cv_scores.std())

    # FEATURE IMPORTANCE
    feature_importance(best_rf, best_gb)

    # SAVE MODEL
    os.makedirs("saved_model", exist_ok=True)

    model_path = "saved_model/flood_model.joblib"

    metrics_path = "saved_model/model_metrics.json"

    joblib.dump(ensemble, model_path)

    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)

    print("\nMODEL SAVED SUCCESSFULLY")
    print("Model Path  :", model_path)
    print("Metrics Path:", metrics_path)

# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    train()