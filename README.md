# ScrumFlow

A Scrum project management application with secure user authentication.

## Features

- User authentication with JWT
- Two-factor authentication
- Password security (min 12 chars, strength meter, etc.)
- Project management
- Scrum workflow

## Docker Setup (Recommended)

### Prerequisites

- Docker
- Docker Compose

### Running the Application

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ScrumFlow
   ```

2. Start the application using the provided script:
   ```
   ./docker-start.sh
   ```
   
   This script will:
   - Stop any existing containers
   - Remove dangling containers
   - Build and start the containers with docker-compose

   Alternatively, you can use docker-compose directly:
   ```
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api

### Development

- The Docker setup includes volume mounts, so changes to the code will be reflected in real-time.
- Backend changes will trigger the Django auto-reload.
- Frontend changes will trigger the React hot-reload.

### Stopping the Application

Press `Ctrl+C` in the terminal where docker-start.sh is running, or run:
```
docker-compose down
```

## Manual Setup (without Docker)

### Backend Setup

1. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```
   python manage.py migrate
   ```

4. Start the server:
   ```
   python manage.py runserver
   ```

### Frontend Setup

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

## API Documentation

API documentation is available at http://localhost:8000/api/swagger/ when the backend is running.