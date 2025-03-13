#!/bin/bash

echo "Stopping any existing Django servers..."
pkill -f "python manage.py runserver" || true

echo "Stopping any existing npm processes..."
pkill -f "npm start" || true

echo "Building and starting Docker containers..."
docker-compose up --build

# This script will be terminated when docker-compose is stopped with Ctrl+C 