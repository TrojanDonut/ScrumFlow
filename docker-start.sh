#!/bin/bash

# Get the compose file to use - default to regular docker-compose.yml for dev
COMPOSE_FILE=${1:-docker-compose.yml}
echo "Using compose file: $COMPOSE_FILE"

# Stop any existing containers
echo "Stopping any existing containers..."
docker compose -f $COMPOSE_FILE down

# Remove any dangling containers
echo "Removing any dangling containers..."
docker container prune -f

# Build and start the containers
echo "Building and starting containers..."
if [ "$2" = "--detach" ] || [ "$2" = "-d" ]; then
    docker compose -f $COMPOSE_FILE up --build -d
    echo "Containers started in detached mode."
else
    docker compose -f $COMPOSE_FILE up --build
    # This script will be terminated when docker-compose is stopped with Ctrl+C
fi 