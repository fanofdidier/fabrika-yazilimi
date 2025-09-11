import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, Table, LoadingSpinner, Input } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';


const OrdersPage = () => {
  const { hasRole, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Çalışanlar için siparişleri görevler olarak göster
  const isWorker = user?.role === 'fabrika_iscisi';
  

  useEffect(() => {
    const loadOrders = async () => {
      // Eğer user yoksa veya loading durumundaysa bekle
      if (!user) {
        return;
      }
      
      setLoading(true);
      try {
        // 1) Backend'den admin siparişlerini getir
        let backendOrders = [];
        try {
          const res = await api.get('/orders');
          // Backend response: { success: true, data: { orders: [...], pagination: {...} } }
          backendOrders = res.data?.success && res.data?.data?.orders ? res.data.data.orders : [];
        } catch (apiErr) {
          console.warn('Backend orders fetch failed, continue with local orders only.', apiErr?.message);
          backendOrders = [];
        }
        const apiNormalized = backendOrders.map((o, idx) => {
          const createdAt = o.createdAt || new Date().toISOString();
          const orderNumber = o.orderNumber || `WEB-${new Date(createdAt).getFullYear()}-${String(idx + 1).padStart(3, '0')}`;
          
          // Backend'den gelen veri yapısına göre mapping
          const productName = o.items && o.items.length > 0 ? o.items[0].productName : (o.title || 'Ürün');
          const customerName = o.createdBy && o.createdBy.firstName ? 
            `${o.createdBy.firstName} ${o.createdBy.lastName || ''}`.trim() : 
            (o.createdBy && o.createdBy.username ? o.createdBy.username : 'Müşteri');
          const quantity = o.items && o.items.length > 0 ? o.items[0].quantity : 0;
          const unitPrice = 0; // Backend'de unitPrice yok
          const totalAmount = 0; // Backend'de totalPrice yok
          const deliveryDate = o.dueDate || o.deliveryDate || null;
          const orderDate = o.orderDate || createdAt;
          const status = o.status || 'beklemede';
          const priority = o.priority || 'normal';
          
          
          return {
            id: o._id, // Backend'deki gerçek _id'yi id olarak kullan
            _id: o._id,
            orderNumber,
            product: productName,
            productName,
            customerName,
            quantity,
            unitPrice,
            totalAmount,
            deliveryDate,
            orderDate,
            status,
            priority,
            createdAt,
            source: 'backend',
            // Backend'den gelen diğer alanlar
            title: o.title,
            description: o.description,
            location: o.location,
            assignedTo: o.assignedTo,
            items: o.items,
            createdBy: o.createdBy,
            updatedAt: o.updatedAt
          };
        });

        // 2) Sadece backend'den gelen verileri kullan
        setOrders(apiNormalized);

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('Orders loading error:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]); // user dependency'sini geri ekledim

  const getStatusBadge = (status) => {
    const statusConfig = {
      beklemede: { variant: 'warning', text: 'Beklemede' },
      onaylandi: { variant: 'primary', text: 'Onaylandı' },
      hazirlaniyor: { variant: 'primary', text: 'Hazırlanıyor' },
      ham_madde_bekleniyor: { variant: 'warning', text: 'Ham Madde Bekleniyor' },
      uretimde: { variant: 'primary', text: 'Üretimde' },
      kalite_kontrol: { variant: 'info', text: 'Kalite Kontrol' },
      paketleniyor: { variant: 'primary', text: 'Paketleniyor' },
      kargoya_verildi: { variant: 'info', text: 'Kargoya Verildi' },
      teslim_edildi: { variant: 'success', text: 'Teslim Edildi' },
      iptal_edildi: { variant: 'danger', text: 'İptal Edildi' },
      // Eski değerler için backward compatibility
      pending: { variant: 'warning', text: 'Beklemede' },
      in_progress: { variant: 'primary', text: 'İşlemde' },
      completed: { variant: 'success', text: 'Tamamlandı' },
      cancelled: { variant: 'danger', text: 'İptal Edildi' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      düşük: { variant: 'success', text: 'Düşük' },
      normal: { variant: 'warning', text: 'Normal' },
      yüksek: { variant: 'danger', text: 'Yüksek' },
      acil: { variant: 'danger', text: 'Acil' },
      // Eski değerler için backward compatibility
      low: { variant: 'success', text: 'Düşük' },
      medium: { variant: 'warning', text: 'Orta' },
      high: { variant: 'danger', text: 'Yüksek' }
    };
    
    const config = priorityConfig[priority] || { variant: 'secondary', text: priority };
    return <Badge variant={config.variant} size="sm">{config.text}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.product || order.productName)?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  

  const columns = [
    {
      key: 'orderNumber',
      header: isWorker ? 'Görev No' : 'Sipariş No',
      render: (cellValue, order, rowIndex) => (
        <Link 
          to={`/orders/${order?.id || ''}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {order?.orderNumber || 'N/A'}
        </Link>
      )
    },
    {
      key: 'customerName',
      header: 'Müşteri',
      render: (cellValue, order, rowIndex) => (
        <div>
          <div className="font-medium text-gray-900">{order?.customerName || 'Bilinmeyen Müşteri'}</div>
          <div className="text-sm text-gray-500">{order?.customerEmail || '-'}</div>
        </div>
      )
    },
    {
      key: 'product',
      header: 'Ürün',
      render: (cellValue, order, rowIndex) => (
        <div>
          <div className="font-medium text-gray-900">{order?.product || order?.productName || 'Bilinmeyen Ürün'}</div>
          <div className="text-sm text-gray-500">Adet: {order?.quantity || 0}</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Durum',
      render: (cellValue, order, rowIndex) => (
        <div className="space-y-1">
          {getStatusBadge(order?.status || 'pending')}
          {getPriorityBadge(order?.priority || 'medium')}
        </div>
      )
    },
    {
      key: 'dates',
      header: 'Tarihler',
      render: (cellValue, order, rowIndex) => (
        <div className="text-sm">
          <div>Sipariş: {order?.orderDate ? formatDate(order.orderDate) : '-'}</div>
          <div className="text-gray-500">Teslimat: {order?.deliveryDate ? formatDate(order.deliveryDate) : '-'}</div>
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: 'Tutar',
      render: (cellValue, order, rowIndex) => (
        <div className="font-medium text-gray-900">
          {formatCurrency(order?.totalAmount || 0)}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (cellValue, order, rowIndex) => (
        <div className="flex space-x-2">
          <Link 
            to={`/orders/${order?.id || ''}`}
            className="inline-block"
          >
            <Button size="sm" variant="outline">
              Görüntüle
            </Button>
          </Link>
          {order?.status === 'pending' && (
            <Button size="sm" variant="primary">
              Başlat
            </Button>
          )}
        </div>
      )
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tüm Durumlar' },
    { value: 'pending', label: 'Beklemede' },
    { value: 'in_progress', label: 'İşlemde' },
    { value: 'completed', label: 'Tamamlandı' },
    { value: 'cancelled', label: 'İptal Edildi' }
  ];

  const getStatusCounts = () => {
    return orders.reduce((acc, order) => {
      if (order?.status) {
        // Backend status'larını frontend status'larına map et
        let mappedStatus = order.status;
        
        // Backend status'larını frontend status'larına çevir
        const statusMapping = {
          'beklemede': 'pending',
          'onaylandi': 'pending',
          'hazirlaniyor': 'in_progress',
          'ham_madde_bekleniyor': 'in_progress',
          'uretimde': 'in_progress',
          'kalite_kontrol': 'in_progress',
          'paketleniyor': 'in_progress',
          'kargoya_verildi': 'in_progress',
          'teslim_edildi': 'completed',
          'iptal_edildi': 'cancelled'
        };
        
        mappedStatus = statusMapping[order.status] || order.status;
        acc[mappedStatus] = (acc[mappedStatus] || 0) + 1;
      }
      return acc;
    }, {});
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Siparişler yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isWorker ? 'Görevlerim' : 'Sipariş Yönetimi'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isWorker 
                ? `Toplam ${orders.length} görev bulundu`
                : `Toplam ${orders.length} sipariş bulundu`
              }
            </p>
          </div>
          {hasRole(['admin', 'magaza_personeli']) && (
            <Link to="/orders/new">
              <Button variant="primary">
                📦 Yeni Sipariş Oluştur
              </Button>
            </Link>
          )}
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">{isWorker ? 'Devam Eden Görevler' : 'Beklemede'}</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.pending || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <span className="text-blue-600 text-xl">🔄</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">{isWorker ? 'Devam Eden Görevler' : 'İşlemde'}</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.in_progress || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tamamlandı</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.completed || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <span className="text-red-600 text-xl">❌</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">İptal Edildi</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.cancelled || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder={isWorker ? 'Görev no, müşteri adı veya ürün ara...' : 'Sipariş no, müşteri adı veya ürün ara...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
            </select>
          </div>
        </Card>

        {/* Orders Table */}
        <Card>
          <Table columns={columns} data={filteredOrders} />
        </Card>
    </div>
  );
};

export default OrdersPage;