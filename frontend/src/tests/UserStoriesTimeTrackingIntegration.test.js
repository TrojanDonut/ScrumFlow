import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import UserStories from '../pages/UserStories';

// Mock axios
jest.mock('axios');

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    projectId: '1',
    sprintId: '1'
  }),
  useNavigate: () => jest.fn()
}));

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Redux store
const mockStore = configureStore([]);

// Mock child components
jest.mock('../pages/StoryTaskDetails', () => {
  return {
    __esModule: true,
    default: ({
      show,
      handleClose,
      story,
      tasks,
      users,
      sprintStatus,
      currentProjectRole,
      onTaskAdded,
      handleRejectStory,
      handleAcceptStory
    }) => {
      return show ? (
        <div data-testid="story-task-details">
          <h3>{story.name}</h3>
          <div>
            {tasks && tasks.map(task => (
              <div key={task.id} data-testid={`task-${task.id}`}>
                <span>{task.title}</span>
                <span>{task.status}</span>
                <button 
                  onClick={() => onTaskAdded(story.id, { refreshTask: task.id, skipStoryRefresh: true })}
                  data-testid={`refresh-task-${task.id}`}
                >
                  Log Time
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleClose} data-testid="close-details">Close</button>
        </div>
      ) : null;
    }
  };
});

describe('UserStories Integration with Time Tracking', () => {
  let store;
  
  beforeEach(() => {
    // Clear localStorage
    window.localStorage.clear();
    
    // Reset axios mocks
    axios.get.mockReset();
    axios.post.mockReset();
    axios.put.mockReset();
    
    // Setup default axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/projects/1/stories/')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Story 1',
              status: 'IN_PROGRESS',
              text: 'Description 1',
              priority: 1,
              business_value: 100,
              acceptance_tests: 'Tests'
            }
          ]
        });
      } else if (url.includes('/api/stories/1/tasks/')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Task 1',
              status: 'IN_PROGRESS',
              assigned_to: 1,
              story: 1,
              description: 'Task description',
              estimated_hours: 5
            }
          ]
        });
      } else if (url.includes('/api/projects/1/members/')) {
        return Promise.resolve({
          data: [
            { user: { id: 1, username: 'developer' } }
          ]
        });
      }
      return Promise.resolve({ data: {} });
    });
    
    // Setup mock store
    store = mockStore({
      auth: {
        user: { id: 1, username: 'developer' },
        currentProjectRole: 'DEVELOPER'
      },
      stories: {
        stories: [
          {
            id: 1,
            name: 'Story 1',
            status: 'IN_PROGRESS'
          }
        ],
        loading: false,
        error: null
      },
      tasks: {
        tasksByStoryId: {
          1: [
            {
              id: 1,
              title: 'Task 1',
              status: 'IN_PROGRESS',
              assigned_to: 1,
              story: 1
            }
          ]
        },
        projectUsers: [
          { user: { id: 1, username: 'developer' } }
        ],
        loading: false,
        error: null
      },
      sprints: {
        currentSprint: {
          id: 1,
          name: 'Sprint 1',
          is_active: true
        },
        loading: false
      }
    });
    
    // Mock dispatch to track actions
    store.dispatch = jest.fn().mockImplementation((action) => {
      if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
      }
      return action;
    });
  });
  
  test('time logging refreshes task data without refreshing entire story', async () => {
    // Setup specific API responses for this test
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/tasks/1/')) {
        // Response for refreshing a specific task
        return Promise.resolve({
          data: {
            id: 1,
            title: 'Task 1 Updated',
            status: 'IN_PROGRESS',
            assigned_to: 1,
            story: 1,
            description: 'Task description',
            estimated_hours: 5,
            hours_spent: 2.5 // Updated hours spent
          }
        });
      } else if (url.includes('/api/projects/1/stories/')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Story 1',
              status: 'IN_PROGRESS',
              text: 'Description 1',
              priority: 1,
              business_value: 100,
              acceptance_tests: 'Tests'
            }
          ]
        });
      } else if (url.includes('/api/stories/1/tasks/')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Task 1',
              status: 'IN_PROGRESS',
              assigned_to: 1,
              story: 1,
              description: 'Task description',
              estimated_hours: 5
            }
          ]
        });
      } else if (url.includes('/api/projects/1/members/')) {
        return Promise.resolve({
          data: [
            { user: { id: 1, username: 'developer' } }
          ]
        });
      }
      
      return Promise.resolve({ data: {} });
    });
    
    render(
      <Provider store={store}>
        <UserStories />
      </Provider>
    );
    
    // Wait for stories to load
    await waitFor(() => {
      expect(screen.getByText('Story 1')).toBeInTheDocument();
    });
    
    // Open story details
    fireEvent.click(screen.getByText('Story 1'));
    
    // Wait for story details to load
    await waitFor(() => {
      expect(screen.getByTestId('story-task-details')).toBeInTheDocument();
    });
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    // Click the "Log Time" button that simulates time tracking
    fireEvent.click(screen.getByTestId('refresh-task-1'));
    
    // Verify that the specific task API was called (fetching single task)
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:8000/api/tasks/1/', expect.anything());
    });
    
    // Count the number of times the stories API was called after the initial load
    const storiesApiCallsAfterClick = axios.get.mock.calls.filter(
      call => call[0].includes('/api/projects/1/stories/')
    ).length;
    
    // Should be 1 (initial load) as we're not refreshing the story when logging time
    expect(storiesApiCallsAfterClick).toBe(1);
  });
  
  test('fetches updated task data when story details are opened', async () => {
    // First render with initial data
    render(
      <Provider store={store}>
        <UserStories />
      </Provider>
    );
    
    // Wait for stories to load
    await waitFor(() => {
      expect(screen.getByText('Story 1')).toBeInTheDocument();
    });
    
    // Update the mock for task data to simulate time has been logged
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/stories/1/tasks/')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Task 1',
              status: 'IN_PROGRESS',
              assigned_to: 1,
              story: 1,
              description: 'Task description',
              estimated_hours: 5,
              hours_spent: 3.5  // Time has been logged
            }
          ]
        });
      } else if (url.includes('/api/projects/1/stories/')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Story 1',
              status: 'IN_PROGRESS',
              text: 'Description 1',
              priority: 1,
              business_value: 100,
              acceptance_tests: 'Tests'
            }
          ]
        });
      } else if (url.includes('/api/projects/1/members/')) {
        return Promise.resolve({
          data: [
            { user: { id: 1, username: 'developer' } }
          ]
        });
      }
      
      return Promise.resolve({ data: {} });
    });
    
    // Open story details
    fireEvent.click(screen.getByText('Story 1'));
    
    // Wait for story details and tasks to load
    await waitFor(() => {
      expect(screen.getByTestId('story-task-details')).toBeInTheDocument();
    });
    
    // Verify that task API was called to get latest data
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:8000/api/stories/1/tasks/', expect.anything());
    });
  });
  
  test('story status is preserved when logging time', async () => {
    // Setup specific API responses for this test
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/tasks/1/')) {
        // Response for refreshing a specific task
        return Promise.resolve({
          data: {
            id: 1,
            title: 'Task 1',
            status: 'IN_PROGRESS',
            assigned_to: 1,
            story: 1,
            description: 'Task description',
            estimated_hours: 5,
            hours_spent: 2.5 // Updated hours spent
          }
        });
      } else if (url.includes('/api/projects/1/stories/')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Story 1',
              status: 'IN_PROGRESS',
              text: 'Description 1',
              priority: 1,
              business_value: 100,
              acceptance_tests: 'Tests'
            }
          ]
        });
      } else if (url.includes('/api/stories/1/tasks/')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Task 1',
              status: 'IN_PROGRESS',
              assigned_to: 1,
              story: 1,
              description: 'Task description',
              estimated_hours: 5
            }
          ]
        });
      } else if (url.includes('/api/projects/1/members/')) {
        return Promise.resolve({
          data: [
            { user: { id: 1, username: 'developer' } }
          ]
        });
      }
      
      return Promise.resolve({ data: {} });
    });
    
    render(
      <Provider store={store}>
        <UserStories />
      </Provider>
    );
    
    // Wait for stories to load
    await waitFor(() => {
      expect(screen.getByText('Story 1')).toBeInTheDocument();
    });
    
    // Check initial story status (should be IN_PROGRESS)
    const storyElement = screen.getByText('Story 1').closest('[data-testid]');
    expect(storyElement).toHaveTextContent('IN_PROGRESS');
    
    // Open story details
    fireEvent.click(screen.getByText('Story 1'));
    
    // Wait for story details to load
    await waitFor(() => {
      expect(screen.getByTestId('story-task-details')).toBeInTheDocument();
    });
    
    // Click the "Log Time" button that simulates time tracking
    fireEvent.click(screen.getByTestId('refresh-task-1'));
    
    // Verify story status is still IN_PROGRESS after time logging
    await waitFor(() => {
      const storyElementAfter = screen.getByText('Story 1').closest('[data-testid]');
      expect(storyElementAfter).toHaveTextContent('IN_PROGRESS');
    });
  });
}); 