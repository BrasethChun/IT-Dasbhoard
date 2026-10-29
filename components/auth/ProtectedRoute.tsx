import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoutePath } from '../../types';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // If we are still initializing (e.g., checking tokens and user isn't set yet, wait... 
  // actually wait, AuthProvider blocks rendering until loading is done!)
  
  if (!isAuthenticated) {
    return <Navigate to={RoutePath.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};