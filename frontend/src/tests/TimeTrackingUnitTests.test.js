import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import TimeTrackingComponent from '../components/TimeTracking';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

// Mock axios
jest.mock('axios');

// Mock localStorage
const localStorageMock = (function () {
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

// Mock setInterval and clearInterval
jest.useFakeTimers();

describe('TimeTracking Component Unit Tests', () => {
  const mockTask = {
    id: 1,
    title: 'Task 1',
    status: 'IN_PROGRESS',
    assigned_to: 1,
    story: 1,
    description: 'Task description',
    estimated_hours: 5,
    hours_spent: 0
  };

  const mockStore = configureStore([]);
  let store;

  beforeEach(() => {
    // Clear localStorage
    window.localStorage.clear();
    
    // Reset axios mocks
    axios.get.mockReset();
    axios.post.mockReset();
    
    // Mock axios responses
    axios.post.mockImplementation((url) => {
      if (url.includes('/api/tasks/1/start_session/')) {
        return Promise.resolve({
          data: { message: 'Session started successfully' }
        });
      } else if (url.includes('/api/tasks/1/stop_session/')) {
        return Promise.resolve({
          data: { 
            message: 'Session stopped successfully', 
            hours_spent: 1.5,
            task: { ...mockTask, hours_spent: 1.5 }
          }
        });
      } else if (url.includes('/api/tasks/1/log_time/')) {
        return Promise.resolve({
          data: { 
            message: 'Time logged successfully', 
            hours_spent: 2.5,
            task: { ...mockTask, hours_spent: 2.5 }
          }
        });
      }
      
      return Promise.resolve({ data: {} });
    });
    
    // Setup mock store
    store = mockStore({
      auth: {
        user: { id: 1, username: 'developer' }
      }
    });
    
    // Mock dispatch
    store.dispatch = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders time tracking component correctly', () => {
    render(
      <Provider store={store}>
        <TimeTrackingComponent task={mockTask} refreshTaskData={jest.fn()} />
      </Provider>
    );
    
    // Check if component elements are rendered
    expect(screen.getByText(/Start Session/i)).toBeInTheDocument();
    expect(screen.getByText(/Log Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hours spent/i)).toBeInTheDocument();
  });
  
  test('starts time tracking session correctly', async () => {
    const refreshTaskDataMock = jest.fn();
    
    render(
      <Provider store={store}>
        <TimeTrackingComponent task={mockTask} refreshTaskData={refreshTaskDataMock} />
      </Provider>
    );
    
    // Click start session button
    fireEvent.click(screen.getByText(/Start Session/i));
    
    // Check if API call was made
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:8000/api/tasks/1/start_session/', {}, expect.anything());
    });
    
    // Check if localStorage was updated
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'activeTaskSession',
        expect.stringContaining('"taskId":1')
      );
    });
  });
  
  test('stops time tracking session correctly', async () => {
    // Setup active session in localStorage
    localStorage.setItem('activeTaskSession', JSON.stringify({
      taskId: 1,
      startTime: new Date(mockDate.getTime() - 3600000).toISOString(), // 1 hour ago
      story: 1
    }));
    
    const refreshTaskDataMock = jest.fn();
    
    render(
      <Provider store={store}>
        <TimeTrackingComponent task={mockTask} refreshTaskData={refreshTaskDataMock} />
      </Provider>
    );
    
    // Component should show timer
    expect(screen.getByText(/Time elapsed/i)).toBeInTheDocument();
    
    // Click stop session button
    fireEvent.click(screen.getByText(/Stop Session/i));
    
    // Check if API call was made
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/stop_session/',
        expect.objectContaining({ elapsed_time: expect.any(Number) }),
        expect.anything()
      );
    });
    
    // Check if localStorage was cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith('activeTaskSession');
    
    // Check if refresh function was called
    expect(refreshTaskDataMock).toHaveBeenCalled();
  });
  
  test('logs time manually correctly', async () => {
    const refreshTaskDataMock = jest.fn();
    
    render(
      <Provider store={store}>
        <TimeTrackingComponent task={mockTask} refreshTaskData={refreshTaskDataMock} />
      </Provider>
    );
    
    // Enter time in the input
    const timeInput = screen.getByLabelText(/Hours spent/i);
    fireEvent.change(timeInput, { target: { value: '2.5' } });
    
    // Submit the form
    fireEvent.click(screen.getByText(/Log Time/i));
    
    // Check if API call was made
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/log_time/',
        { hours_spent: 2.5 },
        expect.anything()
      );
    });
    
    // Check if refresh function was called
    expect(refreshTaskDataMock).toHaveBeenCalled();
  });
  
  test('cannot start a session for a different task when one is active', async () => {
    // Setup active session for a different task
    localStorage.setItem('activeTaskSession', JSON.stringify({
      taskId: 2, // Different task
      startTime: mockDate.toISOString(),
      story: 1
    }));
    
    const refreshTaskDataMock = jest.fn();
    
    render(
      <Provider store={store}>
        <TimeTrackingComponent task={mockTask} refreshTaskData={refreshTaskDataMock} />
      </Provider>
    );
    
    // Start button should be disabled
    const startButton = screen.getByText(/Start Session/i);
    expect(startButton).toBeDisabled();
    
    // Warning message should be displayed
    expect(screen.getByText(/Another session is already active/i)).toBeInTheDocument();
  });
  
  test('timer displays correct time format', async () => {
    // Setup active session in localStorage to simulate one hour of elapsed time
    localStorage.setItem('activeTaskSession', JSON.stringify({
      taskId: 1,
      startTime: new Date(mockDate.getTime() - 3661000).toISOString(), // 1 hour, 1 minute, 1 second ago
      story: 1
    }));
    
    render(
      <Provider store={store}>
        <TimeTrackingComponent task={mockTask} refreshTaskData={jest.fn()} />
      </Provider>
    );
    
    // Verify the timer displays the correct format (HH:MM:SS)
    const timerElement = screen.getByText(/Time elapsed/i);
    expect(timerElement).toHaveTextContent('01:01:01'); // Format: HH:MM:SS
  });
  
  test('displays validation error for invalid time input', async () => {
    render(
      <Provider store={store}>
        <TimeTrackingComponent task={mockTask} refreshTaskData={jest.fn()} />
      </Provider>
    );
    
    // Enter invalid time (negative value)
    const timeInput = screen.getByLabelText(/Hours spent/i);
    fireEvent.change(timeInput, { target: { value: '-1' } });
    
    // Try to submit
    fireEvent.click(screen.getByText(/Log Time/i));
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Time must be positive/i)).toBeInTheDocument();
    });
    
    // API should not be called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  test('displays error message when API fails', async () => {
    // Mock API failure
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Server error' } }
    });
    
    render(
      <Provider store={store}>
        <TimeTrackingComponent task={mockTask} refreshTaskData={jest.fn()} />
      </Provider>
    );
    
    // Enter time and submit
    const timeInput = screen.getByLabelText(/Hours spent/i);
    fireEvent.change(timeInput, { target: { value: '2.5' } });
    fireEvent.click(screen.getByText(/Log Time/i));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to log time/i)).toBeInTheDocument();
    });
  });
}); 