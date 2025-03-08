import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Button, Card, ListGroup, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { fetchAllUsers, clearProjectError, fetchProjectById, removeMemberFromProject, addMemberToProject } from '../store/slices/projectSlice';

const EditProjectMembers = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const { currentProject, loading, error, members } = useSelector(state => state.projects);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [assignedUsers, setAssignedUsers] = useState([]);

  useEffect(() => {
    dispatch(fetchProjectById(id));
    dispatch(fetchAllUsers());
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProject) {
      setAssignedUsers(currentProject.members);
    }
    dispatch(fetchAllUsers());
  }, [dispatch, currentProject]);

  const handleAddUser = () => {
    if (selectedUser) {
      dispatch(addMemberToProject({ projectId: id, userId: selectedUser, role }));
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser('');
    setRole('DEVELOPER');
  };

  const handleUserDelete = (userId) => {
    dispatch(removeMemberFromProject({ userId, projectId: id }));
  };

  return (
    <div>
      <h1>Edit Project Members</h1>
      {error && (
        <Alert variant="danger" onClose={() => dispatch(clearProjectError())} dismissible>
          {error}
        </Alert>
      )}
      {loading ? (
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      ) : (
        <Card>
          <Card.Header>
            <h5>Assigned Users</h5>
          </Card.Header>
          <ListGroup variant="flush">
            {assignedUsers.map(user => (
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
        </Card>
      )}

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add User to Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
          <Button variant="primary" onClick={() => handleAddUser()}>
            Add User
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EditProjectMembers;