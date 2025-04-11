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
  const [successMessage, setSuccessMessage] = useState(null);
  const dispatch = useDispatch();
  
  const { stories, backlogStories } = useSelector((state) => state.stories);
  const { loading, error: sprintError, currentSprint } = useSelector((state) => state.sprints);
  const { tasksByStoryId } = useSelector((state) => state.tasks);
  
  const fetchData = () => {
    dispatch(fetchStories({ projectId: projectId, sprintId: sprintId }));
    dispatch(fetchBacklogStories(projectId));
    dispatch(fetchSprintById({ projectId: projectId, sprintId: sprintId }));
    dispatch(fetchTasksByProject(projectId));
  };
  
  useEffect(() => {
    fetchData();
  }, [projectId, sprintId]);

  const handleUserStoryAdded = (newStory) => {
    dispatch(fetchStories({ projectId: projectId, sprintId: sprintId }));
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
      // Calculate current sprint load
      const currentSprintLoad = stories.reduce((total, story) => 
        total + (story.story_points || 0), 0);
      
      // Calculate additional load from selected stories
      const additionalLoad = selectedStories.reduce((total, story) => 
        total + (story.story_points || 0), 0);
      
      // Check if we have velocity and if adding would exceed it
      if (currentSprint && currentSprint.velocity) {
        if ((currentSprintLoad + additionalLoad) > currentSprint.velocity) {
          setError(`Cannot add stories: total load (${currentSprintLoad + additionalLoad}) would exceed sprint velocity (${currentSprint.velocity}).`);
          return;
        }
      }
      
      // Check if all stories have story points
      const unestimatedStories = selectedStories.filter(story => !story.story_points);
      if (unestimatedStories.length > 0) {
        const storyNames = unestimatedStories.map(s => `"${s.name}"`).join(', ');
        setError(`Cannot add unestimated stories to sprint: ${storyNames}`);
        return;
      }
      
      // If all validations pass, add stories to sprint
      for (const story of selectedStories) {
        const updatedStory = { ...story, sprint: sprintId };
        const storyId = story.id;
        await dispatch(updateStory({ storyId: storyId, storyData: updatedStory })).unwrap();
      }
      
      // Refresh data
      dispatch(fetchStories({ projectId, sprintId }));
      dispatch(fetchBacklogStories(projectId));
      setError(null);
    } catch (err) {
      setError('Failed to add stories to sprint: ' + (err.message || 'Unknown error'));
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

  const handleSprintEditClose = (success) => {
    setShowEditModal(false);
    // Refresh data when the sprint edit modal is closed
    fetchData();
    
    if (success) {
      setSuccessMessage('Sprint updated successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  if (loading || currentSprint === null) {
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
    
    {currentSprint && (
      <div className="mt-3 mb-4 p-3 border rounded bg-light">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Sprint Capacity</h5>
          <div>
            {/* Calculate current sprint load */}
            {(() => {
              const totalPoints = stories.reduce((sum, story) => sum + (story.story_points || 0), 0);
              const percentUsed = Math.round((totalPoints / currentSprint.velocity) * 100);
              const isOverloaded = totalPoints > currentSprint.velocity;
              
              return (
                <div className="text-end">
                  <div className={isOverloaded ? "text-danger fw-bold" : "text-success"}>
                    Load: {totalPoints} / {currentSprint.velocity} points ({percentUsed}%)
                  </div>
                  <div className="progress mt-1" style={{ height: '10px', width: '200px' }}>
                    <div 
                      className={`progress-bar ${isOverloaded ? 'bg-danger' : 'bg-success'}`} 
                      role="progressbar" 
                      style={{ width: `${Math.min(percentUsed, 100)}%` }} 
                      aria-valuenow={percentUsed} 
                      aria-valuemin="0" 
                      aria-valuemax="100">
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    )}
    
    <div className="d-flex align-items-start mb-3">
      <Button
        variant="primary"
        onClick={() => setShowBacklogModal(true)}
        disabled={!currentSprint?.is_active || !backlogStoriesReady}
      >
        Add Story From Backlog
      </Button>
    </div>
    {successMessage && <Alert variant="success" className="mt-3">{successMessage}</Alert>}
    {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    <div className="row">
      {states.map((state, index) => (
        <UserStoryColumn
          key={state}
          title={state}
          stories={categorizedStories[index]}
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
        currentSprint={{
          ...currentSprint,
          stories: stories // Pass the current stories in the sprint
        }}
      />
    )}

    {/* SprintEditModal */}
    <SprintEditModal
      show={showEditModal}
      handleClose={handleSprintEditClose}
      sprintId={sprintId}
      projectId={projectId}
      sprintData={currentSprint}
    />
  </div>
);
}

export default UserStories;