import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Check if we have tokens already stored
const token = localStorage.getItem('access');
const refreshToken = localStorage.getItem('refresh');

// Helper to check if token is valid
const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login/`, credentials);
      const { access, refresh } = response.data;

      // Store tokens in local storage
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);

      // Configure axios headers for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      // Decode token to get user info
      const decoded = jwtDecode(access);
      return { token: access, refreshToken: refresh, user: decoded };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        return rejectWithValue('Not authenticated');
      }

      const response = await axios.get(`${API_URL}/users/me/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear tokens from local storage
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      delete axios.defaults.headers.common['Authorization'];
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  token: isTokenValid(token) ? token : null,
  refreshToken: refreshToken || null,
  isAuthenticated: isTokenValid(token),
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login reducers
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to login';
      })
      
      // Fetch current user reducers
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Logout reducers
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.refreshToken = null;
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer; 