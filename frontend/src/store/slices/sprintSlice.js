import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchSprints = createAsyncThunk(
  'sprints/fetchSprints',
  async (projectId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/projects/${projectId}/sprints/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
        
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchActiveSprint = createAsyncThunk(
  'sprints/fetchActiveSprint',
  async (projectId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/projects/${projectId}/active-sprint/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createSprint = createAsyncThunk(
  'sprints/createSprint',
  async ({ projectId, sprintData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      // Add the project ID to the sprint data
      const sprintDataWithProject = {
        ...sprintData,
        project: projectId  // Add this line
      };

      const response = await axios.post(
        `${API_URL}/projects/${projectId}/sprints/`, 
        sprintDataWithProject,  // Send updated data
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchSprintById = createAsyncThunk(
  'sprints/fetchSprintById',
  async ({ projectId, sprintId }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/projects/${projectId}/sprints/${sprintId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateSprint = createAsyncThunk(
  'sprints/updateSprint',
  async ({ projectId, sprintId, sprintData }, { rejectWithValue, getState }) => {
    try {
      console.log('Updating sprint with data:', sprintData);

      const { auth } = getState();
      const token = auth.token;
      if (!token) {
        throw new Error('No token found');
      }
      const response = await axios.put(
        `${API_URL}/projects/${projectId}/sprints/${sprintId}/`,
        sprintData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating sprint:', error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCompletedSprints = createAsyncThunk(
  'sprints/fetchCompletedSprints',
  async (projectId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/projects/${projectId}/sprints/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      
      // Filter samo zaključene sprinte
      const completedSprints = response.data.filter(sprint => sprint.is_completed);
      return completedSprints;
    } catch (error) {
      console.error('Error fetching completed sprints:', error);
      return rejectWithValue(error.response?.data || 'Failed to fetch completed sprints');
    }
  }
);

const initialState = {
  sprints: [],
  currentSprint: null,
  completedSprints: [], // Dodano polje za zaključene sprinte
  loading: false,
  error: null,
};

const sprintSlice = createSlice({
  name: 'sprints',
  initialState,
  reducers: {
    clearSprintError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sprints reducers
      .addCase(fetchSprints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSprints.fulfilled, (state, action) => {
        state.loading = false;
        state.sprints = action.payload;
      })
      .addCase(fetchSprints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch sprints';
      })
      
      // Fetch active sprint reducers
      .addCase(fetchActiveSprint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveSprint.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSprint = action.payload;
      })
      .addCase(fetchActiveSprint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch active sprint';
      })
      
      // Create sprint reducers
      .addCase(createSprint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSprint.fulfilled, (state, action) => {
        state.loading = false;
        state.sprints.push(action.payload);
      })
      .addCase(createSprint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create sprint';
      })
      // Fetch sprint by ID reducers
      .addCase(fetchSprintById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSprintById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSprint = action.payload;
      })
      .addCase(fetchSprintById.rejected, (state, action) => {
        state.loading = false;
        state.error = 'Failed to fetch sprint by ID';
      })
      
      // Fetch completed sprints reducers
      .addCase(fetchCompletedSprints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompletedSprints.fulfilled, (state, action) => {
        state.loading = false;
        state.completedSprints = action.payload;
      })
      .addCase(fetchCompletedSprints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch completed sprints';
      });
  },
});

export const { clearSprintError } = sprintSlice.actions;
export default sprintSlice.reducer;