import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

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
      
        const newSocket = io('http://91.98.135.16:5000', {
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

      // Sipariş cevap sistemi için event listener
      newSocket.on('orderResponse', (data) => {
        console.log('Sipariş cevabı alındı:', data);
        
        // Custom event ile popup bildirim tetikle
        window.dispatchEvent(new CustomEvent('orderResponseReceived', {
          detail: {
            type: 'order_response',
            message: data.message || 'Siparişe yeni cevap geldi',
            orderId: data.orderId,
            timelineEntry: data.timelineEntry,
            from: data.from
          }
        }));
      });

      // Sipariş güncellemesi için event listener
      newSocket.on('orderUpdated', (data) => {
        console.log('Sipariş güncellendi:', data);
        
        // Eğer sipariş durumu değiştiyse bildirim göster
        if (data.statusChanged) {
          window.dispatchEvent(new CustomEvent('orderResponseReceived', {
            detail: {
              type: 'order_status_change',
              message: `Sipariş durumu güncellendi: ${data.newStatus}`,
              orderId: data.orderId,
              timelineEntry: data.timelineEntry
            }
          }));
        }
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
