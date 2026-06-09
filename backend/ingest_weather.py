import os
import requests
import datetime
import random
import argparse
from dotenv import load_dotenv

from database import SessionLocal, engine, Base
import models
import joblib
import pandas as pd

load_dotenv()
API_KEY = os.getenv("OPENWEATHER_API_KEY")

ZONES = ["Beltola", "Zoo Road", "Anil Nagar", "Bhangagarh", "Uzan Bazaar"]
FEATURE_COLS = ['river_level', 'rainfall', 'humidity', 'soil_moisture', 'drainage_cap', 'temp']

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', 'model', 'saved_model', 'flood_model.joblib'))

try:
    model = joblib.load(MODEL_PATH)
except Exception:
    model = None
    print(f"Warning: Could not load model from {MODEL_PATH}")

def setup_db():
    Base.metadata.create_all(bind=engine)

def fetch_weather():
    """Fetch live data or return generated mock data if API key is missing."""
    results = {}
    
    # Future OpenWeatherMap Implementation via requests
    # if API_KEY: ... 
    
    base_river = random.uniform(46.0, 52.0)
    base_soil = random.uniform(0.3, 0.8)
    for zone in ZONES:
        # Hardcoded simulation constraints matching prior frontend behavior
        if zone in ["Anil Nagar", "Zoo Road"]:
            rf = random.uniform(60.0, 200.0)
            dc = random.uniform(0.5, 0.95)
        else:
            rf = random.uniform(10.0, 130.0)
            dc = random.uniform(0.2, 0.65)
            
        results[zone] = {
            "rainfall": rf,
            "river_level": base_river + random.uniform(-0.5, 0.5),
            "humidity": random.uniform(65, 95),
            "soil_moisture": min(1.0, max(0.0, base_soil + random.uniform(-0.1, 0.1))),
            "drainage_cap": min(1.0, max(0.0, dc)),
            "temp": random.uniform(24, 35)
        }
    return results

def compute_risk(features):
    if not model:
        return 0, "Low", 0.5
    df = pd.DataFrame([features], columns=FEATURE_COLS)
    risk_code = int(model.predict(df)[0])
    probs = model.predict_proba(df)[0]
    expected_score = probs[1] * 0.5 + probs[2] * 1.0 # 0.0=Low, 0.5=Medium, 1.0=High 
    risk_map = {0: "Low", 1: "Medium", 2: "High"}
    return risk_code, risk_map[risk_code], expected_score

def ingest(mock_history=False):
    db = SessionLocal()
    setup_db()
    
    if mock_history:
        print("Scaffolding historical SQLite records (last 24h)...")
        now = datetime.datetime.now(datetime.timezone.utc)
        for i in range(24, -1, -2):
            data = fetch_weather()
            for zone, feats in data.items():
                risk_code, risk_label, score = compute_risk(
                    [feats['river_level'], feats['rainfall'], feats['humidity'], 
                     feats['soil_moisture'], feats['drainage_cap'], feats['temp']]
                )
                record = models.WeatherRecord(
                    zone_name=zone,
                    timestamp=now - datetime.timedelta(hours=i),
                    rainfall=feats['rainfall'],
                    river_level=feats['river_level'],
                    humidity=feats['humidity'],
                    soil_moisture=feats['soil_moisture'],
                    drainage_cap=feats['drainage_cap'],
                    temp=feats['temp'],
                    risk_score=float(score),
                    risk_label=risk_label
                )
                db.add(record)
        db.commit()
        print("Historical DB Populated safely.")
    else:
        print("Running live single pipeline ingest...")
        data = fetch_weather()
        for zone, feats in data.items():
            risk_code, risk_label, score = compute_risk(
                [feats['river_level'], feats['rainfall'], feats['humidity'], 
                 feats['soil_moisture'], feats['drainage_cap'], feats['temp']]
            )
            record = models.WeatherRecord(
                zone_name=zone,
                timestamp=datetime.datetime.now(datetime.timezone.utc),
                rainfall=feats['rainfall'],
                river_level=feats['river_level'],
                humidity=feats['humidity'],
                soil_moisture=feats['soil_moisture'],
                drainage_cap=feats['drainage_cap'],
                temp=feats['temp'],
                risk_score=float(score),
                risk_label=risk_label
            )
            db.add(record)
        db.commit()
        print("Live data inserted successfully into flood_data.db.")
    
    db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mock-history", action="store_true", help="Prepopulate database array.")
    args = parser.parse_args()
    
    ingest(mock_history=args.mock_history)
