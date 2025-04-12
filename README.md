# ScrumFlow

A comprehensive web application for managing Scrum projects, built with Django (backend) and React (frontend).

## 📋 Overview

This application provides a complete solution for Scrum teams to manage their projects, sprints, user stories, and tasks. It supports the entire Scrum workflow from project creation to sprint retrospectives.

## ✨ Features

- User authentication with JWT
- Two-factor authentication
- Password security (min 12 chars, strength meter, etc.)
- Role-based access control (System Admin, Product Owner, Scrum Master, Developer)
- Project management
- Sprint planning and tracking
- User story management with acceptance criteria
- Task management and assignment
- Team communication tools

### User Management
- User registration and authentication
- Role-based access control
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

### Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ScrumFlow
   ```

2. **Start the application using the provided script**
   ```bash
   ./docker-start.sh
   ```
   
   This script will:
   - Stop any existing containers
   - Remove dangling containers
   - Build and start the containers with docker-compose

   Alternatively, you can use docker-compose directly:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - API documentation: http://localhost:8000/api/docs/

## 📝 Test Users and Data

The application is pre-populated with test data for easy exploration and testing of features.

### Test Users

| Username      | Password    | Role            | Description                                     |
|---------------|-------------|-----------------|-------------------------------------------------|
| admin         | admin123    | Admin           | System administrator with full access           |
| product_owner | password123 | Product Owner   | Product Owner in both projects                  |
| scrum_master  | password123 | Scrum Master    | Scrum Master in both projects                   |
| developer     | password123 | Developer       | Developer in Scrum Project 1                    |
| developer2    | password123 | Developer       | Developer in Scrum Project 1                    |
| developer3    | password123 | Developer       | Developer in Scrum Project 2                    |
| non_member    | password123 | Non-Member      | User not assigned to any project (for testing)  |

### Test Projects

Two projects are available for testing different permission scenarios:

1. **Scrum Project 1**
   - Contains a full development team (PO, SM, multiple developers)
   - Has multiple sprints (past, current, future)
   - Contains multiple user stories in various states 
   - Has detailed tasks with assignments and time tracking

2. **Scrum Project 2**
   - Different team composition for testing cross-project permissions
   - Contains a single active sprint with user stories

### Sprints

1. **Past Sprint** (Scrum Project 1)
   - Completed sprint with accepted user stories

2. **Current Sprint** (Scrum Project 1)
   - Active sprint with stories in various states:
     - Not Started: Story with unassigned tasks
     - In Progress: Story with assigned tasks and time logs
     - In Review: Story with completed tasks awaiting review
     - Accepted: Story with completed and accepted tasks

3. **Future Sprint** (Scrum Project 1)
   - Planned sprint with not started stories

4. **Active Sprint** (Scrum Project 2)
   - Contains multiple not started stories

### Testing Permission Features

The test data is specifically designed to test permission-related features:

1. **Cross-Project Permissions**: With users assigned to different projects, you can test that a user cannot access resources from a project they don't belong to.

2. **Role-Based Permissions**: 
   - Product Owners can create user stories and view all project data
   - Scrum Masters can manage sprints, create/delete tasks, and complete tasks
   - Developers can self-assign tasks, start/stop work on tasks, and complete assigned tasks

3. **Task State Transitions**:
   - Unassigned → Assigned (when a developer self-assigns)
   - Assigned → In Progress (when developer starts working)
   - In Progress → Assigned (when developer stops working)
   - Assigned/In Progress → Completed (when work is finished)

## 💻 Development

### Project Structure

```
ScrumFlow/
├── backend/                 # Django backend
│   ├── manage.py            # Django management script
│   ├── requirements.txt     # Python dependencies
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
│   │   ├── utils/           # Utility functions
│   │   ├── App.js           # Main application component
│   │   └── index.js         # Application entry point
│   ├── package.json         # Node.js dependencies
│   └── Dockerfile           # Frontend Docker configuration
│
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile.backend       # Backend Docker configuration
├── Dockerfile.frontend      # Frontend Docker configuration
├── docker-start.sh          # Docker startup script
└── start.sh                 # Application startup script
```

### Manual Setup (without Docker)

#### Backend Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Create test data:
   ```bash
   python manage.py create_initial_data
   ```

5. Start the server:
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

### Development

- The Docker setup includes volume mounts, so changes to the code will be reflected in real-time.
- Backend changes will trigger the Django auto-reload.
- Frontend changes will trigger the React hot-reload.

### Stopping the Application

Press `Ctrl+C` in the terminal where docker-start.sh is running, or run:
```bash
docker-compose down
```

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
   ```

### API Documentation

The API documentation is available at http://localhost:8000/api/swagger/ when the application is running. It provides detailed information about all available endpoints, request/response formats, and authentication requirements.

## 🔒 Security

The application implements several security measures:

- JWT-based authentication
- Two-factor authentication
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