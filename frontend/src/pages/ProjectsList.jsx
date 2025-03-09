import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Alert, Table, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchProjects, clearProjectError } from '../store/slices/projectSlice';

const ProjectsList = () => {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector(state => state.projects);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

    if (error) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Alert variant="danger">
          {error.detail ? error.detail : 'An error occurred'}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Projects</h1>
        {user.role === 'SYSTEM_ADMIN' && (
          <Button variant="primary" as={Link} to="/users">Manage Users</Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" onClose={() => dispatch(clearProjectError())} dismissible>
          {error}
        </Alert>
      )}

      {projects.length === 0 ? (
        <Card>
          <Card.Body>
            <Card.Text>No projects found. Create a new project to get started.</Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id}>
                <td>{project.name}</td>
                <td>{project.description.substring(0, 100)}...</td>
                <td>{new Date(project.created_at).toLocaleDateString()}</td>
                <td>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    as={Link} 
                    to={`/projects/${project.id}`}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default ProjectsList; 