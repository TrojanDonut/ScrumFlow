import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Alert } from 'react-bootstrap';

const StoryInfo = () => {
  const { projectId, sprintId, storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/projects/${projectId}/sprints/${sprintId}/user-stories/${storyId}`);
        setStory(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch story details.');
      }
    };
    fetchStory();
  }, [projectId, sprintId, storyId]);

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!story) {
    return <p>Loading story details...</p>;
  }

  return (
    <div>
      <h1>{story.name}</h1>
      <p><strong>Description:</strong> {story.text}</p>
      <p><strong>Acceptance Tests:</strong> {story.acceptance_tests}</p>
      <p><strong>Business Value (€):</strong> {story.business_value}</p>
      <p><strong>Priority:</strong> {story.priority}</p>
      <Button variant="primary" onClick={() => navigate(-1)}>Back</Button>
    </div>
  );
};

export default StoryInfo;
