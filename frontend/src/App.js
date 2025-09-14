import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useSocket } from './contexts/SocketContext';
import { useNotification } from './contexts/NotificationContext';
import { PopupNotificationProvider } from './contexts/PopupNotificationContext';

// Layout Components
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PublicRoute from './components/Auth/PublicRoute';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard.js'));
const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/Orders/OrderDetailPage'));
const CreateOrderPage = lazy(() => import('./pages/Orders/CreateOrderPage'));
const TasksPage = lazy(() => import('./pages/Tasks/TasksPage'));
const TaskDetailPage = lazy(() => import('./pages/Tasks/TaskDetailPage'));
const CreateTaskPage = lazy(() => import('./pages/Tasks/CreateTaskPage'));
const UsersPage = lazy(() => import('./pages/Users/UsersPage'));
const UserDetailPage = lazy(() => import('./pages/Users/UserDetailPage'));
const CreateUserPage = lazy(() => import('./pages/Users/CreateUserPage'));
const NotificationsPage = lazy(() => import('./pages/Notifications/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage'));
const NotFoundPage = lazy(() => import('./pages/Error/NotFoundPage'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-gray-600">Sayfa yükleniyor...</p>
    </div>
  </div>
);

// Main App Component
function App() {
  const { user, loading: authLoading } = useAuth();
  const { connected: socketConnected } = useSocket();
  const { unreadCount } = useNotification();

  // Show loading spinner while checking authentication
  if (authLoading) {
    return <PageLoader />;
  }

  return (
    <PopupNotificationProvider>
      <div className="App">
        {/* Connection status indicator */}
        {user && !socketConnected && (
          <div className="fixed top-0 left-0 right-0 bg-warning-500 text-white text-center py-2 text-sm font-medium z-50">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Bağlantı yeniden kuruluyor...</span>
            </div>
          </div>
        )}

        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Orders */}
            <Route path="orders">
              <Route index element={<OrdersPage />} />
              <Route path="new" element={<CreateOrderPage />} />
              <Route path=":id" element={<OrderDetailPage />} />
            </Route>

            {/* Tasks */}
            <Route path="tasks">
              <Route index element={<TasksPage />} />
              <Route path="new" element={<CreateTaskPage />} />
              <Route path=":id" element={<TaskDetailPage />} />
            </Route>

            {/* Users (Admin and Store Staff only) */}
            <Route
              path="users"
              element={
                <ProtectedRoute requiredRoles={['admin', 'magaza_personeli']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/new"
              element={
                <ProtectedRoute requiredRoles={['admin', 'magaza_personeli']}>
                  <CreateUserPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/:id"
              element={
                <ProtectedRoute requiredRoles={['admin', 'magaza_personeli']}>
                  <UserDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Notifications */}
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Profile */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Settings (Admin only) */}
            <Route
              path="settings"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route
              path="reports"
              element={
                <ProtectedRoute requiredRoles={['admin', 'magaza_personeli']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all route - 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

        {/* Global notification badge for document title */}
        {user && unreadCount > 0 && (
          <DocumentTitle count={unreadCount} />
        )}
      </div>
    </PopupNotificationProvider>
  );
}

// Component to update document title with notification count
const DocumentTitle = ({ count }) => {
  React.useEffect(() => {
    const originalTitle = 'Fabrika-Mağaza Sipariş Takip Sistemi';
    document.title = count > 0 ? `(${count}) ${originalTitle}` : originalTitle;
    
    return () => {
      document.title = originalTitle;
    };
  }, [count]);

  return null;
};

export default App;