FROM python:3.11-slim

WORKDIR /app

# Upgrade pip and install standard dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from project root
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# The backend relies on relative paths to access the ML Model (../model/...)
# so we copy both the backend folder and the model folder into the container
COPY backend/ ./backend/
COPY model/ ./model/

# Set working directory to backend so uvicorn can find main:app locally
WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
