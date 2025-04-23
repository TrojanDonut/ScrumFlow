# ScrumFlow User Instructions

## Table of Contents
1. [Getting Started](#getting-started)
2. [System Roles and Permissions](#system-roles-and-permissions)
3. [User Management](#user-management)
4. [Project Management](#project-management)
5. [Sprint Management](#sprint-management)
6. [User Story Management](#user-story-management)
7. [Task Management](#task-management)
8. [Time Tracking](#time-tracking)
9. [Project Wall](#project-wall)
10. [Reports and Views](#reports-and-views)
11. [Common Tasks](#common-tasks)
12. [Limitations and Restrictions](#limitations-and-restrictions)
13. [Adding Screenshots](#adding-screenshots)

## Getting Started

ScrumFlow is a Scrum project management application that helps teams organize and track their work using Scrum methodology. Your experience with the application will vary based on your assigned role.

![Application Overview](images/application_overview.png)

*Note: To add this image, save a screenshot of the dashboard to an "images" folder in the project root directory.*

## System Roles and Permissions

### System Administrator
- Can create, edit, and delete user accounts
- Can assign system roles to users
- Can manage all aspects of the system
- Has access to all features
- Can create and manage projects
- Can access user management directly from the dashboard

### Product Owner
- Can create and edit user stories
- Can approve/reject completed user stories
- Can add comments to stories
- Can view all project data
- Can post on the project wall
- Manages the product backlog and priorities

### Scrum Master
- Can create and manage sprints
- Can assign stories to sprints
- Can manage tasks
- Can view all project data
- Can post on the project wall
- Facilitates the Scrum process
- Can manage team members in projects

### Development Team Member
- Can view assigned tasks
- Can accept/reject tasks
- Can track time on tasks
- Can mark tasks as complete
- Can add comments to stories
- Can post on the project wall
- Works on tasks and participates in sprints

## User Management

### Creating a New User (System Administrator)
1. Navigate to User Management section
2. Click "Add New User"
3. Fill in required information:
   - Username (must be unique)
   - Password (12-128 characters)
   - First Name
   - Last Name
   - Email
   - System Role
4. Click "Create User"

![User Creation](images/user_creation.png)

### Managing User Accounts
- System administrators can:
  - Edit user details
  - Change user roles
  - Reset passwords
  - Delete user accounts
- Users can:
  - Change their own password
  - Update their personal information
  - View their account details
  - Set up two-factor authentication

### User Profile Management
1. Click on your username in the navigation bar
2. Access your profile to:
   - View your username, email, and role
   - Change your password
   - Set up two-factor authentication
   - View your activity history

![User Profile](images/user_profile.png)

## Project Management

### Creating a New Project (System Administrator)
1. Navigate to Projects section
2. Click "Create Project"
3. Fill in project details:
   - Project Name
   - Description
   - Start Date
4. Assign team members and their roles
5. Click "Create Project"

![Project Creation](images/project_creation.png)

### Managing Projects
- System administrators and Scrum Masters can:
  - Add/remove team members
  - Change team member roles
  - Update project details
  - Archive projects
  - View project overview
  - Create and manage sprints

### Project Details
The Project Details page provides comprehensive information about a project:
- Project Overview: View project name, description, and creation date
- Team Members: See a list of members assigned to the project and their roles
- Manage Team Members: Add or remove team members (if you have appropriate permissions)
- Create Sprint: Create a new sprint by specifying start date, end date, and velocity
- View Sprints: See a list of existing sprints for the project

![Project Details](images/project_details.png)

## Sprint Management

### Creating a New Sprint (Scrum Master)
1. Navigate to Project Details
2. Scroll to "Create a New Sprint" section
3. Enter sprint details:
   - Start Date (must be in future)
   - End Date (must be after start date)
   - Expected Velocity
4. Click "Create Sprint"

![Sprint Creation](images/sprint_creation.png)

### Managing Sprints
- Scrum Masters can:
  - Edit sprint details (before sprint starts)
  - Delete sprints (before they start)
  - Add stories to sprints
  - View sprint progress
  - Manage sprint backlog

### Sprint Limitations and Rules
- **Start Date**: Must be in the future
- **End Date**: Must be after the start date
- **Sprint Overlap**: Sprints in the same project cannot overlap
- **Weekend Dates**: Start dates cannot fall on weekends
- **Velocity**: Must be a positive number between 1 and 100
- **Editing Restrictions**:
  - You cannot modify a sprint after it has started
  - You cannot delete a sprint after it has started
  - For active sprints, only velocity can be updated
- **Status Changes**: Sprint status transitions automatically based on dates

## User Story Management

### Creating a User Story (Product Owner/Scrum Master)
1. Navigate to Product Backlog
2. Click "Add New Story"
3. Enter story details:
   - Title
   - Description
   - Acceptance Criteria
   - Priority (Must Have, Should Have, Could Have, Won't Have)
   - Business Value
4. Click "Create Story"

![Story Creation](images/story_creation.png)

### Managing User Stories
- Product Owners and Scrum Masters can:
  - Edit story details
  - Delete stories (if not in active sprint)
  - Add acceptance criteria
  - Change story priority
  - Move stories between sprints
- Team members can:
  - Add comments to stories
  - View story details
  - View acceptance criteria

### User Story Limitations and Rules
- **Name/Title**: Must be unique within a project and sprint
- **Business Value**: Must be a positive number
- **Story Status Flow**:
  - New stories start as "Not Started"
  - Can be moved to "In Progress" when work begins
  - Can be marked as "Done" when completed
  - Can be "Accepted" or "Rejected" by Product Owner
- **Editing Restrictions**:
  - Stories in active sprints have limited editing capabilities
  - Completed stories cannot be moved back to previous states
  - Only Product Owners can accept/reject stories

## Task Management

### Creating Tasks (Scrum Master/Team Members)
1. Navigate to Sprint Backlog
2. Select a user story
3. Click "Add Task"
4. Enter task details:
   - Description
   - Time Estimate (in hours)
   - Optional: Assign to team member
5. Click "Create Task"

![Task Creation](images/task_creation.png)

### Managing Tasks
- Team members can:
  - Accept/reject assigned tasks
  - Mark tasks as complete
  - Update task status
  - Add comments
  - Track time on tasks
- Scrum Masters can:
  - Create new tasks
  - Edit task details
  - Delete tasks
  - Reassign tasks
  - View task progress

### Task Limitations and Rules
- **Task Status Flow**:
  - New tasks start as "Unassigned"
  - When assigned to a team member, status changes to "Assigned"
  - Team members can start work, changing status to "In Progress"
  - Completed tasks are marked as "Completed"
- **Time Tracking**:
  - Initial estimate must be provided when creating a task
  - Remaining hours are set to estimated hours by default
  - Only the assigned team member can track time on a task
  - Completed tasks cannot be worked on further
- **Assignment Rules**:
  - Tasks can only be assigned to development team members
  - Only assigned members can start/stop work on a task
  - Unassigned tasks cannot be started

## Time Tracking

### Recording Time (Team Members)
1. Navigate to your active tasks
2. Click "Start Work" on a task
3. System automatically tracks time
4. Click "Stop Work" when finished
5. Time is automatically recorded

![Time Tracking](images/time_tracking.png)

### Managing Time Records
- Team members can:
  - View their time records
  - Edit time entries for current day
  - Update time estimates
  - View time spent on tasks
- Scrum Masters can:
  - View all team time records
  - Generate time reports
  - Track team velocity

### Time Tracking Limitations
- Can only track time on assigned tasks
- Cannot track time on completed tasks
- Multiple active time sessions are not allowed
- Time entries cannot be backdated or set for future dates
- Can only edit time entries for the current day

## Project Wall

### Posting Updates (All Users)
1. Navigate to Project Wall
2. Click "New Post"
3. Enter your message
4. Click "Post"

![Project Wall](images/project_wall.png)

### Managing Posts
- All users can:
  - Create new posts
  - Comment on posts
  - View all posts
  - React to posts
- Scrum Masters can:
  - Delete posts
  - Delete comments
  - Pin important posts

## Reports and Views

### Product Backlog View
- Shows all user stories
- Organized by:
  - Completed stories
  - Active sprint stories
  - Backlog stories
- Filterable by priority and status
- Sortable by various criteria

![Product Backlog](images/product_backlog.png)

### Sprint Backlog View
- Shows current sprint tasks
- Organized by:
  - Not assigned
  - Assigned
  - In progress
  - Completed
- Shows time estimates and actual time
- Displays task progress

![Sprint Backlog](images/sprint_backlog.png)

## Common Tasks

### How to Create a Project
1. Navigate to the Projects page
2. Click the "Create Project" button (System Admin only)
3. Fill in the project name and description
4. Click "Create" to save the project
5. After creation, you can add team members to the project

### How to Create a Sprint
1. Navigate to the specific project's detail page
2. Scroll down to the "Create a New Sprint" section
3. Enter the sprint start date, end date, and velocity (points)
4. Click "Create Sprint" to save
5. The new sprint will appear in the "Existing Sprints" section

### How to Manage Team Members
1. Navigate to the specific project's detail page
2. Click the "Manage Team Members" button under the Team Members section
3. Add new members by selecting users and assigning roles
4. Remove existing members as needed
5. Save your changes

### How to Change Your Password
1. Click on your username in the navigation bar
2. Select "Change Password" from the dropdown menu
3. Enter your current password and your new password
4. Confirm your new password
5. Click "Change Password" to save

### How to Set Up Two-Factor Authentication
1. Click on your username in the navigation bar
2. Select "Two-Factor Setup" from the dropdown menu
3. Scan the QR code with your authentication app (like Google Authenticator)
4. Enter the verification code from your app
5. Save your backup codes in a secure location

## Limitations and Restrictions

### General System Limitations
- Each user can have only one role in the system
- Two-factor authentication cannot be disabled once enabled
- All times are stored and displayed in UTC timezone
- Session timeout after 30 minutes of inactivity

### Project Limitations
- A user can be a member of multiple projects
- A user can have different roles in different projects
- Project names must be unique within the system
- Projects cannot be deleted, only archived

### Sprint Limitations
- A sprint must be at least 1 day long
- A sprint cannot be longer than 4 weeks (28 days)
- Sprints cannot overlap within the same project
- Sprint start date must be in the future
- Sprint start date cannot be on a weekend
- Sprints cannot be modified after they start
- Sprints cannot be deleted after they start

### User Story Limitations
- Story names must be unique within a project
- Business value must be a positive number
- Stories in active sprints have limited editing options
- Stories cannot be deleted from active sprints
- Completed stories cannot be moved back to previous states

### Task Limitations
- Tasks must be part of a user story
- Time estimate must be provided
- Only assigned developer can work on a task
- Cannot work on multiple tasks simultaneously
- Completed tasks cannot be reopened
- Task status changes follow strict workflow

## Adding Screenshots

To add screenshots to this documentation:

1. Create an "images" folder in the project root directory if it doesn't exist
2. Take screenshots of the relevant screens (use browser's Developer Tools to set responsive dimensions)
3. Name screenshots descriptively (e.g., "project_creation.png")
4. Save screenshots in the "images" folder
5. Reference the images in this markdown file using the syntax:
   ```
   ![Alt Text](images/filename.png)
   ```
6. Make sure the images are clear and highlight the important UI elements

### Recommended Screenshot Dimensions
- Desktop: 1366 x 768 pixels
- Mobile: 375 x 667 pixels (iPhone 8)
- Tablet: 768 x 1024 pixels (iPad)

### Screenshot Tips
- Highlight important UI elements or buttons
- Remove any sensitive information
- Ensure text is legible
- Use consistent sizing across screenshots
- Include annotations for complex screenshots 