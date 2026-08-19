#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "===> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "===> Collecting static files..."
python manage.py collectstatic --no-input

echo "===> Running database migrations..."
python manage.py migrate

echo "===> Cleaning production DB and ensuring superuser..."
python clean_production_db.py || true

echo "===> Build completed successfully!"
