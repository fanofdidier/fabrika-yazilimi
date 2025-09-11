import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import api from '../services/api';

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  limit: 20,
};

// Action types
const NOTIFICATION_ACTIONS = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  UPDATE_UNREAD_COUNT: 'UPDATE_UNREAD_COUNT',
  RESET_NOTIFICATIONS: 'RESET_NOTIFICATIONS',
  LOAD_MORE_SUCCESS: 'LOAD_MORE_SUCCESS',
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.FETCH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case NOTIFICATION_ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        hasMore: action.payload.hasMore,
        page: action.payload.page,
        loading: false,
        error: null,
      };

    case NOTIFICATION_ACTIONS.LOAD_MORE_SUCCESS:
      return {
        ...state,
        notifications: [...(state.notifications || []), ...(action.payload.notifications || [])],
        hasMore: action.payload.hasMore,
        page: action.payload.page,
        loading: false,
      };

    case NOTIFICATION_ACTIONS.FETCH_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...(state.notifications || [])],
        unreadCount: action.payload.read ? state.unreadCount : state.unreadCount + 1,
      };

    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: (state.notifications || []).map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: (state.notifications || []).map(notification => ({
          ...notification,
          read: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      };

    case NOTIFICATION_ACTIONS.DELETE_NOTIFICATION:
      const deletedNotification = (state.notifications || []).find(n => n.id === action.payload);
      return {
        ...state,
        notifications: (state.notifications || []).filter(notification => notification.id !== action.payload),
        unreadCount: deletedNotification && !deletedNotification.read 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      };

    case NOTIFICATION_ACTIONS.UPDATE_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload,
      };

    case NOTIFICATION_ACTIONS.RESET_NOTIFICATIONS:
      return initialState;

    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext();

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const fetchTimeoutRef = useRef(null);

  // Güvenlik kontrolü - state.notifications her zaman array olmalı
  const safeState = {
    ...state,
    notifications: state.notifications || [],
    unreadCount: state.unreadCount || 0,
    loading: state.loading || false,
    error: state.error || null,
    hasMore: state.hasMore || false,
    page: state.page || 1,
    limit: state.limit || 20
  };

  // Fetch notifications with debouncing
  const fetchNotifications = useCallback(async (page = 1, reset = true) => {
    if (!isAuthenticated) return;

    // Clear existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce the API call
    fetchTimeoutRef.current = setTimeout(async () => {
      dispatch({ type: NOTIFICATION_ACTIONS.FETCH_START });

      try {
        const response = await api.get('/notifications', {
          params: {
            page,
            limit: safeState.limit,
          },
        });

        const responseData = response.data.data || response.data;
        const { notifications, pagination } = responseData;
        const unreadCount = responseData.unreadCount || 0;
        const hasMore = pagination ? pagination.current < pagination.pages : false;
        const currentPage = pagination ? pagination.current : page;
        
        console.log('Fetched notifications:', notifications.length);
        console.log('Unread count:', unreadCount);

        if (reset || page === 1) {
          dispatch({
            type: NOTIFICATION_ACTIONS.FETCH_SUCCESS,
            payload: {
              notifications,
              unreadCount,
              hasMore,
              page: currentPage,
            },
          });
        } else {
          dispatch({
            type: NOTIFICATION_ACTIONS.LOAD_MORE_SUCCESS,
            payload: {
              notifications,
              hasMore,
              page: currentPage,
            },
          });
        }
      } catch (error) {
        console.error('Fetch notifications error:', error);
        dispatch({
          type: NOTIFICATION_ACTIONS.FETCH_ERROR,
          payload: error.response?.data?.message || 'Bildirimler yüklenemedi',
        });
      }
    }, 300); // 300ms debounce
  }, [isAuthenticated, state.limit]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;
    await fetchNotifications(state.page + 1, false);
  }, [fetchNotifications, state.loading, state.hasMore, state.page]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      dispatch({
        type: NOTIFICATION_ACTIONS.MARK_AS_READ,
        payload: notificationId,
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      toast.error('Bildirim okundu olarak işaretlenemedi');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/mark-all-read');
      dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });
      toast.success('Tüm bildirimler okundu olarak işaretlendi');
    } catch (error) {
      console.error('Mark all as read error:', error);
      toast.error('Bildirimler okundu olarak işaretlenemedi');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      dispatch({
        type: NOTIFICATION_ACTIONS.DELETE_NOTIFICATION,
        payload: notificationId,
      });
      toast.success('Bildirim silindi');
    } catch (error) {
      console.error('Delete notification error:', error);
      toast.error('Bildirim silinemedi');
    }
  }, []);

  // Get unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get('/notifications/unread-count');
      const count = response.data.data?.unreadCount || response.data.unreadCount || 0;
      console.log('Unread count response:', response.data);
      console.log('Parsed unread count:', count);
      dispatch({
        type: NOTIFICATION_ACTIONS.UPDATE_UNREAD_COUNT,
        payload: count,
      });
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  }, [isAuthenticated]);

  // Send notification (admin only)
  const sendNotification = useCallback(async (notificationData) => {
    try {
      const response = await api.post('/notifications', notificationData);
      toast.success('Bildirim gönderildi');
      return { success: true, notification: response.data.notification };
    } catch (error) {
      console.error('Send notification error:', error);
      const errorMessage = error.response?.data?.message || 'Bildirim gönderilemedi';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Bulk send notifications (admin only)
  const sendBulkNotification = useCallback(async (notificationData) => {
    try {
      const response = await api.post('/notifications/bulk', notificationData);
      toast.success(`${response.data.sentCount} kullanıcıya bildirim gönderildi`);
      return { success: true, sentCount: response.data.sentCount };
    } catch (error) {
      console.error('Send bulk notification error:', error);
      const errorMessage = error.response?.data?.message || 'Toplu bildirim gönderilemedi';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Handle socket notifications
  useEffect(() => {
    const handleSocketNotification = (event) => {
      const notification = event.detail;
      dispatch({
        type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
        payload: notification,
      });
    };

    window.addEventListener('socket_notification', handleSocketNotification);
    return () => {
      window.removeEventListener('socket_notification', handleSocketNotification);
    };
  }, []);

  // Load notifications on auth change
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Loading notifications for user:', user.username);
      fetchNotifications();
      fetchUnreadCount();
    } else {
      dispatch({ type: NOTIFICATION_ACTIONS.RESET_NOTIFICATIONS });
    }
  }, [isAuthenticated, user]); // fetchNotifications ve fetchUnreadCount dependency'lerini kaldırdık

  // Periodic unread count update
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated]); // fetchUnreadCount dependency'sini kaldırdık

  // Utility functions
  const getNotificationsByType = useCallback((type) => {
    return safeState.notifications.filter(notification => notification.type === type);
  }, [safeState.notifications]);

  const getUnreadNotifications = useCallback(() => {
    return safeState.notifications.filter(notification => !notification.read);
  }, [safeState.notifications]);

  const getNotificationById = useCallback((id) => {
    return safeState.notifications.find(notification => notification.id === id);
  }, [safeState.notifications]);

  const hasUnreadNotifications = useCallback(() => {
    return safeState.unreadCount > 0;
  }, [safeState.unreadCount]);

  // Format notification time
  const formatNotificationTime = useCallback((timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    return notificationTime.toLocaleDateString('tr-TR');
  }, []);

  // Search notifications
  const searchNotifications = useCallback((query) => {
    try {
      if (!query) return safeState.notifications;
      const lowercaseQuery = query.toLowerCase();
      return safeState.notifications.filter(notification => 
        notification?.title?.toLowerCase().includes(lowercaseQuery) ||
        notification?.message?.toLowerCase().includes(lowercaseQuery) ||
        notification?.type?.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Search notifications error:', error);
      return [];
    }
  }, [safeState.notifications]);

  // Get notification icon
  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case 'order_created':
      case 'order_updated':
        return '📦';
      case 'task_assigned':
      case 'task_completed':
        return '📋';
      case 'system_alert':
        return '⚠️';
      case 'reminder':
        return '⏰';
      case 'message':
        return '💬';
      case 'user_action':
        return '👤';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }, []);

  // Get notification color
  const getNotificationColor = useCallback((type, priority) => {
    if (priority === 'urgent' || priority === 'high') {
      return 'bg-red-100 text-red-600';
    }
    
    switch (type) {
      case 'order_created':
      case 'order_updated':
        return 'bg-blue-100 text-blue-600';
      case 'task_assigned':
      case 'task_completed':
        return 'bg-green-100 text-green-600';
      case 'system_alert':
        return 'bg-yellow-100 text-yellow-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'success':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }, []);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      await api.delete('/notifications');
      dispatch({ type: NOTIFICATION_ACTIONS.RESET_NOTIFICATIONS });
      toast.success('Tüm bildirimler silindi');
    } catch (error) {
      console.error('Delete all notifications error:', error);
      toast.error('Bildirimler silinemedi');
    }
  }, []);

  const value = {
    // State
    notifications: safeState.notifications,
    unreadCount: safeState.unreadCount,
    loading: safeState.loading,
    isLoading: safeState.loading, // Alias for compatibility
    error: safeState.error,
    hasMore: safeState.hasMore,
    page: safeState.page,

    // Actions
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    sendBulkNotification,
    fetchUnreadCount,

    // Utilities
    getNotificationsByType,
    getUnreadNotifications,
    getNotificationById,
    hasUnreadNotifications,
    formatNotificationTime,
    searchNotifications,
    getNotificationIcon,
    getNotificationColor,
    deleteAllNotifications,
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;