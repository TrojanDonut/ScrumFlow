import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button, Form, Alert, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { updateStory, createStory, fetchStories, fetchBacklogStories } from '../store/slices/storySlice';

const AddUserStory = ({ show, handleClose, onUserStoryAdded, userStoryData, isEditMode, projectId: propProjectId }) => {
  // Allow projectId to be passed as prop (for ProductBacklog) or from URL params (for Sprint UserStories)
  const params = useParams();
  const projectId = propProjectId || params.projectId;
  const sprintId = params.sprintId;
  const dispatch = useDispatch();
  
  // Move defaultState outside of the component or memoize it
  const getDefaultState = () => ({
    name: '',
    text: '',
    acceptance_tests: '',
    priority: 'MUST_HAVE',
    business_value: '',
    status: 'NOT_STARTED',
    sprint: sprintId || null, // If sprintId is undefined, set to null (for product backlog)
    story_points: 2
  });
  
  const [formData, setFormData] = useState(getDefaultState());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && userStoryData) {
      const defaultState = getDefaultState();
      setFormData({
        name: userStoryData.name || defaultState.name,
        text: userStoryData.text || defaultState.text,
        acceptance_tests: userStoryData.acceptance_tests || defaultState.acceptance_tests,
        priority: userStoryData.priority || defaultState.priority, 
        business_value: userStoryData.business_value || defaultState.business_value,
        status: userStoryData.status || defaultState.status,
        sprint: userStoryData.sprint || defaultState.sprint,
        story_points: userStoryData.story_points || defaultState.story_points
      });
    } else {
      setFormData(getDefaultState());
    }
  }, [isEditMode, userStoryData, sprintId]); // Remove defaultState from dependencies

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
      sprint: formData.sprint ? parseInt(formData.sprint, 10) : null,
      business_value: parseInt(formData.business_value, 10),
      story_points: parseInt(formData.story_points, 10),
      project: projectId // Explicitly set the project ID
    };

    console.log('Submitting story with data:', formattedData);
    console.log('Project ID:', projectId);

    try {
      if (isEditMode) {
        console.log('Updating user story:', formData);
        await dispatch(updateStory({ storyId: userStoryData.id, storyData: formattedData })).unwrap();
      } else {
        console.log('Creating new user story');
        const result = await dispatch(createStory({ 
          sprintId: null, // Explicitly set to null for backlog stories
          storyData: formattedData,
          projectId
        })).unwrap();
        console.log('Story created successfully:', result);
      }
      
      onUserStoryAdded(); // Notify parent component
      setFormData({
        name: '',
        text: '',
        acceptance_tests: '',
        priority: 'MUST_HAVE',
        business_value: '',
      });

      // Refresh appropriate data based on context
      if (sprintId) {
        dispatch(fetchStories({ projectId, sprintId }));
      }
      
      // Always refresh backlog stories for both contexts
      if (projectId) {
        dispatch(fetchBacklogStories(projectId));
      }
      
      if (onUserStoryAdded) {
        onUserStoryAdded();
      }
      
      handleClose(); // Close the modal after success
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.detail || 'An error occurred.');
      } else if (typeof err === 'string') {
        setError(err);
      } else if (err.message) {
        setError(err.message);
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