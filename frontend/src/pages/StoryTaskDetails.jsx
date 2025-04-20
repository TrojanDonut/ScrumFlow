import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { generateTaskStatusTag } from './TaskUtils';
import AddTaskModal from './AddTaskModal';
import TimeTracking from './TimeTracking';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { acceptTask, assignTask, unassignTask } from '../store/slices/taskSlice';

const StoryTaskDetails = ({ show, handleClose, story, tasks, users, sprintStatus, currentProjectRole, onTaskAdded, handleRejectStory, handleAcceptStory }) => {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [localTasks, setLocalTasks] = useState([]);
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  
  // Update local tasks when tasks prop changes
  useEffect(() => {
    if (tasks) {
      setLocalTasks([...tasks]);
    }
  }, [tasks]);
  
  // Get usernames for assigned tasks
  const getUsername = (id) => {
    const user = users.find((user) => user.user.id === id);
    return user ? user.user.username : 'nobody';
  };

  return (
    <>
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <h3>{story.name}</h3>
          <h5>{story.priority} - {story.status}</h5>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Business value: {story.business_value}</strong></p>
        <h4>Description:</h4>
        <p>{story.text}</p>
        <h4>Acceptance tests:</h4>
        <p>{story.acceptance_tests}</p>
        <hr />
        <h4>Tasks:</h4>
        {localTasks.length > 0 ? (
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {localTasks.map((task) => (
              <li key={task.id} style={{ 
                marginBottom: '30px', 
                padding: '15px', 
                border: task.assigned_to === currentUser.id ? '1px solid blue' : '1px solid #dee2e6', 
                borderRadius: '5px',
              }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>{task.title}</strong>
                    {generateTaskStatusTag(task.status)}
                  </div>
                  <div>
                    {task.assigned_to === currentUser.id && (
                      <>
                        {task.status === "ASSIGNED" && (
                          <Button
                            variant="success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleAcceptTask(task.id)}
                          >
                            Accept task
                          </Button>
                        )}
                        {(task.status === "IN_PROGRESS" || task.status === "ASSIGNED") && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="me-2"
                            onClick={() => handleRejectTask(task.id)}
                          >
                            Reject task
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant="warning"
                      size="sm"
                      // onClick={() => handleEditTask(task.id)}
                    >
                      Edit task
                    </Button>
                  </div>
                </div>
                <div>assigned to: {getUsername(task.assigned_to)}</div>
                <div>estimated time: {Math.round(task.estimated_hours)}h</div>
                <div>{task.description}</div>
                <TimeTracking 
                  task={task} 
                  onTimeLogged={() => handleTimeLogged(task.id)} 
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>No tasks available for this story.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        {story.status !== 'DONE' && sprintStatus === 'active' && (  // todo - also check if the sprint is active
          <Button variant="outline-primary" onClick={() => setShowAddTaskModal(true)}>
              Add new task
          </Button>
        )}
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Add Task Modal */}
    <AddTaskModal
      show={showAddTaskModal}
      handleClose={() => setShowAddTaskModal(false)}
      storyId={story.id}
      users={users}
      onTaskAdded={(storyId, taskData) => {
        onTaskAdded(storyId, taskData);
        handleClose();
      }}
    />
    </>
  );
};

export default StoryTaskDetails;
