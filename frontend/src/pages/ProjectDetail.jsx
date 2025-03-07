import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Alert, Spinner, Card, ListGroup, Button } from 'react-bootstrap';
import { fetchProjectById } from '../store/slices/projectSlice';

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, loading, error } = useSelector(state => state.projects);

  useEffect(() => {
    dispatch(fetchProjectById(id));
  }, [dispatch, id]);

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
    return <Alert variant="danger">{error}</Alert>;
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
      <h1>Project Detail: {currentProject.name}</h1>
      <p>{currentProject.description}</p>
      <div className="mt-3">
        <strong>Created:</strong> {new Date(currentProject.created_at).toLocaleDateString()}
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
                      <strong>{member.user}</strong> ({member.role})
                    </div>
                    <div>
                      {member.user.email}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p>No team members assigned to this project.</p>
          )}
          <Button variant="outline-primary" className="mt-3" as={Link} to={`/projects/${id}/members`}>
            Manage Team Members
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProjectDetail;