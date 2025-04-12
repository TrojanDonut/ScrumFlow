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

      const response = await axios.post(`${API_URL}/user-stories/`, storyWithProject, {
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

      const response = await axios.put(`${API_URL}/user-stories/${storyId}/`,
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

export const deleteStory = createAsyncThunk(
  'stories/deleteStory',
  async ({ storyId }, { rejectWithValue, getState }) => {
    try {
      console.log('Sending DELETE request for story ID:', storyId); // Debugging
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.delete(`${API_URL}/user-stories/${storyId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      console.log('Story marked as deleted:', response.data); // Debugging
      return { storyId, ...response.data };
    } catch (error) {
      console.error('Error deleting story:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to delete story');
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

      const response = await axios.post(`${API_URL}/user-stories/${storyId}/remove-from-sprint/`, {
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
  backlogStories: {
    finished: [],
    unrealized: {
      active: [],
      unactive: []
    }
  },
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
      state.backlogStories = {
        finished: [],
        unrealized: {
          active: [],
          unactive: []
        }
      };
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
        
        // The API is returning an array of stories, not a structured object
        // Convert the array into the expected structure
        const stories = action.payload || [];
        
        // Organize stories by status and sprint
        const backlogStories = {
          finished: stories.filter(story => story.status === 'COMPLETED' || story.status === 'ACCEPTED'),
          unrealized: {
            active: stories.filter(story => (story.status !== 'COMPLETED' && story.status !== 'ACCEPTED') && story.sprint),
            unactive: stories.filter(story => (story.status !== 'COMPLETED' && story.status !== 'ACCEPTED') && !story.sprint)
          }
        };
        
        state.backlogStories = backlogStories;
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
        
        // Handle adding the new story to the appropriate category
        const newStory = action.payload;
        
        if (newStory.status === 'ACCEPTED') {
          // Add to finished stories
          state.backlogStories.finished.push(newStory);
        } else {
          // Add to unrealized stories
          if (newStory.sprint) {
            // Add to active stories
            state.backlogStories.unrealized.active.push(newStory);
          } else {
            // Add to unactive stories
            state.backlogStories.unrealized.unactive.push(newStory);
          }
        }
        
        // If it has a sprint, also add to sprint stories
        if (newStory.sprint) {
          const exists = state.stories.some(story => story.id === newStory.id);
          if (!exists) {
            state.stories.push(newStory);
          }
        }
      })
      .addCase(createStory.rejected, (state, action) => {
        state.loading = false;
        state.error = 'Failed to create story';
      })
      .addCase(updateStory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStory.fulfilled, (state, action) => {
        state.loading = false;
        const updatedStory = action.payload;
        
        // Update in sprint stories list if applicable
        const sprintIndex = state.stories.findIndex(story => story.id === updatedStory.id);
        if (sprintIndex !== -1) {
          state.stories[sprintIndex] = updatedStory;
        }
        
        // Update in the appropriate backlog category
        // First, remove the story from all categories
        state.backlogStories.finished = state.backlogStories.finished.filter(
          story => story.id !== updatedStory.id
        );
        state.backlogStories.unrealized.active = state.backlogStories.unrealized.active.filter(
          story => story.id !== updatedStory.id
        );
        state.backlogStories.unrealized.unactive = state.backlogStories.unrealized.unactive.filter(
          story => story.id !== updatedStory.id
        );
        
        // Then add to the appropriate category
        if (updatedStory.status === 'ACCEPTED') {
          state.backlogStories.finished.push(updatedStory);
        } else if (updatedStory.sprint) {
          state.backlogStories.unrealized.active.push(updatedStory);
        } else {
          state.backlogStories.unrealized.unactive.push(updatedStory);
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
        
        // Update the story in sprint stories
        state.stories = state.stories.map(story =>
          story.id === storyId ? { ...story, sprint: null } : story
        );
        
        // Update in backlog categories
        // Find the story in active stories
        const storyIndex = state.backlogStories.unrealized.active.findIndex(
          story => story.id === storyId
        );
        
        if (storyIndex !== -1) {
          // Remove from active stories
          const updatedStory = {...state.backlogStories.unrealized.active[storyIndex], sprint: null};
          state.backlogStories.unrealized.active.splice(storyIndex, 1);
          
          // Add to unactive stories
          state.backlogStories.unrealized.unactive.push(updatedStory);
        }
      })
      .addCase(removeStoryFromSprint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove story from sprint';
      });
  },
});

export const { clearStoryError, resetBacklogStories } = storySlice.actions;
export default storySlice.reducer; 