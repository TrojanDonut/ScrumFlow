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

    // Handle change for all form fields
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      
      // Special handling for assigned_to field
      if (name === 'assigned_to') {
        setTaskData((prev) => ({
          ...prev,
          [name]: value,
          // Set status to ASSIGNED if a user is assigned, otherwise UNASSIGNED
          status: value && value !== '' ? 'ASSIGNED' : 'UNASSIGNED',
        }));
      } else {
        setTaskData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Final check to ensure status is set correctly
      const finalTaskData = {
        ...taskData,
        status: taskData.assigned_to ? 'ASSIGNED' : 'UNASSIGNED'
      };
      
      onTaskAdded(storyId, finalTaskData); // Call the parent function to add the task
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
                <option value="">-- assign developer later --</option>
                {users.map((user) => (
                  <option key={user.user.id} value={user.user.id}>
                    {user.user.username}
                  </option>
                ))}
              </Form.Select>
              {taskData.assigned_to && (
                <div className="text-success mt-1">
                  Task will be marked as ASSIGNED
                </div>
              )}
            </Form.Group>
            <Form.Group className="text-end">
              <Button variant="secondary" className="me-2" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Add Task
              </Button>
            </Form.Group>
          </Form>
        </Modal.Body>
      </Modal>
    );
};

export default AddTaskModal;