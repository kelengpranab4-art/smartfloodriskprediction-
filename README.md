# Guwahati Smart Flood Risk Monitoring & Decision Support System 🌊

![Guwahati Flood Dashboard](https://via.placeholder.com/1200x600/111827/3b82f6?text=Guwahati+Smart+Flood+Monitor+Dashboard)

## 📌 Problem Statement
Guwahati, Assam experiences severe urban flooding annually, largely driven by heavy monsoon rainfall, lack of efficient drainage, and the rising water levels of the Brahmaputra River. The resulting waterlogging severely impacts daily life, traffic, and safety in areas such as Anil Nagar, Zoo Road, and Beltola.

## 💡 Solution Overview
A real-time, **AI-powered Decision Support System (DSS)**. This full-stack web application leverages a Machine Learning model (Hybrid Ensemble: Random Forest + Gradient Boosting + Logistic Regression) trained on historical hydrological data (rainfall and river levels) to predict localized flood risk. It provides early warnings, explains *why* an area is at risk, and offers actionable safety measures through a dark-themed, modern interactive dashboard.

---

## 🛠️ Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS, Leaflet.js (Map Visualization), Recharts, Lucide React.
- **Backend API**: Python, FastAPI, Uvicorn, Pandas.
- **Machine Learning**: Scikit-Learn (Hybrid Ensemble: RF + GB + LR), Joblib for model serialization.

---

## ✨ Key Features
- **Map Visualization**: Interactive Leaflet map zoning Guwahati's critical neighborhoods.
- **AI Explainability**: Risk scores (Low, Medium, High) accompanied by clear human-readable logic ("High risk due to...").
- **Actionable Decision Support**: DSS provides step-by-step recommended actions for residents in vulnerable areas.
- **Forecast & Historical Trends**: Charts visualizing automated 6-hour risk forecasting and 24-hour historical progression.
- **Interactive Simulation Panel**: Test the model manually by adjusting rainfall amount and Brahmaputra river levels using real-time sliders.

---

## 🚀 Quick Start (Production Setup)

The fastest and safest way to run the entire stack (Database, ML API, and React UI) is via Docker.

**Prerequisites**: [Docker Desktop](https://www.docker.com/products/docker-desktop) must be installed.

1. Clone the repository and navigate to the root directory.
2. Run the master orchestrator tool:
   ```bash
   docker-compose up --build -d
   ```
3. Navigate to `http://localhost:5173` to see the live app.
   *(Backend API & Database are concurrently running at `http://localhost:8000`)*

---

## 🛠️ Developer Setup (Local Virtual Environment)

If you wish to modify the Machine Learning scripts or React frontend source, you can run them natively without Docker:

### 1. Backend (FastAPI & ML)
Navigate to the root directory and set up the Python environment:
```bash
python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

# Run the FastAPI server natively
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (React Dashboard)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
---

## 🌍 Deployment Guide

### Deploying the Backend (Render or Railway)
1. Commit the code to GitHub.
2. Ensure your `requirements.txt` is updated.
3. On **Render**: Create a new *Web Service*, connect your GitHub repo.
4. Set the Root Directory to `backend` (if you restructure) or run `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` as the Start Command.
5. On **Railway**: Use a `Procfile` or railway.json to point to the FastAPI uvicorn start command.

### Deploying the Frontend (Vercel or Netlify)
1. Change the API Base URL in `src/components/Dashboard.jsx` and `SimulationPanel.jsx` (currently `http://localhost:8000`) to your new deployed Backend URL.
2. Commit the changes to GitHub.
3. Log in to **Vercel/Netlify** and import your Git repository.
4. Set the Root Directory to `frontend`.
5. The Build Command should be automatically detected as `npm run build` and Output Directory as `dist`.
6. Click **Deploy**. Your Dashboard is now live!

---

*This project is designed as an MCA graduation and portfolio-ready piece demonstrating comprehensive system architecture, machine learning integration, and modern frontend design.*
