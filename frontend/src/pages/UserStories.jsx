import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Alert, ListGroup, Collapse } from 'react-bootstrap'; // Import Collapse from react-bootstrap
import { fetchStories } from '../store/slices/storySlice';
import { useDispatch, useSelector } from 'react-redux';
import AddUserStory from './AddUserStory'; // Import the AddUserStory component

const UserStories = () => {
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [isEditMode, setIsEditMode] = useState(false); // State to track if modal is in edit mode
  const [selectedStory, setSelectedStory] = useState(null); // State to hold the selected story for editing
  const [expandedStoryId, setExpandedStoryId] = useState(null); // State to track expanded story
  const dispatch = useDispatch();
  const { stories } = useSelector((state) => state.stories);

  useEffect(() => {
    dispatch(fetchStories({ projectId: projectId, sprintId: sprintId }));
  }, [projectId, sprintId]);

  const handleUserStoryAdded = (newStory) => {
    // Optionally handle the new story (e.g., refresh the list or update state)
    dispatch(fetchStories({ projectId: projectId, sprintId: sprintId }));
  };

  const handleEditStory = (story) => {
    setSelectedStory(story);
    setIsEditMode(true);
    setShowModal(true);
  };

  const toggleExpandStory = (storyId) => {
    setExpandedStoryId(expandedStoryId === storyId ? null : storyId);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <h1>User Stories for Sprint {sprintId}</h1>
        <Button
          variant="primary"
          onClick={() => {
            setSelectedStory(null);
            setIsEditMode(false);
            setShowModal(true);
          }}
        >
          Add New User Story
        </Button>
      </div>
      <p>Project ID: {projectId}</p>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      {stories.length > 0 ? (
        <ListGroup>
          {stories.map((story) => (
            <ListGroup.Item key={story.id} className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{story.name}</strong> - {story.priority} (Business Value (€): {story.business_value})
                </div>
                <div>
                  <Button
                    variant="outline-primary"
                    className="me-2"
                    onClick={() => handleEditStory(story)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => toggleExpandStory(story.id)}
                  >
                    {expandedStoryId === story.id ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
              <Collapse in={expandedStoryId === story.id}>
                <div className="mt-2">
                  <p>{story.text}</p>
                </div>
              </Collapse>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <p>No user stories available.</p>
      )}

      {/* AddUserStory Modal */}
      <AddUserStory
        show={showModal}
        handleClose={() => setShowModal(false)} // Close the modal
        onUserStoryAdded={handleUserStoryAdded} // Callback for when a story is added
        userStoryData={selectedStory} // Pass the selected story for editing
        isEditMode={isEditMode} // Pass the edit mode flag
      />
    </div>
  );
};

export default UserStories;