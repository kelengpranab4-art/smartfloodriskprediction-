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
        if full_path.startswith("admin") or full_path.startswith("ws") or full_path in ["reports", "forecast", "historical", "zones/risk", "trigger_alert", "subscribe", "unsubscribe", "model/metrics"]:
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
