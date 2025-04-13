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
      // Check if the error is due to 2FA requirement
      if (error.response && error.response.data && error.response.data.two_factor_required) {
        return rejectWithValue({
          detail: 'Two-factor authentication required',
          two_factor_required: true
        });
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${API_URL}/users/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      // If we get a 401, clear the auth state
      if (error.response?.status === 401) {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        delete axios.defaults.headers.common['Authorization'];
      }
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

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/auth/change-password/`, 
        passwordData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update tokens if returned
      if (response.data.access && response.data.refresh) {
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const setupTwoFactor = createAsyncThunk(
  'auth/setupTwoFactor',
  async (password, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/auth/2fa/setup/`, 
        { password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const verifyTwoFactor = createAsyncThunk(
  'auth/verifyTwoFactor',
  async (data, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/auth/2fa/verify/`, 
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const disableTwoFactor = createAsyncThunk(
  'auth/disableTwoFactor',
  async (password, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(
        `${API_URL}/auth/2fa/disable/`, 
        { password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
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
  twoFactorSetup: {
    qrCode: null,
    secretKey: null,
    loading: false,
    error: null,
  },
  passwordChange: {
    success: false,
    loading: false,
    error: null,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPasswordChangeState: (state) => {
      state.passwordChange = {
        success: false,
        loading: false,
        error: null,
      };
    },
    clearTwoFactorSetupState: (state) => {
      state.twoFactorSetup = {
        qrCode: null,
        secretKey: null,
        loading: false,
        error: null,
      };
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
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
        state.refreshToken = null;
      })
      
      // Logout reducers
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.refreshToken = null;
        state.user = null;
      })
      
      // Change password reducers
      .addCase(changePassword.pending, (state) => {
        state.passwordChange.loading = true;
        state.passwordChange.error = null;
        state.passwordChange.success = false;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.passwordChange.loading = false;
        state.passwordChange.success = true;
        if (action.payload.access && action.payload.refresh) {
          state.token = action.payload.access;
          state.refreshToken = action.payload.refresh;
        }
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordChange.loading = false;
        state.passwordChange.error = action.payload;
      })
      
      // Setup two-factor authentication reducers
      .addCase(setupTwoFactor.pending, (state) => {
        state.twoFactorSetup.loading = true;
        state.twoFactorSetup.error = null;
      })
      .addCase(setupTwoFactor.fulfilled, (state, action) => {
        state.twoFactorSetup.loading = false;
        state.twoFactorSetup.qrCode = action.payload.qr_code;
        state.twoFactorSetup.secretKey = action.payload.secret_key;
      })
      .addCase(setupTwoFactor.rejected, (state, action) => {
        state.twoFactorSetup.loading = false;
        state.twoFactorSetup.error = action.payload;
      })
      
      // Verify two-factor authentication reducers
      .addCase(verifyTwoFactor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyTwoFactor.fulfilled, (state) => {
        state.loading = false;
        state.user = {
          ...state.user,
          two_factor_enabled: true
        };
      })
      .addCase(verifyTwoFactor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Disable two-factor authentication reducers
      .addCase(disableTwoFactor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(disableTwoFactor.fulfilled, (state) => {
        state.loading = false;
        state.user = {
          ...state.user,
          two_factor_enabled: false
        };
      })
      .addCase(disableTwoFactor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearPasswordChangeState, clearTwoFactorSetupState } = authSlice.actions;
export default authSlice.reducer; 