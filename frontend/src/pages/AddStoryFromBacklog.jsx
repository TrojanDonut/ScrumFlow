import React, { useState } from 'react';
import { Modal, Button, ListGroup, Tab, Nav } from 'react-bootstrap';

const AddStoryFromBacklog = ({ show, handleClose, backlogStories, onAddToSprint }) => {
  const [selectedStories, setSelectedStories] = useState([]);

  const handleToggleStory = (story) => {
    if (selectedStories.includes(story)) {
      setSelectedStories(selectedStories.filter((s) => s !== story));
    } else {
      setSelectedStories([...selectedStories, story]);
    }
  };

  const handleAdd = () => {
    if (selectedStories.length > 0) {
      onAddToSprint(selectedStories);
      handleClose();
    }
  };

  // Extract unactive stories (those not in a sprint) from the new data structure
  const unactiveStories = backlogStories?.unrealized?.unactive || [];

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add Story From Backlog</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
              >
                {story.name}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={!selectedStories.length === 0}>
          Add to Sprint
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddStoryFromBacklog;