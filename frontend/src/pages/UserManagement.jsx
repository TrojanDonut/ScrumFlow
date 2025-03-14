import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Alert, Table, Spinner, Modal, Form, InputGroup, ProgressBar } from 'react-bootstrap';
import { fetchUsers, createUser, updateUser, deleteUser, clearUserError } from '../store/slices/userSlice';
import { formatErrorMessage } from '../utils/errorUtils';
import { FaEye, FaEyeSlash, FaLock, FaEdit, FaTrash } from 'react-icons/fa';

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector(state => state.users);
  const { user: currentUser } = useSelector(state => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'DEVELOPER'
  });
  const [editUser, setEditUser] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: '',
    is_active: true
  });
  const [successMessage, setSuccessMessage] = useState('');

  // Check if current user is a system admin
  const isSystemAdmin = currentUser && currentUser.role === 'SYSTEM_ADMIN';

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    // Calculate password strength
    if (newUser.password.length === 0) {
      setPasswordStrength(0);
      setPasswordFeedback('Enter password');
      return;
    }
    
    let strength = 0;
    let feedback = '';
    
    // Check length
    if (newUser.password.length < 12) {
      feedback = 'Password is too short (min 12 characters)';
    } else if (newUser.password.length > 128) {
      feedback = 'Password is too long (max 128 characters)';
    } else {
      strength += 20;
      feedback = 'Password length is good';
    }
    
    // Check for lowercase letters
    if (/[a-z]/.test(newUser.password)) {
      strength += 20;
    }
    
    // Check for uppercase letters
    if (/[A-Z]/.test(newUser.password)) {
      strength += 20;
    }
    
    // Check for numbers
    if (/[0-9]/.test(newUser.password)) {
      strength += 20;
    }
    
    // Check for special characters
    if (/[^A-Za-z0-9]/.test(newUser.password)) {
      strength += 20;
    }
    
    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  }, [newUser.password]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditUser({
      ...editUser,
      [name]: value
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setEditUser({
      ...editUser,
      [name]: checked
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (newUser.password !== newUser.password_confirm) {
      // Instead of using an alert, we'll let the form validation handle this
      return;
    }
    
    if (newUser.password.length < 12) {
      // Instead of using an alert, we'll let the form validation handle this
      return;
    }
    
    dispatch(createUser(newUser))
      .unwrap()
      .then(() => {
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
        setPasswordStrength(0);
        setPasswordFeedback('');
        setShowPassword(false);
        setShowPasswordConfirm(false);
        
        // Set success message
        setSuccessMessage(`User ${newUser.username} has been created successfully.`);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
        
        // Refresh the user list
        dispatch(fetchUsers());
      })
      .catch((error) => {
        console.error('Error creating user:', error);
        // The error will be handled by the reducer and displayed in the UI
      });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    dispatch(updateUser({ userId: selectedUser.id, userData: editUser }))
      .unwrap()
      .then(() => {
        setShowEditModal(false);
        
        // Set success message
        setSuccessMessage(`User ${editUser.username} has been updated successfully.`);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
        
        setSelectedUser(null);
        setEditUser({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          role: '',
          is_active: true
        });
        
        // Refresh the user list
        dispatch(fetchUsers());
      })
      .catch((error) => {
        console.error('Error updating user:', error);
        // The error will be handled by the reducer and displayed in the UI
      });
  };

  const handleDeleteUser = () => {
    const username = selectedUser.username;
    
    dispatch(deleteUser(selectedUser.id))
      .unwrap()
      .then(() => {
        setShowDeleteModal(false);
        
        // Set success message
        setSuccessMessage(`User ${username} has been deleted successfully.`);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
        
        setSelectedUser(null);
        
        // Refresh the user list
        dispatch(fetchUsers());
      })
      .catch((error) => {
        console.error('Error deleting user:', error);
        // The error will be handled by the reducer and displayed in the UI
      });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUser({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getPasswordStrengthVariant = () => {
    if (passwordStrength < 40) return 'danger';
    if (passwordStrength < 80) return 'warning';
    return 'success';
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
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4>User Management</h4>
        {isSystemAdmin && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Add New User
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => dispatch(clearUserError())}>
            {formatErrorMessage(error)}
          </Alert>
        )}
        
        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
            {successMessage}
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
              {isSystemAdmin && <th>Actions</th>}
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
                {isSystemAdmin && (
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => openEditModal(user)}
                    >
                      <FaEdit /> Edit
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => openDeleteModal(user)}
                    >
                      <FaTrash /> Delete
                    </Button>
                  </td>
                )}
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
              {error && (
                <Alert variant="danger" dismissible>
                  {formatErrorMessage(error)}
                </Alert>
              )}
              
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
                <InputGroup>
                  <InputGroup.Text>
                    <FaLock />
                  </InputGroup.Text>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    required
                    minLength={12}
                    maxLength={128}
                    onCopy={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputGroup>
                <div className="mt-2">
                  <ProgressBar 
                    now={passwordStrength} 
                    variant={getPasswordStrengthVariant()} 
                    className="mb-1"
                  />
                  <small className="text-muted">{passwordFeedback}</small>
                </div>
                <Form.Text className="text-muted">
                  Password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaLock />
                  </InputGroup.Text>
                  <Form.Control
                    type={showPasswordConfirm ? "text" : "password"}
                    name="password_confirm"
                    value={newUser.password_confirm}
                    onChange={handleInputChange}
                    required
                    onCopy={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
                  >
                    {showPasswordConfirm ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputGroup>
                {newUser.password !== newUser.password_confirm && newUser.password_confirm.length > 0 && (
                  <Form.Text className="text-danger">
                    Passwords do not match
                  </Form.Text>
                )}
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Create User
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleEditSubmit}>
              {error && (
                <Alert variant="danger" dismissible>
                  {formatErrorMessage(error)}
                </Alert>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={editUser.username}
                  onChange={handleEditInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={editUser.email}
                  onChange={handleEditInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="first_name"
                  value={editUser.first_name}
                  onChange={handleEditInputChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="last_name"
                  value={editUser.last_name}
                  onChange={handleEditInputChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select
                  name="role"
                  value={editUser.role}
                  onChange={handleEditInputChange}
                  required
                >
                  <option value="SYSTEM_ADMIN">System Administrator</option>
                  <option value="PRODUCT_OWNER">Product Owner</option>
                  <option value="SCRUM_MASTER">Scrum Master</option>
                  <option value="DEVELOPER">Developer</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Active"
                  name="is_active"
                  checked={editUser.is_active}
                  onChange={handleCheckboxChange}
                />
              </Form.Group>
              
              <div className="d-grid gap-2 mt-4">
                <Button variant="primary" type="submit">
                  Update User
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Delete User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && (
              <Alert variant="danger" dismissible>
                {formatErrorMessage(error)}
              </Alert>
            )}
            
            <p>Are you sure you want to delete the user <strong>{selectedUser?.username}</strong>?</p>
            <p className="text-danger">This action cannot be undone.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  );
};

export default UserManagement; 