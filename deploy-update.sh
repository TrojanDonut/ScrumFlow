#!/bin/bash
set -e

# Define variables
REMOTE_USER="root"
REMOTE_HOST="119.12.135.127"
SSH_KEY="/home/mknzsikey/id_ed"
REMOTE_DIR="/opt/scrumflow"
GIT_REPO="https://github.com/TrojanDonut/ScrumFlow.git"  # Updated to your actual repo
GIT_BRANCH="${1:-main}"  # Use first argument as branch name, default to main

# Ensure SSH key has the right permissions
chmod 600 $SSH_KEY

# Connect to the remote server and update the project
echo "Updating project on the remote server with branch: $GIT_BRANCH..."
ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST << EOF
  cd $REMOTE_DIR
  
  # Check if .git directory exists
  if [ ! -d ".git" ]; then
    # Initialize git and add remote if not already a git repo
    git init
    git remote add origin $GIT_REPO
  fi
  
  # Fetch latest changes
  git fetch --all
  
  # Backup any local changes (if needed)
  git stash
  
  # Checkout the specified branch
  git checkout $GIT_BRANCH
  
  # Pull the latest changes
  git pull origin $GIT_BRANCH
  
  # Make scripts executable
  chmod +x docker-start.sh
  
  # Restart the containers using the enhanced script
  ./docker-start.sh docker-compose.prod.yml --detach
  
  echo "Update completed successfully!"
EOF

echo "Update script finished." 