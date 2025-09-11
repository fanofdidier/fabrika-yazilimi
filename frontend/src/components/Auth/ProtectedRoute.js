import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

const ProtectedRoute = ({ children, requiredRoles = null, requiredPermissions = null }) => {
  const { user, loading, isAuthenticated, hasRole, hasPermission } = useAuth();
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

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg 
                className="h-8 w-8 text-red-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Erişim Yetkisi Yok
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Bu sayfaya erişim için gerekli yetkiniz bulunmuyor.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                Geri Dön
              </button>
              <Navigate to="/dashboard" replace />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check permission-based access
  if (requiredPermissions) {
    const hasRequiredPermissions = Array.isArray(requiredPermissions)
      ? requiredPermissions.every(permission => hasPermission(permission))
      : hasPermission(requiredPermissions);

    if (!hasRequiredPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                <svg 
                  className="h-8 w-8 text-yellow-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Yetersiz İzin
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Bu işlemi gerçekleştirmek için gerekli izniniz bulunmuyor.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.history.back()}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Geri Dön
                </button>
                <Navigate to="/dashboard" replace />
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // User has access, render the protected content
  return children;
};

// Higher-order component for role-based protection
export const withRoleProtection = (Component, requiredRoles) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Higher-order component for permission-based protection
export const withPermissionProtection = (Component, requiredPermissions) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute requiredPermissions={requiredPermissions}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Admin only route
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin']}>
    {children}
  </ProtectedRoute>
);

// Store staff route (admin + store staff)
export const StoreStaffRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin', 'magaza_personeli']}>
    {children}
  </ProtectedRoute>
);

// Factory worker route (admin + factory worker)
export const FactoryWorkerRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin', 'fabrika_iscisi']}>
    {children}
  </ProtectedRoute>
);

// Any authenticated user route
export const AuthenticatedRoute = ({ children }) => (
  <ProtectedRoute>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;