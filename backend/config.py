import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
API_TITLE = "Guwahati Flood Risk Prediction API — Decision Support System"
API_VERSION = "1.0.0"

# CORS Configuration
# ── SECURITY ──────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:8000").split(",")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "guwahati-flood-admin-2026")

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flood_data.db")

# OpenAI Config
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Model Configuration
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'saved_model', 'flood_model.joblib')
METRICS_PATH = os.path.join(BASE_DIR, 'model', 'saved_model', 'model_metrics.json')
DATA_PATH = os.path.join(BASE_DIR, 'data', 'flood_dataset.csv')

FEATURE_COLS = ['river_level', 'rainfall', 'humidity', 'soil_moisture', 'drainage_cap', 'temp']
ZONES = ["Beltola", "Zoo Road", "Anil Nagar", "Bhangagarh", "Uzan Bazaar"]

# Risk Thresholds
DANGER_RIVER_LEVEL = 49.68  # Brahmaputra danger mark
HIGH_RAINFALL_THRESHOLD = 120.0
MEDIUM_RAINFALL_THRESHOLD = 70.0
HIGH_SOIL_MOISTURE = 0.85
MEDIUM_SOIL_MOISTURE = 0.65
HIGH_DRAINAGE_BLOCKAGE = 0.80
