import React, { createContext, useContext, useState, useCallback } from 'react';

const PopupNotificationContext = createContext();

export const usePopupNotification = () => {
  const context = useContext(PopupNotificationContext);
  if (!context) {
    throw new Error('usePopupNotification must be used within a PopupNotificationProvider');
  }
  return context;
};

export const PopupNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((notification) => {
    console.log('🎯 showNotification called with:', notification);
    console.log('🎯 showNotification function exists:', typeof showNotification);
    console.log('🎯 Current notifications state:', notifications);
    
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date()
    };
    
    console.log('📝 Adding notification to state:', newNotification);
    
    // Tek pop-up göstermek için önceki tüm bildirimleri temizle
    setNotifications([newNotification]);
    console.log('📊 Single notification set, count: 1');
    
    // Otomatik kaldırma devre dışı - sadece manuel kapatma
    // setTimeout(() => {
    //   console.log('⏰ Auto-removing notification:', id);
    //   setNotifications(prev => prev.filter(notif => notif.id !== id));
    // }, 8000);
  }, [notifications]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications
  };

  return (
    <PopupNotificationContext.Provider value={value}>
      {children}
    </PopupNotificationContext.Provider>
  );
};
