import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Alert, Tabs, Tab, Spinner, ListGroup } from 'react-bootstrap';
import { fetchProjectById } from '../store/slices/projectSlice';
import { fetchStories } from '../store/slices/storySlice';
import { fetchSprints, fetchActiveSprint } from '../store/slices/sprintSlice';

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, loading: projectLoading, error: projectError } = useSelector(state => state.projects);
  const { stories, loading: storiesLoading } = useSelector(state => state.stories);
  const { sprints, activeSprint, loading: sprintsLoading } = useSelector(state => state.sprints);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    dispatch(fetchProjectById(id));
    dispatch(fetchStories(id));
    dispatch(fetchSprints(id));
    dispatch(fetchActiveSprint(id));
  }, [dispatch, id]);

  if (projectLoading || storiesLoading || sprintsLoading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (projectError) {
    return (
      <Alert variant="danger">
        {projectError}
      </Alert>
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{currentProject.name}</h1>
        <Button variant="primary" as={Link} to={`/projects/${id}/edit`}>Edit Project</Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="overview" title="Overview">
          <Card>
            <Card.Body>
              <Card.Title>Project Details</Card.Title>
              <Card.Text>{currentProject.description}</Card.Text>
              <div className="mt-3">
                <strong>Created:</strong> {new Date(currentProject.created_at).toLocaleDateString()}
              </div>
            </Card.Body>
          </Card>

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
        </Tab>

        <Tab eventKey="sprints" title="Sprints">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Sprints</h3>
            <Button variant="primary" as={Link} to={`/projects/${id}/sprints/new`}>Create Sprint</Button>
          </div>

          {activeSprint && (
            <Card className="mb-4 border-primary">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">Active Sprint</h4>
              </Card.Header>
              <Card.Body>
                <Card.Title>{activeSprint.name}</Card.Title>
                <Card.Text>
                  <strong>Start Date:</strong> {new Date(activeSprint.start_date).toLocaleDateString()}<br />
                  <strong>End Date:</strong> {new Date(activeSprint.end_date).toLocaleDateString()}<br />
                  <strong>Velocity:</strong> {activeSprint.velocity} points
                </Card.Text>
                <Button variant="outline-primary" as={Link} to={`/projects/${id}/sprints/${activeSprint.id}`}>
                  View Sprint
                </Button>
              </Card.Body>
            </Card>
          )}

          {sprints && sprints.length > 0 ? (
            <ListGroup>
              {sprints.map(sprint => (
                <ListGroup.Item key={sprint.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5>{sprint.name}</h5>
                    <div>
                      {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <Button variant="outline-primary" as={Link} to={`/projects/${id}/sprints/${sprint.id}`}>
                    View
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Card>
              <Card.Body>
                <Card.Text>No sprints found for this project.</Card.Text>
              </Card.Body>
            </Card>
          )}
        </Tab>

        <Tab eventKey="stories" title="User Stories">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>User Stories</h3>
            <Button variant="primary" as={Link} to={`/projects/${id}/stories/new`}>Create Story</Button>
          </div>

          {stories && stories.length > 0 ? (
            <ListGroup>
              {stories.map(story => (
                <ListGroup.Item key={story.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5>{story.title}</h5>
                    <div>
                      <span className="badge bg-primary me-2">{story.priority}</span>
                      <span className="badge bg-secondary me-2">Value: {story.business_value}</span>
                      {story.story_points && (
                        <span className="badge bg-info">Points: {story.story_points}</span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline-primary" as={Link} to={`/projects/${id}/stories/${story.id}`}>
                    View
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Card>
              <Card.Body>
                <Card.Text>No user stories found for this project.</Card.Text>
              </Card.Body>
            </Card>
          )}
        </Tab>
      </Tabs>
    </div>
  );
};

export default ProjectDetail; 