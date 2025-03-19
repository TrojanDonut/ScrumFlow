import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Button, Modal, Form, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { addMemberToProject, removeMemberFromProject, updateProjectMemberRole, clearProjectError, fetchProjectById,  } from '../store/slices/projectSlice';
import { formatErrorMessage } from '../utils/errorUtils';

const AssignedUsersList = ({ projectId }) => {
  const dispatch = useDispatch();
  const { members, error, currentProject } = useSelector(state => state.projects);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [editUser, setEditUser] = useState(null);

  const handleAddUser = () => {
    if (selectedUser) {
      dispatch(addMemberToProject({ projectId, userId: selectedUser, role }));
      handleCloseModal();
    }
  };

  const handleEditUser = () => {
    if (editUser) {
      dispatch(updateProjectMemberRole({ projectId, userId: editUser.id, role }));
      handleCloseEditModal();
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser('');
    setRole('DEVELOPER');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditUser(null);
    setRole('DEVELOPER');
  };

  const handleUserDelete = (userId) => {
    dispatch(removeMemberFromProject({ userId, projectId }));
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setRole(user.role);
    setShowEditModal(true);
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
            <Button variant="outline-primary" onClick={() => openEditModal(user)} style={{ float: 'right', marginLeft: '10px' }}>
              Edit
            </Button>
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

      {/* Add User Modal */}
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

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" onClose={() => dispatch(clearProjectError())} dismissible>
              {formatErrorMessage(error)}
            </Alert>
          )}
          <Form>
            <Form.Group controlId="formEditUserRole">
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
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditUser}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default AssignedUsersList;