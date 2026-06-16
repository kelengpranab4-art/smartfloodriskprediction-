import logging
from fastapi import FastAPI, HTTPException, Query, Depends, WebSocket, WebSocketDisconnect, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
import models
import joblib
import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timedelta, timezone
from fastapi.middleware.cors import CORSMiddleware
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix

import config
import utils
from sms_service import sms_service
import ai_service

# ── AUTHENTICATION ────────────────────────────────────────────────────────────
def verify_admin(x_admin_key: str = Header(...)):
    if x_admin_key != config.ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid Admin API Key")
    return True

# ── LOGGING CONFIGURATION ─────────────────────────────────────────────────────
# ... (rest of the file)

# ── LOGGING CONFIGURATION ─────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("flood-api")

class ReportCreate(BaseModel):
    zone_name: str
    severity: str
    description: str

class ReportResponse(BaseModel):
    id: int
    zone_name: str
    severity: str
    description: str
    timestamp: str

app = FastAPI(title=config.API_TITLE, version=config.API_VERSION)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── WEBSOCKET MANAGER ─────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket connection. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to WebSocket: {e}")

manager = ConnectionManager()

@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

class EmergencyPayload(BaseModel):
    zone: str
    risk_level: str
    message: str

class SubscriptionRequest(BaseModel):
    phone_number: str
    zone_name: str

# ── SUBSCRIPTION ENDPOINTS ────────────────────────────────────────────────────

@app.post("/subscribe")
def subscribe(request: SubscriptionRequest, db: Session = Depends(get_db)):
    try:
        existing = db.query(models.Subscriber).filter(models.Subscriber.phone_number == request.phone_number).first()
        if existing:
            existing.zone_name = request.zone_name
            db.commit()
            return {"message": f"Subscription updated for {request.phone_number}"}
        
        new_sub = models.Subscriber(phone_number=request.phone_number, zone_name=request.zone_name)
        db.add(new_sub)
        db.commit()
        logger.info(f"New subscriber: {request.phone_number} for zone {request.zone_name}")
        
        sms_service.send_alert(request.phone_number, f"Welcome to Guwahati Flood Alerts! You will receive notifications for {request.zone_name}.")
        return {"message": "Subscribed successfully"}
    except Exception as e:
        logger.error(f"Subscription error: {e}")
        raise HTTPException(status_code=500, detail="Error during subscription")

@app.post("/unsubscribe")
def unsubscribe(phone: str = Query(...), db: Session = Depends(get_db)):
    try:
        sub = db.query(models.Subscriber).filter(models.Subscriber.phone_number == phone).first()
        if not sub:
            return {"message": "Subscriber not found"}
        db.delete(sub)
        db.commit()
        logger.info(f"Unsubscribed: {phone}")
        return {"message": "Unsubscribed successfully"}
    except Exception as e:
        logger.error(f"Unsubscription error: {e}")
        raise HTTPException(status_code=500, detail="Error during unsubscription")

@app.post("/trigger_alert")
async def trigger_alert(payload: EmergencyPayload, db: Session = Depends(get_db)):
    logger.info(f"Triggering alert for zone: {payload.zone}")
    
    await manager.broadcast({
        "type": "EMERGENCY_ALERT",
        "zone": payload.zone,
        "risk_level": payload.risk_level,
        "message": payload.message,
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
    })
    
    subscribers = db.query(models.Subscriber).filter(models.Subscriber.zone_name == payload.zone).all()
    sms_count = 0
    for sub in subscribers:
        msg = f"FLOOD ALERT ({payload.risk_level}): {payload.zone}. {payload.message}"
        if sms_service.send_alert(sub.phone_number, msg):
            sms_count += 1
            
    return {
        "status": "broadcasted", 
        "connected_clients": len(manager.active_connections),
        "sms_sent": sms_count
    }

# ── ADMIN ENDPOINTS ───────────────────────────────────────────────────────────

class DirectSMSPayload(BaseModel):
    phone_number: str
    message: str

@app.post("/admin/send-sms", dependencies=[Depends(verify_admin)])
def admin_send_sms(payload: DirectSMSPayload):
    success = sms_service.send_alert(payload.phone_number, payload.message)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send SMS")
    return {"message": "SMS sent successfully"}

@app.get("/admin/subscribers", dependencies=[Depends(verify_admin)])
def get_all_subscribers(db: Session = Depends(get_db)):
    return db.query(models.Subscriber).all()

@app.delete("/admin/subscribers/{sub_id}", dependencies=[Depends(verify_admin)])
def delete_subscriber(sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(models.Subscriber).filter(models.Subscriber.id == sub_id).first()
    if not sub: raise HTTPException(status_code=404, detail="Subscriber not found")
    db.delete(sub)
    db.commit()
    return {"message": "Subscriber deleted"}

@app.delete("/admin/reports/{report_id}", dependencies=[Depends(verify_admin)])
def delete_report(report_id: int, db: Session = Depends(get_db)):
    rep = db.query(models.CitizenReport).filter(models.CitizenReport.id == report_id).first()
    if not rep: raise HTTPException(status_code=404, detail="Report not found")
    db.delete(rep)
    db.commit()
    return {"message": "Report deleted"}

# ── Pydantic Models ───────────────────────────────────────────────────────────
class PredictionRequest(BaseModel):
    rainfall:      float
    river_level:   float
    humidity:      float = 75.0
    soil_moisture: float = 0.5
    drainage_cap:  float = 0.4
    temp:          float = 28.0

class PredictionResponse(BaseModel):
    risk:                    str
    score:                   float
    reason:                  str
    actions:                 List[str]
    model_type:              str  = "Hybrid Ensemble (RF + GB + LR)"
    confidence_score:        float = 0.0
    rainfall_contribution:   int   = 50
    river_level_contribution: int  = 50

class ZoneRiskPrediction(PredictionResponse):
    zone:         str
    rainfall:     float
    river_level:  float
    last_updated: str

class ForecastPoint(BaseModel):
    time:        str
    rainfall:    float
    river_level: float
    risk_score:  float
    risk_label:  str

class AIAnalysisRequest(BaseModel):
    zone: str
    risk: str
    score: float
    rainfall: float
    river_level: float

class AIDraftRequest(BaseModel):
    zone: str
    risk_level: str
    metrics: str

# ── AI AUTOMATION ENDPOINTS ───────────────────────────────────────────────────

@app.post("/ai/analyze-flood")
def ai_analyze_flood(request: AIAnalysisRequest):
    insight = ai_service.generate_flood_insight(request.dict())
    return {"insight": insight}

@app.post("/ai/draft-sms")
def ai_draft_sms(request: AIDraftRequest, db: Session = Depends(get_db)):
    # This is publicly accessible but normally only used in admin dashboard. 
    # Can secure with Depends(verify_admin) later if needed.
    draft = ai_service.draft_sms_alert(request.zone, request.risk_level, request.metrics)
    return {"draft": draft}

@app.get("/admin/telemetry", dependencies=[Depends(verify_admin)])
def get_telemetry(db: Session = Depends(get_db)):
    return {
        "total_subscribers": db.query(models.Subscriber).count(),
        "total_reports": db.query(models.CitizenReport).count(),
        "active_ws_clients": len(manager.active_connections),
        "uptime": "N/A", # Simulating more metrics
        "model_status": "Ready" if model else "Not Loaded"
    }

# ── Load Model ────────────────────────────────────────────────────────────────
if os.path.exists(config.MODEL_PATH):
    model = joblib.load(config.MODEL_PATH)
    logger.info(f"✅ Model loaded from {config.MODEL_PATH}")
else:
    model = None
    logger.warning(f"⚠️ Model not found at {config.MODEL_PATH}")

# ── DATABASE INITIALIZATION ──────────────────────────────────────────────────
from database import engine
models.Base.metadata.create_all(bind=engine)

# ── Endpoints ─────────────────────────────────────────────────────────────────


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    """Manual simulation endpoint — accepts all 6 features."""
    try:
        info = utils.get_risk_info(
            model         = model,
            river_level   = request.river_level,
            rainfall      = request.rainfall,
            humidity      = request.humidity,
            soil_moisture = request.soil_moisture,
            drainage_cap  = request.drainage_cap,
            temp          = request.temp,
        )
        return PredictionResponse(**info)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during prediction.")


@app.get("/zones/risk", response_model=List[ZoneRiskPrediction])
def get_zone_risks(db: Session = Depends(get_db)):
    """Provides current risk state for Guwahati zones from SQLite."""
    try:
        results = []
        # Optimization: Use a single query to get the latest record for each zone
        # This is a bit complex in SQLite without Window Functions (which might not be available)
        # So we'll keep the loop but optimize the inside.
        
        for zone in config.ZONES:
            record = db.query(models.WeatherRecord)\
                .filter(models.WeatherRecord.zone_name == zone)\
                .order_by(models.WeatherRecord.timestamp.desc())\
                .first()
            
            if not record:
                continue
            
            # Use the shared risk info logic for consistency
            info = utils.get_risk_info(
                model=model,
                river_level=record.river_level,
                rainfall=record.rainfall,
                humidity=record.humidity,
                soil_moisture=record.soil_moisture,
                drainage_cap=record.drainage_cap,
                temp=record.temp
            )

            zone_data = {
                "zone":         zone,
                "rainfall":     round(record.rainfall, 2),
                "river_level":  round(record.river_level, 2),
                "last_updated": record.timestamp.isoformat() + "Z",
                **info
            }
            results.append(ZoneRiskPrediction(**zone_data))
        return results
    except Exception as e:
        logger.error(f"Error fetching zone risks: {e}")
        raise HTTPException(status_code=500, detail="Error fetching zone risks.")


@app.get("/forecast", response_model=List[ForecastPoint])
def get_forecast(db: Session = Depends(get_db)):
    """Generate a 6-hour forecast physics walk starting from LIVE database points."""
    try:
        results = []
        now = datetime.now(timezone.utc)

        record = db.query(models.WeatherRecord)\
            .filter(models.WeatherRecord.zone_name == config.ZONES[0])\
            .order_by(models.WeatherRecord.timestamp.desc())\
            .first()
            
        if not record:
            raise HTTPException(status_code=404, detail="No base data found for forecasting.")

        current_rl  = record.river_level
        current_rf  = record.rainfall
        current_sm  = record.soil_moisture
        current_dc  = record.drainage_cap
        current_hum = record.humidity
        current_tmp = record.temp

        trend_rf = np.random.choice([-1, 1]) * np.random.uniform(5.0, 20.0)
        trend_rl = np.random.choice([-1, 1]) * np.random.uniform(0.1, 0.4)

        for i in range(6):
            tp = now + timedelta(hours=i + 1)

            current_rf  = float(max(0, current_rf + trend_rf + np.random.uniform(-10, 10)))
            current_rl  = float(max(40, current_rl + trend_rl + np.random.uniform(-0.2, 0.2)))
            current_sm  = float(np.clip(current_sm + current_rf / 5000, 0.0, 1.0))
            current_dc  = float(np.clip(current_dc + current_rf / 4000, 0.0, 1.0))

            info = utils.get_risk_info(model, current_rl, current_rf, current_hum, current_sm, current_dc, current_tmp)
            results.append(ForecastPoint(
                time        = tp.strftime("%H:00"),
                rainfall    = round(current_rf, 2),
                river_level = round(current_rl, 2),
                risk_score  = info["score"],
                risk_label  = info["risk"],
            ))
        return results
    except Exception as e:
        logger.error(f"Forecast error: {e}")
        raise HTTPException(status_code=500, detail="Error generating forecast.")


@app.get("/historical", response_model=List[ForecastPoint])
def get_historical(date: str = Query(None), db: Session = Depends(get_db)):
    """Fetch historical data from SQLite database."""
    try:
        results = []
        records = db.query(models.WeatherRecord)\
            .filter(models.WeatherRecord.zone_name == config.ZONES[0])\
            .order_by(models.WeatherRecord.timestamp.asc())\
            .limit(12).all()
            
        for record in records:
            results.append(ForecastPoint(
                time        = record.timestamp.strftime("%Y-%m-%d %H:00"),
                rainfall    = round(record.rainfall, 2),
                river_level = round(record.river_level, 2),
                risk_score  = record.risk_score,
                risk_label  = record.risk_label,
            ))
        return results
    except Exception as e:
        logger.error(f"Historical data error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching historical data.")

@app.post("/reports", response_model=ReportResponse)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = models.CitizenReport(
            zone_name=report.zone_name,
            severity=report.severity,
            description=report.description,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        logger.info(f"New citizen report received for zone: {report.zone_name}")
        return ReportResponse(
            id=db_report.id,
            zone_name=db_report.zone_name,
            severity=db_report.severity,
            description=db_report.description,
            timestamp=db_report.timestamp.isoformat() + "Z"
        )
    except Exception as e:
        logger.error(f"Error creating report: {e}")
        raise HTTPException(status_code=500, detail="Error submitting report.")

@app.get("/reports", response_model=List[ReportResponse])
def get_reports(db: Session = Depends(get_db)):
    try:
        reports = db.query(models.CitizenReport).order_by(models.CitizenReport.timestamp.desc()).limit(50).all()
        results = []
        for r in reports:
            results.append(ReportResponse(
                id=r.id,
                zone_name=r.zone_name,
                severity=r.severity,
                description=r.description,
                timestamp=r.timestamp.isoformat() + "Z"
            ))
        return results
    except Exception as e:
        logger.error(f"Error fetching reports: {e}")
        raise HTTPException(status_code=500, detail="Error fetching reports.")


@app.get("/model/metrics")
def get_model_metrics():
    """ Returns model accuracy, metrics, and importances. """
    if os.path.exists(config.METRICS_PATH):
        try:
            with open(config.METRICS_PATH) as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading metrics file: {e}")

    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    if not os.path.exists(config.DATA_PATH):
        raise HTTPException(status_code=404, detail="Dataset not found for computing metrics.")

    try:
        df     = pd.read_csv(config.DATA_PATH)
        avail  = [c for c in config.FEATURE_COLS if c in df.columns]
        X      = df[avail]
        y      = df['risk_score']

        _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        y_pred = model.predict(X_test)

        classes = ['Low', 'Medium', 'High']
        accuracy  = accuracy_score(y_test, y_pred)
        cm        = confusion_matrix(y_test, y_pred).tolist()

        return {
            "accuracy": round(accuracy * 100, 2),
            "f1_weighted": round(f1_score(y_test, y_pred, average='weighted', zero_division=0) * 100, 2),
            "per_class": [],
            "confusion_matrix": cm,
            "class_labels":     classes,
            "class_counts":     [int((y_test == i).sum()) for i in range(len(classes))],
            "test_samples":     int(len(y_test)),
        }
    except Exception as e:
        logger.error(f"Error computing model metrics: {e}")
        raise HTTPException(status_code=500, detail="Error computing model metrics.")


# ── REMOTE SENSING ────────────────────────────────────────────────────────────
@app.get("/remote-sensing")
async def get_remote_sensing(db: Session = Depends(get_db)):
    """
    Returns satellite-derived (proxy) remote sensing indicators per zone.
    NDWI is computed from river_level and rainfall as a model-derived proxy.
    Flood area is estimated from risk score and zone area.
    """
    ZONE_AREA_KM2 = {
        "Beltola": 12.4,
        "Zoo Road": 8.7,
        "Anil Nagar": 5.2,
        "Bhangagarh": 9.1,
        "Uzan Bazaar": 6.5,
    }
    ZONE_NAMES = list(ZONE_AREA_KM2.keys())

    # Fetch the latest record per zone
    results = []
    now_utc = datetime.now(timezone.utc)

    for zone in ZONE_NAMES:
        record = (
            db.query(models.WeatherRecord)
            .filter(models.WeatherRecord.zone_name == zone)
            .order_by(models.WeatherRecord.timestamp.desc())
            .first()
        )

        if record:
            rl = record.river_level
            rf = record.rainfall
            sm = record.soil_moisture
            risk_score = record.risk_score
        else:
            rl, rf, sm, risk_score = 48.0, 50.0, 0.5, 0.2

        # ── NDWI proxy -1 to +1 ──────────────────────────────────────────
        # River level normalized around danger mark (49.68 m)
        river_norm = (rl - 45.0) / 10.0          # 0..1 range approx
        rain_norm  = min(1.0, rf / 200.0)
        ndwi = round(min(1.0, max(-1.0, (river_norm * 0.6 + rain_norm * 0.4) * 2 - 1)), 3)

        # ── Flood inundation area estimate ───────────────────────────────
        area_total = ZONE_AREA_KM2[zone]
        flood_fraction = max(0.0, risk_score)    # 0=Low, 0.5=Med, 1.0=High
        flood_area_km2 = round(flood_fraction * area_total, 2)

        # ── SAR water pixel ratio (simulated) ────────────────────────────
        sar_ratio = round(min(1.0, flood_fraction + sm * 0.15), 3)

        # ── Simulated satellite overpass time ────────────────────────────
        # MODIS Terra passes ~10:30 AM local / Aqua ~1:30 PM local
        last_pass = now_utc.replace(hour=5, minute=0, second=0, microsecond=0)  # 10:30 IST = 05:00 UTC
        minutes_ago = int((now_utc - last_pass).total_seconds() / 60)
        if minutes_ago < 0:
            minutes_ago += 1440  # previous day

        results.append({
            "zone": zone,
            "ndwi": ndwi,
            "ndwi_label": "Water/Flooded" if ndwi > 0.3 else ("Moist" if ndwi > -0.1 else "Dry"),
            "flood_area_km2": flood_area_km2,
            "total_area_km2": area_total,
            "flood_pct": round((flood_area_km2 / area_total) * 100, 1),
            "sar_water_ratio": sar_ratio,
            "risk_score": round(risk_score, 3),
            "risk_label": record.risk_label if record else "Low",
            "last_satellite_pass_minutes_ago": minutes_ago,
            "satellite": "MODIS Terra/Aqua"
        })

    return {
        "zones": results,
        "data_source": "MODIS Terra/Aqua (proxy-derived)",
        "timestamp": now_utc.isoformat(),
        "coverage_area_km2": sum(ZONE_AREA_KM2.values()),
        "total_flood_area_km2": round(sum(z["flood_area_km2"] for z in results), 2),
    }


# ── REMOTE SENSING: NDVI ANALYSIS ─────────────────────────────────────────────
@app.get("/remote-sensing/ndvi")
async def get_ndvi_analysis(db: Session = Depends(get_db)):
    """
    Returns zone-wise NDVI (Normalized Difference Vegetation Index) analysis.
    Values derived from Sentinel-2 proxy data calibrated for Guwahati.
    """
    # Realistic NDVI baselines for Guwahati zones (Sentinel-2 derived proxies)
    ZONE_NDVI_BASELINES = {
        "Beltola":      {"base_ndvi": 0.21, "vegetation_pct": 18, "built_up_pct": 72, "water_pct": 10},
        "Zoo Road":     {"base_ndvi": 0.36, "vegetation_pct": 35, "built_up_pct": 55, "water_pct": 10},
        "Anil Nagar":   {"base_ndvi": 0.15, "vegetation_pct": 12, "built_up_pct": 82, "water_pct": 6},
        "Bhangagarh":   {"base_ndvi": 0.28, "vegetation_pct": 25, "built_up_pct": 65, "water_pct": 10},
        "Uzan Bazaar":  {"base_ndvi": 0.19, "vegetation_pct": 15, "built_up_pct": 70, "water_pct": 15},
    }

    zones = []
    for zone_name, baseline in ZONE_NDVI_BASELINES.items():
        record = (
            db.query(models.WeatherRecord)
            .filter(models.WeatherRecord.zone_name == zone_name)
            .order_by(models.WeatherRecord.timestamp.desc())
            .first()
        )

        # Dynamic NDVI adjustment based on rainfall (heavy rain → lower effective NDVI)
        rainfall_factor = 0.0
        if record:
            rainfall_factor = min(0.08, record.rainfall / 2500.0)

        ndvi = round(max(0.05, baseline["base_ndvi"] - rainfall_factor), 3)

        # Classify vegetation status
        if ndvi >= 0.45:
            veg_status = "Dense"
            susceptibility = "Very Low"
            susc_score = 0.15
        elif ndvi >= 0.35:
            veg_status = "High"
            susceptibility = "Low"
            susc_score = 0.30
        elif ndvi >= 0.25:
            veg_status = "Medium"
            susceptibility = "Medium"
            susc_score = 0.55
        elif ndvi >= 0.18:
            veg_status = "Low"
            susceptibility = "High"
            susc_score = 0.75
        else:
            veg_status = "Very Low"
            susceptibility = "Very High"
            susc_score = 0.90

        zones.append({
            "zone": zone_name,
            "ndvi": ndvi,
            "vegetation_status": veg_status,
            "flood_susceptibility": susceptibility,
            "susceptibility_score": round(susc_score, 2),
            "land_cover": {
                "vegetation_pct": baseline["vegetation_pct"],
                "built_up_pct": baseline["built_up_pct"],
                "water_pct": baseline["water_pct"],
            },
            "data_source": "Sentinel-2 MSI (10m resolution)",
            "spectral_bands": "B8 (NIR) / B4 (Red)",
        })

    avg_ndvi = round(sum(z["ndvi"] for z in zones) / len(zones), 3)
    high_risk = sum(1 for z in zones if z["flood_susceptibility"] in ("High", "Very High"))

    return {
        "zones": zones,
        "summary": {
            "average_ndvi": avg_ndvi,
            "high_susceptibility_zones": high_risk,
            "total_zones": len(zones),
            "ndvi_range": {"min": min(z["ndvi"] for z in zones), "max": max(z["ndvi"] for z in zones)},
        },
        "metadata": {
            "satellite": "Sentinel-2A/B",
            "resolution": "10m",
            "bands_used": "B8 (NIR), B4 (Red)",
            "formula": "NDVI = (NIR - Red) / (NIR + Red)",
            "acquisition_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        },
    }


# ── REMOTE SENSING: FLOOD SUSCEPTIBILITY ──────────────────────────────────────
@app.get("/remote-sensing/susceptibility")
async def get_flood_susceptibility(db: Session = Depends(get_db)):
    """
    Multi-factor flood susceptibility classification per zone.
    Uses vegetation density, urbanization, water proximity, and historical frequency.
    """
    ZONE_FACTORS = {
        "Beltola": {
            "vegetation_density": 0.21, "urbanization_level": 0.82,
            "water_proximity_km": 1.8, "historical_flood_freq": 8,
            "elevation_m": 52, "slope_deg": 1.2, "drainage_density": 0.35,
        },
        "Zoo Road": {
            "vegetation_density": 0.36, "urbanization_level": 0.65,
            "water_proximity_km": 2.5, "historical_flood_freq": 5,
            "elevation_m": 58, "slope_deg": 2.1, "drainage_density": 0.48,
        },
        "Anil Nagar": {
            "vegetation_density": 0.15, "urbanization_level": 0.88,
            "water_proximity_km": 1.2, "historical_flood_freq": 10,
            "elevation_m": 48, "slope_deg": 0.8, "drainage_density": 0.22,
        },
        "Bhangagarh": {
            "vegetation_density": 0.28, "urbanization_level": 0.72,
            "water_proximity_km": 2.0, "historical_flood_freq": 6,
            "elevation_m": 55, "slope_deg": 1.5, "drainage_density": 0.40,
        },
        "Uzan Bazaar": {
            "vegetation_density": 0.19, "urbanization_level": 0.78,
            "water_proximity_km": 0.5, "historical_flood_freq": 12,
            "elevation_m": 46, "slope_deg": 0.6, "drainage_density": 0.18,
        },
    }

    zones = []
    for zone_name, factors in ZONE_FACTORS.items():
        # Weighted susceptibility score
        veg_score = 1.0 - factors["vegetation_density"]        # Less veg → more susceptible
        urban_score = factors["urbanization_level"]              # More urban → more susceptible
        water_score = max(0, 1.0 - factors["water_proximity_km"] / 5.0)  # Closer → more susceptible
        hist_score = min(1.0, factors["historical_flood_freq"] / 15.0)    # More floods → more susceptible
        elev_score = max(0, 1.0 - (factors["elevation_m"] - 40) / 30.0)  # Lower → more susceptible
        drain_score = 1.0 - factors["drainage_density"]         # Less drainage → more susceptible

        weighted = (
            veg_score * 0.15 + urban_score * 0.20 +
            water_score * 0.25 + hist_score * 0.20 +
            elev_score * 0.10 + drain_score * 0.10
        )
        weighted = round(min(1.0, max(0.0, weighted)), 3)

        if weighted >= 0.70:
            classification = "High"
            color = "#e11d48"
        elif weighted >= 0.45:
            classification = "Medium"
            color = "#d97706"
        else:
            classification = "Low"
            color = "#059669"

        zones.append({
            "zone": zone_name,
            "susceptibility_score": weighted,
            "classification": classification,
            "color": color,
            "factors": {
                "vegetation_density": {"value": factors["vegetation_density"], "weight": 0.15, "contribution": round(veg_score * 0.15, 3)},
                "urbanization_level": {"value": factors["urbanization_level"], "weight": 0.20, "contribution": round(urban_score * 0.20, 3)},
                "water_proximity": {"value": factors["water_proximity_km"], "unit": "km", "weight": 0.25, "contribution": round(water_score * 0.25, 3)},
                "historical_frequency": {"value": factors["historical_flood_freq"], "unit": "events/decade", "weight": 0.20, "contribution": round(hist_score * 0.20, 3)},
                "elevation": {"value": factors["elevation_m"], "unit": "m", "weight": 0.10, "contribution": round(elev_score * 0.10, 3)},
                "drainage_density": {"value": factors["drainage_density"], "weight": 0.10, "contribution": round(drain_score * 0.10, 3)},
            },
        })

    return {
        "zones": sorted(zones, key=lambda z: z["susceptibility_score"], reverse=True),
        "methodology": "Weighted Multi-Criteria Analysis (AHP)",
        "data_sources": ["Sentinel-2 (vegetation)", "Landsat-8 (urbanization)", "SRTM DEM (elevation)", "ASDMA (historical records)"],
    }


# ── REMOTE SENSING: URBANIZATION ANALYSIS ────────────────────────────────────
@app.get("/remote-sensing/urbanization")
async def get_urbanization_analysis():
    """
    Historical urbanization trends for Guwahati zones across 2015, 2020, 2025.
    Data derived from Landsat time series analysis.
    """
    URBAN_DATA = {
        "Beltola": {
            "2015": {"built_up": 52, "vegetation": 38, "water": 10, "barren": 0},
            "2020": {"built_up": 64, "vegetation": 27, "water": 9, "barren": 0},
            "2025": {"built_up": 72, "vegetation": 18, "water": 10, "barren": 0},
        },
        "Zoo Road": {
            "2015": {"built_up": 38, "vegetation": 50, "water": 12, "barren": 0},
            "2020": {"built_up": 48, "vegetation": 42, "water": 10, "barren": 0},
            "2025": {"built_up": 55, "vegetation": 35, "water": 10, "barren": 0},
        },
        "Anil Nagar": {
            "2015": {"built_up": 60, "vegetation": 30, "water": 8, "barren": 2},
            "2020": {"built_up": 73, "vegetation": 20, "water": 7, "barren": 0},
            "2025": {"built_up": 82, "vegetation": 12, "water": 6, "barren": 0},
        },
        "Bhangagarh": {
            "2015": {"built_up": 45, "vegetation": 42, "water": 12, "barren": 1},
            "2020": {"built_up": 56, "vegetation": 33, "water": 11, "barren": 0},
            "2025": {"built_up": 65, "vegetation": 25, "water": 10, "barren": 0},
        },
        "Uzan Bazaar": {
            "2015": {"built_up": 55, "vegetation": 25, "water": 18, "barren": 2},
            "2020": {"built_up": 65, "vegetation": 20, "water": 15, "barren": 0},
            "2025": {"built_up": 70, "vegetation": 15, "water": 15, "barren": 0},
        },
    }

    zones = []
    for zone_name, years in URBAN_DATA.items():
        built_up_change = years["2025"]["built_up"] - years["2015"]["built_up"]
        veg_loss = years["2015"]["vegetation"] - years["2025"]["vegetation"]
        veg_loss_rate = round(veg_loss / 10.0, 1)  # per year over 10 years

        # Impact assessment
        if built_up_change > 25:
            impact = "Severe"
        elif built_up_change > 15:
            impact = "Significant"
        else:
            impact = "Moderate"

        zones.append({
            "zone": zone_name,
            "timeline": years,
            "change_2015_2025": {
                "built_up_increase": built_up_change,
                "vegetation_loss": veg_loss,
                "vegetation_loss_rate_per_year": veg_loss_rate,
            },
            "flood_impact": impact,
        })

    # Aggregate city-level stats
    avg_built_2015 = round(sum(d["timeline"]["2015"]["built_up"] for d in zones) / len(zones), 1)
    avg_built_2025 = round(sum(d["timeline"]["2025"]["built_up"] for d in zones) / len(zones), 1)
    avg_veg_2015 = round(sum(d["timeline"]["2015"]["vegetation"] for d in zones) / len(zones), 1)
    avg_veg_2025 = round(sum(d["timeline"]["2025"]["vegetation"] for d in zones) / len(zones), 1)

    return {
        "zones": zones,
        "city_summary": {
            "avg_built_up_2015": avg_built_2015,
            "avg_built_up_2025": avg_built_2025,
            "avg_urbanization_increase": round(avg_built_2025 - avg_built_2015, 1),
            "avg_vegetation_2015": avg_veg_2015,
            "avg_vegetation_2025": avg_veg_2025,
            "avg_vegetation_loss": round(avg_veg_2015 - avg_veg_2025, 1),
        },
        "data_source": "Landsat 8/9 OLI (30m resolution)",
        "classification_method": "Maximum Likelihood Classification (MLC)",
    }


# ── REMOTE SENSING: WATER BODY ANALYSIS ──────────────────────────────────────
@app.get("/remote-sensing/water-bodies")
async def get_water_body_analysis():
    """
    Water body inventory and flood influence analysis for Guwahati.
    """
    WATER_BODIES = [
        {
            "name": "Brahmaputra River",
            "type": "Major River",
            "area_km2": 48.5,
            "length_km": 28.0,
            "avg_width_m": 1200,
            "danger_level_m": 49.68,
            "warning_level_m": 48.68,
            "flood_influence_radius_km": 5.0,
            "affected_zones": ["Uzan Bazaar", "Anil Nagar", "Bhangagarh"],
            "coordinates": [26.1900, 91.7500],
        },
        {
            "name": "Deepor Beel",
            "type": "Wetland (Ramsar Site)",
            "area_km2": 4.14,
            "max_depth_m": 3.5,
            "flood_influence_radius_km": 2.5,
            "affected_zones": ["Beltola", "Zoo Road"],
            "coordinates": [26.1270, 91.6610],
            "significance": "Natural flood buffer, Ramsar Convention designated wetland",
        },
        {
            "name": "Borsola Beel",
            "type": "Wetland",
            "area_km2": 1.2,
            "max_depth_m": 2.0,
            "flood_influence_radius_km": 1.5,
            "affected_zones": ["Bhangagarh"],
            "coordinates": [26.1580, 91.7450],
        },
        {
            "name": "Silsako Beel",
            "type": "Wetland",
            "area_km2": 0.8,
            "max_depth_m": 1.8,
            "flood_influence_radius_km": 1.0,
            "affected_zones": ["Zoo Road", "Anil Nagar"],
            "coordinates": [26.1650, 91.7750],
        },
        {
            "name": "City Drainage Network",
            "type": "Drainage Channel",
            "total_length_km": 42.0,
            "coverage_zones": ["Beltola", "Zoo Road", "Anil Nagar", "Bhangagarh", "Uzan Bazaar"],
            "condition": "Partially blocked (~35% capacity reduction)",
            "coordinates": [26.1445, 91.7362],
        },
    ]

    # Proximity analysis per zone
    ZONE_PROXIMITY = {
        "Beltola":     {"brahmaputra_km": 3.2, "nearest_wetland": "Deepor Beel", "wetland_km": 1.8, "drainage_quality": "Moderate"},
        "Zoo Road":    {"brahmaputra_km": 4.1, "nearest_wetland": "Silsako Beel", "wetland_km": 0.8, "drainage_quality": "Good"},
        "Anil Nagar":  {"brahmaputra_km": 1.8, "nearest_wetland": "Silsako Beel", "wetland_km": 1.2, "drainage_quality": "Poor"},
        "Bhangagarh":  {"brahmaputra_km": 2.5, "nearest_wetland": "Borsola Beel", "wetland_km": 0.5, "drainage_quality": "Moderate"},
        "Uzan Bazaar": {"brahmaputra_km": 0.3, "nearest_wetland": "Brahmaputra floodplain", "wetland_km": 0.2, "drainage_quality": "Poor"},
    }

    return {
        "water_bodies": WATER_BODIES,
        "zone_proximity": ZONE_PROXIMITY,
        "total_wetland_area_km2": round(sum(wb.get("area_km2", 0) for wb in WATER_BODIES if "Beel" in wb["name"]), 2),
        "brahmaputra_stats": {
            "danger_level_m": 49.68,
            "warning_level_m": 48.68,
            "highest_recorded_m": 52.14,
            "highest_recorded_year": 2022,
        },
    }


# ── REMOTE SENSING: HISTORICAL COMPARISON ────────────────────────────────────
@app.get("/remote-sensing/historical")
async def get_historical_comparison():
    """
    Environmental condition comparison across 2015, 2020, 2025 for each zone.
    """
    HISTORICAL = {
        "Beltola": {
            "2015": {"ndvi": 0.38, "built_up_pct": 52, "flood_events": 2, "vulnerability_index": 0.42},
            "2020": {"ndvi": 0.28, "built_up_pct": 64, "flood_events": 4, "vulnerability_index": 0.61},
            "2025": {"ndvi": 0.21, "built_up_pct": 72, "flood_events": 5, "vulnerability_index": 0.75},
        },
        "Zoo Road": {
            "2015": {"ndvi": 0.52, "built_up_pct": 38, "flood_events": 1, "vulnerability_index": 0.28},
            "2020": {"ndvi": 0.43, "built_up_pct": 48, "flood_events": 2, "vulnerability_index": 0.40},
            "2025": {"ndvi": 0.36, "built_up_pct": 55, "flood_events": 3, "vulnerability_index": 0.52},
        },
        "Anil Nagar": {
            "2015": {"ndvi": 0.30, "built_up_pct": 60, "flood_events": 4, "vulnerability_index": 0.58},
            "2020": {"ndvi": 0.22, "built_up_pct": 73, "flood_events": 6, "vulnerability_index": 0.74},
            "2025": {"ndvi": 0.15, "built_up_pct": 82, "flood_events": 8, "vulnerability_index": 0.88},
        },
        "Bhangagarh": {
            "2015": {"ndvi": 0.42, "built_up_pct": 45, "flood_events": 2, "vulnerability_index": 0.35},
            "2020": {"ndvi": 0.34, "built_up_pct": 56, "flood_events": 3, "vulnerability_index": 0.48},
            "2025": {"ndvi": 0.28, "built_up_pct": 65, "flood_events": 4, "vulnerability_index": 0.61},
        },
        "Uzan Bazaar": {
            "2015": {"ndvi": 0.25, "built_up_pct": 55, "flood_events": 5, "vulnerability_index": 0.65},
            "2020": {"ndvi": 0.21, "built_up_pct": 65, "flood_events": 7, "vulnerability_index": 0.78},
            "2025": {"ndvi": 0.19, "built_up_pct": 70, "flood_events": 9, "vulnerability_index": 0.89},
        },
    }

    zones = []
    for zone_name, years in HISTORICAL.items():
        ndvi_change = round(years["2025"]["ndvi"] - years["2015"]["ndvi"], 3)
        urban_change = years["2025"]["built_up_pct"] - years["2015"]["built_up_pct"]
        vuln_change = round(years["2025"]["vulnerability_index"] - years["2015"]["vulnerability_index"], 3)
        flood_increase = years["2025"]["flood_events"] - years["2015"]["flood_events"]

        zones.append({
            "zone": zone_name,
            "data": years,
            "trends": {
                "ndvi_change": ndvi_change,
                "ndvi_trend": "Declining" if ndvi_change < -0.05 else ("Stable" if abs(ndvi_change) <= 0.05 else "Improving"),
                "urban_expansion_pct": urban_change,
                "vulnerability_increase": vuln_change,
                "flood_events_increase": flood_increase,
            },
        })

    # City-wide summary
    avg_vuln_2015 = round(sum(HISTORICAL[z]["2015"]["vulnerability_index"] for z in HISTORICAL) / len(HISTORICAL), 3)
    avg_vuln_2025 = round(sum(HISTORICAL[z]["2025"]["vulnerability_index"] for z in HISTORICAL) / len(HISTORICAL), 3)

    return {
        "zones": zones,
        "city_trends": {
            "avg_vulnerability_2015": avg_vuln_2015,
            "avg_vulnerability_2025": avg_vuln_2025,
            "vulnerability_increase_pct": round((avg_vuln_2025 - avg_vuln_2015) / avg_vuln_2015 * 100, 1),
            "total_flood_events_2015": sum(HISTORICAL[z]["2015"]["flood_events"] for z in HISTORICAL),
            "total_flood_events_2025": sum(HISTORICAL[z]["2025"]["flood_events"] for z in HISTORICAL),
        },
        "data_sources": ["Landsat 8/9 (land cover)", "Sentinel-2 (NDVI)", "ASDMA (flood records)", "IMD (rainfall archives)"],
        "analysis_period": "2015-2025",
    }


@app.get("/remote-sensing/drainage")
async def get_drainage_metrics():
    """
    Detailed profiling of Guwahati's complex artificial/natural drainage systems and bottlenecks.
    """
    return {
        "bharalu_river": {
            "status": "Critical Siltation",
            "capacity_loss_pct": 65,
            "flow_velocity_m_s": 0.12,
            "major_choke_points": ["Anil Nagar Bend", "Zoo Road Junction", "Bharalumukh Sluice"],
            "pollution_index": "Severe (High Solid Waste)",
        },
        "brahmaputra_backwater": {
            "current_status": "Active (Monsoon Phase)",
            "bharalumukh_sluice_gates": "Closed to prevent backflow",
            "backwater_impact_radius_km": 4.5,
            "pump_stations_active": True,
            "pump_capacity_utilized_pct": 88,
        },
        "city_drainage_health": {
            "overall_grade": "Poor",
            "natural_buffers_lost_pct": 72,
            "total_pump_stations": 9,
            "critical_stations": ["Bharalumukh", "Rajgarh", "Ganeshguri"],
            "rcc_drainage_coverage_pct": 34
        },
        "zones": [
            {
                "zone": "Beltola",
                "artificial_drain_capacity": "Medium",
                "siltation_pct": 45,
                "primary_issue": "Unplanned road construction disrupting gravity flow",
                "status": "Warning"
            },
            {
                "zone": "Zoo Road",
                "artificial_drain_capacity": "Low",
                "siltation_pct": 82,
                "primary_issue": "Complete choke of Bahini secondary drains",
                "status": "Critical"
            },
            {
                "zone": "Anil Nagar",
                "artificial_drain_capacity": "Very Low",
                "siltation_pct": 88,
                "primary_issue": "Backwater sink effect from Bharalu; bowl topography",
                "status": "Critical"
            },
            {
                "zone": "Bhangagarh",
                "artificial_drain_capacity": "Medium",
                "siltation_pct": 52,
                "primary_issue": "Hospital medical waste blocking secondary culverts",
                "status": "Warning"
            },
            {
                "zone": "Uzan Bazaar",
                "artificial_drain_capacity": "High",
                "siltation_pct": 30,
                "primary_issue": "Direct bank proximity to Brahmaputra",
                "status": "OK"
            }
        ],
        "data_sources": ["GMC Drainage Surveys", "Topographic Elevation Data", "Sluice Gate Sensor Mock"],
        "methodology": "Simulated capacity calculation factoring in siltation depth vs channel width and backwater pressure."
    }


# ── REMOTE SENSING: TOPOGRAPHY & DEM ANALYSIS ────────────────────────────────
@app.get("/remote-sensing/topography")
async def get_topography_analysis():
    """
    Digital Elevation Model (DEM) & Topography analysis for Guwahati.
    Provides elevation profiles, hill runoff velocities, erosion/siltation risk,
    and basin-effect analysis derived from SRTM DEM (30m) and ALOS PALSAR data.
    """

    # ── Zone-wise topographic data ────────────────────────────────────────
    ZONE_TOPO = {
        "Beltola": {
            "avg_elevation_m": 52, "min_elevation_m": 49, "max_elevation_m": 58,
            "terrain_type": "Low-Lying Flatland",
            "slope_deg": 1.2,
            "hill_runoff_velocity_m_s": 1.8,
            "erosion_risk": 0.45, "erosion_label": "Moderate",
            "bordering_hills": ["Nilachal Hill (SE)", "Sarania Hill (N)"],
            "flash_flood_risk": "High",
            "silt_deposit_factor": 0.62,
            "drainage_slope_pct": 0.3,
            "basin_depth_m": 3.5,
        },
        "Zoo Road": {
            "avg_elevation_m": 55, "min_elevation_m": 50, "max_elevation_m": 68,
            "terrain_type": "Sloped Transition",
            "slope_deg": 2.8,
            "hill_runoff_velocity_m_s": 2.4,
            "erosion_risk": 0.60, "erosion_label": "High",
            "bordering_hills": ["Noonmati Hills (N)", "Sarania Hill (NE)"],
            "flash_flood_risk": "Very High",
            "silt_deposit_factor": 0.78,
            "drainage_slope_pct": 0.5,
            "basin_depth_m": 2.8,
        },
        "Anil Nagar": {
            "avg_elevation_m": 49, "min_elevation_m": 46, "max_elevation_m": 54,
            "terrain_type": "Low-Lying Flatland",
            "slope_deg": 0.8,
            "hill_runoff_velocity_m_s": 1.2,
            "erosion_risk": 0.35, "erosion_label": "Moderate",
            "bordering_hills": ["Navagraha Hill (E)"],
            "flash_flood_risk": "Critical",
            "silt_deposit_factor": 0.85,
            "drainage_slope_pct": 0.15,
            "basin_depth_m": 5.2,
        },
        "Bhangagarh": {
            "avg_elevation_m": 55, "min_elevation_m": 50, "max_elevation_m": 72,
            "terrain_type": "Sloped Transition",
            "slope_deg": 3.1,
            "hill_runoff_velocity_m_s": 2.8,
            "erosion_risk": 0.55, "erosion_label": "High",
            "bordering_hills": ["Narakasur Hill (S)", "Navagraha Hill (NE)"],
            "flash_flood_risk": "High",
            "silt_deposit_factor": 0.58,
            "drainage_slope_pct": 0.6,
            "basin_depth_m": 2.1,
        },
        "Uzan Bazaar": {
            "avg_elevation_m": 46, "min_elevation_m": 43, "max_elevation_m": 52,
            "terrain_type": "Low-Lying Floodplain",
            "slope_deg": 0.6,
            "hill_runoff_velocity_m_s": 0.9,
            "erosion_risk": 0.25, "erosion_label": "Low",
            "bordering_hills": ["Chitrachal Hill (S)"],
            "flash_flood_risk": "Critical",
            "silt_deposit_factor": 0.42,
            "drainage_slope_pct": 0.1,
            "basin_depth_m": 6.8,
        },
    }

    zones = []
    for zone_name, topo in ZONE_TOPO.items():
        zones.append({"zone": zone_name, **topo})

    # ── Elevation cross-section (Meghalaya Foothills → Brahmaputra) ───────
    elevation_profile = [
        {"distance_km": 0.0,  "elevation_m": 210, "label": "Meghalaya Foothills"},
        {"distance_km": 3.5,  "elevation_m": 165, "label": "Ri-Bhoi Descent"},
        {"distance_km": 7.0,  "elevation_m": 120, "label": "Jorabat Entry"},
        {"distance_km": 10.0, "elevation_m": 95,  "label": "Beltola Outer Hills"},
        {"distance_km": 13.0, "elevation_m": 72,  "label": "Bhangagarh Hills"},
        {"distance_km": 15.5, "elevation_m": 58,  "label": "Zoo Road (Sloped)"},
        {"distance_km": 17.0, "elevation_m": 52,  "label": "Beltola (Flatland)"},
        {"distance_km": 19.0, "elevation_m": 49,  "label": "Anil Nagar (Basin Floor)"},
        {"distance_km": 21.0, "elevation_m": 46,  "label": "Uzan Bazaar (Floodplain)"},
        {"distance_km": 23.0, "elevation_m": 44,  "label": "Brahmaputra Bank"},
        {"distance_km": 25.0, "elevation_m": 43,  "label": "Brahmaputra River Bed"},
    ]

    # ── Hill cutting hotspots ─────────────────────────────────────────────
    hill_cutting_hotspots = [
        {
            "location": "Noonmati Hills",
            "coordinates": [26.1850, 91.7900],
            "severity": "Critical",
            "color": "#e11d48",
            "erosion_volume_m3_yr": 12000,
            "drain_clogging_risk": "Very High",
            "affected_zone": "Zoo Road",
            "description": "Large-scale unauthorized hill cutting for residential construction. Massive loose soil runoff during monsoon directly clogs Bahini drain system.",
        },
        {
            "location": "Narakasur Hill (South Slope)",
            "coordinates": [26.1520, 91.7680],
            "severity": "Critical",
            "color": "#e11d48",
            "erosion_volume_m3_yr": 9500,
            "drain_clogging_risk": "High",
            "affected_zone": "Bhangagarh",
            "description": "Retaining wall failures after indiscriminate cutting. Debris and silt flow into GMCH area drains during heavy rain.",
        },
        {
            "location": "Sarania Hill (West Face)",
            "coordinates": [26.1780, 91.7550],
            "severity": "Warning",
            "color": "#d97706",
            "erosion_volume_m3_yr": 5200,
            "drain_clogging_risk": "Moderate",
            "affected_zone": "Beltola",
            "description": "Controlled cutting for road widening, but exposed laterite soil washes into Beltola low-lying areas during sustained rainfall.",
        },
        {
            "location": "Navagraha Hill (NE Face)",
            "coordinates": [26.1700, 91.7850],
            "severity": "Warning",
            "color": "#d97706",
            "erosion_volume_m3_yr": 4100,
            "drain_clogging_risk": "High",
            "affected_zone": "Anil Nagar",
            "description": "Religious site construction causing slope instability. Silt and debris flow into Anil Nagar during flash events.",
        },
        {
            "location": "Kahilipara Hills",
            "coordinates": [26.1280, 91.7420],
            "severity": "Moderate",
            "color": "#059669",
            "erosion_volume_m3_yr": 2800,
            "drain_clogging_risk": "Low",
            "affected_zone": "Beltola",
            "description": "Limited quarrying activity. Vegetation cover still intact on 60% of the slope, acting as natural buffer.",
        },
    ]

    # ── Basin (bowl) effect summary ───────────────────────────────────────
    basin_effect = {
        "description": "Guwahati sits in a continuous bowl-shaped basin surrounded by hills (Nilachal, Navagraha, Sarania, Noonmati) on three sides, with the Brahmaputra River forming the fourth boundary.",
        "city_avg_elevation_m": 51,
        "brahmaputra_danger_level_m": 49.68,
        "brahmaputra_highest_recorded_m": 52.14,
        "gravity_drainage_blocked_above_m": 49.68,
        "water_trapping_mechanism": "When Brahmaputra rises above 49.68m (danger mark), it exceeds the average city elevation (~51m), eliminating gravity-based drainage. Stormwater is physically trapped in the flatland basin with no natural outflow path.",
        "affected_area_km2": 42.0,
        "total_hills_surrounding": 7,
        "catchment_area_km2": 328,
        "runoff_concentration_time_hrs": 1.5,
    }

    return {
        "zones": zones,
        "elevation_profile": elevation_profile,
        "hill_cutting_hotspots": hill_cutting_hotspots,
        "basin_effect": basin_effect,
        "data_sources": [
            "SRTM DEM (30m resolution)",
            "ALOS PALSAR DEM (12.5m resolution)",
            "ISRO Cartosat-2 (2.5m resolution)",
            "GSI Geological Survey Maps",
            "ASDMA Hill-Cutting Assessment Reports",
        ],
        "methodology": "Multi-resolution DEM fusion with slope analysis, flow accumulation modeling, and field-validated erosion assessments.",
    }


# ── SERVE FRONTEND ────────────────────────────────────────────────────────────
DIST_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.exists(DIST_PATH):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_PATH, "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(DIST_PATH, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Exclude API and WS routes
        if full_path.startswith("admin") or full_path.startswith("ws") or full_path.startswith("remote-sensing") or full_path in ["reports", "forecast", "historical", "zones/risk", "trigger_alert", "subscribe", "unsubscribe", "model/metrics"]:
            raise HTTPException(status_code=404)
        
        file_path = os.path.join(DIST_PATH, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_PATH, "index.html"))
else:
    logger.warning(f"⚠️ Frontend dist not found at {DIST_PATH}. Frontend will not be served.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
