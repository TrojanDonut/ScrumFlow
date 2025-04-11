import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Alert, Spinner, Card, ListGroup, Button } from 'react-bootstrap';
import { fetchProjectById } from '../store/slices/projectSlice';
import { formatErrorMessage } from '../utils/errorUtils';
import axios from "axios";
import { createSprint, fetchSprints } from "../store/slices/sprintSlice";

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject } = useSelector(state => state.projects);
  const { sprints, error, loading } = useSelector(state => state.sprints);
  const { user } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    velocity: 0,
  });
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    dispatch(fetchProjectById(id));
    dispatch(fetchSprints(id));
  }, [dispatch, id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(createSprint({ projectId: id, sprintData: formData })).unwrap();
      
      // Reset form
      setFormData({ start_date: "", end_date: "", velocity: 0 });
      
      // Refresh sprints list
      dispatch(fetchSprints(id));
      
      // Show success message
      setSuccessMessage('Sprint created successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to create sprint:', err);
    }
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }


  if (!currentProject) {
    return (
      <Alert variant="info">
        Project not found. <Link to="/projects">Return to projects list</Link>
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1>Project Detail: {currentProject.name}</h1>
          <p>{currentProject.description}</p>
          <div className="mt-3">
            <strong>Created:</strong> {new Date(currentProject.created_at).toLocaleDateString()}
          </div>
        </div>
        <div>
          {user?.user_type === 'ADMIN' && (
            <Button variant="outline-primary" as={Link} to={`/projects/${id}/edit`} className="me-2">
              Edit Project
            </Button>
          )}
          <Button variant="outline-success" as={Link} to={`/projects/${id}/backlog`}>
            View Product Backlog
          </Button>
        </div>
      </div>
      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Team Members</Card.Title>
          {currentProject.members && currentProject.members.length > 0 ? (
            <ListGroup>
              {currentProject.members.map(member => (
                <ListGroup.Item key={member.id}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{member.user.username}</strong> ({member.role})
                    </div>
                    <div>{member.user.email}</div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p>No team members assigned to this project.</p>
          )}
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Create a New Sprint</Card.Title>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Start Date:</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="form-control" required />
            </div>
            <div className="mb-3">
              <label className="form-label">End Date:</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="form-control" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Velocity (points):</label>
              <input type="number" name="velocity" value={formData.velocity} onChange={handleChange} className="form-control" required />
            </div>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Creating..." : "Create Sprint"}
            </Button>
          </form>
          {successMessage && <Alert variant="success" className="mt-3">{successMessage}</Alert>}
          {error && <Alert variant="danger" className="mt-3">{formatErrorMessage(error)}</Alert>}
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Existing Sprints</Card.Title>
          {sprints.length > 0 ? (
            <ListGroup>
              {sprints.map((sprint) => (
                <ListGroup.Item key={sprint.id}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      Sprint from {formatDate(sprint.start_date)} to {formatDate(sprint.end_date)} (Velocity (points): {sprint.velocity})
                    </div>
                    <Button
                      variant="outline-primary"
                      as={Link}
                      to={`/projects/${id}/sprints/${sprint.id}/user-stories`}
                    >
                      View
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p>No sprints available.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProjectDetail;
