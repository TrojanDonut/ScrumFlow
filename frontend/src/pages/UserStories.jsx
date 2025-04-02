import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Alert, ListGroup, Collapse } from 'react-bootstrap';
import { fetchStories, removeStoryFromSprint } from '../store/slices/storySlice';
import { useDispatch, useSelector } from 'react-redux';
import AddUserStory from './AddUserStory';
import UserStoryColumn from './UserStoryColumn'; // Import the new component
import './UserStories.css';

const UserStories = () => {
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [expandedStoryId, setExpandedStoryId] = useState(null);
  const dispatch = useDispatch();
  const { stories } = useSelector((state) => state.stories);

  useEffect(() => {
    dispatch(fetchStories({ projectId: projectId, sprintId: sprintId }));
  }, [projectId, sprintId]);

  const handleUserStoryAdded = (newStory) => {
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

  const handleRemoveFromSprint = async (storyId) => {
    try {
      await dispatch(removeStoryFromSprint({ storyId })).unwrap();
      dispatch(fetchStories({ projectId, sprintId })); // Re-fetch stories
    } catch (err) {
      setError('Failed to remove story from sprint.');
    }
  };

  // Divide stories into categories based on their state
  const states = ['NOT_STARTED', 'IN_PROGRESS', 'DONE', 'ACCEPTED', 'REJECTED'];
  const categorizedStories = states.map((state) =>
    stories.filter((story) => story.status === state)
  );
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
      <div className="row">
        {states.map((state, index) => (
          <UserStoryColumn
            key={state}
            title={state}
            stories={categorizedStories[index]}
            onEdit={handleEditStory}
            onToggleExpand={toggleExpandStory}
            expandedStoryId={expandedStoryId}
            onRemoveFromSprint={handleRemoveFromSprint}
          />
        ))}
      </div>

      {/* AddUserStory Modal */}
      <AddUserStory
        show={showModal}
        handleClose={() => setShowModal(false)}
        onUserStoryAdded={handleUserStoryAdded}
        userStoryData={selectedStory}
        isEditMode={isEditMode}
      />
    </div>
  );
};

export default UserStories;