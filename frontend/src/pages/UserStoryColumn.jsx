import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ListGroup, Button, Collapse, Spinner } from 'react-bootstrap';
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

                {/* Render tasks */}
                {tasksByStoryId[story.id] && tasksByStoryId[story.id].length > 0 ? (
                  <div className="mt-3">
                    <hr/>
                    <h6>Tasks:</h6>
                    <ul style={{ paddingLeft: 0, listStylePosition: 'inside' }}>
                      {tasksByStoryId[story.id].map((task) => (
                        <li key={task.id}>
                          {task.title} - {task.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 text-muted">This story has no tasks.</div>
                )}

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