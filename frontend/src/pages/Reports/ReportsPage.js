import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Table, LoadingSpinner, Input, Alert } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
  getOrderStatusLabel, 
  getPriorityLabel,
  getOrderStatusColor,
  getPriorityColor
} from '../../utils/statusMapping';
import { 
  exportOrdersToCSV, 
  exportOrdersToPDF, 
  exportOrderLogsToCSV, 
  exportOrderLogsToPDF 
} from '../../utils/exportUtils';

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderLogs, setShowOrderLogs] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filtreleme state'leri
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    priority: 'all',
    product: '',
    isOpen: 'all'
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders');
      const backendOrders = response.data?.success && response.data?.data?.orders ? response.data.data.orders : [];
      
      const normalizedOrders = backendOrders.map((order) => ({
        id: order._id,
        orderNumber: order.orderNumber || `ORD-${new Date(order.createdAt).getFullYear()}-${String(order._id).slice(-4)}`,
        title: order.title || 'Başlıksız Sipariş',
        description: order.description || '',
        status: order.status || 'beklemede',
        priority: order.priority || 'normal',
        createdAt: order.createdAt || new Date().toISOString(),
        dueDate: order.dueDate || null,
        createdBy: order.createdBy ? {
          name: order.createdBy.fullName || `${order.createdBy.firstName || ''} ${order.createdBy.lastName || ''}`.trim(),
          email: order.createdBy.email || ''
        } : { name: 'Bilinmeyen', email: '' },
        assignedTo: order.assignedTo ? {
          name: order.assignedTo.fullName || `${order.assignedTo.firstName || ''} ${order.assignedTo.lastName || ''}`.trim(),
          email: order.assignedTo.email || ''
        } : null,
        items: order.items || [],
        responses: order.responses || [],
        timeline: order.timeline || [],
        location: order.location || 'fabrika'
      }));

      setOrders(normalizedOrders);
    } catch (error) {
      console.error('Orders fetch error:', error);
      setMessage({ type: 'error', text: 'Siparişler yüklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Tarih filtresi
    if (filters.dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    // Durum filtresi
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Öncelik filtresi
    if (filters.priority !== 'all') {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }

    // Ürün filtresi
    if (filters.product) {
      filtered = filtered.filter(order => 
        order.title.toLowerCase().includes(filters.product.toLowerCase()) ||
        order.items.some(item => 
          item.productName?.toLowerCase().includes(filters.product.toLowerCase())
        )
      );
    }

    // Açık/Kapalı filtresi
    if (filters.isOpen !== 'all') {
      const openStatuses = ['siparis_olusturuldu', 'siparis_onaylandi', 'hammadde_hazirlaniyor', 'uretim_basladi', 'uretim_tamamlandi', 'kalite_kontrol', 'sevkiyata_hazir', 'yola_cikti'];
      const closedStatuses = ['teslim_edildi', 'tamamlandi', 'iptal_edildi'];
      
      if (filters.isOpen === 'open') {
        filtered = filtered.filter(order => openStatuses.includes(order.status));
      } else if (filters.isOpen === 'closed') {
        filtered = filtered.filter(order => closedStatuses.includes(order.status));
      }
    }

    setFilteredOrders(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: 'all',
      priority: 'all',
      product: '',
      isOpen: 'all'
    });
  };

  const handleExportToPDF = () => {
    try {
      exportOrdersToPDF(filteredOrders);
      setMessage({ type: 'success', text: 'PDF raporu başarıyla oluşturuldu ve yazdırma penceresi açıldı.' });
    } catch (error) {
      console.error('PDF export error:', error);
      setMessage({ type: 'error', text: 'PDF export sırasında bir hata oluştu.' });
    }
  };

  const handleExportToExcel = () => {
    try {
      exportOrdersToCSV(filteredOrders);
      setMessage({ type: 'success', text: 'Excel raporu başarıyla indirildi.' });
    } catch (error) {
      console.error('Excel export error:', error);
      setMessage({ type: 'error', text: 'Excel export sırasında bir hata oluştu.' });
    }
  };

  const handleExportOrderLogsToPDF = () => {
    try {
      exportOrderLogsToPDF(selectedOrder);
      setMessage({ type: 'success', text: 'Sipariş log PDF raporu başarıyla oluşturuldu ve yazdırma penceresi açıldı.' });
    } catch (error) {
      console.error('Order log PDF export error:', error);
      setMessage({ type: 'error', text: 'Sipariş log PDF export sırasında bir hata oluştu.' });
    }
  };

  const handleExportOrderLogsToExcel = () => {
    try {
      exportOrderLogsToCSV(selectedOrder);
      setMessage({ type: 'success', text: 'Sipariş log Excel raporu başarıyla indirildi.' });
    } catch (error) {
      console.error('Order log Excel export error:', error);
      setMessage({ type: 'error', text: 'Sipariş log Excel export sırasında bir hata oluştu.' });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProductNames = (items) => {
    if (!items || items.length === 0) return 'Ürün bilgisi yok';
    return items.map(item => item.productName || 'Ürün').join(', ');
  };

  const tableColumns = [
    {
      key: 'orderNumber',
      label: 'Sipariş No',
      render: (value, order) => (
        <div className="font-medium text-gray-900">
          {order.orderNumber}
        </div>
      )
    },
    {
      key: 'title',
      label: 'Sipariş Başlığı',
      render: (value, order) => (
        <div>
          <div className="font-medium text-gray-900">{order.title}</div>
          <div className="text-sm text-gray-500">{getProductNames(order.items)}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      render: (value, order) => (
        <Badge 
          variant={getOrderStatusColor(order.status)} 
          size="sm"
        >
          {getOrderStatusLabel(order.status)}
        </Badge>
      )
    },
    {
      key: 'priority',
      label: 'Öncelik',
      render: (value, order) => (
        <Badge 
          variant={getPriorityColor(order.priority)} 
          size="sm"
        >
          {getPriorityLabel(order.priority)}
        </Badge>
      )
    },
    {
      key: 'createdBy',
      label: 'Oluşturan',
      render: (value, order) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{order.createdBy.name}</div>
          <div className="text-sm text-gray-500">{order.createdBy.email}</div>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Oluşturma Tarihi',
      render: (value, order) => (
        <div className="text-sm text-gray-900">
          {formatDate(order.createdAt)}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (value, order) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedOrder(order);
            setShowOrderLogs(true);
          }}
        >
          Log Geçmişi
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Raporlar yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
            <p className="text-gray-600 mt-1">
              Toplam {orders.length} sipariş • {filteredOrders.length} sonuç gösteriliyor
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportToPDF}
              disabled={filteredOrders.length === 0}
            >
              📄 PDF İndir
            </Button>
            <Button
              variant="outline"
              onClick={handleExportToExcel}
              disabled={filteredOrders.length === 0}
            >
              📊 Excel İndir
            </Button>
          </div>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <div className="mb-4">
            <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })}>
              {message.text}
            </Alert>
          </div>
        )}

        {/* Filtreler */}
        <Card className="p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtreler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durum
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="siparis_olusturuldu">Sipariş Oluşturuldu</option>
                <option value="siparis_onaylandi">Sipariş Onaylandı</option>
                <option value="hammadde_hazirlaniyor">Hammadde Hazırlanıyor</option>
                <option value="uretim_basladi">Üretim Başladı</option>
                <option value="uretim_tamamlandi">Üretim Tamamlandı</option>
                <option value="kalite_kontrol">Kalite Kontrol</option>
                <option value="sevkiyata_hazir">Sevkiyata Hazır</option>
                <option value="yola_cikti">Yola Çıktı</option>
                <option value="teslim_edildi">Teslim Edildi</option>
                <option value="tamamlandi">Tamamlandı</option>
                <option value="iptal_edildi">İptal Edildi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Öncelik
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Tüm Öncelikler</option>
                <option value="düşük">Düşük</option>
                <option value="normal">Normal</option>
                <option value="yüksek">Yüksek</option>
                <option value="acil">Acil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Ara
              </label>
              <Input
                placeholder="Ürün adı..."
                value={filters.product}
                onChange={(e) => handleFilterChange('product', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açık/Kapalı
              </label>
              <select
                value={filters.isOpen}
                onChange={(e) => handleFilterChange('isOpen', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Tümü</option>
                <option value="open">Açık</option>
                <option value="closed">Kapalı</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              Filtreleri Temizle
            </Button>
          </div>
        </Card>
      </div>

      {/* Sipariş Tablosu */}
      <Card>
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-lg mb-2">📊</div>
            <p className="text-gray-600">
              {Object.values(filters).some(f => f !== 'all' && f !== '') 
                ? 'Filtre kriterlerinize uygun sipariş bulunamadı.' 
                : 'Henüz sipariş bulunmuyor.'}
            </p>
          </div>
        ) : (
          <Table
            data={filteredOrders}
            columns={tableColumns}
            className="w-full"
          />
        )}
      </Card>

      {/* Sipariş Log Modal */}
      {showOrderLogs && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Sipariş Log Geçmişi - {selectedOrder.orderNumber}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportOrderLogsToPDF}
                >
                  📄 PDF İndir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportOrderLogsToExcel}
                >
                  📊 Excel İndir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOrderLogs(false)}
                >
                  ✕ Kapat
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Sipariş Bilgileri */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Sipariş Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Sipariş No:</span> {selectedOrder.orderNumber}
                  </div>
                  <div>
                    <span className="font-medium">Başlık:</span> {selectedOrder.title}
                  </div>
                  <div>
                    <span className="font-medium">Durum:</span> 
                    <Badge variant={getOrderStatusColor(selectedOrder.status)} size="sm" className="ml-2">
                      {getOrderStatusLabel(selectedOrder.status)}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Öncelik:</span>
                    <Badge variant={getPriorityColor(selectedOrder.priority)} size="sm" className="ml-2">
                      {getPriorityLabel(selectedOrder.priority)}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Oluşturan:</span> {selectedOrder.createdBy.name}
                  </div>
                  <div>
                    <span className="font-medium">Oluşturma Tarihi:</span> {formatDate(selectedOrder.createdAt)}
                  </div>
                </div>
              </Card>

              {/* Birleşik Log Geçmişi */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Sipariş Log Geçmişi</h3>
                {(() => {
                  // Timeline ve responses'ları birleştir ve tarihe göre sırala
                  const allLogs = [];
                  
                  // Timeline logları ekle
                  if (selectedOrder.timeline && selectedOrder.timeline.length > 0) {
                    selectedOrder.timeline.forEach(log => {
                      allLogs.push({
                        type: 'timeline',
                        timestamp: log.timestamp,
                        user: log.user,
                        description: log.description,
                        note: log.note,
                        status: log.status
                      });
                    });
                  }
                  
                  // Response logları ekle
                  if (selectedOrder.responses && selectedOrder.responses.length > 0) {
                    selectedOrder.responses.forEach(response => {
                      allLogs.push({
                        type: 'response',
                        timestamp: response.timestamp,
                        user: response.userName,
                        description: `${response.userName} - ${getOrderStatusLabel(response.status)}`,
                        note: response.note,
                        status: response.status
                      });
                    });
                  }
                  
                  // Tarihe göre sırala (en yeni üstte)
                  allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                  
                  if (allLogs.length > 0) {
                    return (
                      <div className="space-y-4">
                        {allLogs.map((log, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {log.type === 'timeline' ? 'İşlem' : 'Cevap'}
                                  </span>
                                  <span className="font-medium text-gray-900">{log.user}</span>
                                </div>
                                <p className="text-sm text-gray-700 mb-1">{log.description}</p>
                                {log.note && (
                                  <p className="text-sm text-gray-600 bg-white p-2 rounded border-l-2 border-gray-300">
                                    💬 {log.note}
                                  </p>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 ml-4 flex-shrink-0">
                                {formatDate(log.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return <p className="text-gray-500">Henüz log kaydı bulunmuyor.</p>;
                  }
                })()}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;