import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Button, Form } from 'react-bootstrap';

const AddTaskModal = ({ show, handleClose, storyId, users, onTaskAdded }) => {
    
    const CurrentUser = () => {
        const user = useSelector((state) => state.auth.user);
        const userId = user?.id || user?.user_id;
        return userId;
    };

    const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    estimated_hours: '',
    status: 'UNASSIGNED',
    story: storyId,
    assigned_to: '',
    created_by: CurrentUser(),
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    setTaskData((prev) => ({
      ...prev,
      [name]: value,
      status: name === 'assigned_to' && value !== '' ? 'ASSIGNED' : 'UNASSIGNED',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onTaskAdded(storyId, taskData); // Call the parent function to add the task
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add new task</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={taskData.title}
              onChange={handleInputChange}
              placeholder="Enter task title"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={taskData.description}
              onChange={handleInputChange}
              placeholder="Enter task description"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Estimated hours</Form.Label>
            <Form.Control
              type="number"
              name="estimated_hours"
              value={taskData.estimated_hours}
              onChange={handleInputChange}
              placeholder="Enter estimated hours"
              min="1"
              max="100"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Assign to user</Form.Label>
            <Form.Select
              name="assigned_to"
              value={taskData.assigned_to || ''}
              onChange={handleInputChange}
            >
              <option value="">...</option>
              {users.map((user) => (
                <option key={user.user.id} value={user.user.id}>
                  {user.user.username}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Button variant="primary" type="submit">
            Add Task
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddTaskModal;