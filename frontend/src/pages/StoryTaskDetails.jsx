import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { generateTaskStatusTag } from './TaskUtils';
import AddTaskModal from './AddTaskModal';
import TimeTracking from './TimeTracking';
import axios from 'axios';

const StoryTaskDetails = ({ show, handleClose, story, tasks, users, sprintStatus, onTaskAdded }) => {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [localTasks, setLocalTasks] = useState([]);
  
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

  // Handle task refresh when time is logged
  const handleTimeLogged = async (taskId) => {
    try {
      // Fetch the updated task directly to get the latest status
      const response = await axios.get(`http://localhost:8000/api/tasks/${taskId}/`);
      const updatedTask = response.data;
      
      // Update the local task in our state
      setLocalTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
      );
      
      // Also notify the parent component
      if (onTaskAdded) {
        onTaskAdded(story.id, null);
      }
    } catch (error) {
      console.error('Error refreshing task:', error);
      // Fall back to parent refresh if direct fetch fails
      if (onTaskAdded) {
        onTaskAdded(story.id, null);
      }
    }
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
              <li key={task.id} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>{task.title}</strong>
                    {generateTaskStatusTag(task.status)}
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

    {/* Add Task Modal */}
    <AddTaskModal
      show={showAddTaskModal}
      handleClose={() => setShowAddTaskModal(false)}
      storyId={story.id}
      users={users}
      onTaskAdded={(storyId, taskData) => {
        // Update local tasks immediately if we have taskData
        if (taskData) {
          setLocalTasks(prev => [...prev, taskData]);
        }
        
        // Notify parent component
        onTaskAdded(storyId, taskData);
        setShowAddTaskModal(false);
      }}
    />
    </>
  );
};

export default StoryTaskDetails;
