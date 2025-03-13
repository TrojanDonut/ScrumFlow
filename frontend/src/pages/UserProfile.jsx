import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fetchCurrentUser } from '../store/slices/authSlice';
import { FaCheckCircle } from 'react-icons/fa';

const UserProfile = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: ''
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    }
  }, [user]);

  // Effect to handle success message timeout
  useEffect(() => {
    let timer;
    if (success) {
      timer = setTimeout(() => {
        setSuccess(false);
        setSuccessMessage('');
      }, 5000);
    }
    
    // Cleanup timer on component unmount or when success changes
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSuccessMessage('');
    setLoading(true);

    try {
      await axios.put('/users/profile/update/', formData);
      console.log('Profile update successful');
      
      // Set success state and message
      setSuccessMessage(`Profile updated successfully! Username: ${formData.username}`);
      setSuccess(true);
      
      // Refresh user data
      dispatch(fetchCurrentUser());
      
      setLoading(false);
      
      // Timeout is now handled by the useEffect
    } catch (err) {
      console.error('Profile update error:', err);
      setLoading(false);
      if (err.response && err.response.data) {
        setError(err.response.data);
      } else {
        setError({ detail: 'An error occurred. Please try again.' });
      }
    }
  };

  return (
    <Row className="justify-content-md-center">
      <Col md={8}>
        <Card>
          <Card.Header as="h4">Update Profile Information</Card.Header>
          <Card.Body>
            {error && (
              <Alert variant="danger">
                {error.detail ? error.detail : 
                  Object.entries(error).map(([key, value]) => (
                    <div key={key}><strong>{key}:</strong> {value}</div>
                  ))
                }
              </Alert>
            )}
            
            {success && (
              <Alert variant="success">
                <Alert.Heading>
                  <FaCheckCircle className="me-2" />
                  Profile Updated Successfully!
                </Alert.Heading>
                <p>
                  {successMessage || "Your profile information has been updated. The changes are now visible throughout the system."}
                </p>
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <Form.Text className="text-muted">
                  Your unique username for logging in.
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </Form.Group>
              
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default UserProfile; 