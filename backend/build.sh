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

echo "===> Ensuring initial admin superuser exists..."
python create_admin.py || true

echo "===> Build completed successfully!"
