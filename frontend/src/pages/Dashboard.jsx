import React, { useEffect } from 'react';
import { Card, Row, Col, ListGroup } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useSelector(state => state.auth);

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>
      
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Welcome, {user?.username}!</h5>
            </Card.Header>
            <Card.Body>
              <p>
                Welcome to the Scrum Management System. Use the navigation bar or the quick links below to access different parts of the application.
              </p>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Links</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item action as={Link} to="/projects">
                View All Projects
              </ListGroup.Item>
              {user?.is_system_admin && (
                <ListGroup.Item action as={Link} to="/users">
                  Manage Users
                </ListGroup.Item>
              )}
              <ListGroup.Item action as={Link} to="/instructions">
                User Instructions
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Your Profile</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>Username:</strong> {user?.username}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 