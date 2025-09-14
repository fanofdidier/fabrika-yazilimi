import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, LoadingSpinner } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const { notifications } = useNotification();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingTasks: 0,
    activeUsers: 0,
    completedOrders: 0
  });

  const loadDashboardData = useCallback(async () => {
    console.log('🎯 Rendering Dashboard (legacy view) with real data');
    setLoading(true);
    try {
      const [ordersStatsRes, tasksStatsRes, ordersRes, tasksRes] = await Promise.all([
        api.get('/orders/stats'),
        api.get('/tasks/stats'),
        api.get('/orders?limit=5'),
        api.get('/tasks?limit=5')
      ]);

      const ordersStats = ordersStatsRes.data?.data || {};
      const tasksStats = tasksStatsRes.data?.data || {};
      console.log('📊 ordersStats:', ordersStats);
      console.log('📊 tasksStats:', tasksStats);

      const orderStatusCounts = Object.fromEntries(
        (ordersStats.statusStats || []).map(s => [s._id, s.count])
      );
      const taskStatusCounts = Object.fromEntries(
        (tasksStats.statusStats || []).map(s => [s._id, s.count])
      );

      setStats({
        totalOrders: ordersStats.totalOrders || 0,
        pendingTasks: (taskStatusCounts['beklemede'] || taskStatusCounts['pending'] || 0),
        activeUsers: 0,
        completedOrders: (orderStatusCounts['teslim_edildi'] || orderStatusCounts['completed'] || 0)
      });
      // recent data (not shown in this simple view, but good to keep warm)
      console.log('🧾 recentOrders len:', (ordersRes.data?.data?.orders || []).length);
      console.log('🧾 recentTasks len:', (tasksRes.data?.data?.tasks || []).length);
    } catch (error) {
      console.error('Dashboard data loading error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const unreadNotifications = (notifications || []).filter(n => !n.read).length;

  const quickStats = [
    {
      title: 'Toplam Siparişler',
      value: stats.totalOrders,
      icon: '📦',
      color: 'bg-blue-500',
      link: '/orders'
    },
    {
      title: 'Bekleyen Görevler',
      value: stats.pendingTasks,
      icon: '📋',
      color: 'bg-yellow-500',
      link: '/tasks'
    },
    {
      title: 'Aktif Kullanıcılar',
      value: stats.activeUsers,
      icon: '👥',
      color: 'bg-green-500',
      link: '/users'
    },
    {
      title: 'Tamamlanan Siparişler',
      value: stats.completedOrders,
      icon: '✅',
      color: 'bg-purple-500',
      link: '/orders'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'order',
      title: 'Yeni sipariş oluşturuldu',
      description: 'Sipariş #1234 - ABC Şirketi',
      time: '5 dakika önce',
      icon: '📦'
    },
    {
      id: 2,
      type: 'task',
      title: 'Görev tamamlandı',
      description: 'Kalite kontrol görevi - Mehmet Kaya',
      time: '15 dakika önce',
      icon: '✅'
    },
    {
      id: 3,
      type: 'user',
      title: 'Yeni kullanıcı kaydı',
      description: 'Ali Çelik sisteme katıldı',
      time: '1 saat önce',
      icon: '👤'
    },
    {
      id: 4,
      type: 'system',
      title: 'Sistem güncellemesi',
      description: 'Bildirim sistemi güncellendi',
      time: '2 saat önce',
      icon: '⚙️'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Dashboard yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Hoş geldiniz, {user?.firstName || 'Kullanıcı'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Fabrika yönetim sistemi ana sayfası
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Link key={index} to={stat.link}>
              <Card className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${stat.color} text-white text-2xl mr-4`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Son Aktiviteler</h2>
              <Button variant="outline" size="sm">
                Tümünü Gör
              </Button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Notifications Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Bildirimler</h2>
              <Link to="/notifications">
                <Button variant="outline" size="sm">
                  Tümünü Gör
                </Button>
              </Link>
            </div>
            
            {unreadNotifications > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📢</div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {unreadNotifications} okunmamış bildirim
                      </p>
                      <p className="text-sm text-gray-600">
                        Yeni bildirimlerinizi kontrol edin
                      </p>
                    </div>
                  </div>
                  <Badge variant="primary">{unreadNotifications}</Badge>
                </div>
                
                {/* Show recent notifications */}
                <div className="space-y-2">
                  {(notifications || []).slice(0, 3).map((notification) => (
                    <div key={notification.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                      <div className="text-lg">
                        {notification.type === 'order' ? '📦' : 
                         notification.type === 'task' ? '📋' : 
                         notification.type === 'system' ? '⚙️' : '📢'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      {!notification.read && (
                        <Badge variant="primary" size="sm">Yeni</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-gray-600">Tüm bildirimler okundu</p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/orders/create">
              <Button className="w-full" variant="primary">
                📦 Yeni Sipariş Oluştur
              </Button>
            </Link>
            <Link to="/tasks/create">
              <Button className="w-full" variant="outline">
                📋 Yeni Görev Ekle
              </Button>
            </Link>
            <Link to="/users">
              <Button className="w-full" variant="outline">
                👥 Kullanıcı Yönetimi
              </Button>
            </Link>
          </div>
        </Card>
    </div>
  );
};

export default DashboardPage;