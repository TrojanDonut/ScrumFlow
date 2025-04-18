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

      // Add debug logging
      console.log("Fetched tasks:", response.data);
      console.log("Organized tasks by story ID:", tasksByStoryId);

      return tasksByStoryId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch tasks for project');
    }
  }
);

export const fetchUsersForProject = createAsyncThunk(
  'tasks/fetchUsersForProject',
  async (projectId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/projects/${projectId}/members/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch users for project');
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

export const addTaskToStory = createAsyncThunk(
  'tasks/addTaskToStory',
  async ({ storyId, taskData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/stories/${storyId}/tasks/`,
        taskData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      return { task: response.data, storyId };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add task');
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
    projectUsers: {},
    error: null,
  },
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
    addTaskToStoryLocally: (state, action) => {
      const { task, storyId } = action.payload;
      if (!state.tasksByStoryId[storyId]) {
        state.tasksByStoryId[storyId] = [];
      }
      // Remove any existing task with the same ID (for optimistic updates)
      state.tasksByStoryId[storyId] = state.tasksByStoryId[storyId].filter(t => t.id !== task.id);
      state.tasksByStoryId[storyId].push(task);
    },
    removeTaskLocally: (state, action) => {
      const { taskId, storyId } = action.payload;
      if (state.tasksByStoryId[storyId]) {
        state.tasksByStoryId[storyId] = state.tasksByStoryId[storyId].filter(task => task.id !== taskId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users by project reducers
      .addCase(fetchUsersForProject.pending, (state, action) => {
        console.log(`Fetching users for project ${action.meta.arg}`);
        state.loadingByProjectId[action.meta.arg] = true;
        state.error = null;
      })
      .addCase(fetchUsersForProject.fulfilled, (state, action) => {
        console.log(`Users fetched for project ${action.meta.arg}:`, action.payload);
        state.projectUsers = action.payload;
        state.loadingByProjectId[action.meta.arg] = false;
      })
      .addCase(fetchUsersForProject.rejected, (state, action) => {
        console.error(`Failed to fetch users for project ${action.meta.arg}:`, action.payload);
        state.loadingByProjectId[action.meta.arg] = false;
        state.error = action.payload || 'Failed to fetch users for project';
      })  
    
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
        console.log("Current tasksByStoryId state:", state.tasksByStoryId);
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
      .addCase(addTaskToStory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTaskToStory.fulfilled, (state, action) => {
        state.loading = false;
        const { task, storyId } = action.payload;
        if (!state.tasksByStoryId[storyId]) {
          state.tasksByStoryId[storyId] = [];
        }
        state.tasksByStoryId[storyId].push(task);
      })
      .addCase(addTaskToStory.rejected, (state, action) => {
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

export const { clearTaskError, addTaskToStoryLocally, removeTaskLocally } = taskSlice.actions;
export default taskSlice.reducer;