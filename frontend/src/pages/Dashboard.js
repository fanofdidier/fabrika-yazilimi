import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { Card, Button, Badge, Alert } from '../components/UI';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const { isConnected, getOnlineUsersCount } = useSocket();
  const { unreadCount } = useNotification();
  
  const [stats, setStats] = useState({
    orders: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    tasks: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    users: { total: 0, online: 0 },
    notifications: { unread: 0 }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard statistics
      const [statsResponse, ordersResponse, tasksResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/orders?limit=5&sort=-createdAt'),
        api.get('/tasks?limit=5&sort=-createdAt')
      ]);
      
      setStats({
        ...statsResponse.data,
        users: {
          ...statsResponse.data.users,
          online: getOnlineUsersCount()
        },
        notifications: {
          unread: unreadCount
        }
      });
      
      setRecentOrders(ordersResponse.data.orders || []);
      setRecentTasks(tasksResponse.data.tasks || []);
      
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Dashboard verileri yüklenirken hata oluştu');
      toast.error('Dashboard verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const getTaskStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Dashboard yükleniyor..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        variant="danger"
        title="Hata"
        dismissible
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
          >
            Tekrar dene
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="gradient-primary text-white hover-lift">
        <Card.Body>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Hoş geldiniz, {user?.name || 'Kullanıcı'}!
              </h1>
              <p className="text-blue-100 mt-1">
                Fabrika Sipariş Takip Sistemi Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant={isConnected ? 'success' : 'danger'}
                className="glass-effect"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-300' : 'bg-red-300'
                  }`}></div>
                  <span>{isConnected ? 'Bağlı' : 'Bağlantı Kesildi'}</span>
                </div>
              </Badge>
              <div className="text-blue-100 text-sm">
                {getOnlineUsersCount()} çevrimiçi kullanıcı
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Orders Stats */}
        <Card className="hover-lift shadow-soft">
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-medium">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">
                  Toplam Siparişler
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.orders.total}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bekliyor</span>
                <Badge variant="warning" size="sm">{stats.orders.pending}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Devam Ediyor</span>
                <Badge variant="primary" size="sm">{stats.orders.inProgress}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tamamlandı</span>
                <Badge variant="success" size="sm">{stats.orders.completed}</Badge>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Tasks Stats */}
        <Card className="hover-lift shadow-soft">
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-medium">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">
                  Toplam Görevler
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.tasks.total}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bekliyor</span>
                <Badge variant="warning" size="sm">{stats.tasks.pending}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Devam Ediyor</span>
                <Badge variant="primary" size="sm">{stats.tasks.inProgress}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tamamlandı</span>
                <Badge variant="success" size="sm">{stats.tasks.completed}</Badge>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Users Stats */}
        {hasRole(['admin', 'magaza_personeli']) && (
          <Card className="hover-lift shadow-soft">
            <Card.Body>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-medium">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">
                    Kullanıcılar
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.users.total}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Çevrimiçi</span>
                  <Badge variant="success" size="sm">{stats.users.online}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Çevrimdışı</span>
                  <Badge variant="secondary" size="sm">{stats.users.total - stats.users.online}</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Notifications Stats */}
        <Card className="hover-lift shadow-soft">
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-medium">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718A8.966 8.966 0 003 12a9 9 0 0118 0 8.966 8.966 0 00-1.868 7.718" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">
                  Okunmamış Bildirimler
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.notifications.unread}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button
                as={Link}
                to="/notifications"
                variant="outline"
                size="sm"
                className="w-full"
              >
                Tümünü Görüntüle
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Recent Orders and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="shadow-soft">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Son Siparişler</Card.Title>
              <Button
                as={Link}
                to="/orders"
                variant="ghost"
                size="sm"
              >
                Tümünü Görüntüle →
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-gray-200">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            #{order.orderNumber}
                          </p>
                          <Badge
                            variant={getOrderStatusColor(order.status)}
                            size="sm"
                          >
                            {getOrderStatusText(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.customerName} • {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ₺{order.totalAmount?.toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="mt-2 text-sm">Henüz sipariş yok</p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Recent Tasks */}
        <Card className="shadow-soft">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Son Görevler</Card.Title>
              <Button
                as={Link}
                to="/tasks"
                variant="ghost"
                size="sm"
              >
                Tümünü Görüntüle →
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-gray-200">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {task.title}
                          </p>
                          <Badge
                            variant={getTaskStatusColor(task.status)}
                            size="sm"
                          >
                            {getTaskStatusText(task.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {task.assignedTo?.name} • {formatDate(task.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}
                          size="sm"
                        >
                          {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
                  </svg>
                  <p className="mt-2 text-sm">Henüz görev yok</p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-soft">
        <Card.Header>
          <Card.Title>Hızlı İşlemler</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              as={Link}
              to="/orders/new"
              variant="outline"
              className="flex flex-col items-center p-6 h-auto hover-lift"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-sm font-medium">Yeni Sipariş</span>
            </Button>
            
            <Button
              as={Link}
              to="/tasks/new"
              variant="outline"
              className="flex flex-col items-center p-6 h-auto hover-lift"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-sm font-medium">Yeni Görev</span>
            </Button>
            
            {hasRole(['admin', 'magaza_personeli']) && (
              <Button
                as={Link}
                to="/users/new"
                variant="outline"
                className="flex flex-col items-center p-6 h-auto hover-lift"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Yeni Kullanıcı</span>
              </Button>
            )}
            
            <Button
              as={Link}
              to="/reports"
              variant="outline"
              className="flex flex-col items-center p-6 h-auto hover-lift"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Raporlar</span>
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;