import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button, Form, Alert, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { updateStory, createStory, fetchStories, fetchBacklogStories } from '../store/slices/storySlice';

const AddUserStory = ({ show, handleClose, onUserStoryAdded, userStoryData, isEditMode, projectId: propProjectId }) => {
  const params = useParams();
  const projectId = propProjectId || params.projectId;
  const sprintId = params.sprintId;
  const dispatch = useDispatch();
  const { backlogStories, error: storyError } = useSelector(state => state.stories);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [developers, setDevelopers] = useState([]); // State to store developers

  const getDefaultState = () => ({
    name: '',
    text: '',
    acceptance_tests: '',
    priority: 'MUST_HAVE',
    business_value: '',
    status: 'NOT_STARTED',
    sprint: sprintId || null,
    assigned_to: null, // New field for assigned developer
    story_points: '',
    project: params.projectId,
  });
  const [formData, setFormData] = useState(getDefaultState());

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
        story_points: userStoryData.story_points || defaultState.story_points,
      });
    } else {
      setFormData(getDefaultState());
    }
  }, [isEditMode, userStoryData, sprintId]);

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
      story_points: formData.story_points ? parseInt(formData.story_points, 10) : null,
      project: projectId,
    };

    try {
      if (isEditMode) {
        await dispatch(updateStory({ storyId: userStoryData.id, storyData: formattedData })).unwrap();
      } else {
        console.log('Creating new user story');
        const result = await dispatch(createStory({
          sprintId: sprintId, // Explicitly set to null for backlog stories
          storyData: formattedData,
          projectId
        })).unwrap();
        console.log('Story created successfully:', result);
      }
      if (sprintId) {
        dispatch(fetchStories({ projectId, sprintId }));
      }
      if (projectId) {
        dispatch(fetchBacklogStories(projectId));
      }
      if (onUserStoryAdded) {
        onUserStoryAdded();
      }
      handleClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred.');
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
            <Form.Label>Business Value</Form.Label>
            <Form.Control
              type="number"
              name="business_value"
              value={formData.business_value}
              onChange={handleChange}
              min="1"
              max="10"
              required
            />
          </Form.Group>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update User Story' : 'Add User Story')}
          </Button>
        </Form>

        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        {storyError && <Alert variant="danger" className="mt-3">{storyError}</Alert>}
      </Modal.Body>
    </Modal>
  );
};

export default AddUserStory;