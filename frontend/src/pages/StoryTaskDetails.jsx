import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { generateTaskStatusTag } from './TaskUtils';
import AddTaskModal from './AddTaskModal';

const StoryTaskDetails = ({ show, handleClose, story, tasks, users, sprintStatus, onTaskAdded }) => {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  
  // get usernames for assigned tasks
  const getUsername = (id) => {
    const user = users.find((user) => user.user.id === id);
    return user ? user.user.username : 'nobody';
  };

  return (
    <>
    <Modal show={show} onHide={handleClose}>
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
        {tasks.length > 0 ? (
          <ul>
            {tasks.map((task) => (
              <li key={task.id} style={{ marginBottom: '15px' }}>
                <div>
                  <strong>{task.title}</strong>
                  {generateTaskStatusTag(task.status)}
                </div>
                <div>assigned to: {getUsername(task.assigned_to)}</div>
                <div>estimated time: {Math.round(task.estimated_hours)}h</div>
                <div>{task.description}</div>
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
      onTaskAdded={onTaskAdded}
    />
    </>
  );
};

export default StoryTaskDetails;
