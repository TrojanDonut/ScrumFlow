import React, { useState } from 'react';
import { Modal, Button, ListGroup } from 'react-bootstrap';

const AddStoryFromBacklog = ({ show, handleClose, backlogStories, onAddToSprint }) => {
  const [selectedStory, setSelectedStory] = useState(null);

  const handleAdd = () => {
    if (selectedStory) {
      onAddToSprint(selectedStory);
      handleClose();
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add Story From Backlog</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup>
          {backlogStories.map((story) => (
            <ListGroup.Item
              key={story.id}
              active={selectedStory === story}
              onClick={() => setSelectedStory(story)}
              style={{ cursor: 'pointer' }}
            >
              {story.name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={!selectedStory}>
          Add to Sprint
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddStoryFromBacklog;