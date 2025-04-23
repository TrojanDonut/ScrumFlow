import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TaskDetail from '../components/TaskDetail';
import ProjectBoard from '../components/ProjectBoard';

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

describe('Time Tracking Integration Tests', () => {
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
  
  const mockStory = {
    id: 1,
    title: 'User story 1',
    description: 'Story description',
    business_value: 10,
    priority: 'MUST_HAVE',
    status: 'IN_PROGRESS',
    sprint: 1,
    project: 1,
    tasks: [mockTask]
  };
  
  const mockSprint = {
    id: 1,
    name: 'Sprint 1',
    start_date: '2023-05-01',
    end_date: '2023-05-15',
    project: 1
  };
  
  const mockUser = {
    id: 1,
    username: 'developer',
    email: 'dev@example.com',
    role: 'DEVELOPER'
  };
  
  const mockProject = {
    id: 1,
    name: 'Test Project',
    description: 'Project description',
    owner: 1,
    members: [mockUser]
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
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/tasks/1/')) {
        return Promise.resolve({ data: mockTask });
      } else if (url.includes('/api/stories/1/')) {
        return Promise.resolve({ data: mockStory });
      } else if (url.includes('/api/projects/1/sprints/1/')) {
        return Promise.resolve({ data: mockSprint });
      } else if (url.includes('/api/projects/1/')) {
        return Promise.resolve({ data: mockProject });
      } else if (url.includes('/api/projects/1/stories/')) {
        return Promise.resolve({ data: [mockStory] });
      } else if (url.includes('/api/stories/1/tasks/')) {
        return Promise.resolve({ data: [mockTask] });
      }
      
      return Promise.resolve({ data: {} });
    });
    
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
        user: mockUser,
        isAuthenticated: true
      },
      project: {
        currentProject: mockProject,
        loading: false
      },
      sprint: {
        currentSprint: mockSprint,
        loading: false
      }
    });
    
    // Mock dispatch
    store.dispatch = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('task detail page shows time tracking component', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/projects/1/tasks/1']}>
          <Routes>
            <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/',
        expect.anything()
      );
    });
    
    // Time tracking component should be rendered
    expect(screen.getByText(/Start Session/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hours spent/i)).toBeInTheDocument();
  });
  
  test('starting time tracking session updates the UI', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/projects/1/tasks/1']}>
          <Routes>
            <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Start Session/i)).toBeInTheDocument();
    });
    
    // Start session
    fireEvent.click(screen.getByText(/Start Session/i));
    
    // Check API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/start_session/',
        {},
        expect.anything()
      );
    });
    
    // UI should update to show timer
    await waitFor(() => {
      expect(screen.getByText(/Time elapsed/i)).toBeInTheDocument();
      expect(screen.getByText(/Stop Session/i)).toBeInTheDocument();
    });
  });
  
  test('active session is detected when navigating to task detail', async () => {
    // Set active session in localStorage
    localStorage.setItem('activeTaskSession', JSON.stringify({
      taskId: 1,
      startTime: new Date(mockDate.getTime() - 1800000).toISOString(), // 30 minutes ago
      story: 1
    }));
    
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/projects/1/tasks/1']}>
          <Routes>
            <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    // Task detail should load with active session
    await waitFor(() => {
      expect(screen.getByText(/Time elapsed/i)).toBeInTheDocument();
      expect(screen.getByText(/Stop Session/i)).toBeInTheDocument();
    });
    
    // Timer should show approximately 30 minutes
    expect(screen.getByText(/Time elapsed/i)).toHaveTextContent('00:30:00');
  });
  
  test('logging time updates the task hours', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/projects/1/tasks/1']}>
          <Routes>
            <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Hours spent/i)).toBeInTheDocument();
    });
    
    // Enter time and submit
    const timeInput = screen.getByLabelText(/Hours spent/i);
    fireEvent.change(timeInput, { target: { value: '2.5' } });
    fireEvent.click(screen.getByText(/Log Time/i));
    
    // Check API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/log_time/',
        { hours_spent: 2.5 },
        expect.anything()
      );
    });
    
    // API should be called to refresh task data
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/',
        expect.anything()
      );
    });
  });
  
  test('stopping time tracking session updates task hours', async () => {
    // Set active session in localStorage
    localStorage.setItem('activeTaskSession', JSON.stringify({
      taskId: 1,
      startTime: new Date(mockDate.getTime() - 3600000).toISOString(), // 1 hour ago
      story: 1
    }));
    
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/projects/1/tasks/1']}>
          <Routes>
            <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Stop Session/i)).toBeInTheDocument();
    });
    
    // Stop session
    fireEvent.click(screen.getByText(/Stop Session/i));
    
    // Check API call to stop session
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/stop_session/',
        expect.objectContaining({ elapsed_time: expect.any(Number) }),
        expect.anything()
      );
    });
    
    // Check if localStorage was cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith('activeTaskSession');
    
    // API should be called to refresh task data
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks/1/',
        expect.anything()
      );
    });
  });
  
  test('active session notification is shown on project board', async () => {
    // Set active session in localStorage
    localStorage.setItem('activeTaskSession', JSON.stringify({
      taskId: 1,
      startTime: new Date(mockDate.getTime() - 1800000).toISOString(), // 30 minutes ago
      story: 1
    }));
    
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/projects/1']}>
          <Routes>
            <Route path="/projects/:projectId" element={<ProjectBoard />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    // Wait for project board to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/projects/1/',
        expect.anything()
      );
    });
    
    // Should show active session notification
    expect(screen.getByText(/You have an active time tracking session/i)).toBeInTheDocument();
    
    // Should show task name
    expect(screen.getByText(/Task 1/i)).toBeInTheDocument();
    
    // Should show go to task button
    const goToTaskButton = screen.getByText(/Go to task/i);
    expect(goToTaskButton).toBeInTheDocument();
    
    // Clicking the button should navigate to task
    fireEvent.click(goToTaskButton);
    
    // Check if navigation happened
    expect(window.location.pathname).toBe('/projects/1/tasks/1');
  });
  
  test('task card in project board shows estimated vs. spent hours', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/projects/1']}>
          <Routes>
            <Route path="/projects/:projectId" element={<ProjectBoard />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    // Wait for project board to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/projects/1/stories/',
        expect.anything()
      );
    });
    
    // Should show task card with time information
    expect(screen.getByText(/Task 1/i)).toBeInTheDocument();
    expect(screen.getByText(/0\/5h/i)).toBeInTheDocument(); // 0 spent out of 5 estimated
  });
}); 