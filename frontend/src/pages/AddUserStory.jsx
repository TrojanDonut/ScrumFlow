import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button, Form, Alert, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { updateStory, createStory, fetchStories, fetchBacklogStories } from '../store/slices/storySlice';
import { fetchProjectDevelopers } from '../store/slices/userSlice';

const AddUserStory = ({ show, handleClose, onUserStoryAdded, userStoryData, isEditMode, projectId: propProjectId }) => {
  const params = useParams();
  const projectId = propProjectId || params.projectId;
  const sprintId = params.sprintId;
  const dispatch = useDispatch();

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
    story_points: 2,
    assigned_to: null, // New field for assigned developer
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
        assigned_to: userStoryData.assigned_to || defaultState.assigned_to, // Pre-fill assigned developer
      });
    } else {
      setFormData(getDefaultState());
    }
  }, [isEditMode, userStoryData, sprintId]);

  useEffect(() => {
    // Fetch developers for the project
    const fetchDevelopers = async () => {
      try {
        const result = await dispatch(fetchProjectDevelopers(projectId)).unwrap();
        setDevelopers(result); // Store developers in state
      } catch (err) {
        console.error('Failed to fetch developers:', err);
      }
    };

    if (projectId) {
      fetchDevelopers();
    }
  }, [projectId, dispatch]);

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
      project: projectId,
    };

    try {
      if (isEditMode) {
        await dispatch(updateStory({ storyId: userStoryData.id, storyData: formattedData })).unwrap();
      } else {
        await dispatch(createStory({ sprintId: null, storyData: formattedData, projectId })).unwrap();
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
                    <Form.Group className="mb-3">
            <Form.Label>Assign Developer</Form.Label>
            <Form.Select
              name="assigned_to"
              value={formData.assigned_to || ''}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              {developers.map((dev) => (
                <option key={dev.id} value={dev.id}>
                  {dev.username}
                </option>
              ))}
            </Form.Select>
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