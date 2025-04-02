import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchStories = createAsyncThunk(
  'stories/fetchStories',
  async ({sprintId}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/sprints/${sprintId}/stories/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      rejectWithValue(err.response.data);
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
  async ({ sprintId, storyData }, { rejectWithValue, getState }) => {
    try {
      console.log('Creating story with data:', storyData);
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(`${API_URL}/stories/`, storyData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      console.error('Error creating story:', err.response?.data || err.message);
      rejectWithValue(err.response.data);
    }
  }
);

export const updateStory = createAsyncThunk(
  'stories/updateStory',
  async ({ storyId, storyData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.put(`${API_URL}/stories/${storyId}/`,
        storyData,
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        return response.data;
      }
    catch (error) { 
      console.error('Error updating story:', error.response?.data || error.message);
      return rejectWithValue(error.response.data);
    }
  }
);

export const removeStoryFromSprint = createAsyncThunk(
  'stories/removeStoryFromSprint',
  async ({ storyId }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(`${API_URL}/stories/${storyId}/remove-from-sprint/`, {
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
      })
      .addCase(updateStory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.stories.findIndex(story => story.id === action.payload.id);
        if (index !== -1) {
          state.stories[index] = action.payload;
        }
      })
      .addCase(updateStory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update story';
      })
      .addCase(removeStoryFromSprint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeStoryFromSprint.fulfilled, (state, action) => {
        state.loading = false;
        const storyId = action.meta.arg.storyId;
        state.stories = state.stories.map(story =>
          story.id === storyId ? { ...story, sprint: null } : story
        );
      })
      .addCase(removeStoryFromSprint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove story from sprint';
      });
  },
});

export const { clearStoryError } = storySlice.actions;
export default storySlice.reducer; 