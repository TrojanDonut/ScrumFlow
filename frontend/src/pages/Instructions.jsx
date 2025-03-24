import React from 'react';
import { Card, Accordion, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';

const Instructions = () => {
  const { user } = useSelector(state => state.auth);
  
  return (
    <div>
      <h1 className="mb-4">ScrumFlow - User Instructions</h1>
      
      <Alert variant="info">
        This guide provides instructions on how to use the ScrumFlow application based on your role.
      </Alert>
      
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Getting Started</Card.Title>
          <p>ScrumFlow is a Scrum project management application that helps teams organize and track their work using Scrum methodology.</p>
          <p>Your experience with the application will vary based on your assigned role:</p>
          <ul>
            <li><strong>System Admin:</strong> Can manage users and create projects</li>
            <li><strong>Product Owner:</strong> Manages the product backlog and priorities</li>
            <li><strong>Scrum Master:</strong> Facilitates the Scrum process</li>
            <li><strong>Developer:</strong> Works on tasks and participates in sprints</li>
          </ul>
        </Card.Body>
      </Card>
      
      <Accordion className="mb-4">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Dashboard</Accordion.Header>
          <Accordion.Body>
            <p>The Dashboard is your starting point in the application:</p>
            <ul>
              <li>View your profile information including username, email, and role</li>
              <li>Access quick links to view all projects</li>
              <li>System Admins can access user management directly from this page</li>
            </ul>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="1">
          <Accordion.Header>Projects</Accordion.Header>
          <Accordion.Body>
            <p>The Projects page allows you to view and manage projects:</p>
            <ul>
              <li><strong>View Projects:</strong> See a list of all projects you have access to</li>
              <li><strong>Create Project:</strong> System Admins can create new projects by clicking the "Create Project" button</li>
              <li><strong>Project Details:</strong> Click the "View" button to access details of a specific project</li>
              <li><strong>Delete Project:</strong> Remove a project by clicking the "Delete" button (restricted by permissions)</li>
            </ul>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="2">
          <Accordion.Header>Project Details</Accordion.Header>
          <Accordion.Body>
            <p>The Project Details page provides comprehensive information about a project:</p>
            <ul>
              <li><strong>Project Overview:</strong> View project name, description, and creation date</li>
              <li><strong>Team Members:</strong> See a list of members assigned to the project and their roles</li>
              <li><strong>Manage Team Members:</strong> Add or remove team members (if you have appropriate permissions)</li>
              <li><strong>Create Sprint:</strong> Create a new sprint by specifying start date, end date, and velocity</li>
              <li><strong>View Sprints:</strong> See a list of existing sprints for the project</li>
            </ul>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="3">
          <Accordion.Header>User Profile</Accordion.Header>
          <Accordion.Body>
            <p>The User Profile page allows you to manage your account:</p>
            <ul>
              <li><strong>View Profile:</strong> See your username, email, and role</li>
              <li><strong>Change Password:</strong> Update your password</li>
              <li><strong>Two-Factor Authentication:</strong> Set up 2FA for additional security</li>
            </ul>
          </Accordion.Body>
        </Accordion.Item>

        {user?.user_type === 'ADMIN' && (
          <Accordion.Item eventKey="4">
            <Accordion.Header>User Management (Admin Only)</Accordion.Header>
            <Accordion.Body>
              <p>As a System Admin, you can manage users in the system:</p>
              <ul>
                <li><strong>View Users:</strong> See a list of all users in the system</li>
                <li><strong>Create User:</strong> Add new users to the system</li>
                <li><strong>Edit User:</strong> Modify user information and roles</li>
                <li><strong>Delete User:</strong> Remove users from the system</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
        )}
      </Accordion>

      <Card>
        <Card.Body>
          <Card.Title>Common Tasks</Card.Title>
          <Accordion>
            <Accordion.Item eventKey="0">
              <Accordion.Header>How to Create a Project</Accordion.Header>
              <Accordion.Body>
                <ol>
                  <li>Navigate to the Projects page</li>
                  <li>Click the "Create Project" button (System Admin only)</li>
                  <li>Fill in the project name and description</li>
                  <li>Click "Create" to save the project</li>
                  <li>After creation, you can add team members to the project</li>
                </ol>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="1">
              <Accordion.Header>How to Create a Sprint</Accordion.Header>
              <Accordion.Body>
                <ol>
                  <li>Navigate to the specific project's detail page</li>
                  <li>Scroll down to the "Create a New Sprint" section</li>
                  <li>Enter the sprint start date, end date, and velocity</li>
                  <li>Click "Create Sprint" to save</li>
                  <li>The new sprint will appear in the "Existing Sprints" section</li>
                </ol>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="2">
              <Accordion.Header>How to Manage Team Members</Accordion.Header>
              <Accordion.Body>
                <ol>
                  <li>Navigate to the specific project's detail page</li>
                  <li>Click the "Manage Team Members" button under the Team Members section</li>
                  <li>Add new members by selecting users and assigning roles</li>
                  <li>Remove existing members as needed</li>
                  <li>Save your changes</li>
                </ol>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="3">
              <Accordion.Header>How to Change Your Password</Accordion.Header>
              <Accordion.Body>
                <ol>
                  <li>Click on your username in the navigation bar</li>
                  <li>Select "Change Password" from the dropdown menu</li>
                  <li>Enter your current password and your new password</li>
                  <li>Confirm your new password</li>
                  <li>Click "Change Password" to save</li>
                </ol>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="4">
              <Accordion.Header>How to Set Up Two-Factor Authentication</Accordion.Header>
              <Accordion.Body>
                <ol>
                  <li>Click on your username in the navigation bar</li>
                  <li>Select "Two-Factor Setup" from the dropdown menu</li>
                  <li>Scan the QR code with your authentication app (like Google Authenticator)</li>
                  <li>Enter the verification code from your app</li>
                  <li>Save your backup codes in a secure location</li>
                </ol>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Instructions; 