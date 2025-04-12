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
  // Add debug logging to see what data is received
  console.log(`UserStoryColumn ${title} - tasksByStoryId:`, tasksByStoryId);
  console.log(`UserStoryColumn ${title} - stories:`, stories);
  
  const getSprintStatus = () => {
    if (!sprint) return 'active';
    const now = new Date();
    if (new Date(sprint.start_date) > now) {
      return 'future';
    } else if (new Date(sprint.end_date) < now) {
      return 'past';
    }
    return 'active';
  };
  
  const sprintStatus = getSprintStatus();

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
                {sprintStatus !== 'past' && (
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
                {tasksByStoryId ? (
                  tasksByStoryId[story.id] && tasksByStoryId[story.id].length > 0 ? (
                    <ListGroup>
                      {tasksByStoryId[story.id].map((task) => (
                        <ListGroup.Item key={task.id}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="fw-semibold">{task.title}</div>
                            <Badge bg={
                              task.status === 'COMPLETED' ? 'success' : 
                              task.status === 'IN_PROGRESS' ? 'warning' : 
                              task.status === 'UNASSIGNED' ? 'secondary' : 'info'
                            }>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {task.description && <small className="text-muted d-block mt-1">{task.description}</small>}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <p className="text-muted">This story has no tasks yet. Tasks help track and manage the implementation work.</p>
                  )
                ) : (
                  <div className="text-center my-3">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <small>Loading tasks...</small>
                  </div>
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