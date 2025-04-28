import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchStories = createAsyncThunk(
  'stories/fetchStories',
  async ({projectId, sprintId}, { rejectWithValue, getState }) => {
    try {
      console.log(`Fetching stories for sprint: ${sprintId}`);
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
      console.log('Sprint stories response:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching sprint stories:', err.response?.data || err.message);
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

      const response = await axios.delete(`${API_URL}/stories/${storyId}/`, {
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
      console.log(`Removing story ${storyId} from sprint`);
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/user-stories/${storyId}/remove-from-sprint/`, 
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );
      console.log('Story removed from sprint successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error removing story from sprint:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to remove story from sprint');
    }
  }
);

export const addStoryToSprint = createAsyncThunk(
  'stories/addStoryToSprint',
  async ({ storyId, sprintId }, { rejectWithValue, getState }) => {
    try {
      console.log(`Adding story ${storyId} to sprint ${sprintId}`);
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/stories/${storyId}/move-to-sprint/${sprintId}/`, 
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );
      
      console.log('Story added to sprint successfully:', response.data);
      // Log the complete response for debugging
      console.log('Full API response:', {
        status: response.status,
        data: response.data,
        storyId: storyId,
        sprintId: sprintId
      });
      return response.data;
    } catch (error) {
      console.error('Error adding story to sprint:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to add story to sprint');
    }
  }
);

export const returnStoriesToBacklog = createAsyncThunk(
  'stories/returnStoriesToBacklog',
  async ({ projectId, sprintId }, { rejectWithValue, getState }) => {
    try {
      console.log(`Returning incomplete stories from sprint ${sprintId} to backlog`);
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/projects/${projectId}/sprints/${sprintId}/return-stories/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );
      
      console.log('Stories returned to backlog successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error returning stories to backlog:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to return stories to backlog');
    }
  }
);

export const updateStoryStatus = createAsyncThunk(
  'stories/updateStoryStatus',
  async ({ storyId, status, rejectionReason }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      console.log(`Sending request to update story ${storyId} status to ${status}`);
      const response = await axios.post(
        `${API_URL}/user-stories/${storyId}/update-status/`,
        { 
          status,
          rejection_reason: rejectionReason // Include rejection reason in the payload
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating story status:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || `Failed to update story status to ${status}`);
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
        // The API now returns a structured object, not an array
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
      })
      .addCase(addStoryToSprint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addStoryToSprint.fulfilled, (state, action) => {
        state.loading = false;
        const storyId = action.meta.arg.storyId;
        const sprintId = action.meta.arg.sprintId;
        console.log('addStoryToSprint fulfilled with payload:', action.payload);
        console.log('Current stories in state:', state.stories);
        
        // Find if the story is already in sprint stories
        const storyExists = state.stories.some(story => story.id === storyId);
        
        // Update the story in sprint stories if it exists, otherwise add it
        if (storyExists) {
          state.stories = state.stories.map(story =>
            story.id === storyId ? { ...story, sprint: sprintId } : story
          );
        } else if (action.payload) {
          // If we have payload data, add the story to sprint stories
          state.stories.push(action.payload);
        }
        
        console.log('Updated stories in state:', state.stories);
        
        // Update in backlog categories
        // Find the story in unactive stories
        const storyInUnactive = state.backlogStories.unrealized.unactive.findIndex(
          story => story.id === storyId
        );
        
        if (storyInUnactive !== -1) {
          // Remove from unactive stories
          const updatedStory = {
            ...state.backlogStories.unrealized.unactive[storyInUnactive], 
            sprint: sprintId
          };
          state.backlogStories.unrealized.unactive.splice(storyInUnactive, 1);
          
          // Add to active stories
          state.backlogStories.unrealized.active.push(updatedStory);
          console.log('Story moved from unactive to active in backlog');
        } else {
          // Find the story in active stories to update its sprint ID
          const storyIndex = state.backlogStories.unrealized.active.findIndex(
            story => story.id === storyId
          );
          
          if (storyIndex !== -1) {
            // Update the sprint ID
            state.backlogStories.unrealized.active[storyIndex].sprint = sprintId;
            console.log('Story updated in active backlog');
          }
        }
      })
      .addCase(addStoryToSprint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add story to sprint';
      })
      .addCase(returnStoriesToBacklog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(returnStoriesToBacklog.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Stories returned to backlog:', action.payload);
        
        // Ne posodabljamo celotne strukture backlogStories,
        // ker API ne vrača nove strukture, ampak samo podatke o uspehu operacije
        
        // Lahko dodamo komentar o uspehu operacije
        state.lastAction = {
          type: 'RETURN_TO_BACKLOG',
          message: `Successfully returned ${action.payload.stories_count} stories to backlog`,
          timestamp: new Date().toISOString()
        };
        
        // Ne spreminjamo `state.stories`, ker moramo podatke pridobiti na novo
        // s fetchBacklogStories, kar je že implementirano v handleReturnStoriesToBacklog
      })
      .addCase(returnStoriesToBacklog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to return stories to backlog';
      })
      .addCase(updateStoryStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStoryStatus.fulfilled, (state, action) => {
        state.loading = false;
        
        const updatedStory = {
          ...action.payload,
          // Eksplicitno nastavimo sprint na null za ACCEPTED in REJECTED zgodbe
          sprint: action.payload.status === 'ACCEPTED' || action.payload.status === 'REJECTED' 
            ? null 
            : action.payload.sprint
        };
        
        // Če je zgodba sprejeta ali zavrnjena, jo odstrani iz seznama zgodb sprinta
        if (updatedStory.status === 'ACCEPTED' || updatedStory.status === 'REJECTED') {
          state.stories = state.stories.filter(story => story.id !== updatedStory.id);
        } else {
          // Posodobi zgodbo v seznamu zgodb sprinta
          const storyIndex = state.stories.findIndex(story => story.id === updatedStory.id);
          if (storyIndex !== -1) {
            state.stories[storyIndex] = updatedStory;
          }
        }
        
        // Posodobi backlog glede na status
        
        // Najprej odstrani zgodbo iz vseh kategorij
        state.backlogStories.unrealized.active = state.backlogStories.unrealized.active.filter(
          story => story.id !== updatedStory.id
        );
        
        state.backlogStories.unrealized.unactive = state.backlogStories.unrealized.unactive.filter(
          story => story.id !== updatedStory.id
        );
        
        state.backlogStories.finished = state.backlogStories.finished.filter(
          story => story.id !== updatedStory.id
        );
        
        // Dodaj v ustrezno kategorijo
        if (updatedStory.status === 'ACCEPTED') {
          // Dodaj v končane zgodbe (finished)
          state.backlogStories.finished.push({...updatedStory, sprint: null});
        } else if (updatedStory.status === 'REJECTED') {
          // Dodaj v nepripisane zgodbe (unactive)
          state.backlogStories.unrealized.unactive.push({...updatedStory, sprint: null});
        }
      })
      .addCase(updateStoryStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update story status';
      });
  },
});

export const { clearStoryError, resetBacklogStories } = storySlice.actions;
export default storySlice.reducer;