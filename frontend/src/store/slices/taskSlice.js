import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchTasksByProject = createAsyncThunk(
  'tasks/fetchTasksByProject',
  async (projectId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/projects/${projectId}/tasks/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      // Group tasks by story_id
      const tasksByStoryId = response.data.reduce((acc, task) => {
        if (!acc[task.story]) {
          acc[task.story] = [];
        }
        acc[task.story].push(task);
        return acc;
      }, {});

      return tasksByStoryId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch tasks for project');
    }
  }
);

export const fetchTasksStory = createAsyncThunk(
  'tasks/fetchTasks',
  async (storyId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/stories/${storyId}/tasks/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch tasks for story');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async ({ storyId, taskData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/stories/${storyId}/tasks/`, taskData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ taskId, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/stories/tasks/${taskId}/`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasksByStoryId: {},
    loadingByProjectId: {},
    loadingByStoryId: {},
    error: null,
  },
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks by project reducers
      .addCase(fetchTasksByProject.pending, (state, action) => {
        console.log(`Fetching tasks for project ${action.meta.arg}`);
        state.loadingByProjectId[action.meta.arg] = true;
        state.error = null;
      })
      .addCase(fetchTasksByProject.fulfilled, (state, action) => {
        console.log(`Tasks fetched for project ${action.meta.arg}:`, action.payload);
        state.tasksByStoryId = action.payload; // Update tasks grouped by story_id
        state.loadingByProjectId[action.meta.arg] = false;
      })
      .addCase(fetchTasksByProject.rejected, (state, action) => {
        console.error(`Failed to fetch tasks for project ${action.meta.arg}:`, action.payload);
        state.loadingByProjectId[action.meta.arg] = false;
        state.error = action.payload || 'Failed to fetch tasks for project';
      })  
    
    // Fetch tasks reducers
      .addCase(fetchTasksStory.pending, (state, action) => {
        console.log(`Fetching tasks for story ${action.meta.arg}`);
        state.loadingByStoryId[action.meta.arg] = true;
      })
      .addCase(fetchTasksStory.fulfilled, (state, action) => {
        console.log(`Tasks fetched for story ${action.meta.arg}:`, action.payload.tasks);
        state.tasksByStoryId[action.payload.storyId] = action.payload.tasks;
        state.loadingByStoryId[action.payload.storyId] = false;
      })
      .addCase(fetchTasksStory.rejected, (state, action) => {
        console.error(`Failed to fetch tasks for story ${action.meta.arg}:`, action.payload);
        state.loadingByStoryId[action.meta.arg] = false;
      })
      
      // Create task reducers
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create task';
      })
      
      // Update task status reducers
      .addCase(updateTaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update task status';
      });
  },
});

export const { clearTaskError } = taskSlice.actions;
export default taskSlice.reducer; 