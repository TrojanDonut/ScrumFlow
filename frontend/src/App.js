import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectDetail from './pages/ProjectDetail';
import UserManagement from './pages/UserManagement';
import CreateProject from './pages/CreateProject';
import ProtectedRoute from './components/ProtectedRoute';
import EditProjectMembers from './pages/EditProjectMembers';
import ChangePassword from './pages/ChangePassword';
import TwoFactorSetup from './pages/TwoFactorSetup';
import UserProfile from './pages/UserProfile';
import Instructions from './pages/Instructions';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCurrentUser } from './store/slices/authSlice';
import EditProject from './pages/EditProject';
import UserStories from './pages/UserStories';

function App() {
  const { isAuthenticated } = useSelector(state => state.auth);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <>
      <Header />
      <Container className="py-4">
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/projects" element={
            <ProtectedRoute>
              <ProjectsList />
            </ProtectedRoute>
          } />

          <Route path="/projects/new" element={
            <ProtectedRoute adminOnly={true}>
              <CreateProject />
            </ProtectedRoute>
          } />
          
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          } />

          <Route path="/projects/:id/members" element={
            <ProtectedRoute>
              <EditProjectMembers />
            </ProtectedRoute>
          } />

          <Route path="/projects/:id/edit" element={
            <ProtectedRoute adminOnly>
              <EditProject />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute adminOnly>
              <UserManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } />
          
          <Route path="/two-factor-setup" element={
            <ProtectedRoute>
              <TwoFactorSetup />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/instructions" element={
            <ProtectedRoute>
              <Instructions />
            </ProtectedRoute>
          } />
          
          <Route path="/projects/:projectId/sprints/:sprintId/user-stories" element={
            <ProtectedRoute>
              <UserStories />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </Container>
    </>
  );
}

export default App;