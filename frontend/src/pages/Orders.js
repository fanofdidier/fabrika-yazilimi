import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import api from '../services/api';

const Orders = () => {
  const { user, hasPermission } = useAuth();
  const { socket } = useSocket();
  
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    dateRange: 'all'
  });
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productName: '',
    quantity: 1,
    unitPrice: '',
    totalPrice: '',
    priority: 'normal',
    dueDate: '',
    notes: '',
    specifications: ''
  });
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters, sortBy, sortOrder]);

  useEffect(() => {
    if (socket) {
      socket.on('orderCreated', handleOrderCreated);
      socket.on('orderUpdated', handleOrderUpdated);
      socket.on('orderDeleted', handleOrderDeleted);
      
      return () => {
        socket.off('orderCreated', handleOrderCreated);
        socket.off('orderUpdated', handleOrderUpdated);
        socket.off('orderDeleted', handleOrderDeleted);
      };
    }
  }, [socket]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Siparişler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderCreated = (order) => {
    setOrders(prev => [order, ...prev]);
    toast.success('Yeni sipariş eklendi');
  };

  const handleOrderUpdated = (updatedOrder) => {
    setOrders(prev => prev.map(order => 
      order._id === updatedOrder._id ? updatedOrder : order
    ));
    if (selectedOrder && selectedOrder._id === updatedOrder._id) {
      setSelectedOrder(updatedOrder);
    }
    toast.success('Sipariş güncellendi');
  };

  const handleOrderDeleted = (orderId) => {
    setOrders(prev => prev.filter(order => order._id !== orderId));
    if (selectedOrder && selectedOrder._id === orderId) {
      setSelectedOrder(null);
      setShowDetailsModal(false);
    }
    toast.success('Sipariş silindi');
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(searchTerm) ||
        order.productName.toLowerCase().includes(searchTerm) ||
        order.orderNumber.toLowerCase().includes(searchTerm) ||
        order.customerPhone.includes(searchTerm)
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'dueDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const validateOrderForm = () => {
    const newErrors = {};
    
    if (!newOrder.customerName.trim()) {
      newErrors.customerName = 'Müşteri adı gereklidir';
    }
    
    if (!newOrder.customerPhone.trim()) {
      newErrors.customerPhone = 'Telefon numarası gereklidir';
    } else if (!/^[0-9+\-\s()]+$/.test(newOrder.customerPhone)) {
      newErrors.customerPhone = 'Geçerli bir telefon numarası giriniz';
    }
    
    if (newOrder.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newOrder.customerEmail)) {
      newErrors.customerEmail = 'Geçerli bir e-posta adresi giriniz';
    }
    
    if (!newOrder.productName.trim()) {
      newErrors.productName = 'Ürün adı gereklidir';
    }
    
    if (!newOrder.quantity || newOrder.quantity < 1) {
      newErrors.quantity = 'Geçerli bir miktar giriniz';
    }
    
    if (!newOrder.unitPrice || newOrder.unitPrice < 0) {
      newErrors.unitPrice = 'Geçerli bir birim fiyat giriniz';
    }
    
    if (!newOrder.dueDate) {
      newErrors.dueDate = 'Teslim tarihi gereklidir';
    } else if (new Date(newOrder.dueDate) < new Date()) {
      newErrors.dueDate = 'Teslim tarihi bugünden sonra olmalıdır';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    if (!validateOrderForm()) {
      return;
    }
    
    setIsCreating(true);
    setErrors({});
    
    try {
      const orderData = {
        ...newOrder,
        totalPrice: parseFloat(newOrder.unitPrice) * parseInt(newOrder.quantity)
      };
      
      await api.post('/orders', orderData);
      
      setNewOrder({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        productName: '',
        quantity: 1,
        unitPrice: '',
        totalPrice: '',
        priority: 'normal',
        dueDate: '',
        notes: '',
        specifications: ''
      });
      
      setShowCreateModal(false);
      toast.success('Sipariş başarıyla oluşturuldu!');
    } catch (error) {
      console.error('Error creating order:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          setErrors({ general: errorData.message || 'Geçersiz veri' });
        }
      } else {
        setErrors({ general: 'Sipariş oluşturulurken bir hata oluştu' });
      }
      
      toast.error('Sipariş oluşturulamadı');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Sipariş durumu güncellendi');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Sipariş durumu güncellenemedi');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Sipariş silindi');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Sipariş silinemedi');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setNewOrder(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Auto-calculate total price
      if (name === 'quantity' || name === 'unitPrice') {
        const quantity = name === 'quantity' ? parseInt(value) || 0 : parseInt(prev.quantity) || 0;
        const unitPrice = name === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(prev.unitPrice) || 0;
        updated.totalPrice = (quantity * unitPrice).toFixed(2);
      }
      
      return updated;
    });
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_production': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'confirmed': return 'Onaylandı';
      case 'in_production': return 'Üretimde';
      case 'ready': return 'Hazır';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'low': return 'Düşük';
      case 'normal': return 'Normal';
      case 'high': return 'Yüksek';
      case 'urgent': return 'Acil';
      default: return priority;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h1>
          <p className="text-gray-600">Tüm siparişleri görüntüleyin ve yönetin</p>
        </div>
        {hasPermission('orders:create') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Yeni Sipariş
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arama
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Müşteri, ürün, sipariş no..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durum
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">Tümü</option>
              <option value="pending">Beklemede</option>
              <option value="confirmed">Onaylandı</option>
              <option value="in_production">Üretimde</option>
              <option value="ready">Hazır</option>
              <option value="delivered">Teslim Edildi</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Öncelik
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">Tümü</option>
              <option value="low">Düşük</option>
              <option value="normal">Normal</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarih Aralığı
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">Tümü</option>
              <option value="today">Bugün</option>
              <option value="week">Son 7 Gün</option>
              <option value="month">Son 30 Gün</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('orderNumber')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Sipariş No</span>
                    {sortBy === 'orderNumber' && (
                      <svg className={`w-4 h-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('customerName')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Müşteri</span>
                    {sortBy === 'customerName' && (
                      <svg className={`w-4 h-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miktar
                </th>
                <th 
                  onClick={() => handleSort('totalPrice')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Toplam</span>
                    {sortBy === 'totalPrice' && (
                      <svg className={`w-4 h-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Öncelik
                </th>
                <th 
                  onClick={() => handleSort('dueDate')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Teslim Tarihi</span>
                    {sortBy === 'dueDate' && (
                      <svg className={`w-4 h-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerPhone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(order.totalPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                      {getPriorityText(order.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(order.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailsModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Detay
                      </button>
                      {hasPermission('orders:update') && (
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Beklemede</option>
                          <option value="confirmed">Onaylandı</option>
                          <option value="in_production">Üretimde</option>
                          <option value="ready">Hazır</option>
                          <option value="delivered">Teslim Edildi</option>
                          <option value="cancelled">İptal Edildi</option>
                        </select>
                      )}
                      {hasPermission('orders:delete') && (
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{indexOfFirstOrder + 1}</span>
                  {' - '}
                  <span className="font-medium">{Math.min(indexOfLastOrder, filteredOrders.length)}</span>
                  {' / '}
                  <span className="font-medium">{filteredOrders.length}</span>
                  {' sonuç gösteriliyor'}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Yeni Sipariş Oluştur</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Müşteri Adı *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={newOrder.customerName}
                    onChange={handleOrderChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.customerName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                  )}
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon *</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={newOrder.customerPhone}
                    onChange={handleOrderChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.customerPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.customerPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
                  )}
                </div>

                {/* Customer Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-posta</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={newOrder.customerEmail}
                    onChange={handleOrderChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.customerEmail ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.customerEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
                  )}
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ürün Adı *</label>
                  <input
                    type="text"
                    name="productName"
                    value={newOrder.productName}
                    onChange={handleOrderChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.productName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.productName && (
                    <p className="mt-1 text-sm text-red-600">{errors.productName}</p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Miktar *</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={newOrder.quantity}
                    onChange={handleOrderChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.quantity ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                  )}
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Birim Fiyat *</label>
                  <input
                    type="number"
                    name="unitPrice"
                    min="0"
                    step="0.01"
                    value={newOrder.unitPrice}
                    onChange={handleOrderChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.unitPrice ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.unitPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
                  )}
                </div>

                {/* Total Price (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Toplam Fiyat</label>
                  <input
                    type="text"
                    value={newOrder.totalPrice ? formatCurrency(newOrder.totalPrice) : ''}
                    readOnly
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Öncelik</label>
                  <select
                    name="priority"
                    value={newOrder.priority}
                    onChange={handleOrderChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="low">Düşük</option>
                    <option value="normal">Normal</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teslim Tarihi *</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={newOrder.dueDate}
                    onChange={handleOrderChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.dueDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Teknik Özellikler</label>
                <textarea
                  name="specifications"
                  rows={3}
                  value={newOrder.specifications}
                  onChange={handleOrderChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Ürünün teknik özelliklerini belirtin..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Notlar</label>
                <textarea
                  name="notes"
                  rows={3}
                  value={newOrder.notes}
                  onChange={handleOrderChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Ek notlar..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <LoadingSpinner size="sm" className="text-white mr-2" />
                  ) : null}
                  Sipariş Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Sipariş Detayları - {selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Müşteri Bilgileri</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Ad Soyad</dt>
                      <dd className="text-sm text-gray-900">{selectedOrder.customerName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                      <dd className="text-sm text-gray-900">{selectedOrder.customerPhone}</dd>
                    </div>
                    {selectedOrder.customerEmail && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">E-posta</dt>
                        <dd className="text-sm text-gray-900">{selectedOrder.customerEmail}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Order Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Sipariş Bilgileri</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Ürün</dt>
                      <dd className="text-sm text-gray-900">{selectedOrder.productName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Miktar</dt>
                      <dd className="text-sm text-gray-900">{selectedOrder.quantity}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Birim Fiyat</dt>
                      <dd className="text-sm text-gray-900">{formatCurrency(selectedOrder.unitPrice)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Toplam Fiyat</dt>
                      <dd className="text-sm font-bold text-gray-900">{formatCurrency(selectedOrder.totalPrice)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Durum</dt>
                      <dd>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Öncelik</dt>
                      <dd>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedOrder.priority)}`}>
                          {getPriorityText(selectedOrder.priority)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sipariş Tarihi</dt>
                      <dd className="text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Teslim Tarihi</dt>
                      <dd className="text-sm text-gray-900">{formatDate(selectedOrder.dueDate)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Specifications */}
              {selectedOrder.specifications && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Teknik Özellikler</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedOrder.specifications}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Notlar</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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

export default Orders;