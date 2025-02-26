import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchStories = createAsyncThunk(
  'stories/fetchStories',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/stories/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchBacklogStories = createAsyncThunk(
  'stories/fetchBacklogStories',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/backlog/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createStory = createAsyncThunk(
  'stories/createStory',
  async ({ projectId, storyData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/projects/${projectId}/stories/`, storyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  stories: [],
  backlogStories: [],
  loading: false,
  error: null,
};

const storySlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    clearStoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stories reducers
      .addCase(fetchStories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.loading = false;
        state.stories = action.payload;
      })
      .addCase(fetchStories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch stories';
      })
      
      // Fetch backlog stories reducers
      .addCase(fetchBacklogStories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBacklogStories.fulfilled, (state, action) => {
        state.loading = false;
        state.backlogStories = action.payload;
      })
      .addCase(fetchBacklogStories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch backlog stories';
      })
      
      // Create story reducers
      .addCase(createStory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStory.fulfilled, (state, action) => {
        state.loading = false;
        state.stories.push(action.payload);
      })
      .addCase(createStory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create story';
      });
  },
});

export const { clearStoryError } = storySlice.actions;
export default storySlice.reducer; 