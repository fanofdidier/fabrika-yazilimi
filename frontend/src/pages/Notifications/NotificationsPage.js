import React, { useContext, useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { Card, Button, Badge, Alert } from '../../components/UI';


const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotification();
  const [filter, setFilter] = useState('all'); // all, unread, read

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      info: '📢',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      order: '📦',
      task: '📋',
      system: '⚙️'
    };
    return icons[type] || '📢';
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    const colors = {
      info: 'bg-blue-50 border-blue-200',
      success: 'bg-green-50 border-green-200',
      warning: 'bg-yellow-50 border-yellow-200',
      error: 'bg-red-50 border-red-200',
      order: 'bg-purple-50 border-purple-200',
      task: 'bg-indigo-50 border-indigo-200',
      system: 'bg-gray-50 border-gray-200'
    };
    return colors[type] || 'bg-blue-50 border-blue-200';
  };

  // Format time
  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
    return `${Math.floor(diffInMinutes / 1440)} gün önce`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bildirimler</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  Tümünü Okundu İşaretle
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Tümünü Temizle
                </Button>
              )}
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Tümü ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Okunmamış ({unreadCount})
            </Button>
            <Button
              variant={filter === 'read' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('read')}
            >
              Okunmuş ({notifications.length - unreadCount})
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">📭</div>
              <p className="text-gray-600">
                {filter === 'all' ? 'Henüz bildirim yok' : 
                 filter === 'unread' ? 'Okunmamış bildirim yok' : 'Okunmuş bildirim yok'}
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 transition-all duration-200 hover:shadow-md ${
                  !notification.read ? 'ring-2 ring-blue-200' : ''
                } ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <Badge variant="primary" size="sm">
                            Yeni
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatTime(notification.timestamp)}</span>
                        <Badge variant="secondary" size="sm">
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        Okundu İşaretle
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearNotification(notification.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Sil
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
    </div>
  );
};

export default NotificationsPage;