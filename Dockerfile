# Production Dockerfile for Django Backend on Render
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install --no-cache-dir -r /app/requirements.txt

# Copy backend application code
COPY backend/ /app/

# Make build script executable and collect static / run migrations setup
RUN chmod +x /app/build.sh

EXPOSE 10000

CMD ["daphne", "-b", "0.0.0.0", "-p", "10000", "tracking_core.asgi:application"]
