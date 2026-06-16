# Stage 1: Build the React Frontend
FROM node:18-slim AS frontend-build
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend and build it
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the FastAPI Backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and model files
# Note: These paths assume the docker context is the project root
COPY backend/ ./backend/
COPY model/ ./model/

# Copy the build output from Stage 1 to the location the backend expects
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Set working directory to backend so gunicorn/uvicorn can find main:app
WORKDIR /app/backend

EXPOSE 8000

# Production command using gunicorn with uvicorn workers
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8000"]
