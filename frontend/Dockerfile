# Stage 1: Build the React Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files strictly first for Docker layer caching
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code and build it
COPY frontend/ .

# VITE_API_URL is a build-time arg passed from render.yaml
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine

# Copy the static dist folder to the Nginx html dir
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config for single-page app (handles client-side routing)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
