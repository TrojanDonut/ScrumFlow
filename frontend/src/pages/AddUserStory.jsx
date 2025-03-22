import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Form, Alert } from 'react-bootstrap';

const AddUserStory = () => {
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const [userStories, setUserStories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    acceptance_tests: '',
    priority: 'must have',
    business_value: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
    
      if (isNaN(formData.business_value) || formData.business_value <= 0) {
        setError('Business value must be a positive number.');
        setLoading(false);
        return;
      }
    
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/projects/${projectId}/sprints/${sprintId}/user-stories/`,
          {
            name: formData.name,
            text: formData.text,
            acceptance_tests: formData.acceptance_tests,
            priority: formData.priority,
            business_value: parseInt(formData.business_value, 10),
            project: projectId,
            sprint: sprintId,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
        setUserStories([...userStories, response.data]);
        setFormData({
          name: '',
          text: '',
          acceptance_tests: '',
          priority: 'must have',
          business_value: '',
        });
        navigate(`/projects/${projectId}/sprints/${sprintId}/user-stories`); // Redirect after success
      } catch (err) {
        if (err.response && err.response.data) {
          setError(err.response.data.detail || 'An error occurred.');
        } else {
          setError('An error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

  return (
    <div>
      <h1>Add New User Story</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            name="text"
            value={formData.text}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Acceptance Tests</Form.Label>
          <Form.Control
            as="textarea"
            name="acceptance_tests"
            value={formData.acceptance_tests}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Priority</Form.Label>
          <Form.Select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
          >
            <option value="must have">Must Have</option>
            <option value="should have">Should Have</option>
            <option value="could have">Could Have</option>
            <option value="won't have this time">Won't Have This Time</option>
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Business Value (€)</Form.Label>
          <Form.Control
            type="number"
            name="business_value"
            value={formData.business_value}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Adding...' : 'Add User Story'}
        </Button>
      </Form>

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
};

export default AddUserStory;
