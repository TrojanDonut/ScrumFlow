import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Button, Modal, Form, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { addMemberToProject, removeMemberFromProject, clearProjectError, fetchProjectById } from '../store/slices/projectSlice';
import { formatErrorMessage } from '../utils/errorUtils';

const AssignedUsersList = ({ projectId }) => {
  const dispatch = useDispatch();
  const { members, error, currentProject } = useSelector(state => state.projects);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [role, setRole] = useState('DEVELOPER');

  const handleAddUser = () => {
    if (selectedUser) {
      dispatch(addMemberToProject({ projectId, userId: selectedUser, role }));
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser('');
    setRole('DEVELOPER');
  };

  const handleUserDelete = (userId) => {
    dispatch(removeMemberFromProject({ userId, projectId }));
  };

  return (
    <Card>
      <Card.Header>
        <h5>Assigned Users</h5>
      </Card.Header>
      <ListGroup variant="flush">
        {currentProject && currentProject.members && currentProject.members.map(user => (
          <ListGroup.Item key={user.id}>
            {user.user.username} - {user.role}
            <Button variant="danger" onClick={() => handleUserDelete(user.id)} style={{ float: 'right' }}>
              Delete
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Card.Body>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Add User
        </Button>
      </Card.Body>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add User to Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" onClose={() => dispatch(clearProjectError())} dismissible>
              {formatErrorMessage(error)}
            </Alert>
          )}
          <Form>
            <Form.Group controlId="formUserSelect">
              <Form.Label>Select User</Form.Label>
              <Form.Control as="select" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                <option value="">Select a user</option>
                {members.map(user => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="formUserRole">
              <Form.Label>Role</Form.Label>
              <Form.Control as="select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="DEVELOPER">Developer</option>
                <option value="SCRUM_MASTER">Scrum Master</option>
                <option value="PRODUCT_OWNER">Product Owner</option>
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddUser}>
            Add User
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default AssignedUsersList;