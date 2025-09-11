import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, Table, LoadingSpinner, Input } from '../../components/UI';


const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Siparişlerden otomatik görev oluşturma
  const generateTasksFromOrders = (orders) => {
    const tasks = [];
    
    orders.forEach((order, index) => {
      // Her sipariş için temel görevler oluştur
      const baseTaskId = (index + 1) * 100;
      
      // Malzeme Hazırlığı görevi
      tasks.push({
        id: baseTaskId + 1,
        title: 'Malzeme Hazırlığı',
        description: `${order.orderNumber} siparişi için ${order.productName} malzeme hazırlığı`,
        assignee: 'Beklemede',
        assigneeEmail: 'atama@fabrika.com',
        status: order.status === 'completed' ? 'completed' : 'pending',
        priority: order.priority || 'medium',
        category: 'material',
        createdDate: order.createdAt,
        dueDate: order.deliveryDate,
        completedDate: order.status === 'completed' ? order.deliveryDate : null,
        orderId: order.id,
        orderNumber: order.orderNumber,
        estimatedHours: Math.ceil(order.quantity / 10) || 4,
        actualHours: null,
        progress: order.status === 'completed' ? 100 : 0
      });
      
      // Üretim görevi
      tasks.push({
        id: baseTaskId + 2,
        title: 'Üretim İşlemi',
        description: `${order.orderNumber} - ${order.productName} üretim işlemi`,
        assignee: 'Beklemede',
        assigneeEmail: 'uretim@fabrika.com',
        status: order.status === 'completed' ? 'completed' : (order.status === 'in_progress' ? 'in_progress' : 'pending'),
        priority: order.priority || 'high',
        category: 'production',
        createdDate: order.createdAt,
        dueDate: order.deliveryDate,
        completedDate: order.status === 'completed' ? order.deliveryDate : null,
        orderId: order.id,
        orderNumber: order.orderNumber,
        estimatedHours: Math.ceil(order.quantity / 5) || 8,
        actualHours: null,
        progress: order.status === 'completed' ? 100 : (order.status === 'in_progress' ? 50 : 0)
      });
      
      // Kalite Kontrol görevi
      tasks.push({
        id: baseTaskId + 3,
        title: 'Kalite Kontrol',
        description: `${order.orderNumber} siparişi için kalite kontrol işlemi`,
        assignee: 'Beklemede',
        assigneeEmail: 'kalite@fabrika.com',
        status: order.status === 'completed' ? 'completed' : 'pending',
        priority: 'high',
        category: 'quality',
        createdDate: order.createdAt,
        dueDate: order.deliveryDate,
        completedDate: order.status === 'completed' ? order.deliveryDate : null,
        orderId: order.id,
        orderNumber: order.orderNumber,
        estimatedHours: 2,
        actualHours: null,
        progress: order.status === 'completed' ? 100 : 0
      });
    });
    
    return tasks;
  };

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        // localStorage'dan siparişleri yükle
        const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        // Siparişlerden görevler oluştur
        const generatedTasks = generateTasksFromOrders(savedOrders);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setTasks(generatedTasks);
      } catch (error) {
        console.error('Tasks loading error:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', text: 'Beklemede' },
      in_progress: { variant: 'primary', text: 'İşlemde' },
      completed: { variant: 'success', text: 'Tamamlandı' },
      overdue: { variant: 'danger', text: 'Gecikmiş' },
      cancelled: { variant: 'secondary', text: 'İptal Edildi' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { variant: 'danger', text: 'Yüksek' },
      medium: { variant: 'warning', text: 'Orta' },
      low: { variant: 'success', text: 'Düşük' }
    };
    
    const config = priorityConfig[priority] || { variant: 'secondary', text: priority };
    return <Badge variant={config.variant} size="sm">{config.text}</Badge>;
  };

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      material: { variant: 'primary', text: 'Malzeme', icon: '📦' },
      quality: { variant: 'success', text: 'Kalite', icon: '✅' },
      planning: { variant: 'warning', text: 'Planlama', icon: '📋' },
      maintenance: { variant: 'secondary', text: 'Bakım', icon: '🔧' },
      shipping: { variant: 'primary', text: 'Sevkiyat', icon: '🚚' },
      production: { variant: 'primary', text: 'Üretim', icon: '⚙️' }
    };
    
    const config = categoryConfig[category] || { variant: 'secondary', text: category, icon: '📝' };
    return (
      <Badge variant={config.variant} size="sm">
        {config.icon} {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const filteredTasks = tasks.filter(task => {
    if (!task) return false;
    const matchesSearch = 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.orderNumber && task.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const columns = [
    {
      key: 'title',
      header: 'Görev',
      render: (task) => (
        <div>
          <Link 
            to={`/tasks/${task?.id || ''}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {task?.title || 'Başlıksız Görev'}
          </Link>
          <div className="text-sm text-gray-500 mt-1">
            {task?.description && task.description.length > 50 
              ? `${task.description.substring(0, 50)}...` 
              : task?.description || 'Açıklama yok'
            }
          </div>
          {task?.orderNumber && (
            <div className="text-xs text-blue-600 mt-1">
              Sipariş: {task.orderNumber}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'assignee',
      header: 'Atanan',
      render: (task) => (
        <div>
          <div className="font-medium text-gray-900">{task?.assignee || 'Atanmamış'}</div>
          <div className="text-sm text-gray-500">{task?.assigneeEmail || '-'}</div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Kategori',
      render: (task) => getCategoryBadge(task?.category || 'other')
    },
    {
      key: 'status',
      header: 'Durum',
      render: (task) => (
        <div className="space-y-1">
          {getStatusBadge(isOverdue(task?.dueDate, task?.status) ? 'overdue' : (task?.status || 'pending'))}
          {getPriorityBadge(task?.priority || 'medium')}
        </div>
      )
    },
    {
      key: 'progress',
      header: 'İlerleme',
      render: (task) => (
        <div className="w-full">
          <div className="flex justify-between text-sm mb-1">
            <span>{task?.progress || 0}%</span>
            <span className="text-gray-500">
              {task?.actualHours ? `${task.actualHours}h` : `${task?.estimatedHours || 0}h`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                (task?.progress || 0) === 100 ? 'bg-green-500' :
                (task?.progress || 0) > 50 ? 'bg-blue-500' :
                (task?.progress || 0) > 0 ? 'bg-yellow-500' : 'bg-gray-300'
              }`}
              style={{ width: `${task?.progress || 0}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      key: 'dates',
      header: 'Tarihler',
      render: (task) => (
        <div className="text-sm">
          <div>Oluşturulma: {formatDate(task?.createdDate) || '-'}</div>
          <div className={`${
            isOverdue(task?.dueDate, task?.status) ? 'text-red-600 font-medium' : 'text-gray-500'
          }`}>
            Bitiş: {formatDate(task?.dueDate) || '-'}
          </div>
          {task?.completedDate && (
            <div className="text-green-600">
              Tamamlanma: {formatDate(task.completedDate)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (task) => (
        <div className="flex space-x-2">
          <Link to={`/tasks/${task?.id || ''}`}>
            <Button size="sm" variant="outline">
              Görüntüle
            </Button>
          </Link>
          {task?.status === 'pending' && (
            <Button 
              size="sm" 
              variant="primary"
              onClick={() => handleStatusChange(task?.id, 'in_progress')}
            >
              Başlat
            </Button>
          )}
          {task?.status === 'in_progress' && (
            <Button 
              size="sm" 
              variant="success"
              onClick={() => handleStatusChange(task?.id, 'completed')}
            >
              Tamamla
            </Button>
          )}
        </div>
      )
    }
  ];

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          const updatedTask = { ...task, status: newStatus };
          if (newStatus === 'completed') {
            updatedTask.completedDate = new Date().toISOString();
            updatedTask.progress = 100;
          } else if (newStatus === 'in_progress') {
            updatedTask.progress = Math.max(updatedTask.progress, 10);
          }
          return updatedTask;
        }
        return task;
      });
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tüm Durumlar' },
    { value: 'pending', label: 'Beklemede' },
    { value: 'in_progress', label: 'İşlemde' },
    { value: 'completed', label: 'Tamamlandı' },
    { value: 'overdue', label: 'Gecikmiş' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'Tüm Öncelikler' },
    { value: 'high', label: 'Yüksek' },
    { value: 'medium', label: 'Orta' },
    { value: 'low', label: 'Düşük' }
  ];

  const getStatusCounts = () => {
    return tasks.reduce((acc, task) => {
      const status = isOverdue(task.dueDate, task.status) ? 'overdue' : task.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Görevler yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Görev Yönetimi</h1>
            <p className="text-gray-600 mt-2">
              Toplam {tasks.length} görev bulundu
            </p>
          </div>
          <Link to="/tasks/create">
            <Button variant="primary">
              📋 Yeni Görev Oluştur
            </Button>
          </Link>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Beklemede</p>
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
                <p className="text-sm text-gray-600">İşlemde</p>
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
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gecikmiş</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.overdue || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arama
              </label>
              <Input
                type="text"
                placeholder="Görev adı, açıklama, atanan kişi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum Filtresi
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Öncelik Filtresi
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Tasks Table */}
        <Card>
          <Table
            data={filteredTasks}
            columns={columns}
            loading={loading}
            emptyMessage="Görev bulunamadı"
          />
        </Card>
    </div>
  );
};

export default TasksPage;