import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/projects/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (projectId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/projects/${projectId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  'users/fetchAllUsers',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(`${API_URL}/projects/`, projectData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({id, projectData}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;
      if (!token) {
        throw new Error('No token found');
      }
      const response = await axios.put(`${API_URL}/projects/${id}/`, projectData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const removeMemberFromProject = createAsyncThunk(
  'projects/removeMemberFromProject',
  async ({userId, projectId}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }
      const response = await axios.delete(`${API_URL}/projects/${projectId}/members/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const addMemberToProject = createAsyncThunk(
  'projects/addMemberToProject',
  async ({userId, projectId, role}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const projectData = {
        user: userId,
        role: role,
      };

      const response = await axios.post(`${API_URL}/projects/${projectId}/members/`, projectData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.delete(`${API_URL}/projects/${projectId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const updateProjectMemberRole = createAsyncThunk(
  'projects/updateProjectMemberRole',
  async ({projectId, userId, role}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.put(`${API_URL}/projects/${projectId}/members/${userId}/`, { user: userId, role: role }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);


const initialState = {
  projects: [],
  currentProject: null,
  members: [],
  loading: false,
  error: null,
};

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearProjectError: (state) => {
      state.error = null;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects reducers
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch projects';
      })
      // Fetch project by id reducers
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch project';
      })
      // Create project reducers
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = 'Failed to create project';
      })
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(removeMemberFromProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeMemberFromProject.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject.members = state.currentProject.members.filter(
          (member) => member.id !== action.meta.arg.userId
        )
      })
      .addCase(removeMemberFromProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove member from project';
      })
      .addCase(addMemberToProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMemberToProject.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject.members = [...state.currentProject.members, action.payload];
      })
      .addCase(addMemberToProject.rejected, (state, action) => {
        state.loading = false;
        state.error = 'Failed to add member to project';
      })
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.projects.findIndex(project => project.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = 'Failed to update project';
      })
      .addCase(updateProjectMemberRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      }
      )
      .addCase(updateProjectMemberRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.currentProject.members.findIndex(member => member.id === action.payload.id);
        if (index !== -1) {
          state.currentProject.members[index] = action.payload;
        }
      })
      .addCase(updateProjectMemberRole.rejected, (state, action) => {
        state.loading = false;
        state.error = 'Failed to update member role';
      });
  },
});

export const { clearProjectError, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;