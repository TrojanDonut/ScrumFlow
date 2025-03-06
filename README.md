# Scrum Workflow Application

A comprehensive web application for managing Scrum projects, built with Django (backend) and React (frontend).

## 📋 Overview

This application provides a complete solution for Scrum teams to manage their projects, sprints, user stories, and tasks. It supports the entire Scrum workflow from project creation to sprint retrospectives.

## ✨ Features

### User Management
- User registration and authentication
- Role-based access control (System Admin, Product Owner, Scrum Master, Developer)
- User profile management

### Project Management
- Create and manage multiple projects
- Assign team members with specific roles
- Project dashboard with key metrics
- Project documentation management

### Sprint Management
- Sprint planning and creation
- Sprint backlog management
- Active sprint tracking
- Sprint review and retrospective tools
- Burndown charts and velocity tracking

### User Story Management
- Product backlog management
- User story creation with acceptance criteria
- Story point estimation with Planning Poker
- Prioritization tools (MoSCoW method)

### Task Management
- Break down user stories into tasks
- Task assignment and status tracking
- Time logging and remaining work updates
- Task board with customizable columns

### Communication
- Project wall for team communication
- Comments on user stories and tasks
- @mentions and notifications
- File sharing and attachments

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)
- [Git](https://git-scm.com/downloads) (version 2.30+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/scrum-workflow-app.git
   cd scrum-workflow-app
   ```

2. **Build and start the Docker containers**
   ```bash
   # Build the Docker images
   docker-compose build
   
   # Start the containers in detached mode
   docker-compose up -d
   ```

3. **Set up the database**
   ```bash
   # Apply database migrations
   docker-compose exec backend python manage.py migrate
   
   # Create initial test data (users and sample project)
   docker-compose exec backend python manage.py create_initial_data
   ```

4. **Access the application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000/api](http://localhost:8000/api)
   - API documentation: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
   - Admin interface: [http://localhost:8000/admin](http://localhost:8000/admin)

### Troubleshooting

If you encounter any issues during setup:

1. **Check container logs**
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Restart the containers**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Reset the database** (if you have migration issues)
   ```bash
   docker-compose down
   docker-compose run --rm backend rm -f db.sqlite3
   docker-compose up -d
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py create_initial_data
   ```

### Default Users

The application comes with pre-configured users for testing:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | System Administrator |
| product_owner | password123 | Product Owner |
| scrum_master | password123 | Scrum Master |
| developer | password123 | Developer |


## 💻 Development

### Project Structure

```
scrum-app/
├── backend/                 # Django backend
│   ├── manage.py            # Django management script
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Backend Docker configuration
│   ├── scrum_project/       # Main Django project
│   ├── users/               # User management app
│   ├── projects/            # Project management app
│   ├── sprints/             # Sprint management app
│   ├── stories/             # User story management app
│   └── tasks/               # Task management app
│
├── frontend/                # React frontend
│   ├── public/              # Static files
│   ├── src/                 # React source code
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store configuration
│   │   │   └── slices/      # Redux slices for state management
│   │   ├── App.js           # Main application component
│   │   └── index.js         # Application entry point
│   ├── package.json         # Node.js dependencies
│   └── Dockerfile           # Frontend Docker configuration
│
└── docker-compose.yml       # Docker Compose configuration
```

### Backend Architecture

The backend is built with Django and Django REST Framework, following a modular approach with separate apps for different domains:

- **users**: Handles user authentication, authorization, and profile management
- **projects**: Manages projects, team members, and project documentation
- **sprints**: Handles sprint planning, tracking, and retrospectives
- **stories**: Manages user stories, acceptance criteria, and estimation
- **tasks**: Handles task creation, assignment, and time tracking

### Frontend Architecture

The frontend is built with React and Redux, using a component-based architecture:

- **components**: Reusable UI components
- **pages**: Page-level components
- **store**: Redux store with slices for different data domains
- **services**: API service functions for backend communication

### API Documentation

The API documentation is available at [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) when the application is running. It provides detailed information about all available endpoints, request/response formats, and authentication requirements.

### Running Tests

To run the backend tests:

```bash
# Run all tests
docker-compose exec backend python manage.py test

# Run tests for a specific app
docker-compose exec backend python manage.py test users
```

To run the frontend tests:

```bash
docker-compose exec frontend npm test
```

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Backend: Modify Django code in the `backend/` directory
   - Frontend: Modify React code in the `frontend/` directory

3. **Test your changes**:
   - Run the tests as described above
   - Manually test the feature in the browser

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

5. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a pull request** for code review

## 🔒 Security

The application implements several security measures:

- JWT-based authentication
- Password validation with minimum length and complexity requirements
- CSRF protection
- Role-based access control
- Input validation and sanitization

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request