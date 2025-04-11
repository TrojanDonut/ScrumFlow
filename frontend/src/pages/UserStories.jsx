import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Alert, ListGroup, Collapse } from 'react-bootstrap';
import { fetchStories, removeStoryFromSprint, updateStory, fetchBacklogStories } from '../store/slices/storySlice';
import { fetchSprintById } from '../store/slices/sprintSlice';
import { fetchTasksByProject } from '../store/slices/taskSlice';
import { useDispatch, useSelector } from 'react-redux';
import AddUserStory from './AddUserStory';
import UserStoryColumn from './UserStoryColumn'; // Import the new component
import AddStoryFromBacklog from './AddStoryFromBacklog'; 
import SprintEditModal from './SprintEditModal'; // Assuming you have a SprintEditModal component
import './UserStories.css';

const UserStories = () => {
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [expandedStoryId, setExpandedStoryId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const dispatch = useDispatch();
  
  const { stories, backlogStories } = useSelector((state) => state.stories);
  const { loading, error: sprintError, currentSprint } = useSelector((state) => state.sprints);
  const { tasksByStoryId } = useSelector((state) => state.tasks);
  
  useEffect(() => {
    dispatch(fetchStories({ projectId: projectId, sprintId: sprintId }));
    dispatch(fetchBacklogStories(projectId)); // Updated to include projectId
    dispatch(fetchSprintById({ projectId: projectId, sprintId: sprintId }));
    dispatch(fetchTasksByProject(projectId));
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
      dispatch(fetchBacklogStories(projectId)); // Re-fetch backlog stories with projectId
    } catch (err) {
      setError('Failed to remove story from sprint.');
    }
  };

  const [showBacklogModal, setShowBacklogModal] = useState(false); // Assuming backlog stories are in the Redux store

  const handleAddStoryToSprint = async (selectedStories) => {
    try {
      for (const story of selectedStories) {
        const updatedStory = { ...story, sprint: sprintId };
        const storyId = story.id;
        await dispatch(updateStory({ storyId: storyId, storyData: updatedStory })).unwrap();
      }
      // Dispatch an action to add the story to the sprint
      dispatch(fetchStories({ projectId, sprintId })); // Re-fetch stories
      dispatch(fetchBacklogStories(projectId)); // Re-fetch backlog stories with projectId
    } catch (err) {
      setError('Failed to add stories to sprint.');
    }
  };

  // Divide stories into categories based on their state
  const states = ['NOT_STARTED', 'IN_PROGRESS', 'DONE', 'ACCEPTED', 'REJECTED'];
  const categorizedStories = states.map((state) =>
    stories.filter((story) => story.status === state)
  );

  // Check if backlogStories is in the expected format and initialized
  const backlogStoriesReady = backlogStories && 
                             (typeof backlogStories === 'object') && 
                             ('unrealized' in backlogStories);

  if (loading && currentSprint === null) {
    return <div>Loading...</div>;
  }
  return (
  <div>
    <div className="d-flex justify-content-between align-items-center">
      <h1>User Stories for Sprint</h1>
      <Button
        variant="secondary"
        onClick={() => {
          setShowEditModal(true);
        }}
      >
        Edit Sprint
      </Button>
    </div>
    <div className="d-flex align-items-start mt-3">
      <Button
        variant="primary"
        className="me-2"
        onClick={() => {
          setSelectedStory(null);
          setIsEditMode(false);
          setShowModal(true);
        }}
      >
        Create New User Story
      </Button>
      <Button
        variant="primary"
        onClick={() => setShowBacklogModal(true)}
        disabled={!currentSprint?.is_active || !backlogStoriesReady}
      >
        Add Story From Backlog
      </Button>
    </div>
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
          tasksByStoryId={tasksByStoryId}
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
    {backlogStoriesReady && (
      <AddStoryFromBacklog
        show={showBacklogModal}
        handleClose={() => setShowBacklogModal(false)}
        backlogStories={backlogStories}
        onAddToSprint={handleAddStoryToSprint}
      />
    )}

    {/* SprintEditModal */}
    <SprintEditModal
      show={showEditModal}
      handleClose={() => setShowEditModal(false)}
      sprintId={sprintId}
      projectId={projectId}
      sprintData={currentSprint}
    />
  </div>
);
}

export default UserStories;