import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

  // Ses bildirimi çalma fonksiyonu
  const playNotificationSound = useCallback(() => {
    try {
      // Web Audio API ile basit bir bildirim sesi oluştur
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // İki tonlu bildirim sesi (yüksek-düşük)
      const playTone = (frequency, duration, delay = 0) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };
      
      // Bildirim sesi: 800Hz - 600Hz (kısa-kısa-uzun)
      playTone(800, 0.1, 0);    // İlk ton
      playTone(800, 0.1, 150);  // İkinci ton
      playTone(600, 0.3, 300);  // Üçüncü ton (daha uzun)
      
    } catch (error) {
      console.log('Ses çalma hatası (normal):', error);
      // Fallback: Basit beep sesi
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ses çalma başarısız olursa sessizce devam et
        });
      } catch (fallbackError) {
        console.log('Fallback ses çalma hatası:', fallbackError);
      }
    }
  }, []);

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
    
    // Ses bildirimi çal
    playNotificationSound();
    
    // Otomatik kaldırma devre dışı - sadece manuel kapatma
    // setTimeout(() => {
    //   console.log('⏰ Auto-removing notification:', id);
    //   setNotifications(prev => prev.filter(notif => notif.id !== id));
    // }, 8000);
  }, [notifications, playNotificationSound]);

  // Custom event listener for order responses
  useEffect(() => {
    const handleOrderResponse = (event) => {
      console.log('🎯 Order response event received:', event.detail);
      showNotification(event.detail);
    };

    window.addEventListener('orderResponseReceived', handleOrderResponse);
    
    return () => {
      window.removeEventListener('orderResponseReceived', handleOrderResponse);
    };
  }, [showNotification]);

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