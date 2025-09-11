// Authentication utility functions

// Token management
export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

// Set auth token in axios headers
export const setAuthToken = (token) => {
  if (token) {
    // Set default auth header for all requests
    localStorage.setItem('token', token);
  } else {
    // Remove auth header
    localStorage.removeItem('token');
  }
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Check if token is expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// Get user data from token
export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.userId,
      role: payload.role,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch (error) {
    console.error('Token parsing error:', error);
    return null;
  }
};

// Check if token is about to expire (within 5 minutes)
export const isTokenExpiringSoon = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const fiveMinutes = 5 * 60; // 5 minutes in seconds
    
    return payload.exp - currentTime < fiveMinutes;
  } catch (error) {
    console.error('Token expiration check error:', error);
    return false;
  }
};

// Role-based access control
export const hasRole = (userRole, requiredRoles) => {
  if (!userRole || !requiredRoles) return false;
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }
  
  return userRole === requiredRoles;
};

// Permission-based access control
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  
  // Admin has all permissions
  if (userRole === 'admin') return true;
  
  // Define role-based permissions
  const rolePermissions = {
    magaza_personeli: [
      'orders.create',
      'orders.read',
      'orders.update',
      'orders.delete',
      'tasks.read',
      'notifications.read',
      'profile.update',
      'users.read', // Can view other users
    ],
    fabrika_iscisi: [
      'tasks.read',
      'tasks.update',
      'tasks.complete',
      'orders.read',
      'orders.update_status',
      'notifications.read',
      'profile.update',
    ],
  };
  
  const userPermissions = rolePermissions[userRole] || [];
  return userPermissions.includes(permission);
};

// Get role display name
export const getRoleDisplayName = (role) => {
  const roleNames = {
    admin: 'İşletme Sahibi',
    magaza_personeli: 'Mağaza Personeli',
    fabrika_iscisi: 'Fabrika İşçisi',
  };
  
  return roleNames[role] || role;
};

// Get role color for UI
export const getRoleColor = (role) => {
  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    magaza_personeli: 'bg-blue-100 text-blue-800',
    fabrika_iscisi: 'bg-green-100 text-green-800',
  };
  
  return roleColors[role] || 'bg-gray-100 text-gray-800';
};

// Logout utility
export const logout = () => {
  removeAuthToken();
  // Clear any other stored user data
  localStorage.removeItem('user');
  localStorage.removeItem('preferences');
  
  // Redirect to login page
  window.location.href = '/login';
};

// Format user display name
export const formatUserDisplayName = (user) => {
  if (!user) return 'Kullanıcı';
  
  if (user.name) {
    return user.name;
  }
  
  if (user.username) {
    return user.username;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Kullanıcı';
};

// Check if user can access route
export const canAccessRoute = (userRole, routePermissions) => {
  if (!routePermissions) return true; // Public route
  if (!userRole) return false; // Not authenticated
  
  // Admin can access all routes
  if (userRole === 'admin') return true;
  
  // Check if user role is in allowed roles
  if (Array.isArray(routePermissions)) {
    return routePermissions.includes(userRole);
  }
  
  return userRole === routePermissions;
};

// Validate password strength
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Şifre gereklidir');
    return { isValid: false, errors };
  }
  
  if (password.length < 6) {
    errors.push('Şifre en az 6 karakter olmalıdır');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermelidir');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermelidir');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Şifre en az bir rakam içermelidir');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: getPasswordStrength(password),
  };
};

// Get password strength score
const getPasswordStrength = (password) => {
  let score = 0;
  
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/(?=.*[a-z])/.test(password)) score += 1;
  if (/(?=.*[A-Z])/.test(password)) score += 1;
  if (/(?=.*\d)/.test(password)) score += 1;
  if (/(?=.*[^\w\s])/.test(password)) score += 1;
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

// Generate secure random password
export const generateSecurePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required type
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Session management
export const extendSession = () => {
  const token = getToken();
  if (token && isAuthenticated()) {
    // Update last activity timestamp
    localStorage.setItem('lastActivity', Date.now().toString());
    return true;
  }
  return false;
};

export const checkSessionTimeout = (timeoutMinutes = 30) => {
  const lastActivity = localStorage.getItem('lastActivity');
  if (!lastActivity) return false;
  
  const now = Date.now();
  const lastActivityTime = parseInt(lastActivity);
  const timeoutMs = timeoutMinutes * 60 * 1000;
  
  return (now - lastActivityTime) > timeoutMs;
};

// Initialize session tracking
export const initSessionTracking = (timeoutMinutes = 30) => {
  // Update activity on user interactions
  const updateActivity = () => {
    if (isAuthenticated()) {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
  };
  
  // Track user activity
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });
  
  // Check session timeout periodically
  const checkInterval = setInterval(() => {
    if (checkSessionTimeout(timeoutMinutes)) {
      clearInterval(checkInterval);
      logout();
    }
  }, 60000); // Check every minute
  
  // Initial activity timestamp
  updateActivity();
  
  return () => {
    // Cleanup function
    events.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });
    clearInterval(checkInterval);
  };
};