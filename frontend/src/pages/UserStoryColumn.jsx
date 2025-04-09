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
}) => {
  // const dispatch = useDispatch();

  // // Select tasks and loading states from the Redux store
  // const tasks = useSelector((state) => state.tasks.tasksByStoryId);
  // const loadingTasks = useSelector((state) => state.tasks.loadingByStoryId);

  // const handleToggleExpand = (storyId) => {
  //   onToggleExpand(storyId);

  //   // Dispatch fetchTasks if tasks for the story are not already loaded
  //   if (!tasks[storyId]) {
  //     dispatch(fetchTasks(storyId));
  //     console.log('Tasks:', tasks);
  //     console.log('Loading Tasks:', loadingTasks);
  //   }
  // };

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
                    <h5>Tasks:</h5>
                    <ul>
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
                  <Button
                    variant="outline-primary"
                    className="me-2"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering expand/collapse
                      onEdit(story);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering expand/collapse
                      onRemoveFromSprint(story.id);
                    }}
                  >
                    Remove
                  </Button>
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