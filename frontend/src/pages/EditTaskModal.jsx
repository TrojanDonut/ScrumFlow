import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { updateTask, deleteTask } from '../store/slices/taskSlice';
import DeleteConfirmationModal from './DeleteTaskConfirmationModal';

const EditTaskModal = ({ show, handleClose, task, users, onTaskUpdated, onTaskDeleted }) => {
  const dispatch = useDispatch();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    estimated_hours: '',
    assigned_to: null,
    status: '',
  });

  // Populate the form with the current task data when the modal opens
  useEffect(() => {
    if (task) {
      setTaskData({
        title: task.title,
        description: task.description,
        estimated_hours: task.estimated_hours,
        assigned_to: task.assigned_to,
        status: task.status,
      });
    }
  }, [task]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'assigned_to') {
      setTaskData((prev) => ({
        ...prev,
        [name]: value,
        status: name === 'assigned_to' && value !== '' ? 'ASSIGNED' : 'UNASSIGNED',
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
    console.log("Editing task ", task.id)
    console.log("New task data: ", taskData)

    dispatch(updateTask({ taskId: task.id, taskData }))
      .unwrap()
      .then((updatedTask) => {
        console.log('Task updated:', updatedTask);
        onTaskUpdated(updatedTask);
        handleClose();
      })
      .catch((error) => {
        console.error('Failed to update task:', error);
      });
  };

  const handleDeleteTask = () => {
    dispatch(deleteTask(task.id))
      .unwrap()
      .then(() => {
        onTaskDeleted(task.id);
        setShowDeleteModal(false);
        handleClose();
      })
      .catch((error) => {
        console.error('Failed to delete task:', error);
      });
  };

  const canChangeAssignee = () => {
    var canChange = task.status === 'UNASSIGNED' || task.status === 'ASSIGNED';
    console.log("Can change assignee: ", canChange);
    return canChange
  }

  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Task - {task.title}</Modal.Title>
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
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Estimated Hours</Form.Label>
              <Form.Control
                type="number"
                name="estimated_hours"
                value={Math.round(taskData.estimated_hours)}
                onChange={handleInputChange}
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
                disabled={!canChangeAssignee()}
              >
                <option value="">-- Unassigned --</option>
                {users.map((user) => (
                  <option key={user.user.id} value={user.user.id}>
                    {user.user.username}
                  </option>
                ))}
              </Form.Select>
              {!canChangeAssignee() && (
                <div className="text-muted mt-1">
                  You can only assign to user when the task is unassigned or it hasn't yet been accepted by the asignee.
                </div>
              )}
            </Form.Group>
            <Form.Group className="d-flex justify-content-between">
              {canChangeAssignee() && (
                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                  Delete task
                </Button>
              )}
              {!canChangeAssignee() && (
                <div className="text-muted mt-1 fs-7">
                  You can only delete inactive tasks.
                </div>
              )}
              <div>
                <Button variant="secondary" className="me-2" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save changes
                </Button>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteTask}
      />
    </>
  );
};

export default EditTaskModal;