import json
import os
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", "./outputs"))
IMAGE_DIR = Path(os.environ.get("IMAGE_DIR", "./images"))

app = FastAPI(title="Forensic Analytics Inference", version="1.0")

models = {}
scoring_rules = {}
schema = {}


@app.on_event("startup")
def load_models():
    global scoring_rules, schema
    for name in ("reviewer_anomaly_model", "text_similarity_model"):
        path = OUTPUT_DIR / f"{name}.joblib"
        if path.exists():
            try:
                models[name] = joblib.load(path)
            except Exception:
                models[name] = None
    rules_path = OUTPUT_DIR / "scoring_rules.json"
    if rules_path.exists():
        scoring_rules = json.loads(rules_path.read_text(encoding="utf-8"))
    schema_path = OUTPUT_DIR / "forensic_scoring_schema.json"
    if schema_path.exists():
        schema = json.loads(schema_path.read_text(encoding="utf-8"))


class AnalyzeRequest(BaseModel):
    review_text: str = Field(min_length=10)
    rating: int = Field(ge=1, le=5)
    verified_purchase: bool | None = None
    has_image: bool = False
    asin: str | None = None
    review_month: str | None = None
    reviewer_review_count: int | None = None
    reviewer_negative_ratio: float | None = None
    reviewer_product_count: int | None = None


@app.get("/health")
def health():
    return {
        "status": "ok",
        "loaded_models": [k for k, v in models.items() if v is not None],
        "scoring_rules_loaded": bool(scoring_rules),
        "schema_version": schema.get("schema_version"),
    }


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    anomaly_model = models.get("reviewer_anomaly_model")
    review_count = req.reviewer_review_count or 0
    neg_ratio = req.reviewer_negative_ratio or 0.0
    product_count = req.reviewer_product_count or 0

    anomaly_percentile = None
    if anomaly_model is not None:
        try:
            features = np.array([[
                review_count,
                review_count * neg_ratio,
                neg_ratio,
                product_count,
                req.rating,
            ]])
            if hasattr(anomaly_model, "score_samples"):
                scores = anomaly_model.score_samples(features)
                anomaly_percentile = float(100 * (1 - np.exp(-abs(float(scores[0])))))
        except Exception:
            anomaly_percentile = None

    return {
        "engine": "python-joblib",
        "loaded_models": [k for k, v in models.items() if v is not None],
        "anomaly_percentile": anomaly_percentile,
        "scoring_rules_available": bool(scoring_rules),
        "note": (
            "This endpoint exposes the notebook's joblib artifacts. Full component scoring "
            "is performed by the TypeScript engine in the Next.js route for a faithful, "
            "dependency-free result."
        ),
    }
