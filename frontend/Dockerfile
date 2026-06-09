# Stage 1: Build the React Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY frontend/package.json frontend/package-lock.json* ./

# Install deps - use legacy peer deps for React 19 compat
RUN npm install --legacy-peer-deps

# Copy all frontend source
COPY frontend/ .

# VITE_API_URL is set as build-time env var from Render
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Build the Vite app
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine

# Copy nginx SPA config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
