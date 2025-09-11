import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import WhatsAppNotification from './WhatsAppNotification';

const NotificationPanel = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    getNotificationIcon,
    getNotificationColor,
    formatNotificationTime,
    searchNotifications
  } = useNotification();

  // Güvenlik kontrolü - notifications undefined ise boş array kullan
  const safeNotifications = notifications || [];
  
  // Eğer notifications henüz yüklenmemişse veya loading durumundaysa, loading göster
  if (notifications === undefined || isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <LoadingSpinner size="md" />
          <p className="mt-2 text-sm text-gray-600">Bildirimler yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Eğer panel açık değilse, hiçbir şey render etme
  if (!isOpen) {
    return null;
  }
  
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    applyFilters();
  }, [safeNotifications, filter, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const applyFilters = () => {
    try {
      let filtered = [...safeNotifications];

      // Apply search filter
      if (searchQuery) {
        const searchResult = searchNotifications(searchQuery);
        filtered = searchResult || [];
      }

      // Apply read/unread filter
      switch (filter) {
        case 'unread':
          filtered = filtered.filter(notification => !notification.read);
          break;
        case 'read':
          filtered = filtered.filter(notification => notification.read);
          break;
        default:
          break;
      }

      // Sort by creation date (newest first)
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setFilteredNotifications(filtered);
    } catch (error) {
      console.error('Apply filters error:', error);
      setFilteredNotifications([]);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate to related page if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => {
      const prevArray = prev || [];
      if (prevArray.includes(notificationId)) {
        return prevArray.filter(id => id !== notificationId);
      } else {
        return [...prevArray, notificationId];
      }
    });
  };

  const handleSelectAll = () => {
    if ((selectedNotifications || []).length === (filteredNotifications || []).length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications((filteredNotifications || []).map(n => n._id));
    }
  };

  const handleBulkMarkAsRead = async () => {
    const promises = (selectedNotifications || [])
      .filter(id => {
        const notification = safeNotifications.find(n => n._id === id);
        return notification && !notification.read;
      })
      .map(id => markAsRead(id));
    
    await Promise.all(promises);
    setSelectedNotifications([]);
    setShowBulkActions(false);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`${(selectedNotifications || []).length} bildirimi silmek istediğinizden emin misiniz?`)) {
      return;
    }

    const promises = (selectedNotifications || []).map(id => deleteNotification(id));
    await Promise.all(promises);
    setSelectedNotifications([]);
    setShowBulkActions(false);
  };

  const getNotificationTypeText = (type) => {
    switch (type) {
      case 'order_created': return 'Yeni Sipariş';
      case 'order_updated': return 'Sipariş Güncellendi';
      case 'task_assigned': return 'Görev Atandı';
      case 'task_completed': return 'Görev Tamamlandı';
      case 'system_alert': return 'Sistem Uyarısı';
      case 'reminder': return 'Hatırlatma';
      case 'message': return 'Mesaj';
      case 'user_action': return 'Kullanıcı İşlemi';
      case 'error': return 'Hata';
      case 'success': return 'Başarılı';
      case 'info': return 'Bilgi';
      default: return 'Bildirim';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Yüksek
          </span>
        );
      case 'urgent':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-900">
            Acil
          </span>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={onClose}></div>
      <div 
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out"
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-medium text-gray-900">Bildirimler</h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Toplu İşlemler"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-3 space-y-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bildirimlerde ara..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex space-x-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  filter === 'all'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tümü ({safeNotifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  filter === 'unread'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Okunmamış ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  filter === 'read'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Okunmuş ({safeNotifications.length - unreadCount})
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="mt-3 p-2 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={(selectedNotifications || []).length === (filteredNotifications || []).length && (filteredNotifications || []).length > 0}
                    onChange={handleSelectAll}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  Tümünü Seç
                </label>
                <span className="text-xs text-gray-500">
                  {(selectedNotifications || []).length} seçili
                </span>
              </div>
              {(selectedNotifications || []).length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleBulkMarkAsRead}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Okundu İşaretle
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Sil
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-3 flex space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
            {safeNotifications.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Tüm bildirimleri silmek istediğinizden emin misiniz?')) {
                    deleteAllNotifications();
                  }
                }}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Tümünü Sil
              </button>
            )}
            <button
              onClick={() => setShowWhatsApp(true)}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              WhatsApp Gönder
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner size="md" />
            </div>
          ) : (filteredNotifications || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM12 3v12M7 8l5-5 5 5" />
              </svg>
              <p className="text-sm">
                {searchQuery ? 'Arama kriterinize uygun bildirim bulunamadı' : 'Henüz bildirim yok'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {(filteredNotifications || []).map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    {showBulkActions && (
                      <input
                        type="checkbox"
                        checked={(selectedNotifications || []).includes(notification._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectNotification(notification._id);
                        }}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    )}
                    
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        getNotificationColor(notification.type, notification.priority)
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-600">
                          {getNotificationTypeText(notification.type)}
                        </p>
                        <div className="flex items-center space-x-1">
                          {getPriorityBadge(notification.priority)}
                          <span className="text-xs text-gray-500">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      {notification.title && (
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {notification.title}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {notification.metadata && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(notification.metadata).map(([key, value]) => (
                            <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Okundu İşaretle
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Sil
                          </button>
                        </div>
                        
                        {notification.actionUrl && (
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Toplam {safeNotifications.length} bildirim
            </p>
            {unreadCount > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {unreadCount} okunmamış bildirim
              </p>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Notification Modal */}
      <WhatsAppNotification
        isOpen={showWhatsApp}
        onClose={() => setShowWhatsApp(false)}
        recipients={[]}
        message=""
      />
    </>
  );
};

export default NotificationPanel;