import React, { useState } from 'react';
import { ListGroup, Button, Collapse } from 'react-bootstrap';
import StoryTaskDetails from './StoryTaskDetails';
import { generateTaskStatusTag } from './TaskUtils';
import { useDispatch } from 'react-redux';
import { addTaskToStory, fetchTasksByProject } from '../store/slices/taskSlice';
import { fetchStories } from '../store/slices/storySlice';

const UserStoryColumn = ({
  title,
  stories,
  onEdit,
  onToggleExpand,
  expandedStoryId,
  onRemoveFromSprint,
  tasksByStoryId,
  projectUsers,
  sprint,
  onTaskAdded,
  handleAcceptStory,
  handleRejectStory,
  currentProjectRole,
  currentActiveUser,
  userProjectRole
}) => {
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [selectedStory, setSelectedStory] = useState(null); // State to store the selected story
  const dispatch = useDispatch();

  const handleShowDetails = (story) => {
    setSelectedStory(story);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStory(null);
  };

  const getSprintStatus = () => {
    if (!sprint) return 'active';
    const now = new Date();
    if (new Date(sprint.start_date) > now) {
      return 'future';
    } else if (new Date(sprint.end_date) < now) {
      return 'past';
    }
    return 'active';
  };

  const sprintStatus = getSprintStatus();

  var tasks = tasksByStoryId[expandedStoryId] || [];

  // todo - this isn't actually neccessary
  // if (userProjectRole === "DEVELOPER") {
  //   // filter tasks by assigned_to
  //   tasks = tasks.filter((task) => task.assigned_to === currentActiveUser.id);
  // }

  // Render the StoryTaskDetails modal
  const renderStoryTaskDetailsModal = () => {
    if (!selectedStory) return null;

    return (
      <StoryTaskDetails
        show={showModal}
        handleClose={handleCloseModal}
        story={selectedStory}
        tasks={tasks}
        users={projectUsers}
        sprintStatus={sprint?.is_active ? 'active' : 'inactive'}
        currentProjectRole={currentProjectRole}
        onTaskAdded={onTaskAdded}
        handleAcceptStory={handleAcceptStory}
        handleRejectStory={handleRejectStory}
      />
    );
  };

  return (
    <div className="col">
      <h3>{title}</h3>
      <ListGroup>
        {stories.map((story) => (
          <ListGroup.Item key={story.id} className="d-flex flex-column">
            <div
              className="d-flex justify-content-between align-items-center"
              onClick={() => onToggleExpand(story.id)}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <strong>{story.name}</strong> - {story.priority}
              </div>
            </div>
            <Collapse in={expandedStoryId === story.id}>
              <div className="mt-2">
                <p>
                  {story.text.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </p>

                {/* Render tasks */}
                {tasks ? (
                  <div className="mt-3">
                    <hr/>
                    <h6>Tasks:</h6>
                    <ul style={{ paddingLeft: 0, listStylePosition: 'inside' }}>
                      {tasks.map((task) => (
                        <li key={task.id}>
                          <strong>{task.title}</strong>
                          {generateTaskStatusTag(task.status)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 text-muted">This story has no tasks.</div>
                )}
                <hr/>

                <div className="d-flex justify-content-end mt-2">
                  <hr/>
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ marginRight: '10px' }}
                    onClick={() => handleShowDetails(story)}
                  >
                    Details
                  </Button>
                  {sprintStatus !== 'past' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onRemoveFromSprint(story.id)}
                    >
                      Remove from Sprint
                    </Button>
                  )}
                </div>
              </div>
            </Collapse>
          </ListGroup.Item>
        ))}
      </ListGroup>

      {/* Render the modal */}
      {renderStoryTaskDetailsModal()}
    </div>
  );
};

export default UserStoryColumn;