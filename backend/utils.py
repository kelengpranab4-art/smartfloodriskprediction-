import pandas as pd
import numpy as np
from fastapi import HTTPException
from config import FEATURE_COLS, DANGER_RIVER_LEVEL, HIGH_RAINFALL_THRESHOLD, MEDIUM_RAINFALL_THRESHOLD, HIGH_SOIL_MOISTURE, MEDIUM_SOIL_MOISTURE, HIGH_DRAINAGE_BLOCKAGE

def get_risk_info(model, river_level: float, rainfall: float,
                  humidity: float = 75.0, soil_moisture: float = 0.5,
                  drainage_cap: float = 0.4, temp: float = 28.0):
    """Run the ML model and return structured risk information."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run model/train_model.py first.")

    input_df = pd.DataFrame(
        [[river_level, rainfall, humidity, soil_moisture, drainage_cap, temp]],
        columns=FEATURE_COLS
    )

    risk_code = int(model.predict(input_df)[0])
    probs = model.predict_proba(input_df)[0]

    # Continuous risk score: 0=Low → 0.0,  1=Medium → 0.5,  2=High → 1.0
    expected_score = probs[1] * 0.5 + probs[2] * 1.0

    risk_map = {0: "Low", 1: "Medium", 2: "High"}
    risk = risk_map[risk_code]

    # ── Reason & Actions ─────────────────────────────────────────────────
    if risk == "High":
        if river_level > DANGER_RIVER_LEVEL and rainfall > HIGH_RAINFALL_THRESHOLD:
            reason = f"Critical: Heavy rainfall combined with Brahmaputra above danger mark ({DANGER_RIVER_LEVEL}m)."
        elif river_level > 51:
            reason = "Critical: Brahmaputra level significantly above the danger mark."
        elif soil_moisture > HIGH_SOIL_MOISTURE and drainage_cap > HIGH_DRAINAGE_BLOCKAGE:
            reason = "Critical: Fully saturated soil and blocked drainage create imminent flood risk."
        else:
            reason = "Warning: Extreme weather conditions indicating imminent urban flood risk."
        actions = [
            "Evacuate low-lying areas immediately.",
            "Avoid travel through Anil Nagar and Zoo Road.",
            "Move vehicles and essential items to higher ground.",
            "Monitor BSDMA and district emergency broadcasts.",
        ]
    elif risk == "Medium":
        if river_level > 48.0:
            reason = "Alert: River approaching danger mark; further rain will worsen waterlogging."
        elif rainfall > MEDIUM_RAINFALL_THRESHOLD:
            reason = "Alert: Sustained rainfall causing localised urban waterlogging."
        elif soil_moisture > MEDIUM_SOIL_MOISTURE:
            reason = "Alert: High soil saturation reducing drainage effectiveness."
        else:
            reason = "Alert: Elevated risk due to saturated soil and drainage capacity constraints."
        actions = [
            "Stay alert for weather updates over the next 6 hours.",
            "Avoid parking in basement or low-lying areas.",
            "Clear surroundings of plastic waste to aid drainage.",
            "Prepare emergency kits and keep them accessible.",
        ]
    else:
        reason = "Normal: Water levels are within safe limits and drainage is functioning well."
        actions = [
            "No immediate action required.",
            "Maintain general weather awareness during monsoon season.",
        ]

    # ── XAI: feature contribution approximation ───────────────────────
    rain_severity = min(100, (rainfall / 200) * 100)
    river_severity = min(100, max(0, (river_level - 45) / 10) * 100)
    soil_sev = min(100, soil_moisture * 50)
    drain_sev = min(100, drainage_cap * 50)

    total_sev = rain_severity + river_severity + soil_sev + drain_sev
    if total_sev == 0:
        rf_contrib, riv_contrib = 50, 50
    else:
        rain_total = rain_severity + soil_sev * 0.5 + drain_sev * 0.5
        river_total = river_severity
        grand = rain_total + river_total
        rf_contrib = int((rain_total / max(grand, 1)) * 100)
        riv_contrib = 100 - rf_contrib

    return {
        "risk": risk,
        "score": float(round(expected_score, 4)),
        "reason": reason,
        "actions": actions,
        "model_type": "Hybrid Ensemble (RF + GB + LR)",
        "confidence_score": round(float(max(probs)), 2),
        "rainfall_contribution": rf_contrib,
        "river_level_contribution": riv_contrib,
    }
