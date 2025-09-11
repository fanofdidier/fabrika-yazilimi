import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { setAuthToken, removeAuthToken } from '../utils/auth';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Set token in API headers
      setAuthToken(token);
      // Try to load user from backend
      loadUser();
    } else {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: 'No token found' });
    }
  }, []);

  // Load user data
  const loadUser = async () => {
    dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
    
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        dispatch({ 
          type: AUTH_ACTIONS.LOAD_USER_SUCCESS, 
          payload: response.data.data.user 
        });
      } else {
        throw new Error(response.data.message || 'Kullanıcı bilgileri alınamadı');
      }
    } catch (error) {
      console.error('Load user error:', error);
      dispatch({ 
        type: AUTH_ACTIONS.LOAD_USER_FAILURE, 
        payload: error.response?.data?.message || 'Kullanıcı bilgileri yüklenemedi' 
      });
      // Remove invalid token
      removeAuthToken();
    }
  };

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Store token and set in API headers
        localStorage.setItem('token', token);
        setAuthToken(token);
        
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_SUCCESS, 
          payload: { user, token } 
        });
        
        toast.success(`Hoş geldiniz, ${user.firstName || user.username}!`);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Giriş yapılamadı');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Giriş yapılamadı';
      
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_FAILURE, 
        payload: errorMessage 
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      localStorage.removeItem('token');
      removeAuthToken();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Başarıyla çıkış yapıldı');
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      const updatedUser = response.data.user;
      
      dispatch({ 
        type: AUTH_ACTIONS.UPDATE_USER, 
        payload: updatedUser 
      });
      
      toast.success('Profil başarıyla güncellendi');
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.message || 'Profil güncellenemedi';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await api.put('/auth/change-password', passwordData);
      toast.success('Şifre başarıyla değiştirildi');
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      const errorMessage = error.response?.data?.message || 'Şifre değiştirilemedi';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has required role
  const hasRole = (requiredRoles) => {
    if (!state.user || !requiredRoles) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(state.user.role);
    }
    return state.user.role === requiredRoles;
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!state.user) return false;
    
    // Admin has all permissions
    if (state.user.role === 'admin') return true;
    
    // Define role-based permissions
    const rolePermissions = {
      magaza_personeli: [
        'orders.create',
        'orders.read',
        'orders.update',
        'tasks.read',
        'notifications.read',
        'profile.update',
      ],
      fabrika_iscisi: [
        'tasks.read',
        'tasks.update',
        'orders.read',
        'orders.update_status',
        'notifications.read',
        'profile.update',
      ],
    };
    
    const userPermissions = rolePermissions[state.user.role] || [];
    return userPermissions.includes(permission);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!state.user) return '';
    return state.user.name || state.user.username || 'Kullanıcı';
  };

  // Get user role display name
  const getUserRoleDisplayName = () => {
    if (!state.user) return '';
    
    const roleNames = {
      admin: 'İşletme Sahibi',
      magaza_personeli: 'Mağaza Personeli',
      fabrika_iscisi: 'Fabrika İşçisi',
    };
    
    return roleNames[state.user.role] || state.user.role;
  };

  const value = {
    // State
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    
    // Actions
    login,
    logout,
    loadUser,
    updateProfile,
    changePassword,
    clearError,
    
    // Utilities
    hasRole,
    hasPermission,
    getUserDisplayName,
    getUserRoleDisplayName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;