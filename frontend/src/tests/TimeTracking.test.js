import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import TimeTracking from '../pages/TimeTracking';

// Mock axios
jest.mock('axios');

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

// Setup mock store
const mockStore = configureStore([]);

describe('TimeTracking Component', () => {
  let store;
  
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    
    // Setup mock store
    store = mockStore({
      auth: {
        user: { id: 1, username: 'testuser' }
      }
    });
    
    // Reset axios mocks
    axios.get.mockReset();
    axios.post.mockReset();
    
    // Setup default axios responses
    axios.get.mockResolvedValue({ data: [] });
    axios.post.mockResolvedValue({ data: { success: true } });
  });
  
  test('renders nothing if task is not assigned to user', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      status: 'IN_PROGRESS',
      assigned_to: 2 // Different user ID
    };
    
    const { container } = render(
      <Provider store={store}>
        <TimeTracking task={task} onTimeLogged={() => {}} />
      </Provider>
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  test('renders nothing if task is not in progress', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      status: 'ASSIGNED',
      assigned_to: 1 // Current user ID
    };
    
    const { container } = render(
      <Provider store={store}>
        <TimeTracking task={task} onTimeLogged={() => {}} />
      </Provider>
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  test('renders time tracking controls when task is in progress and assigned to user', async () => {
    const task = {
      id: 1,
      title: 'Test Task',
      status: 'IN_PROGRESS',
      assigned_to: 1 // Current user ID
    };
    
    render(
      <Provider store={store}>
        <TimeTracking task={task} onTimeLogged={() => {}} />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      expect(screen.getByText('Start Session')).toBeInTheDocument();
      expect(screen.getByText('Manual Time Entry')).toBeInTheDocument();
    });
  });
  
  test('starts a session when clicking start button', async () => {
    const task = {
      id: 1,
      title: 'Test Task',
      status: 'IN_PROGRESS',
      assigned_to: 1 // Current user ID
    };
    
    axios.post.mockResolvedValue({
      data: {
        success: true,
        session_id: 1,
        start_time: new Date().toISOString()
      }
    });
    
    render(
      <Provider store={store}>
        <TimeTracking task={task} onTimeLogged={() => {}} />
      </Provider>
    );
    
    // Click start session button
    fireEvent.click(screen.getByText('Start Session'));
    
    // Check if API was called
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/start-session/'
      );
      expect(localStorage.setItem).toHaveBeenCalled();
    });
    
    // Button text should change to "Stop Session"
    await waitFor(() => {
      expect(screen.getByText('Stop Session')).toBeInTheDocument();
      expect(screen.getByText(/Time tracking session is active/)).toBeInTheDocument();
    });
  });
  
  test('stops a session when clicking stop button', async () => {
    const task = {
      id: 1,
      title: 'Test Task',
      status: 'IN_PROGRESS',
      assigned_to: 1 // Current user ID
    };
    
    // Setup localStorage with an active session
    const sessionKey = `task_session_${task.id}_1`;
    localStorage.setItem(sessionKey, JSON.stringify({
      active: true,
      startTime: new Date().toISOString(),
      taskId: task.id
    }));
    
    axios.post.mockResolvedValue({
      data: {
        success: true,
        hours_logged: 1.5
      }
    });
    
    const onTimeLoggedMock = jest.fn();
    
    render(
      <Provider store={store}>
        <TimeTracking task={task} onTimeLogged={onTimeLoggedMock} />
      </Provider>
    );
    
    // Wait for component to detect active session
    await waitFor(() => {
      expect(screen.getByText('Stop Session')).toBeInTheDocument();
    });
    
    // Click stop session button
    fireEvent.click(screen.getByText('Stop Session'));
    
    // Check if API was called
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/stop-session/'
      );
      expect(localStorage.removeItem).toHaveBeenCalledWith(sessionKey);
      expect(onTimeLoggedMock).toHaveBeenCalled();
    });
    
    // Button text should change back to "Start Session"
    await waitFor(() => {
      expect(screen.getByText('Start Session')).toBeInTheDocument();
    });
  });
  
  test('logs manual time', async () => {
    const task = {
      id: 1,
      title: 'Test Task',
      status: 'IN_PROGRESS',
      assigned_to: 1 // Current user ID
    };
    
    axios.post.mockResolvedValue({ data: {} });
    
    const onTimeLoggedMock = jest.fn();
    
    render(
      <Provider store={store}>
        <TimeTracking task={task} onTimeLogged={onTimeLoggedMock} />
      </Provider>
    );
    
    // Fill manual time form
    fireEvent.change(screen.getByPlaceholderText('Hours'), { target: { value: '2.5' } });
    fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'Test manual entry' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Log Time'));
    
    // Check if API was called with right params
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/stop/', 
        {
          hours_spent: 2.5,
          description: 'Test manual entry'
        }
      );
      expect(onTimeLoggedMock).toHaveBeenCalled();
    });
    
    // Form should be cleared
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Hours').value).toBe('');
      expect(screen.getByPlaceholderText('Description').value).toBe('');
    });
  });
  
  test('displays time logs', async () => {
    const task = {
      id: 1,
      title: 'Test Task',
      status: 'IN_PROGRESS',
      assigned_to: 1 // Current user ID
    };
    
    // Mock time logs API response
    axios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          date: '2023-05-01',
          hours_spent: 2.5,
          description: 'First log entry'
        },
        {
          id: 2,
          date: '2023-05-02',
          hours_spent: 1.5,
          description: 'Second log entry'
        }
      ]
    });
    
    render(
      <Provider store={store}>
        <TimeTracking task={task} onTimeLogged={() => {}} />
      </Provider>
    );
    
    // Check if logs are displayed
    await waitFor(() => {
      expect(screen.getByText('First log entry')).toBeInTheDocument();
      expect(screen.getByText('Second log entry')).toBeInTheDocument();
      expect(screen.getByText('2.5')).toBeInTheDocument();
      expect(screen.getByText('1.5')).toBeInTheDocument();
    });
  });
  
  test('shows error when time logging fails', async () => {
    const task = {
      id: 1,
      title: 'Test Task',
      status: 'IN_PROGRESS',
      assigned_to: 1 // Current user ID
    };
    
    // Mock API error
    axios.post.mockRejectedValue({
      response: {
        data: { error: 'Failed to log time' }
      }
    });
    
    render(
      <Provider store={store}>
        <TimeTracking task={task} onTimeLogged={() => {}} />
      </Provider>
    );
    
    // Click start session button
    fireEvent.click(screen.getByText('Start Session'));
    
    // Check if error is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to start tracking/)).toBeInTheDocument();
    });
  });
}); 