import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { usePopupNotification } from '../../contexts/PopupNotificationContext';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationPanel from './NotificationPanel';
import LoadingSpinner from '../UI/LoadingSpinner';
import PopupNotificationContainer from '../UI/PopupNotificationContainer';

const Layout = () => {
  const { user, loading } = useAuth();
  const { connected, socket } = useSocket();
  const { unreadCount } = useNotification();
  const { showNotification } = usePopupNotification();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Socket.io event listeners for popup notifications (only for factory workers)
  useEffect(() => {
    console.log('🔧 Popup listener setup:', { 
      socket: !!socket, 
      user: !!user, 
      userRole: user?.role,
      isFactoryWorker: user?.role === 'fabrika_iscisi'
    });
    
    if (socket && user && user.role === 'fabrika_iscisi') {
      console.log('✅ Setting up popup listeners for factory worker');
      
      const handleNewNotification = (notification) => {
        console.log('🔔 Popup notification received:', notification);
        console.log('🎯 Calling showNotification with:', {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          orderId: notification.orderId,
          timestamp: notification.timestamp
        });
        
        // Pop-up bildirimi göster
        showNotification({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          orderId: notification.orderId,
          timestamp: notification.timestamp
        });
      };

      const handleOrderUpdated = (data) => {
        console.log('📦 Order updated for popup:', data);
        
        // Eğer orderUpdated event'inde timelineEntry varsa pop-up göster
        if (data.timelineEntry) {
          console.log('📝 Showing popup for timeline entry:', data.timelineEntry);
          console.log('🎯 Calling showNotification with timeline data:', {
            type: 'siparis_cevabi',
            title: 'Sipariş Cevabı',
            message: data.timelineEntry.description,
            orderId: data.orderId,
            timelineEntry: data.timelineEntry,
            timestamp: data.timelineEntry.timestamp
          });
          
          showNotification({
            type: 'siparis_cevabi',
            title: 'Sipariş Cevabı',
            message: data.timelineEntry.description,
            orderId: data.orderId,
            timelineEntry: data.timelineEntry,
            timestamp: data.timelineEntry.timestamp
          });
        }
      };

      socket.on('newNotification', handleNewNotification);
      socket.on('orderUpdated', handleOrderUpdated);

      return () => {
        console.log('🧹 Cleaning up popup listeners');
        socket.off('newNotification', handleNewNotification);
        socket.off('orderUpdated', handleOrderUpdated);
      };
    } else {
      console.log('❌ Popup listeners not set up:', {
        socket: !!socket,
        user: !!user,
        role: user?.role
      });
    }
  }, [socket, user, showNotification]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && sidebarOpen) {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        
        if (sidebar && !sidebar.contains(event.target) && 
            sidebarToggle && !sidebarToggle.contains(event.target)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, sidebarOpen]);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationPanelOpen) {
        const panel = document.getElementById('notification-panel');
        const toggle = document.getElementById('notification-toggle');
        
        if (panel && !panel.contains(event.target) && 
            toggle && !toggle.contains(event.target)) {
          setNotificationPanelOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationPanelOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (notificationPanelOpen) {
          setNotificationPanelOpen(false);
        } else if (sidebarOpen && isMobile) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [notificationPanelOpen, sidebarOpen, isMobile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Uygulama yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Kullanıcı Bilgileri Yüklenemedi
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Lütfen sayfayı yenileyin veya tekrar giriş yapın.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          onNotificationToggle={() => setNotificationPanelOpen(!notificationPanelOpen)}
          notificationCount={unreadCount}
          isConnected={connected}
        />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
      />

      {/* Popup Notifications - Only for factory workers */}
      {user && user.role === 'fabrika_iscisi' && (
        <PopupNotificationContainer />
      )}

      {/* Connection status indicator */}
      {!connected && (
        <div className="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Bağlantı kesildi</span>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div className="hidden">
        {/* This is for screen readers and accessibility */}
        <div role="region" aria-label="Klavye kısayolları">
          <p>ESC: Panelleri kapat</p>
          <p>Alt + S: Kenar çubuğunu aç/kapat</p>
          <p>Alt + N: Bildirim panelini aç/kapat</p>
        </div>
      </div>
    </div>
  );
};

export default Layout;