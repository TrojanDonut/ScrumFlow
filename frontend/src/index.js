import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

// Setup axios defaults and interceptors
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Set default base URL
axios.defaults.baseURL = API_URL;

// Add request interceptor to add auth token to requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is due to an expired token and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh');
        if (!refreshToken) {
          // No refresh token available, redirect to login
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Try to get a new token
        const response = await axios.post(
          `${API_URL}/auth/token/refresh/`,
          { refresh: refreshToken },
          { _retry: true } // Mark this request to avoid infinite loop
        );
        
        const { access } = response.data;
        
        // Save the new token
        localStorage.setItem('access', access);
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
); 