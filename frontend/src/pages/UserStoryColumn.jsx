import React from 'react';
import { ListGroup, Button, Collapse } from 'react-bootstrap';

const UserStoryColumn = ({ title, stories, onEdit, onToggleExpand, expandedStoryId, onRemoveFromSprint }) => {
  return (
    <div className="col">
      <h3>{title}</h3>
      <ListGroup>
        {stories.map((story) => (
          <ListGroup.Item key={story.id} className="d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{story.name}</strong> - {story.priority} (Business Value (€): {story.business_value})
              </div>
              <div>
                <Button
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => onEdit(story)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => onToggleExpand(story.id)}
                >
                  {expandedStoryId === story.id ? 'Collapse' : 'Expand'}
                </Button>
                <Button variant="danger" onClick={() => onRemoveFromSprint(story.id)}>
                    Remove from Sprint
                </Button>
              </div>
            </div>
            <Collapse in={expandedStoryId === story.id}>
              <div className="mt-2">
                <p>{story.text}</p>
              </div>
            </Collapse>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
};

export default UserStoryColumn;