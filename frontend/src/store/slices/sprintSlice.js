import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchSprints = createAsyncThunk(
  'sprints/fetchSprints',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/sprints/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchActiveSprint = createAsyncThunk(
  'sprints/fetchActiveSprint',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/active-sprint/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createSprint = createAsyncThunk(
  'sprints/createSprint',
  async ({ projectId, sprintData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/projects/${projectId}/sprints/`, sprintData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  sprints: [],
  activeSprint: null,
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
      });
  },
});

export const { clearSprintError } = sprintSlice.actions;
export default sprintSlice.reducer; 