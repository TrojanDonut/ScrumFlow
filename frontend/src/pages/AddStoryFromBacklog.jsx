import React, { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Alert, Badge, ProgressBar } from 'react-bootstrap';

const AddStoryFromBacklog = ({ show, handleClose, backlogStories, onAddToSprint, currentSprint }) => {
  const [selectedStories, setSelectedStories] = useState([]);
  const [error, setError] = useState(null);
  
  // Calculate current sprint load from the stories already in the sprint
  // This uses the stories array passed from the UserStories component, which has the most up-to-date data
  const sprintLoad = currentSprint?.stories?.reduce((total, story) => 
    total + (story.story_points || 0), 0) || 0;
  
  // Calculate selected stories load
  const selectedLoad = selectedStories.reduce((total, story) => 
    total + (story.story_points || 0), 0);
  
  // Calculate total projected load
  const totalProjectedLoad = sprintLoad + selectedLoad;
  
  // Check if adding the selected stories would exceed velocity
  const wouldExceedVelocity = currentSprint && (totalProjectedLoad > currentSprint.velocity);
  
  // Reset selected stories when modal closes
  useEffect(() => {
    if (!show) {
      setSelectedStories([]);
      setError(null);
    }
  }, [show]);

  const handleToggleStory = (story) => {
    // Don't allow selecting stories without story points
    if (!story.story_points) {
      setError(`Story "${story.name}" cannot be added to sprint because it's not estimated yet.`);
      return;
    }
    
    setError(null);
    
    if (selectedStories.includes(story)) {
      setSelectedStories(selectedStories.filter((s) => s !== story));
    } else {
      // Check if adding this story would exceed velocity
      const newTotalLoad = totalProjectedLoad + (story.story_points || 0);
      if (currentSprint && (newTotalLoad > currentSprint.velocity)) {
        setError(`Adding this story would exceed sprint velocity of ${currentSprint.velocity} points.`);
        return;
      }
      
      setSelectedStories([...selectedStories, story]);
    }
  };

  const handleAdd = () => {
    if (selectedStories.length > 0) {
      // Final check before adding stories
      if (wouldExceedVelocity) {
        setError(`Cannot add stories. Total load ${totalProjectedLoad} exceeds sprint velocity ${currentSprint.velocity}.`);
        return;
      }
      
      onAddToSprint(selectedStories);
      handleClose();
    }
  };

  // Extract unactive stories (those not in a sprint) from the new data structure
  const unactiveStories = backlogStories?.unrealized?.unactive || [];

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add Story From Backlog</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentSprint && (
          <div className="mb-3">
            <h5>Sprint Capacity</h5>
            <div className="d-flex justify-content-between mb-2">
              <span>Velocity: {currentSprint.velocity} points</span>
              <span>Current Load: {sprintLoad} points</span>
              <span>Selected Load: {selectedLoad} points</span>
              <span className={wouldExceedVelocity ? "text-danger fw-bold" : "text-success"}>
                Total: {totalProjectedLoad} / {currentSprint.velocity} points
              </span>
            </div>
            <ProgressBar className="mb-3">
              <ProgressBar 
                variant="success" 
                now={(sprintLoad / currentSprint.velocity) * 100} 
                key={1} 
                label={`${sprintLoad}`}
              />
              <ProgressBar 
                variant={wouldExceedVelocity ? "danger" : "warning"} 
                now={(selectedLoad / currentSprint.velocity) * 100} 
                key={2} 
                label={selectedLoad > 0 ? `+${selectedLoad}` : ''}
              />
            </ProgressBar>
            
            {sprintLoad > 0 && (
              <div className="mb-3">
                <small className="text-muted">
                  Current sprint stories: {currentSprint.stories?.length || 0} 
                  (Total points: {sprintLoad})
                </small>
              </div>
            )}
            
            {wouldExceedVelocity && (
              <Alert variant="warning">
                Adding these stories would exceed the sprint velocity. 
                Consider removing some stories or increasing the sprint velocity.
              </Alert>
            )}
          </div>
        )}
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        {unactiveStories.length === 0 ? (
          <p>No available stories in the backlog. Create a new story or add stories to the project backlog first.</p>
        ) : (
          <ListGroup>
            {unactiveStories.map((story) => (
              <ListGroup.Item
                key={story.id}
                active={selectedStories.includes(story)}
                onClick={() => handleToggleStory(story)}
                style={{ cursor: 'pointer' }}
                className={!story.story_points ? "text-muted" : ""}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="mb-1">{story.name}</div>
                    <small>
                      Business Value: {story.business_value}
                      {story.story_points ? (
                        <span className="ms-3">Story Points: {story.story_points}</span>
                      ) : (
                        <Badge bg="warning" className="ms-2">Not Estimated</Badge>
                      )}
                    </small>
                  </div>
                  {selectedStories.includes(story) && (
                    <Badge bg="primary">Selected</Badge>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAdd} 
          disabled={selectedStories.length === 0 || wouldExceedVelocity}
        >
          Add to Sprint
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddStoryFromBacklog;