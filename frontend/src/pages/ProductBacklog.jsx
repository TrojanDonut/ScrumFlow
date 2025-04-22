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
import { fetchBacklogStories, fetchStories, resetBacklogStories, updateStory, returnStoriesToBacklog, updateStoryStatus } from '../store/slices/storySlice';
import { fetchProjectById } from '../store/slices/projectSlice';
import { fetchCompletedSprints } from '../store/slices/sprintSlice';
import AddUserStory from './AddUserStory';
import { deleteStory } from '../store/slices/storySlice';
import axios from 'axios';

const ProductBacklog = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { backlogStories, loading, error } = useSelector(state => state.stories);
  const { currentProject } = useSelector(state => state.projects);
  const { currentProjectRole, auth } = useSelector(state => state.auth);
  const { completedSprints } = useSelector(state => state.sprints);
  const [showModal, setShowModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [newStoryPoints, setNewStoryPoints] = useState('');
  const [storyToEstimate, setStoryToEstimate] = useState(null);
  const [activeTab, setActiveTab] = useState('unrealized');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [storyToUpdateStatus, setStoryToUpdateStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [errorMessage, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [returnError, setReturnError] = useState(null);

  // Handler to open the status update modal
  const handleOpenStatusModal = (story) => {
    setStoryToUpdateStatus(story);
    setNewStatus(story.status || '');
    setShowStatusModal(true);
  };

  // Handler to submit the status update
  const handleStatusUpdateSubmit = async () => {
    if (!storyToUpdateStatus) return;

    try {
      await dispatch(updateStory({
        storyId: storyToUpdateStatus.id,
        storyData: { ...storyToUpdateStatus, status: newStatus }
      })).unwrap();

      dispatch(fetchBacklogStories(id));
      setShowStatusModal(false);
    } catch (err) {
      console.error('Failed to update story status:', err);
    }
  };

  const handleAcceptStory = async (storyId) => {
    try {
      await dispatch(updateStoryStatus({ storyId, status: 'ACCEPTED' })).unwrap();
      dispatch(fetchBacklogStories(id));
    } catch (err) {
      console.error("Error accepting story:", err);
      setError('Failed to accept story: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRejectStory = async (storyId) => {
    try {
      await dispatch(updateStoryStatus({ storyId, status: 'REJECTED' })).unwrap();
      dispatch(fetchBacklogStories(id));
    } catch (err) {
      console.error("Error rejecting story:", err);
      setError('Failed to reject story: ' + (err.message || 'Unknown error'));
    }
  };

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

  useEffect(() => {
    const isAuthenticated = auth && auth.token;
    const isProductOwner = currentProjectRole === "PRODUCT_OWNER";
    
    if (id && isAuthenticated && isProductOwner) {
      dispatch(fetchCompletedSprints(id));
    }
  }, [id, auth, currentProjectRole, dispatch]);

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

  const handleReturnStoriesToBacklog = async (sprintId) => {
    try {
      // Show confirmation dialog
      if (!window.confirm(
        "This will return all incomplete stories from this sprint back to the product backlog. Continue?"
      )) {
        return; // User cancelled
      }
      
      const result = await dispatch(returnStoriesToBacklog({
        projectId: id,
        sprintId
      })).unwrap();
      
      // Reload backlog stories
      dispatch(fetchBacklogStories(id));
      
      // Show success notification
      alert(`${result.stories_count} stories were returned to the product backlog.`);
    } catch (err) {
      console.error('Failed to return stories to backlog:', err);
      setReturnError('Failed to return stories to backlog: ' + (err.message || 'Unknown error'));
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
    if (!fetchError) return null;

    let errorMessage = '';
    if (typeof fetchError === 'string') {
      errorMessage = fetchError;
    } else if (fetchError.detail) {
      errorMessage = fetchError.detail;
    } else if (fetchError.message) {
      errorMessage = fetchError.message;
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
    };
    
    // Only include WONT_HAVE stories if they exist in this list
    // (which should only happen for the Future Releases tab)
    const wontHaveStories = stories.filter(s => s.priority === 'WONT_HAVE');
    if (wontHaveStories.length > 0) {
      priorityGroups['WONT_HAVE'] = wontHaveStories.sort((a, b) => b.business_value - a.business_value);
    }

    return (
      <>
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
                    {story.status === 'DONE' && currentProjectRole === 'PRODUCT_OWNER' && (
                      <>
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleAcceptStory(story.id)}
                        >
                          Accept Story
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleRejectStory(story.id)}
                        >
                          Reject Story
                        </Button>
                      </>
                    )}
                    {!story.sprint && currentProjectRole === "SCRUM_MASTER" && (
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
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleRemoveStory(story.id)}
                          >
                            Remove
                          </Button>
                      </>
                    )}
                    {activeTab === 'unrealized' && story.sprint && currentProjectRole === "SCRUM_MASTER" && (
                        <Button 
                          variant="outline-secondary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleOpenStatusModal(story)}
                          >
                            Update Status
                        </Button>
                    )}
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
    <>
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Product Backlog</h1>
          {currentProject && <p>{currentProject.name}</p>}
        </div>
        { currentProjectRole !== "DEVELOPER" && (
        <Button 
          variant="primary"
          onClick={handleOpenAddStoryModal}
        >
          Add New User Story
        </Button>)}
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

          <Tab.Container id="backlog-tabs" defaultActiveKey="unrealized" onSelect={(key) => setActiveTab(key)}>
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
                {renderUserStoryList((backlogStories.finished || []).filter(story => story.priority !== 'WONT_HAVE'))}
              </Tab.Pane>
              
              <Tab.Pane eventKey="future">
                <h4 className="mb-3">Future Releases</h4>
                {/* Custom rendering for Future Releases - only show WONT_HAVE stories */}
                {(() => {
                  const stories = [
                    ...(backlogStories.unrealized?.unactive?.filter(story => story.priority === 'WONT_HAVE') || []),
                    ...(backlogStories.unrealized?.active?.filter(story => story.priority === 'WONT_HAVE') || [])
                  ];
                  
                  if (!stories || stories.length === 0) {
                    return (
                      <ListGroup.Item className="text-muted">
                        No stories in this category
                      </ListGroup.Item>
                    );
                  }

                  const wontHaveStories = stories.sort((a, b) => b.business_value - a.business_value);

                  return (
                    <Card className="mb-3">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <span>
                          <Badge bg={getPriorityBadgeVariant('WONT_HAVE')} className="me-2">
                            {formatPriorityLabel('WONT_HAVE')}
                          </Badge>
                          <span className="fw-bold">
                            {wontHaveStories.length} {wontHaveStories.length === 1 ? 'story' : 'stories'}
                          </span>
                        </span>
                      </Card.Header>
                      <ListGroup variant="flush">
                        {wontHaveStories.map(story => (
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
                            {!story.sprint && currentProjectRole === "SCRUM_MASTER" && (
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
                                  <Button 
                                    variant="danger" 
                                    size="sm" 
                                    onClick={() => handleRemoveStory(story.id)}
                                  >
                                    Remove
                                  </Button>
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="me-2"
                                    as={Link} 
                                    to={`/projects/${id}/user-stories/${story.id}`}
                                  >
                                    Details
                                  </Button>
                              </>
                            )}
                            </div>
                          </ListGroup.Item>
                        ))}
                        {wontHaveStories.length === 0 && (
                          <ListGroup.Item className="text-muted">
                            No stories with this priority
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </Card>
                  );
                })()}
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>

          {currentProjectRole === "PRODUCT_OWNER" && completedSprints.length > 0 && (
            <div className="mt-4">
              <h3>Completed Sprints</h3>
              <p className="text-muted">
                As a Product Owner, you can return incomplete stories from completed sprints back to the backlog.
              </p>
              
              {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                  {error}
                </Alert>
              )}
              
              {returnError && (
                <Alert variant="danger" onClose={() => setReturnError(null)} dismissible>
                  {returnError}
                </Alert>
              )}
              
              <ListGroup className="mt-3">
                {completedSprints.map(sprint => (
                  <ListGroup.Item key={sprint.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5>Sprint: {sprint.name || `Sprint ${sprint.id}`}</h5>
                      <small>
                        {sprint.start_date} - {sprint.end_date}
                      </small>
                    </div>
                    <Button 
                      variant="warning" 
                      onClick={() => handleReturnStoriesToBacklog(sprint.id)}
                    >
                      Return Incomplete Stories
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}
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
                        variant={newStoryPoints === value ? "primary" : "outline-secondary"}
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

  <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
    <Modal.Header closeButton>
      <Modal.Title>Update Story Status</Modal.Title>
    </Modal.Header>
    <Modal.Body>
    {console.log('Rendering status modal with story:', storyToUpdateStatus)}
      {storyToUpdateStatus && (
        <>
          <p><strong>Story:</strong> {storyToUpdateStatus.name}</p>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select 
                value={newStatus} 
                onChange={e => setNewStatus(e.target.value)}
              >
                <option value="">Select a status</option>
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </>
      )}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
        Cancel
      </Button>
      <Button 
        variant="primary" 
        onClick={handleStatusUpdateSubmit}
        disabled={!newStatus}
      >
        Save Changes
      </Button>
    </Modal.Footer>
  </Modal>
  </>
  );
};

export default ProductBacklog;