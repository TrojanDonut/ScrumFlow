import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Alert, ListGroup } from 'react-bootstrap';

const UserStories = () => {
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const [userStories, setUserStories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserStories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/projects/${projectId}/sprints/${sprintId}/user-stories/`);
        setUserStories(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserStories();
  }, [projectId, sprintId]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <h1>User Stories for Sprint {sprintId}</h1>
        <Button
          variant="primary"
          onClick={() => navigate(`/projects/${projectId}/sprints/${sprintId}/user-stories/add`)}
        >
          Add New User Story
        </Button>
      </div>
      <p>Project ID: {projectId}</p>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      {userStories.length > 0 ? (
        <ListGroup>
          {userStories.map((story) => (
            <ListGroup.Item key={story.id} className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{story.name}</strong> - {story.priority} (Business Value (€): {story.business_value})
              </div>
              <Button
                variant="outline-primary" 
                onClick={() => navigate(`/projects/${projectId}/sprints/${sprintId}/user-stories/${story.id}`)}
              >
                View
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <p>No user stories available.</p>
      )}
    </div>
  );
};

export default UserStories;
