import React from 'react';
import { ListGroup, Button, Collapse } from 'react-bootstrap';
import { useSelector } from 'react-redux';

const UserStoryColumn = ({ title, stories, onToggleExpand, expandedStoryId, onRemoveFromSprint, sprint }) => {
  const getSprintStatus = () => {
    const now = new Date();
    console.log('Current Date:', now);
    console.log('Sprint Start Date:', sprint.start_date);
    console.log('Sprint End Date:', sprint.end_date);
    console.log(sprint);
    if (new Date(sprint.start_date) > now) {
      return 'future';
    } else if (new Date(sprint.end_date) < now) {
      return 'past';
    }
    return 'active';
  };
  const sprintStatus = getSprintStatus();
  console.log('Sprint Status:', sprintStatus);
  console.log('Sprint:', sprint);
  return (
    <div className="col">
      <h3>{title}</h3>
      <ListGroup>
        {stories.map((story) => (
          <ListGroup.Item key={story.id} className="d-flex flex-column">
            <div
              className="d-flex justify-content-between align-items-center"
              onClick={() => onToggleExpand(story.id)}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <strong>{story.name}</strong> - {story.priority}
              </div>
            </div>
            <Collapse in={expandedStoryId === story.id}>
              <div className="mt-2">
                <p>
                  {story.text.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </p>
                <div className="d-flex justify-content-end mt-2">
                {sprintStatus !== 'past' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onRemoveFromSprint(story.id)}
                  >
                    Remove from Sprint
                  </Button>
                )}
                </div>
              </div>
            </Collapse>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
};

export default UserStoryColumn;