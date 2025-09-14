import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, Table, LoadingSpinner, Input } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';
import { 
  mapOrderStatus, 
  mapPriority, 
  getOrderStatusLabel, 
  getPriorityLabel,
  getOrderStatusColor,
  getPriorityColor,
  ORDER_STATUS_OPTIONS,
  PRIORITY_OPTIONS
} from '../../utils/statusMapping';


const OrdersPage = () => {
  const { hasRole, user } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Çalışanlar için siparişleri görevler olarak göster
  const isWorker = user?.role === 'fabrika_iscisi';
  

  const loadOrders = async () => {
    // Eğer user yoksa veya loading durumundaysa bekle
    if (!user) {
      return;
    }
    
    setLoading(true);
    try {
      // Backend'den siparişleri getir
      const res = await api.get('/orders');
      
      // Backend response: { success: true, data: { orders: [...], pagination: {...} } }
      const backendOrders = res.data?.success && res.data?.data?.orders ? res.data.data.orders : [];
      
      // Backend verilerini normalize et
      const normalizedOrders = backendOrders.map((order) => {
        const createdAt = order.createdAt || new Date().toISOString();
        const orderNumber = order.orderNumber || `ORD-${new Date(createdAt).getFullYear()}-${String(order._id).slice(-4)}`;
        
        // Müşteri adını oluştur
        let customerName = 'Bilinmeyen Müşteri';
        if (order.createdBy) {
          if (order.createdBy.firstName && order.createdBy.lastName) {
            customerName = `${order.createdBy.firstName} ${order.createdBy.lastName}`.trim();
          } else if (order.createdBy.username) {
            customerName = order.createdBy.username;
          }
        }
        
        // Ürün bilgilerini al
        let productName = 'Ürün';
        let quantity = 0;
        if (order.items && order.items.length > 0) {
          productName = order.items[0].productName || order.items[0].name || 'Ürün';
          quantity = order.items[0].quantity || 0;
        } else if (order.title) {
          productName = order.title;
        }
        
        return {
          id: order._id,
          _id: order._id,
          orderNumber,
          product: productName,
          productName,
          customerName,
          customerEmail: order.createdBy?.email || '',
          quantity,
          unitPrice: 0, // Backend'de unitPrice yok
          totalAmount: 0, // Backend'de totalPrice yok
          deliveryDate: order.dueDate || order.deliveryDate || null,
          orderDate: order.orderDate || createdAt,
          status: order.status || 'beklemede',
          priority: order.priority || 'normal',
          createdAt,
          // Backend'den gelen diğer alanlar
          title: order.title,
          description: order.description,
          location: order.location,
          assignedTo: order.assignedTo,
          items: order.items,
          createdBy: order.createdBy,
          updatedAt: order.updatedAt
        };
      });

      setOrders(normalizedOrders);
    } catch (error) {
      console.error('Orders loading error:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  // Socket.io ile gerçek zamanlı güncellemeler
  useEffect(() => {
    if (socket) {
      const handleOrderUpdated = (data) => {
        console.log('🔔 OrdersPage: Order updated event received:', data);
        // Siparişleri yenile
        loadOrders();
      };

      const handleNewOrder = (data) => {
        console.log('🔔 OrdersPage: New order event received:', data);
        // Siparişleri yenile
        loadOrders();
      };

      socket.on('orderUpdated', handleOrderUpdated);
      socket.on('new-order', handleNewOrder);

      return () => {
        socket.off('orderUpdated', handleOrderUpdated);
        socket.off('new-order', handleNewOrder);
      };
    }
  }, [socket]);

  const getStatusBadge = (status) => {
    return (
      <Badge variant={getOrderStatusColor(status)}>
        {getOrderStatusLabel(status)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    return (
      <Badge variant={getPriorityColor(priority)} size="sm">
        {getPriorityLabel(priority)}
      </Badge>
    );
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
    
    // Arama filtresi
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.product || order.productName)?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filtresi - backend status'larını frontend status'larına map et
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const mappedOrderStatus = mapOrderStatus(order.status);
      matchesStatus = mappedOrderStatus === statusFilter;
    }
    
    // Öncelik filtresi
    let matchesPriority = true;
    if (priorityFilter !== 'all') {
      const mappedOrderPriority = mapPriority(order.priority);
      matchesPriority = mappedOrderPriority === priorityFilter;
    }
    
    return matchesSearch && matchesStatus && matchesPriority;
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

  // Status ve priority options utility'den import edildi

  const getStatusCounts = () => {
    const counts = { 
      total: 0,
      open: 0,      // siparis_olusturuldu, siparis_onaylandi, hammadde_hazirlaniyor, uretim_basladi, uretim_tamamlandi, kalite_kontrol, sevkiyata_hazir, yola_cikti
      closed: 0     // teslim_edildi, tamamlandi, iptal_edildi
    };

    orders.forEach(order => {
      if (order?.status) {
        counts.total += 1;
        
        switch (order.status) {
          case 'siparis_olusturuldu':
          case 'siparis_onaylandi':
          case 'hammadde_hazirlaniyor':
          case 'uretim_basladi':
          case 'uretim_tamamlandi':
          case 'kalite_kontrol':
          case 'sevkiyata_hazir':
          case 'yola_cikti':
            counts.open += 1;
            break;
          case 'teslim_edildi':
          case 'tamamlandi':
          case 'iptal_edildi':
            counts.closed += 1;
            break;
          // Eski status'lar için backward compatibility
          case 'beklemede':
          case 'onaylandi':
          case 'hazirlaniyor':
          case 'ham_madde_bekleniyor':
          case 'uretimde':
          case 'paketleniyor':
          case 'kargoya_verildi':
            counts.open += 1;
            break;
        }
      }
    });

    return counts;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                <span className="text-gray-600 text-xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.total || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <span className="text-blue-600 text-xl">🔄</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Açık Siparişler</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.open || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                <span className="text-gray-600 text-xl">🔒</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kapalı Siparişler</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.closed || 0}</p>
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
              {ORDER_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Orders Table */}
        <Card>
          <Table 
            columns={columns} 
            data={filteredOrders} 
            getRowClassName={(order) => {
              // Kapalı siparişler için farklı stil
              const closedStatuses = ['teslim_edildi', 'tamamlandi', 'iptal_edildi'];
              if (closedStatuses.includes(order.status)) {
                return 'bg-gray-100 opacity-75';
              }
              return '';
            }}
          />
        </Card>
    </div>
  );
};

export default OrdersPage;