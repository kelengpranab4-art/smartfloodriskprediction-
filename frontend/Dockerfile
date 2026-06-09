# Stage 1: Build the React Application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files strictly first for Docker layer caching
COPY frontend/package*.json ./
RUN npm install

# Copy source code and build it
COPY frontend/ .
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine

# Copy the static dist folder to the Nginx html dir
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Add a custom Nginx conf here if React Router is used, 
# although our layout uses standard links so default is fine.

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
