import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useProtectedRoute = (requiredRole) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      // If no user, redirect to login
      if (!user) {
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
        return;
      }

      // If role doesn't match required role, redirect to appropriate dashboard
      if (requiredRole && user.role !== requiredRole) {
        let redirectPath = '/';
        
        if (user.role === 'owner') {
          redirectPath = '/owner/dashboard';
        } else if (user.role === 'admin') {
          redirectPath = '/admin/dashboard';
        } else if (user.role === 'student') {
          redirectPath = '/student/dashboard';
        }

        // Only navigate if not already on the correct path
        if (location.pathname !== redirectPath) {
          navigate(redirectPath, { replace: true });
        }
      }
    }
  }, [user, loading, requiredRole, navigate, location.pathname]);

  return { user, loading };
};
