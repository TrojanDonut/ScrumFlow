import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { BrowserRouter } from 'react-router-dom';
import Sprint from '../pages/Sprint';
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

// Mock date for consistent testing
const mockDate = new Date('2023-05-15T10:00:00Z');
global.Date = class extends Date {
  constructor() {
    return mockDate;
  }
  
  static now() {
    return mockDate.getTime();
  }
};

// Mock Redux store
const mockStore = configureStore([]);

// Mock Timer functions
jest.useFakeTimers();

describe('Time Tracking E2E Tests', () => {
  let store;
  
  beforeEach(() => {
    // Clear localStorage
    window.localStorage.clear();
    
    // Reset axios mocks
    axios.get.mockReset();
    axios.post.mockReset();
    axios.put.mockReset();
    
    // Setup default axios responses for fetching data
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/projects/1/sprints/1/')) {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Sprint 1',
            start_date: '2023-05-01',
            end_date: '2023-05-31',
            is_active: true,
            project: 1
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
              acceptance_tests: 'Tests',
              sprint: 1
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
              estimated_hours: 5,
              hours_spent: 0
            }
          ]
        });
      } else if (url.includes('/api/projects/1/members/')) {
        return Promise.resolve({
          data: [
            { user: { id: 1, username: 'developer' } }
          ]
        });
      } else if (url.includes('/api/tasks/1/')) {
        return Promise.resolve({
          data: {
            id: 1,
            title: 'Task 1',
            status: 'IN_PROGRESS',
            assigned_to: 1,
            story: 1,
            description: 'Task description',
            estimated_hours: 5,
            hours_spent: 0
          }
        });
      }
      
      return Promise.resolve({ data: {} });
    });
    
    // Mock axios.post for session start/stop and manual time logging
    axios.post.mockImplementation((url) => {
      if (url.includes('/api/tasks/1/start_session/')) {
        return Promise.resolve({
          data: {
            message: 'Session started successfully'
          }
        });
      } else if (url.includes('/api/tasks/1/stop_session/')) {
        return Promise.resolve({
          data: {
            message: 'Session stopped successfully',
            hours_spent: 1.5,
            task: {
              id: 1,
              title: 'Task 1',
              status: 'IN_PROGRESS',
              assigned_to: 1,
              story: 1,
              description: 'Task description',
              estimated_hours: 5,
              hours_spent: 1.5
            }
          }
        });
      } else if (url.includes('/api/tasks/1/log_time/')) {
        return Promise.resolve({
          data: {
            message: 'Time logged successfully',
            hours_spent: 2.5,
            task: {
              id: 1,
              title: 'Task 1',
              status: 'IN_PROGRESS',
              assigned_to: 1,
              story: 1,
              description: 'Task description',
              estimated_hours: 5,
              hours_spent: 2.5
            }
          }
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
            status: 'IN_PROGRESS',
            sprint: 1
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
              story: 1,
              hours_spent: 0,
              estimated_hours: 5
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
    
    // Mock dispatch
    store.dispatch = jest.fn().mockImplementation((action) => {
      if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
      }
      return action;
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('complete time tracking workflow - session start, stop, and manual logging', async () => {
    // Wrap the component in BrowserRouter for navigation
    render(
      <Provider store={store}>
        <BrowserRouter>
          <UserStories />
        </BrowserRouter>
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
    
    // Step 1: Start session
    // Mock TimeTracking component behavior for starting session
    // First check if we have a Start button
    const startSessionButton = screen.getByText('Start Session', { exact: false });
    expect(startSessionButton).toBeInTheDocument();
    
    // Click to start session
    fireEvent.click(startSessionButton);
    
    // Verify API call was made to start session
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:8000/api/tasks/1/start_session/', {}, expect.anything());
    });
    
    // Update localStorage to simulate active session
    localStorageMock.setItem('activeTaskSession', JSON.stringify({
      taskId: 1,
      startTime: mockDate.toISOString(),
      story: 1
    }));
    
    // Refresh the component to reflect session state
    await act(async () => {
      // Simulate reload
      const { rerender } = render(
        <Provider store={store}>
          <BrowserRouter>
            <UserStories />
          </BrowserRouter>
        </Provider>
      );
    });
    
    // Open story details again after reload
    fireEvent.click(screen.getByText('Story 1'));
    
    // Wait for story details to load
    await waitFor(() => {
      expect(screen.getByTestId('story-task-details')).toBeInTheDocument();
    });
    
    // Step 2: Stop session
    // Now we should have a Stop button instead of Start
    const stopSessionButton = screen.getByText('Stop Session', { exact: false });
    expect(stopSessionButton).toBeInTheDocument();
    
    // Click to stop session
    fireEvent.click(stopSessionButton);
    
    // Verify API call was made to stop session
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:8000/api/tasks/1/stop_session/', expect.anything(), expect.anything());
    });
    
    // Check that localStorage was cleared
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('activeTaskSession');
    
    // Step 3: Log manual time
    // Wait for the manual time input to be available
    const logTimeButton = screen.getByText('Log Time', { exact: false });
    expect(logTimeButton).toBeInTheDocument();
    
    // Find the input field for manual time
    const timeInput = screen.getByLabelText('Hours spent:', { exact: false });
    expect(timeInput).toBeInTheDocument();
    
    // Enter time manually
    fireEvent.change(timeInput, { target: { value: '2.5' } });
    
    // Submit the form
    fireEvent.click(logTimeButton);
    
    // Verify API call was made to log manual time
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/log_time/',
        { hours_spent: 2.5 },
        expect.anything()
      );
    });
    
    // Step 4: Verify data is updated
    // Mock the updated task data
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/tasks/1/')) {
        return Promise.resolve({
          data: {
            id: 1,
            title: 'Task 1',
            status: 'IN_PROGRESS',
            assigned_to: 1,
            story: 1,
            description: 'Task description',
            estimated_hours: 5,
            hours_spent: 2.5 // Updated hours
          }
        });
      }
      // Keep other responses the same
      return Promise.resolve({ data: {} });
    });
    
    // Refresh the task data by triggering a task refresh
    // This would typically happen after logging time
    await waitFor(() => {
      // Verify the task API was called to get the updated data
      expect(axios.get).toHaveBeenCalledWith('http://localhost:8000/api/tasks/1/', expect.anything());
    });
    
    // Test story and tasks remain in progress after time logging
    // Check that the task status is still IN_PROGRESS
    await waitFor(() => {
      expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
    });
  });
  
  test('cannot start a new session when one is already in progress', async () => {
    // Set up active session in localStorage
    localStorageMock.setItem('activeTaskSession', JSON.stringify({
      taskId: 2, // Different task
      startTime: mockDate.toISOString(),
      story: 1
    }));
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <UserStories />
        </BrowserRouter>
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
    
    // Start button should be disabled or warning should be shown
    const startButton = screen.getByText('Start Session', { exact: false });
    expect(startButton).toBeDisabled();
    
    // Should show active session warning
    const warningText = screen.getByText('Another session is already active', { exact: false });
    expect(warningText).toBeInTheDocument();
  });
  
  test('active session persists across page refreshes', async () => {
    // Set up active session in localStorage
    localStorageMock.setItem('activeTaskSession', JSON.stringify({
      taskId: 1,
      startTime: new Date(mockDate.getTime() - 3600000).toISOString(), // 1 hour ago
      story: 1
    }));
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <UserStories />
        </BrowserRouter>
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
    
    // Should show active timer
    const timerDisplay = screen.getByText('Time elapsed:', { exact: false });
    expect(timerDisplay).toBeInTheDocument();
    
    // Should show elapsed time of approximately 1 hour
    expect(timerDisplay).toHaveTextContent('01:00:'); // Format might vary, checking for hour
    
    // Stop button should be available
    const stopButton = screen.getByText('Stop Session', { exact: false });
    expect(stopButton).toBeInTheDocument();
  });
}); 