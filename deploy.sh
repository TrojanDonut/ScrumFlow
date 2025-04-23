#!/bin/bash
set -e

# Define variables
REMOTE_USER="root"
REMOTE_HOST="119.12.135.127"
SSH_KEY="/home/mknzsikey/id_ed"
REMOTE_DIR="/opt/scrumflow"

# Ensure SSH key has the right permissions
chmod 600 $SSH_KEY

# Copy project files to the remote server
echo "Copying project files to the remote server..."
rsync -avz --exclude 'venv' --exclude '.git' --exclude 'node_modules' \
  --exclude '.cursor' -e "ssh -i $SSH_KEY" \
  ./ $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR

# Connect to the remote server and set up the project
echo "Setting up the project on the remote server..."
ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST << EOF
  # Create a random secret key
  SECRET_KEY=\$(openssl rand -base64 32)
  
  # Navigate to project directory
  cd $REMOTE_DIR
  
  # Make the script executable
  chmod +x docker-start.sh
  
  # Start the containers with the production configuration using the enhanced script
  SECRET_KEY="\$SECRET_KEY" ./docker-start.sh docker-compose.prod.yml --detach
  
  echo "Deployment completed successfully!"
EOF

echo "Deployment script finished." 