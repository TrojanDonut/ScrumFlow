import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import projectReducer from './slices/projectSlice';
import userReducer from './slices/userSlice';
import sprintReducer from './slices/sprintSlice';
import storyReducer from './slices/storySlice';
import taskReducer from './slices/taskSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    users: userReducer,
    sprints: sprintReducer,
    stories: storyReducer,
    tasks: taskReducer,
  },
});

export default store; 