import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Alert, Table, Spinner, Modal, Form } from 'react-bootstrap';
import { fetchUsers, createUser, clearUserError } from '../store/slices/userSlice';

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector(state => state.users);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'DEVELOPER'
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createUser(newUser))
      .then((result) => {
        if (createUser.fulfilled.match(result)) {
          setShowModal(false);
          setNewUser({
            username: '',
            email: '',
            password: '',
            password_confirm: '',
            first_name: '',
            last_name: '',
            role: 'DEVELOPER'
          });
        }
      });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>User Management</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>Create User</Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => dispatch(clearUserError())} dismissible>
          {typeof error === 'object' 
            ? Object.entries(error).map(([key, value]) => `${key}: ${value}`).join(', ') 
            : error}
        </Alert>
      )}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Full Name</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{`${user.first_name} ${user.last_name}`}</td>
              <td>{user.role}</td>
              <td>{user.is_active ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={newUser.username}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="first_name"
                value={newUser.first_name}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="last_name"
                value={newUser.last_name}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="role"
                value={newUser.role}
                onChange={handleInputChange}
                required
              >
                <option value="SYSTEM_ADMIN">System Administrator</option>
                <option value="PRODUCT_OWNER">Product Owner</option>
                <option value="SCRUM_MASTER">Scrum Master</option>
                <option value="DEVELOPER">Developer</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="password_confirm"
                value={newUser.password_confirm}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserManagement; 