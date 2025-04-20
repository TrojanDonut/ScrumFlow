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

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add task');
    }
  }
);

export const acceptTask = createAsyncThunk(
  'tasks/acceptTask',
  async (taskId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/tasks/${taskId}/accept/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to accept task');
    }
  }
);

export const assignTask = createAsyncThunk(
  'tasks/assignTask',
  async (taskId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/tasks/${taskId}/assign/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to assign task');
    }
  }
);

export const unassignTask = createAsyncThunk(
  'tasks/unassignTask',
  async (taskId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/tasks/${taskId}/unassign/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to unassign task');
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

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, taskData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.patch(
        `${API_URL}/tasks/${taskId}/`,
        taskData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      await axios.delete(`${API_URL}/tasks/${taskId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      return taskId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete task');
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
        state.tasksByStoryId[action.payload.story].push(action.payload);
      })
      .addCase(addTaskToStory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create task';
      })

      // Assign task reducers
      .addCase(assignTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignTask.fulfilled, (state, action) => {
        state.loading = false;
        const task = action.payload;
        const storyTasks = state.tasksByStoryId[task.story] || [];
        const index = storyTasks.findIndex((t) => t.id === task.id);
        if (index !== -1) {
          storyTasks[index] = task;
        }
      })
      .addCase(assignTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to assign task';
      })

      // Unassign task reducers
      .addCase(unassignTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unassignTask.fulfilled, (state, action) => {
        state.loading = false;
        const task = action.payload;
        const storyTasks = state.tasksByStoryId[task.story] || [];
        const index = storyTasks.findIndex((t) => t.id === task.id);
        if (index !== -1) {
          storyTasks[index] = task;
        }
      })
      .addCase(unassignTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to unassign task';
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
      })

      // Update task reducers
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTask = action.payload;
        const storyTasks = state.tasksByStoryId[updatedTask.story] || [];
        const index = storyTasks.findIndex((task) => task.id === updatedTask.id);
        if (index !== -1) {
          storyTasks[index] = updatedTask;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update task';
      })

      // Handle delete task reducers
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        const taskId = action.payload;
        for (const storyId in state.tasksByStoryId) {
          state.tasksByStoryId[storyId] = state.tasksByStoryId[storyId].filter(
            (task) => task.id !== taskId
          );
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete task';
      });
  },
});

export const { clearTaskError } = taskSlice.actions;
export default taskSlice.reducer;