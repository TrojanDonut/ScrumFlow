import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  ListGroup, 
  Button, 
  Alert, 
  Spinner, 
  Accordion,
  Badge
} from 'react-bootstrap';
import { fetchBacklogStories, fetchStories, resetBacklogStories } from '../store/slices/storySlice';
import { fetchProjectById } from '../store/slices/projectSlice';
import AddUserStory from './AddUserStory';

const ProductBacklog = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { backlogStories, loading, error } = useSelector(state => state.stories);
  const { currentProject } = useSelector(state => state.projects);
  const [showModal, setShowModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (id) {
      console.log('Fetching backlog stories for project:', id);
      dispatch(fetchBacklogStories(id));
      dispatch(fetchProjectById(id));
    }

    // Cleanup function to reset backlog stories when unmounting
    return () => {
      dispatch(resetBacklogStories());
    };
  }, [dispatch, id]);

  const handleUserStoryAdded = () => {
    if (id) {
      console.log('Story added, refreshing backlog for project:', id);
      dispatch(fetchBacklogStories(id));
    }
  };

  const handleEditStory = (story) => {
    setSelectedStory(story);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleOpenAddStoryModal = () => {
    setSelectedStory(null);
    setIsEditMode(false);
    setShowModal(true);
  };

  // Group stories by priority
  const priorityGroups = backlogStories && id ? {
    'MUST_HAVE': backlogStories
      .filter(story => story.priority === 'MUST_HAVE')
      .sort((a, b) => b.business_value - a.business_value),
    'SHOULD_HAVE': backlogStories
      .filter(story => story.priority === 'SHOULD_HAVE')
      .sort((a, b) => b.business_value - a.business_value),
    'COULD_HAVE': backlogStories
      .filter(story => story.priority === 'COULD_HAVE')
      .sort((a, b) => b.business_value - a.business_value),
    'WONT_HAVE': backlogStories
      .filter(story => story.priority === 'WONT_HAVE')
      .sort((a, b) => b.business_value - a.business_value)
  } : {
    'MUST_HAVE': [],
    'SHOULD_HAVE': [],
    'COULD_HAVE': [],
    'WONT_HAVE': []
  };

  console.log('Current backlogStories:', backlogStories);
  console.log('Grouped stories:', priorityGroups);

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'MUST_HAVE':
        return 'danger';
      case 'SHOULD_HAVE':
        return 'warning';
      case 'COULD_HAVE':
        return 'info';
      case 'WONT_HAVE':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  const formatPriorityLabel = (priority) => {
    return priority.replace('_', ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Add a better error message display
  const renderError = () => {
    if (!error) return null;
    
    let errorMessage = '';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.detail) {
      errorMessage = error.detail;
    } else if (error.message) {
      errorMessage = error.message;
    } else {
      errorMessage = 'An error occurred while fetching the backlog stories.';
    }
    
    return <Alert variant="danger">{errorMessage}</Alert>;
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

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Product Backlog</h1>
          {currentProject && <p>{currentProject.name}</p>}
        </div>
        <Button 
          variant="primary"
          onClick={handleOpenAddStoryModal}
        >
          Add New User Story
        </Button>
      </div>

      {renderError()}

      {!backlogStories || backlogStories.length === 0 ? (
        <Alert variant="info">
          No stories in the backlog. Click "Add New User Story" to create one.
        </Alert>
      ) : (
        <div>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Prioritized Product Backlog</h5>
            </Card.Header>
            <Card.Body>
              <p>This page displays all user stories that are not assigned to any sprint, organized by their priority level.</p>
            </Card.Body>
          </Card>

          {Object.keys(priorityGroups).map(priority => (
            <Card key={priority} className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>
                  <Badge bg={getPriorityBadgeVariant(priority)} className="me-2">
                    {formatPriorityLabel(priority)}
                  </Badge>
                  <span className="fw-bold">
                    {priorityGroups[priority].length} {priorityGroups[priority].length === 1 ? 'story' : 'stories'}
                  </span>
                </span>
              </Card.Header>
              <ListGroup variant="flush">
                {priorityGroups[priority].map(story => (
                  <ListGroup.Item 
                    key={story.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <h6>{story.name}</h6>
                      <small>Business Value: {story.business_value}</small>
                      {story.story_points && (
                        <small className="ms-3">Story Points: {story.story_points}</small>
                      )}
                    </div>
                    <div>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEditStory(story)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline-info" 
                        size="sm" 
                        as={Link} 
                        to={`/projects/${id}/user-stories/${story.id}`}
                      >
                        Details
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
                {priorityGroups[priority].length === 0 && (
                  <ListGroup.Item className="text-muted">
                    No stories with this priority
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit User Story Modal */}
      <AddUserStory
        show={showModal}
        handleClose={() => setShowModal(false)}
        onUserStoryAdded={handleUserStoryAdded}
        userStoryData={selectedStory}
        isEditMode={isEditMode}
        projectId={id}
      />
    </Container>
  );
};

export default ProductBacklog;