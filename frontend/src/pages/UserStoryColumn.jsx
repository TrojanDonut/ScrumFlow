import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ListGroup, Button, Collapse, Spinner, Badge } from 'react-bootstrap';
import { fetchTasks } from '../store/slices/taskSlice';

const UserStoryColumn = ({ 
  title, 
  stories, 
  onEdit, 
  onToggleExpand, 
  expandedStoryId, 
  onRemoveFromSprint,
  tasksByStoryId,
  sprint,
}) => {
  const { currentProjectRole } = useSelector(state => state.auth);

  const getSprintStatus = () => {
    const now = new Date();
    if (!sprint) return 'active';
    if (new Date(sprint.start_date) > now) {
      return 'future';
    } else if (new Date(sprint.end_date) < now) {
      return 'past';
    }
    return 'active';
  };
  
  const sprintStatus = getSprintStatus();
  console.log("Sprint status:", sprintStatus);
  console.log("Current project role:", currentProjectRole);

  // Display the story points and status
  const renderStoryInfo = (story) => (
    <div className="d-flex align-items-center mt-1">
      {story.story_points ? (
        <Badge bg="primary" className="me-2">
          {story.story_points} points
        </Badge>
      ) : (
        <Badge bg="warning" className="me-2">
          Not estimated
        </Badge>
      )}
      <small className="text-muted">Business Value: {story.business_value}</small>
    </div>
  );

  return (
    <div className="col">
      <h3>{title.replace('_', ' ')}</h3>
      <ListGroup>
        {stories.map((story) => (
          <ListGroup.Item key={story.id}>
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => onToggleExpand(story.id)}
              className="d-flex justify-content-between align-items-center"
            >
              <div>
                <div className="fw-bold">{story.name}</div>
                {renderStoryInfo(story)}
              </div>
              <div>
                {sprintStatus === 'active' && currentProjectRole === "SCRUM_MASTER" && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromSprint(story.id);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <Collapse in={expandedStoryId === story.id}>
              <div className="mt-3">
                <p>
                  <strong>Description:</strong> {story.text}
                </p>
                <p>
                  <strong>Acceptance Tests:</strong> {story.acceptance_tests}
                </p>
                <h5 className="mt-3">Tasks</h5>
                {tasksByStoryId && tasksByStoryId[story.id] ? (
                  tasksByStoryId[story.id].length > 0 ? (
                    <ListGroup>
                      {tasksByStoryId[story.id].map((task) => (
                        <ListGroup.Item key={task.id}>
                          <div className="d-flex justify-content-between">
                            <div>{task.title}</div>
                            <div>{task.status}</div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <p>No tasks for this story.</p>
                  )
                ) : (
                  <Spinner animation="border" size="sm" />
                )}
              </div>
            </Collapse>
          </ListGroup.Item>
        ))}
        {stories.length === 0 && (
          <ListGroup.Item className="text-muted">
            No stories in this category
          </ListGroup.Item>
        )}
      </ListGroup>
    </div>
  );
};

export default UserStoryColumn;