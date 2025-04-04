import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Alert, Table, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchProjects, clearProjectError, deleteProject } from '../store/slices/projectSlice';
import { formatErrorMessage } from '../utils/errorUtils';

const ProjectsList = () => {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector(state => state.projects);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleDelete = async (projectId) => {
    await dispatch(deleteProject(projectId));
    dispatch(fetchProjects());
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

  if (error) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Alert variant="danger">
          {formatErrorMessage(error)}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Projects</h1>
        {user?.user_type === 'ADMIN' && (
          <Button variant="primary" as={Link} to="/projects/new">Create Project</Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" onClose={() => dispatch(clearProjectError())} dismissible>
          {formatErrorMessage(error)}
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
                  {user?.user_type === 'ADMIN' && (
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => handleDelete(project.id)}
                    className="ms-2"
                  >
                    Delete
                  </Button>)}
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