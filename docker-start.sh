#!/bin/bash

# Stop any existing containers
echo "Stopping any existing containers..."
docker compose down

# Remove any dangling containers
echo "Removing any dangling containers..."
docker container prune -f

# Build and start the containers
echo "Building and starting containers..."
docker compose up --build

# This script will be terminated when docker-compose is stopped with Ctrl+C 