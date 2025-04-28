import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Alert, ListGroup, Collapse } from 'react-bootstrap';
import { fetchStories, removeStoryFromSprint, fetchBacklogStories, addStoryToSprint, updateStoryStatus } from '../store/slices/storySlice';
import { fetchSprintById } from '../store/slices/sprintSlice';
import { fetchTasksByProject, fetchUsersForProject, addTaskToStory, addTaskToStoryLocally, removeTaskLocally } from '../store/slices/taskSlice';
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
  const { projectUsers } = useSelector((state) => state.tasks);
  const { currentProjectRole, user } = useSelector(state => state.auth);

  useEffect(() => {
    console.log('UserStories useEffect running with projectId:', projectId, 'sprintId:', sprintId);

    // Check if we have the required IDs
    if (!projectId || !sprintId) {
      console.error('Missing projectId or sprintId in UserStories component');
      return;
    }

    // Dispatch actions to fetch data
    dispatch(fetchStories({ projectId, sprintId }))
      .then(result => {
        console.log('fetchStories completed:', result);
      })
      .catch(error => {
        console.error('fetchStories error:', error);
      });

    dispatch(fetchBacklogStories(projectId));
    dispatch(fetchSprintById({ projectId, sprintId }));
    dispatch(fetchTasksByProject(projectId));
    dispatch(fetchUsersForProject(projectId));
  }, [projectId, sprintId, dispatch]);

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

  const handleAcceptStory = async (storyId) => {
    try {
      await dispatch(updateStoryStatus({ storyId, status: 'ACCEPTED' })).unwrap();
      // Osveži sprint zgodbe in backlog!
      dispatch(fetchStories({ projectId, sprintId }));
      dispatch(fetchBacklogStories(projectId));
    } catch (err) {
      setError('Failed to accept story: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRejectStory = async (storyId) => {
    try {
      await dispatch(updateStoryStatus({ storyId, status: 'REJECTED' })).unwrap();
      // Osveži sprint zgodbe in backlog!
      dispatch(fetchStories({ projectId, sprintId }));
      dispatch(fetchBacklogStories(projectId));
    } catch (err) {
      setError('Failed to reject story: ' + (err.message || 'Unknown error'));
    }
  };

  const [showBacklogModal, setShowBacklogModal] = useState(false); // Assuming backlog stories are in the Redux store

  const handleAddStoryToSprint = async (selectedStories) => {
    try {
      console.log('Attempting to add stories to sprint:', selectedStories);
      // Calculate current sprint load
      const currentSprintLoad = stories.reduce((total, story) =>
        total + (story.story_points || 0), 0);

      // Calculate additional load from selected stories
      const additionalLoad = selectedStories.reduce((total, story) =>
        total + (story.story_points || 0), 0);

      console.log(`Current sprint load: ${currentSprintLoad}, additional load: ${additionalLoad}`);

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
      console.log(`Adding ${selectedStories.length} stories to sprint ${sprintId}`);
      for (const story of selectedStories) {
        console.log(`Adding story ${story.id} to sprint ${sprintId}`);
        const result = await dispatch(addStoryToSprint({ storyId: story.id, sprintId })).unwrap();
        console.log(`Story ${story.id} added with result:`, result);
      }

      console.log('All stories added to sprint, now refreshing data...');

      // Refresh data with explicit promise handling for debugging
      try {
        const storiesResult = await dispatch(fetchStories({ projectId, sprintId })).unwrap();
        console.log('Sprint stories refreshed:', storiesResult);

        const backlogResult = await dispatch(fetchBacklogStories(projectId)).unwrap();
        console.log('Backlog stories refreshed:', backlogResult);

        setError(null);
        console.log('Successfully refreshed all story data after adding to sprint');
      } catch (refreshError) {
        console.error('Error refreshing story data:', refreshError);
      }
    } catch (err) {
      console.error('Failed to add stories to sprint:', err);
      setError('Failed to add stories to sprint: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAddTask = (storyId, taskData) => {
    // Check if this is a refresh request from time logging
    if (taskData && taskData.refreshTask && taskData.skipStoryRefresh) {
      // Just refresh the specific task data, without triggering story refreshes
      console.log(`Refreshing task ${taskData.refreshTask} data only`);
      return;
    }
    
    // Regular task creation flow
    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      ...taskData,
      id: tempId,
      isOptimistic: true
    };

    // Dispatch optimistic update
    // dispatch(addTaskToStoryLocally({ task: optimisticTask, storyId }));

    // Make the API call
    dispatch(addTaskToStory({ storyId, taskData }))
      .unwrap()
      .then((newTask) => {
        console.log('Task added:', newTask);
        // Remove the optimistic task and add the real one
        dispatch(addTaskToStoryLocally({ task: newTask.task, storyId }));
      })
      .catch((error) => {
        console.error('Failed to add task:', error);
        setError('Failed to add task: ' + (error.message || error.error || 'Unknown error'));
        // Remove the optimistic task on error
        dispatch(removeTaskLocally({ taskId: tempId, storyId }));
      });
  };

  // Divide stories into categories based on their state
  const states = ['NOT_STARTED', 'IN_PROGRESS', 'DONE', 'ACCEPTED', 'REJECTED'];
  console.log('Current stories before categorization:', stories);
  const categorizedStories = states.map((state) => {
    const filtered = stories.filter((story) => story.status === state);
    console.log(`Stories in ${state} state:`, filtered);
    return filtered;
  });

  // Check if backlogStories is in the expected format and initialized
  const backlogStoriesReady = backlogStories && 
                             (typeof backlogStories === 'object') && 
                             ('unrealized' in backlogStories);

  if (loading || currentSprint === null) {
    return <div>Loading...</div>;
  }
  return (
  <div>
    <div className="d-flex justify-content-between align-items-center">
      <h1>User Stories for Sprint</h1>
      {currentProjectRole === 'SCRUM_MASTER' && (
      <Button
        variant="secondary"
        onClick={() => {
          setShowEditModal(true);
        }}
      >
        Edit Sprint
      </Button>)}
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
    {currentProjectRole === 'SCRUM_MASTER' && (
      <Button
        variant="primary"
        onClick={() => setShowBacklogModal(true)}
        disabled={!currentSprint?.is_active || !backlogStoriesReady}
      >
        Add Story From Backlog
      </Button>)}
    </div>
    {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    <div className="row">
      {categorizedStories.map((stories, index) => (
        <UserStoryColumn
          key={states[index]}
          title={states[index]}
          stories={stories}
          onToggleExpand={toggleExpandStory}
          expandedStoryId={expandedStoryId}
          onRemoveFromSprint={handleRemoveFromSprint}
          tasksByStoryId={tasksByStoryId}
          projectUsers={projectUsers}
          sprint={currentSprint}
          onTaskAdded={handleAddTask}
          handleAcceptStory={handleAcceptStory}
          handleRejectStory={handleRejectStory}
          currentProjectRole={currentProjectRole}
          currentActiveUser={user}
          userProjectRole={currentProjectRole}
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
      handleClose={() => setShowEditModal(false)}
      sprintId={sprintId}
      projectId={projectId}
      sprintData={currentSprint}
    />
  </div>
);
}

export default UserStories;