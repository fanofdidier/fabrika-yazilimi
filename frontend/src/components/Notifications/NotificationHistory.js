import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import api from '../../services/api';

const NotificationHistory = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    priority: 'all',
    dateRange: 'week',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showDetails, setShowDetails] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    delivered: 0
  });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchStats();
    }
  }, [isOpen, filters, pagination.page]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const response = await api.get('/notifications/history', { params });
      setNotifications(response.data.notifications || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 0
      }));
    } catch (error) {
      console.error('Bildirim geçmişi yüklenirken hata:', error);
      toast.error('Bildirim geçmişi yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/notifications/stats', {
        params: { dateRange: filters.dateRange }
      });
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n._id));
    }
  };

  const retryNotification = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/retry`);
      toast.success('Bildirim yeniden gönderildi');
      fetchNotifications();
    } catch (error) {
      console.error('Bildirim yeniden gönderilirken hata:', error);
      toast.error('Bildirim yeniden gönderilemedi');
    }
  };

  const retrySelected = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      await api.post('/notifications/retry-bulk', {
        notificationIds: selectedNotifications
      });
      toast.success(`${selectedNotifications.length} bildirim yeniden gönderildi`);
      setSelectedNotifications([]);
      fetchNotifications();
    } catch (error) {
      console.error('Toplu yeniden gönderim hatası:', error);
      toast.error('Bildirimler yeniden gönderilemedi');
    }
  };

  const deleteSelected = async () => {
    if (selectedNotifications.length === 0) return;

    if (!window.confirm(`${selectedNotifications.length} bildirimi silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await api.delete('/notifications/bulk', {
        data: { notificationIds: selectedNotifications }
      });
      toast.success(`${selectedNotifications.length} bildirim silindi`);
      setSelectedNotifications([]);
      fetchNotifications();
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      toast.error('Bildirimler silinemedi');
    }
  };

  const exportHistory = async () => {
    setExportLoading(true);
    try {
      const response = await api.get('/notifications/export', {
        params: filters,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bildirim-gecmisi-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Bildirim geçmişi indirildi');
    } catch (error) {
      console.error('Export hatası:', error);
      toast.error('Export işlemi başarısız');
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      sent: { color: 'bg-green-100 text-green-800', text: 'Gönderildi' },
      delivered: { color: 'bg-blue-100 text-blue-800', text: 'Teslim Edildi' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Başarısız' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Beklemede' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'İptal Edildi' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800', text: 'Düşük' },
      normal: { color: 'bg-blue-100 text-blue-800', text: 'Normal' },
      high: { color: 'bg-orange-100 text-orange-800', text: 'Yüksek' },
      urgent: { color: 'bg-red-100 text-red-800', text: 'Acil' }
    };

    const config = priorityConfig[priority] || priorityConfig.normal;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return '📧';
      case 'whatsapp':
        return '💬';
      case 'web':
        return '🌐';
      case 'sms':
        return '📱';
      default:
        return '📢';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const filterOptions = {
    type: [
      { value: 'all', label: 'Tüm Türler' },
      { value: 'email', label: 'Email' },
      { value: 'whatsapp', label: 'WhatsApp' },
      { value: 'web', label: 'Web' },
      { value: 'sms', label: 'SMS' }
    ],
    status: [
      { value: 'all', label: 'Tüm Durumlar' },
      { value: 'sent', label: 'Gönderildi' },
      { value: 'delivered', label: 'Teslim Edildi' },
      { value: 'failed', label: 'Başarısız' },
      { value: 'pending', label: 'Beklemede' },
      { value: 'cancelled', label: 'İptal Edildi' }
    ],
    priority: [
      { value: 'all', label: 'Tüm Öncelikler' },
      { value: 'low', label: 'Düşük' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'Yüksek' },
      { value: 'urgent', label: 'Acil' }
    ],
    dateRange: [
      { value: 'today', label: 'Bugün' },
      { value: 'week', label: 'Bu Hafta' },
      { value: 'month', label: 'Bu Ay' },
      { value: 'quarter', label: 'Bu Çeyrek' },
      { value: 'year', label: 'Bu Yıl' },
      { value: 'all', label: 'Tüm Zamanlar' }
    ]
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Bildirim Geçmişi
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Toplam</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
              <div className="text-sm text-gray-600">Gönderildi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.delivered}</div>
              <div className="text-sm text-gray-600">Teslim Edildi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-600">Başarısız</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Beklemede</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Ara..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {Object.entries(filterOptions).map(([key, options]) => (
              <div key={key}>
                <select
                  value={filters[key]}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            
            <div className="flex space-x-2">
              <button
                onClick={exportHistory}
                disabled={exportLoading}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {exportLoading ? 'İndiriliyor...' : 'Export'}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedNotifications.length} bildirim seçili
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={retrySelected}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Yeniden Gönder
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Sil
                </button>
                <button
                  onClick={() => setSelectedNotifications([])}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Seçimi Temizle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg">Bildirim geçmişi bulunamadı</p>
              <p className="text-sm">Filtreleri değiştirerek tekrar deneyin</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tür
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Konu/Mesaj
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Öncelik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <tr key={notification._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification._id)}
                          onChange={() => handleSelectNotification(notification._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getTypeIcon(notification.type)}</span>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {notification.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {notification.recipient || notification.recipients?.join(', ') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {notification.subject || notification.message}
                        </div>
                        {notification.subject && notification.message && (
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {notification.message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(notification.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(notification.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(notification.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setShowDetails(notification)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Detay
                          </button>
                          {notification.status === 'failed' && (
                            <button
                              onClick={() => retryNotification(notification._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Yeniden Gönder
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Toplam {pagination.total} kayıttan {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} arası gösteriliyor
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + Math.max(1, pagination.page - 2);
                  if (page > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        page === pagination.page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Bildirim Detayları</h3>
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tür</label>
                    <div className="flex items-center mt-1">
                      <span className="text-lg mr-2">{getTypeIcon(showDetails.type)}</span>
                      <span className="text-sm text-gray-900 capitalize">{showDetails.type}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <div className="mt-1">{getStatusBadge(showDetails.status)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Öncelik</label>
                    <div className="mt-1">{getPriorityBadge(showDetails.priority)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gönderim Tarihi</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(showDetails.createdAt)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alıcı(lar)</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {showDetails.recipient || showDetails.recipients?.join(', ') || 'N/A'}
                  </p>
                </div>
                
                {showDetails.subject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Konu</label>
                    <p className="mt-1 text-sm text-gray-900">{showDetails.subject}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mesaj</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{showDetails.message}</p>
                  </div>
                </div>
                
                {showDetails.error && (
                  <div>
                    <label className="block text-sm font-medium text-red-700">Hata Detayı</label>
                    <div className="mt-1 p-3 bg-red-50 rounded-md">
                      <p className="text-sm text-red-900">{showDetails.error}</p>
                    </div>
                  </div>
                )}
                
                {showDetails.metadata && Object.keys(showDetails.metadata).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ek Bilgiler</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <pre className="text-sm text-gray-900">
                        {JSON.stringify(showDetails.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              {showDetails.status === 'failed' && (
                <button
                  onClick={() => {
                    retryNotification(showDetails._id);
                    setShowDetails(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Yeniden Gönder
                </button>
              )}
              <button
                onClick={() => setShowDetails(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;