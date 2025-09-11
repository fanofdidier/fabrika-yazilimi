import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

const PublicRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Yetkilendirme kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard or intended page
  if (isAuthenticated && user) {
    // Check if there's a redirect location from previous navigation
    const from = location.state?.from || redirectTo;
    return <Navigate to={from} replace />;
  }

  // User is not authenticated, show public content
  return children;
};

export default PublicRoute;