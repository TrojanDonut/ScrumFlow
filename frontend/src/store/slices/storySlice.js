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
      return rejectWithValue(err.response?.data || 'Failed to fetch stories');
    }
  }
);

export const fetchBacklogStories = createAsyncThunk(
  'stories/fetchBacklogStories',
  async (projectId, { rejectWithValue, getState }) => {
    try {
      console.log('Fetching backlog stories for project:', projectId);
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const url = `${API_URL}/projects/${projectId}/backlog/`;
      console.log('Making request to:', url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      console.log('Backlog API response:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching backlog stories:', err.response?.data || err.message);
      return rejectWithValue(err.response?.data || 'Failed to fetch backlog stories');
    }
  }
);

export const createStory = createAsyncThunk(
  'stories/createStory',
  async ({ sprintId, storyData, projectId }, { rejectWithValue, getState }) => {
    try {
      console.log('Creating story with data:', storyData);
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      // Include project_id in the story data
      const storyWithProject = {
        ...storyData,
        project: projectId,
        sprint: sprintId || null  // Ensure sprint is null if not provided
      };

      console.log('Sending story data:', storyWithProject);

      const response = await axios.post(`${API_URL}/stories/`, storyWithProject, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true,
      });
      
      console.log('Story created successfully:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error creating story:', err.response?.data || err.message);
      if (err.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue('Failed to create story. Please check your input and try again.');
    }
  }
);

export const updateStory = createAsyncThunk(
  'stories/updateStory',
  async ({ storyId, storyData }, { rejectWithValue, getState }) => {
    try {
      console.log('Updating story with ID:', storyId, 'and data:', storyData);
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
    resetBacklogStories: (state) => {
      state.backlogStories = [];
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
        console.log('Story created, payload:', action.payload);
        console.log('Current backlogStories:', state.backlogStories);
        
        // If the story doesn't have a sprint assigned, add it to backlogStories
        if (!action.payload.sprint) {
          // Check if story already exists in backlogStories
          const exists = state.backlogStories.some(story => story.id === action.payload.id);
          if (!exists) {
            state.backlogStories = [...state.backlogStories, action.payload];
          }
          console.log('Updated backlogStories:', state.backlogStories);
        } else {
          // Check if story already exists in stories
          const exists = state.stories.some(story => story.id === action.payload.id);
          if (!exists) {
            state.stories = [...state.stories, action.payload];
          }
        }
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

export const { clearStoryError, resetBacklogStories } = storySlice.actions;
export default storySlice.reducer; 