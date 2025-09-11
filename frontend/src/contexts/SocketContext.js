import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import { autoDetectBackendUrl } from '../utils/networkUtils';

// Create context
const SocketContext = createContext();

// Socket Provider Component
export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Real socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Socket bağlantısı başlatılıyor...');
      
      // Auto-detect socket URL
      autoDetectBackendUrl().then(apiUrl => {
        // Convert API URL to Socket URL
        const socketUrl = apiUrl.replace('/api', '');
        console.log('🔌 Socket URL:', socketUrl);
        
        const newSocket = io(socketUrl, {
        auth: {
          token: localStorage.getItem('token')
        },
        transports: ['polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
        setSocket(newSocket);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnected(false);
        setOnlineUsers([]);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setConnected(true);
      });

      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('notification', (notification) => {
        console.log('New notification received:', notification);
      });

      // Socket'i hemen set et ama connected durumunu connect event'inde set et
      setSocket(newSocket);
      
      // Eğer socket zaten bağlıysa connected'ı true yap
      if (newSocket.connected) {
        console.log('Socket zaten bağlı, connected true yapılıyor');
        setConnected(true);
      }

        return () => {
          console.log('Socket cleanup...');
          newSocket.close();
        };
      });
    } else {
      setConnected(false);
      setOnlineUsers([]);
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user]);

  // Real socket functions
  const emitEvent = (eventName, data) => {
    if (socket && connected) {
      socket.emit(eventName, data);
      return true;
    }
    return false;
  };

  const joinRoom = (roomName) => {
    if (socket && connected) {
      socket.emit('joinRoom', roomName);
      return true;
    }
    return false;
  };

  const leaveRoom = (roomName) => {
    if (socket && connected) {
      socket.emit('leaveRoom', roomName);
      return true;
    }
    return false;
  };

  const sendNotification = (notification) => {
    if (socket && connected) {
      socket.emit('sendNotification', notification);
      return true;
    }
    return false;
  };

  const updateUserStatus = (status) => {
    if (socket && connected) {
      socket.emit('updateStatus', status);
      return true;
    }
    return false;
  };

  const broadcastToRole = (role, message) => {
    console.log('Mock broadcast to role:', role, message);
    return true;
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.userId === userId);
  };

  const getOnlineUsersByRole = (role) => {
    return onlineUsers.filter(user => user.role === role);
  };

  const getOnlineUsersCount = () => {
    return onlineUsers.length;
  };

  const disconnectSocket = () => {
    setConnected(false);
    setOnlineUsers([]);
    console.log('Mock socket disconnected');
  };

  const value = {
    socket, // Gerçek socket
    connected,
    onlineUsers,
    
    // Functions
    emitEvent,
    joinRoom,
    leaveRoom,
    sendNotification,
    updateUserStatus,
    broadcastToRole,
    
    // Utility functions
    isUserOnline,
    getOnlineUsersByRole,
    getOnlineUsersCount,
    
    // Control functions
    disconnectSocket,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;