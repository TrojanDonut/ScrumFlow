import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { generateTaskStatusTag } from './TaskUtils';
import AddTaskModal from './AddTaskModal';
import TimeTracking from './TimeTracking';
import { useSelector, useDispatch } from 'react-redux';
import { acceptTask, completeTask, stopWorkingOnTask, unassignTask } from '../store/slices/taskSlice';
import EditTaskModal from './EditTaskModal';
const StoryTaskDetails = ({ show, handleClose, story, tasks, users, sprintStatus, currentProjectRole, onTaskAdded, handleRejectStory, handleAcceptStory }) => {
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
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


  // Handler for when time is logged
  const handleTimeLogged = (taskId) => {
    // Refresh the task data after time logging
    const updatedTasks = [...localTasks];
    setLocalTasks(updatedTasks);

    // Call the parent component's refresh method if provided
    if (onTaskAdded) {
      onTaskAdded(story.id, { refresh: true });
    }
  };

  const handleAcceptTask = (taskId) => {
    dispatch(acceptTask(taskId))
      .unwrap()
      .then((updatedTask) => {
        console.log('Task accepted:', updatedTask);
        setLocalTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
        );
      })
      .catch((error) => {
        console.error('Failed to accept task:', error);
      });
  };

  const handleRejectTask = (taskId) => {
    dispatch(unassignTask(taskId))
      .unwrap()
      .then((updatedTask) => {
        console.log('Task rejected:', updatedTask);
        setLocalTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
        );
      })
      .catch((error) => {
        console.error('Failed to reject task:', error);
      });
  };

  const handleStopWorkingOnTask = (taskId) => {
    dispatch(stopWorkingOnTask(taskId))
      .unwrap()
      .then((stoppedTask) => {
        console.log('Task stopped:', stoppedTask);
        setLocalTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === stoppedTask.id ? stoppedTask : task))
        );
      })
      .catch((error) => {
        console.error('Failed to stop working on task:', error);
      });
  };

  const handleCompleteTask = (taskId) => {
    dispatch(completeTask(taskId))
      .unwrap()
      .then((completedTask) => {
        console.log('Task completed:', completedTask);
        setLocalTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === completedTask.id ? completedTask : task))
        );
      })
      .catch((error) => {
        console.error('Failed to complete task:', error);
      });
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowEditTaskModal(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    setLocalTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleTaskDeleted = (taskId) => {
    setLocalTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const renderEditTaskModal = () => {
    if (!selectedTask) return null;

    return (
      <EditTaskModal
        show={showEditTaskModal}
        handleClose={() => setShowEditTaskModal(false)}
        task={selectedTask}
        users={users}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    );
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
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              className="me-2"
                              onClick={() => handleAcceptTask(task.id)}
                            >
                              Accept task
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="me-2"
                              onClick={() => handleRejectTask(task.id)}
                            >
                              Reject task
                            </Button>
                          </>
                        )}
                        {(task.status === "IN_PROGRESS") && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleCompleteTask(task.id)}
                            >
                              Complete task
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="me-2"
                              onClick={() => handleStopWorkingOnTask(task.id)}
                            >
                              Unassign
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => handleEditTask(task)}
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
        {story.status === 'DONE' && currentProjectRole === 'PRODUCT_OWNER' && (
          <>
            <Button
              variant="success"
              onClick={() => {
                handleAcceptStory(story.id);
                handleClose();
              }}
            >
              Accept Story
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                handleRejectStory(story.id);
                handleClose();
              }}
            >
              Reject Story
            </Button>
          </>
        )}
        {story.status !== 'DONE' && sprintStatus === 'active' && (
          <Button variant="outline-primary" onClick={() => setShowAddTaskModal(true)}>
              Add new task
          </Button>
        )}
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Edit Task Modal */}
    {renderEditTaskModal()}

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
