import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectDetail from './pages/ProjectDetail';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import { useSelector } from 'react-redux';

function App() {
  const { isAuthenticated } = useSelector(state => state.auth);

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
          
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute adminOnly>
              <UserManagement />
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