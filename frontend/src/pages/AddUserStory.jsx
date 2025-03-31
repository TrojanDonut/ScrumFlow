import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button, Form, Alert, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { updateStory, createStory, fetchStories } from '../store/slices/storySlice';

const AddUserStory = ({ show, handleClose, onUserStoryAdded, userStoryData, isEditMode }) => {
  const { projectId, sprintId } = useParams();
  const dispatch = useDispatch();
  const defaultState = {
    name: '',
    text: '',
    acceptance_tests: '',
    priority: 'MUST_HAVE',
    business_value: '',
    status: 'NOT_STARTED',
    sprint: sprintId,
    story_points: 2
  };
  const [formData, setFormData] = useState(defaultState);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && userStoryData) {
      setFormData({
        name: userStoryData.name || defaultState.name,
        text: userStoryData.text || defaultState.text,
        acceptance_tests: userStoryData.acceptance_tests || defaultState.acceptance_tests,
        priority: userStoryData.priority || defaultState.priority, 
        business_value: userStoryData.business_value || defaultState.business_value,
        status: userStoryData.status || defaultState.status,
        sprint: userStoryData.sprint || defaultState.sprint,
        story_points: 2
      });
    } else {
      setFormData(defaultState);
    }
  }, [isEditMode, userStoryData]);

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

    const formattedData = {
      ...formData,
      sprint: parseInt(formData.sprint, 10),
      business_value: parseInt(formData.business_value, 10),
  };

    try {
      if (isEditMode) {
        // Update existing user story
        console.log('Updating user story:', formData);
        dispatch(updateStory({ storyId: userStoryData.id, storyData: formattedData }));
      } else {
        dispatch(createStory({ sprintId, storyData: formattedData }));
      }
      dispatch(fetchStories({ projectId, sprintId }));
      handleClose(); // Close the modal after success
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
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit User Story' : 'Add New User Story'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </Form.Select>
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
              <option value="MUST_HAVE">Must Have</option>
              <option value="SHOULD_HAVE">Should Have</option>
              <option value="COULD_HAVE">Could Have</option>
              <option value="WONT_HAVE">Won't Have This Time</option>
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
            {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update User Story' : 'Add User Story')}
          </Button>
        </Form>

        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Modal.Body>
    </Modal>
  );
};

export default AddUserStory;