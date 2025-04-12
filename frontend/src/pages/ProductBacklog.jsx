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
  Badge,
  Tab,
  Nav,
  Modal,
  Form
} from 'react-bootstrap';
import { fetchBacklogStories, fetchStories, resetBacklogStories, updateStory } from '../store/slices/storySlice';
import { fetchProjectById } from '../store/slices/projectSlice';
import AddUserStory from './AddUserStory';
import { deleteStory } from '../store/slices/storySlice';

const ProductBacklog = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { backlogStories, loading, error } = useSelector(state => state.stories);
  const { currentProject } = useSelector(state => state.projects);
  const [showModal, setShowModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [newStoryPoints, setNewStoryPoints] = useState('');
  const [storyToEstimate, setStoryToEstimate] = useState(null);

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

  const handleOpenEstimateModal = (story) => {
    setStoryToEstimate(story);
    setNewStoryPoints(story.story_points || '');
    setShowSizeModal(true);
  };

  const handleEstimateSubmit = async () => {
    if (!storyToEstimate) return;
    
    const points = parseInt(newStoryPoints, 10);
    if (isNaN(points) || points <= 0) {
      // Show validation error
      return;
    }

    try {
      await dispatch(updateStory({
        storyId: storyToEstimate.id,
        storyData: { ...storyToEstimate, story_points: points }
      })).unwrap();
      
      dispatch(fetchBacklogStories(id));
      setShowSizeModal(false);
    } catch (err) {
      console.error('Failed to update story points:', err);
    }
  };

  const handleRemoveStory = async (storyId) => {
    try {
      // Show confirmation dialog
      if (!window.confirm(
        "This will mark the story as deleted but preserve all associated tasks and history. Continue?"
      )) {
        return; // User cancelled
      }
      
      console.log('Removing story with ID:', storyId); // Debugging
      await dispatch(deleteStory({ storyId })).unwrap();
      dispatch(fetchBacklogStories(id));
    } catch (err) {
      console.error('Failed to remove story:', err);
    }
  };

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

  // Function to render a list of user stories
  const renderUserStoryList = (stories) => {
    if (!stories || stories.length === 0) {
      return (
        <ListGroup.Item className="text-muted">
          No stories in this category
        </ListGroup.Item>
      );
    }

    // Group stories by priority
    const priorityGroups = {
      'MUST_HAVE': stories.filter(s => s.priority === 'MUST_HAVE').sort((a, b) => b.business_value - a.business_value),
      'SHOULD_HAVE': stories.filter(s => s.priority === 'SHOULD_HAVE').sort((a, b) => b.business_value - a.business_value),
      'COULD_HAVE': stories.filter(s => s.priority === 'COULD_HAVE').sort((a, b) => b.business_value - a.business_value),
      'WONT_HAVE': stories.filter(s => s.priority === 'WONT_HAVE').sort((a, b) => b.business_value - a.business_value)
    };

    return (
      <>
        {Object.keys(priorityGroups).map(priority => {
          // Skip empty priority groups
          if (priorityGroups[priority].length === 0) return null;
          
          return (
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
                      {story.story_points ? (
                        <small className="ms-3">Story Points: {story.story_points}</small>
                      ) : (
                        <small className="ms-3 text-warning">Not Estimated</small>
                      )}
                      {story.sprint && (
                        <Badge bg="info" className="ms-3">In Sprint</Badge>
                      )}
                      <Badge bg={story.status === 'ACCEPTED' ? 'success' : 'secondary'} className="ms-3">
                        {story.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      {!story.sprint && (
                        <>
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
                            className="me-2"
                            onClick={() => handleOpenEstimateModal(story)}
                          >
                            {story.story_points ? 'Re-estimate' : 'Estimate'}
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        as={Link} 
                        to={`/projects/${id}/user-stories/${story.id}`}
                      >
                        Details
                      </Button>
                      {!story.sprint && (
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleRemoveStory(story.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          );
        })}
      </>
    );
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

  // Check if backlogStories is empty or not in the expected format
  const hasStories = backlogStories && 
                    (backlogStories.finished?.length > 0 || 
                     backlogStories.unrealized?.active?.length > 0 ||
                     backlogStories.unrealized?.unactive?.length > 0);

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

      {!hasStories ? (
        <Alert variant="info">
          No stories in the backlog. Click "Add New User Story" to create one.
        </Alert>
      ) : (
        <div>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Product Backlog</h5>
            </Card.Header>
            <Card.Body>
              <p>This page displays all user stories for the project, organized by their status and priority level.</p>
            </Card.Body>
          </Card>

          <Tab.Container id="backlog-tabs" defaultActiveKey="unrealized">
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="unrealized">Unrealized Stories</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="finished">Finished Stories</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="future">Future Releases</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="unrealized">
                <Tab.Container id="unrealized-tabs" defaultActiveKey="unactive">
                  <Nav variant="pills" className="mb-3">
                    <Nav.Item>
                      <Nav.Link eventKey="unactive">Unassigned</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="active">In Sprint</Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content>
                    <Tab.Pane eventKey="unactive">
                      <h4 className="mb-3">Unassigned User Stories</h4>
                      {renderUserStoryList(backlogStories.unrealized?.unactive?.filter(story => story.priority !== 'WONT_HAVE') || [])}
                    </Tab.Pane>
                    <Tab.Pane eventKey="active">
                      <h4 className="mb-3">User Stories In Sprint</h4>
                      {renderUserStoryList(backlogStories.unrealized?.active?.filter(story => story.priority !== 'WONT_HAVE') || [])}
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Tab.Pane>

              <Tab.Pane eventKey="finished">
                <h4 className="mb-3">Finished User Stories</h4>
                {renderUserStoryList(backlogStories.finished || [])}
              </Tab.Pane>
              
              <Tab.Pane eventKey="future">
                <h4 className="mb-3">Future Releases</h4>
                {renderUserStoryList([
                  ...(backlogStories.unrealized?.unactive?.filter(story => story.priority === 'WONT_HAVE') || []),
                  ...(backlogStories.unrealized?.active?.filter(story => story.priority === 'WONT_HAVE') || [])
                ])}
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
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
      
      {/* Story Size Estimation Modal */}
      <Modal show={showSizeModal} onHide={() => setShowSizeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Estimate Story Points</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {storyToEstimate && (
            <>
              <p><strong>Story:</strong> {storyToEstimate.name}</p>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Story Points</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="1" 
                    value={newStoryPoints} 
                    onChange={e => setNewStoryPoints(e.target.value)}
                    placeholder="Enter story points..."
                  />
                  <Form.Text className="text-muted">
                    Estimate how much effort this story requires using story points.
                  </Form.Text>
                </Form.Group>
                
                <div className="mt-3">
                  <p className="mb-2">Common Fibonacci sequence values:</p>
                  <div className="d-flex flex-wrap gap-2">
                    {[1, 2, 3, 5, 8, 13, 21].map(value => (
                      <Button 
                        key={value} 
                        variant={newStoryPoints == value ? "primary" : "outline-secondary"}
                        size="sm"
                        onClick={() => setNewStoryPoints(value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSizeModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEstimateSubmit}
            disabled={!newStoryPoints || parseInt(newStoryPoints, 10) <= 0}
          >
            Save Estimate
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductBacklog;