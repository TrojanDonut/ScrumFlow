import React from 'react';
import { Card, Accordion, Alert, ListGroup } from 'react-bootstrap';
import { useSelector } from 'react-redux';

const Instructions = () => {
  const { user } = useSelector(state => state.auth);
  
  return (
    <div className="container py-4">
      <h1 className="mb-4">ScrumFlow - User Instructions</h1>
      
      <Alert variant="info">
        This guide provides comprehensive instructions on how to use the ScrumFlow application based on your role.
      </Alert>

      <Accordion className="mb-4">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Getting Started</Accordion.Header>
          <Accordion.Body>
            <p>ScrumFlow is a Scrum project management application that helps teams organize and track their work using Scrum methodology. Your experience with the application will vary based on your assigned role.</p>
            
            <div className="text-center my-4">
              <img 
                src="/images/overview.png" 
                alt="Application Overview" 
                className="img-fluid border rounded" 
                style={{ maxWidth: '100%', maxHeight: '500px' }} 
              />
            </div>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="1">
          <Accordion.Header>System Roles and Permissions</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>System Administrator</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>Can create, edit, and delete user accounts</ListGroup.Item>
                  <ListGroup.Item>Can assign system roles to users</ListGroup.Item>
                  <ListGroup.Item>Can manage all aspects of the system</ListGroup.Item>
                  <ListGroup.Item>Has access to all features</ListGroup.Item>
                  <ListGroup.Item>Can create and manage projects</ListGroup.Item>
                  <ListGroup.Item>Can access user management directly from the dashboard</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>Product Owner</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>Can create and edit user stories</ListGroup.Item>
                  <ListGroup.Item>Can approve/reject completed user stories</ListGroup.Item>
                  <ListGroup.Item>Can add comments to stories</ListGroup.Item>
                  <ListGroup.Item>Can view all project data</ListGroup.Item>
                  <ListGroup.Item>Can post on the project wall</ListGroup.Item>
                  <ListGroup.Item>Manages the product backlog and priorities</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>Scrum Master</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>Can create and manage sprints</ListGroup.Item>
                  <ListGroup.Item>Can assign stories to sprints</ListGroup.Item>
                  <ListGroup.Item>Can manage tasks</ListGroup.Item>
                  <ListGroup.Item>Can view all project data</ListGroup.Item>
                  <ListGroup.Item>Can post on the project wall</ListGroup.Item>
                  <ListGroup.Item>Facilitates the Scrum process</ListGroup.Item>
                  <ListGroup.Item>Can manage team members in projects</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>Development Team Member</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>Can view assigned tasks</ListGroup.Item>
                  <ListGroup.Item>Can accept/reject tasks</ListGroup.Item>
                  <ListGroup.Item>Can track time on tasks</ListGroup.Item>
                  <ListGroup.Item>Can mark tasks as complete</ListGroup.Item>
                  <ListGroup.Item>Can add comments to stories</ListGroup.Item>
                  <ListGroup.Item>Can post on the project wall</ListGroup.Item>
                  <ListGroup.Item>Works on tasks and participates in sprints</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="2">
          <Accordion.Header>User Management</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>Creating a New User (System Administrator)</Card.Header>
              <Card.Body>
                <ol>
                  <li>Navigate to User Management section</li>
                  <li>Click "Add New User"</li>
                  <li>Fill in required information:
                    <ul>
                      <li>Username (must be unique)</li>
                      <li>Password (12-128 characters)</li>
                      <li>First Name</li>
                      <li>Last Name</li>
                      <li>Email</li>
                      <li>System Role</li>
                    </ul>
                  </li>
                  <li>Click "Create User"</li>
                </ol>
                
                {/* Image placeholder for user creation */}
                <div className="text-center my-4">
                  <img 
                    src="/images/user creation.png" 
                    alt="User Creation Form" 
                    className="img-fluid border rounded" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                  />
                </div>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>User Profile Management</Card.Header>
              <Card.Body>
                <ol>
                  <li>Click on your username in the navigation bar</li>
                  <li>Access your profile to:
                    <ul>
                      <li>View your username, email, and role</li>
                      <li>Change your password</li>
                      <li>Set up two-factor authentication</li>
                      <li>View your activity history</li>
                    </ul>
                  </li>
                </ol>
                
                {/* Image placeholder for user profile */}
                <div className="text-center my-4">
                  <img 
                    src="/images/user profile.png" 
                    alt="User Profile" 
                    className="img-fluid border rounded" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                  />
                </div>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="3">
          <Accordion.Header>Project Management</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>Creating a New Project</Card.Header>
              <Card.Body>
                <ol>
                  <li>Navigate to Projects section</li>
                  <li>Click "Create Project"</li>
                  <li>Fill in project details:
                    <ul>
                      <li>Project Name</li>
                      <li>Description</li>
                      <li>Start Date</li>
                    </ul>
                  </li>
                  <li>Assign team members and their roles</li>
                  <li>Click "Create Project"</li>
                </ol>
                
                {/* Image placeholder for project creation */}
                <div className="text-center my-4">
                  <img 
                    src="/images/project creation.png" 
                    alt="Project Creation Form" 
                    className="img-fluid border rounded" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                  />
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>Project Details</Card.Header>
              <Card.Body>
                <p>The Project Details page provides comprehensive information about a project:</p>
                <ListGroup variant="flush">
                  <ListGroup.Item>Project Overview: View project name, description, and creation date</ListGroup.Item>
                  <ListGroup.Item>Team Members: See a list of members assigned to the project and their roles</ListGroup.Item>
                  <ListGroup.Item>Manage Team Members: Add or remove team members (if you have appropriate permissions)</ListGroup.Item>
                  <ListGroup.Item>Create Sprint: Create a new sprint by specifying start date, end date, and velocity</ListGroup.Item>
                  <ListGroup.Item>View Sprints: See a list of existing sprints for the project</ListGroup.Item>
                </ListGroup>
                
                {/* Image placeholder for project details */}
                <div className="text-center my-4">
                  <img 
                    src="/images/project detail.png" 
                    alt="Project Details" 
                    className="img-fluid border rounded" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                  />
                </div>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="4">
          <Accordion.Header>Sprint Management</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>Creating a New Sprint</Card.Header>
              <Card.Body>
                <ol>
                  <li>Navigate to Project Details</li>
                  <li>Scroll to "Create a New Sprint" section</li>
                  <li>Enter sprint details:
                    <ul>
                      <li>Start Date (must be in future)</li>
                      <li>End Date (must be after start date)</li>
                      <li>Expected Velocity</li>
                    </ul>
                  </li>
                  <li>Click "Create Sprint"</li>
                </ol>
                
                {/* Image placeholder for sprint creation */}
                <div className="text-center my-4">
                  <img 
                    src="/images/sprint creation.png" 
                    alt="Sprint Creation Form" 
                    className="img-fluid border rounded" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                  />
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>Sprint Limitations and Rules</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item><strong>Start Date:</strong> Must be in the future</ListGroup.Item>
                  <ListGroup.Item><strong>End Date:</strong> Must be after the start date</ListGroup.Item>
                  <ListGroup.Item><strong>Sprint Overlap:</strong> Sprints in the same project cannot overlap</ListGroup.Item>
                  <ListGroup.Item><strong>Weekend Dates:</strong> Start dates cannot fall on weekends</ListGroup.Item>
                  <ListGroup.Item><strong>Velocity:</strong> Must be a positive number between 1 and 100</ListGroup.Item>
                  <ListGroup.Item><strong>Editing Restrictions:</strong>
                    <ul>
                      <li>You cannot modify a sprint after it has started</li>
                      <li>You cannot delete a sprint after it has started</li>
                      <li>For active sprints, only velocity can be updated</li>
                    </ul>
                  </ListGroup.Item>
                  <ListGroup.Item><strong>Status Changes:</strong> Sprint status transitions automatically based on dates</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="5">
          <Accordion.Header>User Story Management</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>Creating a User Story</Card.Header>
              <Card.Body>
                <ol>
                  <li>Navigate to Product Backlog</li>
                  <li>Click "Add New Story"</li>
                  <li>Enter story details:
                    <ul>
                      <li>Title</li>
                      <li>Description</li>
                      <li>Acceptance Criteria</li>
                      <li>Priority (Must Have, Should Have, Could Have, Won't Have)</li>
                      <li>Business Value</li>
                    </ul>
                  </li>
                  <li>Click "Create Story"</li>
                </ol>
                
                {/* Image placeholder for story creation */}
                <div className="text-center my-4">
                  <img 
                    src="/images/story creation.png" 
                    alt="Story Creation Form" 
                    className="img-fluid border rounded" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                  />
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>User Story Limitations and Rules</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item><strong>Name/Title:</strong> Must be unique within a project and sprint</ListGroup.Item>
                  <ListGroup.Item><strong>Business Value:</strong> Must be a positive number</ListGroup.Item>
                  <ListGroup.Item><strong>Story Status Flow:</strong>
                    <ul>
                      <li>New stories start as "Not Started"</li>
                      <li>Can be moved to "In Progress" when work begins</li>
                      <li>Can be marked as "Done" when completed</li>
                      <li>Can be "Accepted" or "Rejected" by Product Owner</li>
                    </ul>
                  </ListGroup.Item>
                  <ListGroup.Item><strong>Editing Restrictions:</strong>
                    <ul>
                      <li>Stories in active sprints have limited editing capabilities</li>
                      <li>Completed stories cannot be moved back to previous states</li>
                      <li>Only Product Owners can accept/reject stories</li>
                    </ul>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="6">
          <Accordion.Header>Task Management</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>Creating Tasks</Card.Header>
              <Card.Body>
                <ol>
                  <li>Navigate to Sprint Backlog</li>
                  <li>Select a user story</li>
                  <li>Click "Add Task"</li>
                  <li>Enter task details:
                    <ul>
                      <li>Description</li>
                      <li>Time Estimate (in hours)</li>
                      <li>Optional: Assign to team member</li>
                    </ul>
                  </li>
                  <li>Click "Create Task"</li>
                </ol>
                
                {/* Image placeholder for task creation */}
                <div className="text-center my-4">
                  <img 
                    src="/images/task creation.png" 
                    alt="Task Creation Form" 
                    className="img-fluid border rounded" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                  />
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>Task Limitations and Rules</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item><strong>Task Status Flow:</strong>
                    <ul>
                      <li>New tasks start as "Unassigned"</li>
                      <li>When assigned to a team member, status changes to "Assigned"</li>
                      <li>Team members can start work, changing status to "In Progress"</li>
                      <li>Completed tasks are marked as "Completed"</li>
                    </ul>
                  </ListGroup.Item>
                  <ListGroup.Item><strong>Time Tracking:</strong>
                    <ul>
                      <li>Initial estimate must be provided when creating a task</li>
                      <li>Remaining hours are set to estimated hours by default</li>
                      <li>Only the assigned team member can track time on a task</li>
                      <li>Completed tasks cannot be worked on further</li>
                    </ul>
                  </ListGroup.Item>
                  <ListGroup.Item><strong>Assignment Rules:</strong>
                    <ul>
                      <li>Tasks can only be assigned to development team members</li>
                      <li>Only assigned members can start/stop work on a task</li>
                      <li>Unassigned tasks cannot be started</li>
                    </ul>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="7">
          <Accordion.Header>Time Tracking</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>Recording Time</Card.Header>
              <Card.Body>
                <ol>
                  <li>Navigate to your active tasks</li>
                  <li>Click "Start Work" on a task</li>
                  <li>System automatically tracks time</li>
                  <li>Click "Stop Work" when finished</li>
                  <li>Time is automatically recorded</li>
                </ol>
                
                {/* Image placeholder for time tracking */}
                <div className="text-center my-4">
                  <img 
                    src="/images/time tracking.png" 
                    alt="Time Tracking Interface" 
                    className="img-fluid border rounded" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                  />
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>Time Tracking Limitations</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>Can only track time on assigned tasks</ListGroup.Item>
                  <ListGroup.Item>Cannot track time on completed tasks</ListGroup.Item>
                  <ListGroup.Item>Multiple active time sessions are not allowed</ListGroup.Item>
                  <ListGroup.Item>Time entries cannot be backdated or set for future dates</ListGroup.Item>
                  <ListGroup.Item>Can only edit time entries for the current day</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="8">
          <Accordion.Header>Project Wall</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>Posting Updates</Card.Header>
              <Card.Body>
                <ol>
                  <li>Navigate to Project Wall</li>
                  <li>Click "New Post"</li>
                  <li>Enter your message</li>
                  <li>Click "Post"</li>
                </ol>
                
                {/* Image placeholder for project wall */}
                <div className="text-center my-4">
                  <img 
                    src="/images/project wall.png" 
                    alt="Project Wall" 
                    className="img-fluid border rounded" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                  />
                </div>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="9">
          <Accordion.Header>Reports and Views</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>Product Backlog View</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>Shows all user stories</ListGroup.Item>
                  <ListGroup.Item>Organized by:
                    <ul>
                      <li>Completed stories</li>
                      <li>Active sprint stories</li>
                      <li>Backlog stories</li>
                    </ul>
                  </ListGroup.Item>
                  <ListGroup.Item>Filterable by priority and status</ListGroup.Item>
                  <ListGroup.Item>Sortable by various criteria</ListGroup.Item>
                </ListGroup>
                
                {/* Image placeholder for product backlog */}
                <div className="text-center my-4">
                  <img 
                    src="/images/product backlog.png" 
                    alt="Product Backlog View" 
                    className="img-fluid border rounded" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                  />
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>Sprint Backlog View</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>Shows current sprint tasks</ListGroup.Item>
                  <ListGroup.Item>Organized by:
                    <ul>
                      <li>Not assigned</li>
                      <li>Assigned</li>
                      <li>In progress</li>
                      <li>Completed</li>
                    </ul>
                  </ListGroup.Item>
                  <ListGroup.Item>Shows time estimates and actual time</ListGroup.Item>
                  <ListGroup.Item>Displays task progress</ListGroup.Item>
                </ListGroup>
                
                {/* Image placeholder for sprint backlog */}
                <div className="text-center my-4">
                  <img 
                    src="/images/sprint backlog.png" 
                    alt="Sprint Backlog View" 
                    className="img-fluid border rounded" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                  />
                </div>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="10">
          <Accordion.Header>Common Tasks</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>How to Create a Project</Card.Header>
              <Card.Body>
                <ol>
                  <li>Navigate to the Projects page</li>
                  <li>Click the "Create Project" button (System Admin only)</li>
                  <li>Fill in the project name and description</li>
                  <li>Click "Create" to save the project</li>
                  <li>After creation, you can add team members to the project</li>
                </ol>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>How to Create a Sprint</Card.Header>
              <Card.Body>
                <ol>
                  <li>Navigate to the specific project's detail page</li>
                  <li>Scroll down to the "Create a New Sprint" section</li>
                  <li>Enter the sprint start date, end date, and velocity (points)</li>
                  <li>Click "Create Sprint" to save</li>
                  <li>The new sprint will appear in the "Existing Sprints" section</li>
                </ol>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>How to Manage Team Members</Card.Header>
              <Card.Body>
                <ol>
                  <li>Navigate to the specific project's detail page</li>
                  <li>Click the "Manage Team Members" button under the Team Members section</li>
                  <li>Add new members by selecting users and assigning roles</li>
                  <li>Remove existing members as needed</li>
                  <li>Save your changes</li>
                </ol>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>How to Change Your Password</Card.Header>
              <Card.Body>
                <ol>
                  <li>Click on your username in the navigation bar</li>
                  <li>Select "Change Password" from the dropdown menu</li>
                  <li>Enter your current password and your new password</li>
                  <li>Confirm your new password</li>
                  <li>Click "Change Password" to save</li>
                </ol>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>How to Set Up Two-Factor Authentication</Card.Header>
              <Card.Body>
                <ol>
                  <li>Click on your username in the navigation bar</li>
                  <li>Select "Two-Factor Setup" from the dropdown menu</li>
                  <li>Scan the QR code with your authentication app (like Google Authenticator)</li>
                  <li>Enter the verification code from your app</li>
                  <li>Save your backup codes in a secure location</li>
                </ol>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="11">
          <Accordion.Header>Limitations and Restrictions</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>General System Limitations</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>Each user can have only one role in the system</ListGroup.Item>
                  <ListGroup.Item>Two-factor authentication cannot be disabled once enabled</ListGroup.Item>
                  <ListGroup.Item>All times are stored and displayed in UTC timezone</ListGroup.Item>
                  <ListGroup.Item>Session timeout after 30 minutes of inactivity</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>Project Limitations</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>A user can be a member of multiple projects</ListGroup.Item>
                  <ListGroup.Item>A user can have different roles in different projects</ListGroup.Item>
                  <ListGroup.Item>Project names must be unique within the system</ListGroup.Item>
                  <ListGroup.Item>Projects cannot be deleted, only archived</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>Sprint Limitations</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>A sprint must be at least 1 day long</ListGroup.Item>
                  <ListGroup.Item>A sprint cannot be longer than 4 weeks (28 days)</ListGroup.Item>
                  <ListGroup.Item>Sprints cannot overlap within the same project</ListGroup.Item>
                  <ListGroup.Item>Sprint start date must be in the future</ListGroup.Item>
                  <ListGroup.Item>Sprint start date cannot be on a weekend</ListGroup.Item>
                  <ListGroup.Item>Sprints cannot be modified after they start</ListGroup.Item>
                  <ListGroup.Item>Sprints cannot be deleted after they start</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>User Story Limitations</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>Story names must be unique within a project</ListGroup.Item>
                  <ListGroup.Item>Business value must be a positive number</ListGroup.Item>
                  <ListGroup.Item>Stories in active sprints have limited editing options</ListGroup.Item>
                  <ListGroup.Item>Stories cannot be deleted from active sprints</ListGroup.Item>
                  <ListGroup.Item>Completed stories cannot be moved back to previous states</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>Task Limitations</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>Tasks must be part of a user story</ListGroup.Item>
                  <ListGroup.Item>Time estimate must be provided</ListGroup.Item>
                  <ListGroup.Item>Only assigned developer can work on a task</ListGroup.Item>
                  <ListGroup.Item>Cannot work on multiple tasks simultaneously</ListGroup.Item>
                  <ListGroup.Item>Completed tasks cannot be reopened</ListGroup.Item>
                  <ListGroup.Item>Task status changes follow strict workflow</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="12">
          <Accordion.Header>Image Instructions</Accordion.Header>
          <Accordion.Body>
            <Card className="mb-3">
              <Card.Header>Image Information</Card.Header>
              <Card.Body>
                <p>The screenshots in these instructions show the actual ScrumFlow application interface. If you need to update any of these images in the future, follow these steps:</p>
                <ol>
                  <li>Take a new screenshot of the relevant section of the application</li>
                  <li>Save it with the same name in the <code>frontend/public/images</code> directory to replace the existing image:
                    <ul>
                      <li><code>overview.png</code> - Main dashboard screenshot</li>
                      <li><code>user creation.png</code> - User creation form</li>
                      <li><code>user profile.png</code> - User profile page</li>
                      <li><code>project creation.png</code> - Project creation form</li>
                      <li><code>project detail.png</code> - Project details page</li>
                      <li><code>sprint creation.png</code> - Sprint creation form</li>
                      <li><code>story creation.png</code> - User story creation form</li>
                      <li><code>task creation.png</code> - Task creation form</li>
                      <li><code>time tracking.png</code> - Time tracking interface</li>
                      <li><code>project wall.png</code> - Project wall/communication</li>
                      <li><code>product backlog.png</code> - Product backlog view</li>
                      <li><code>sprint backlog.png</code> - Sprint backlog view</li>
                    </ul>
                  </li>
                  <li>The updated images will automatically appear in the instructions after refreshing the page</li>
                </ol>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>Image Guidelines</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>Recommended image size: 800-1200px width</ListGroup.Item>
                  <ListGroup.Item>Format: PNG or JPG (PNG preferred for screenshots)</ListGroup.Item>
                  <ListGroup.Item>Keep file sizes under 300KB for optimal loading</ListGroup.Item>
                  <ListGroup.Item>Use consistent styling and zoom level across screenshots</ListGroup.Item>
                  <ListGroup.Item>Remove any sensitive data before taking screenshots</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

export default Instructions;