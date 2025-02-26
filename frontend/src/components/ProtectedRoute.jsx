import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !user?.is_system_admin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute; 