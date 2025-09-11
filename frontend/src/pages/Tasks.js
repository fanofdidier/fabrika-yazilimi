import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import api from '../services/api';

const Tasks = () => {
  const { user, hasPermission } = useAuth();
  const { socket } = useSocket();
  
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    search: '',
    dateRange: 'all'
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'normal',
    dueDate: '',
    estimatedHours: '',
    category: '',
    tags: '',
    relatedOrder: ''
  });
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [taskComments, setTaskComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters, sortBy, sortOrder]);

  useEffect(() => {
    if (socket) {
      socket.on('taskCreated', handleTaskCreated);
      socket.on('taskUpdated', handleTaskUpdated);
      socket.on('taskDeleted', handleTaskDeleted);
      socket.on('taskCommentAdded', handleTaskCommentAdded);
      
      return () => {
        socket.off('taskCreated', handleTaskCreated);
        socket.off('taskUpdated', handleTaskUpdated);
        socket.off('taskDeleted', handleTaskDeleted);
        socket.off('taskCommentAdded', handleTaskCommentAdded);
      };
    }
  }, [socket]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Görevler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchTaskComments = async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}/comments`);
      setTaskComments(response.data);
    } catch (error) {
      console.error('Error fetching task comments:', error);
    }
  };

  const handleTaskCreated = (task) => {
    setTasks(prev => [task, ...prev]);
    toast.success('Yeni görev eklendi');
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prev => prev.map(task => 
      task._id === updatedTask._id ? updatedTask : task
    ));
    if (selectedTask && selectedTask._id === updatedTask._id) {
      setSelectedTask(updatedTask);
    }
    toast.success('Görev güncellendi');
  };

  const handleTaskDeleted = (taskId) => {
    setTasks(prev => prev.filter(task => task._id !== taskId));
    if (selectedTask && selectedTask._id === taskId) {
      setSelectedTask(null);
      setShowDetailsModal(false);
    }
    toast.success('Görev silindi');
  };

  const handleTaskCommentAdded = (comment) => {
    if (selectedTask && comment.taskId === selectedTask._id) {
      setTaskComments(prev => [...prev, comment]);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Assignee filter
    if (filters.assignee !== 'all') {
      if (filters.assignee === 'me') {
        filtered = filtered.filter(task => task.assignedTo?._id === user._id);
      } else {
        filtered = filtered.filter(task => task.assignedTo?._id === filters.assignee);
      }
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.category?.toLowerCase().includes(searchTerm) ||
        task.tags?.toLowerCase().includes(searchTerm)
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
        filtered = filtered.filter(task => new Date(task.createdAt) >= filterDate);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'dueDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === 'assignedTo') {
        aValue = a.assignedTo?.name || '';
        bValue = b.assignedTo?.name || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTasks(filtered);
    setCurrentPage(1);
  };

  const validateTaskForm = () => {
    const newErrors = {};
    
    if (!newTask.title.trim()) {
      newErrors.title = 'Görev başlığı gereklidir';
    }
    
    if (!newTask.description.trim()) {
      newErrors.description = 'Görev açıklaması gereklidir';
    }
    
    if (!newTask.assignedTo) {
      newErrors.assignedTo = 'Görev atanacak kişi seçilmelidir';
    }
    
    if (!newTask.dueDate) {
      newErrors.dueDate = 'Bitiş tarihi gereklidir';
    } else if (new Date(newTask.dueDate) < new Date()) {
      newErrors.dueDate = 'Bitiş tarihi bugünden sonra olmalıdır';
    }
    
    if (newTask.estimatedHours && (newTask.estimatedHours < 0 || newTask.estimatedHours > 1000)) {
      newErrors.estimatedHours = 'Geçerli bir tahmini süre giriniz (0-1000 saat)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!validateTaskForm()) {
      return;
    }
    
    setIsCreating(true);
    setErrors({});
    
    try {
      const taskData = {
        ...newTask,
        tags: newTask.tags ? newTask.tags.split(',').map(tag => tag.trim()) : [],
        estimatedHours: newTask.estimatedHours ? parseFloat(newTask.estimatedHours) : null
      };
      
      await api.post('/tasks', taskData);
      
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'normal',
        dueDate: '',
        estimatedHours: '',
        category: '',
        tags: '',
        relatedOrder: ''
      });
      
      setShowCreateModal(false);
      toast.success('Görev başarıyla oluşturuldu!');
    } catch (error) {
      console.error('Error creating task:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          setErrors({ general: errorData.message || 'Geçersiz veri' });
        }
      } else {
        setErrors({ general: 'Görev oluşturulurken bir hata oluştu' });
      }
      
      toast.error('Görev oluşturulamadı');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      toast.success('Görev durumu güncellendi');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Görev durumu güncellenemedi');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Görev silindi');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Görev silinemedi');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }
    
    setIsAddingComment(true);
    
    try {
      await api.post(`/tasks/${selectedTask._id}/comments`, {
        content: newComment
      });
      
      setNewComment('');
      toast.success('Yorum eklendi');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Yorum eklenemedi');
    } finally {
      setIsAddingComment(false);
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

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'todo': return 'Yapılacak';
      case 'in_progress': return 'Devam Ediyor';
      case 'review': return 'İncelemede';
      case 'completed': return 'Tamamlandı';
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

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = (task) => {
    switch (task.status) {
      case 'todo': return 0;
      case 'in_progress': return 50;
      case 'review': return 80;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  // Pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

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
          <h1 className="text-2xl font-bold text-gray-900">Görev Yönetimi</h1>
          <p className="text-gray-600">Tüm görevleri görüntüleyin ve yönetin</p>
        </div>
        {hasPermission('tasks:create') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Yeni Görev
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arama
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Başlık, açıklama, kategori..."
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
              <option value="todo">Yapılacak</option>
              <option value="in_progress">Devam Ediyor</option>
              <option value="review">İncelemede</option>
              <option value="completed">Tamamlandı</option>
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

          {/* Assignee Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atanan Kişi
            </label>
            <select
              value={filters.assignee}
              onChange={(e) => handleFilterChange('assignee', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">Tümü</option>
              <option value="me">Bana Atananlar</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
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

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('title')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Görev</span>
                    {sortBy === 'title' && (
                      <svg className={`w-4 h-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('assignedTo')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Atanan</span>
                    {sortBy === 'assignedTo' && (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İlerleme
                </th>
                <th 
                  onClick={() => handleSort('dueDate')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Bitiş Tarihi</span>
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
              {currentTasks.map((task) => (
                <tr key={task._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                      {task.category && (
                        <div className="text-xs text-gray-400 mt-1">{task.category}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {task.assignedTo?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {task.assignedTo?.name || 'Atanmamış'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityText(task.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(task)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getProgressPercentage(task)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className={`${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-600 font-medium' : ''}`}>
                      {formatDate(task.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowDetailsModal(true);
                          fetchTaskComments(task._id);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Detay
                      </button>
                      {(hasPermission('tasks:update') || task.assignedTo?._id === user._id) && (
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="todo">Yapılacak</option>
                          <option value="in_progress">Devam Ediyor</option>
                          <option value="review">İncelemede</option>
                          <option value="completed">Tamamlandı</option>
                          <option value="cancelled">İptal Edildi</option>
                        </select>
                      )}
                      {hasPermission('tasks:delete') && (
                        <button
                          onClick={() => handleDeleteTask(task._id)}
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
                  <span className="font-medium">{indexOfFirstTask + 1}</span>
                  {' - '}
                  <span className="font-medium">{Math.min(indexOfLastTask, filteredTasks.length)}</span>
                  {' / '}
                  <span className="font-medium">{filteredTasks.length}</span>
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

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Yeni Görev Oluştur</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Görev Başlığı *</label>
                  <input
                    type="text"
                    name="title"
                    value={newTask.title}
                    onChange={handleTaskChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Atanan Kişi *</label>
                  <select
                    name="assignedTo"
                    value={newTask.assignedTo}
                    onChange={handleTaskChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.assignedTo ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seçiniz</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                  {errors.assignedTo && (
                    <p className="mt-1 text-sm text-red-600">{errors.assignedTo}</p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Öncelik</label>
                  <select
                    name="priority"
                    value={newTask.priority}
                    onChange={handleTaskChange}
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
                  <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi *</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={newTask.dueDate}
                    onChange={handleTaskChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.dueDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                  )}
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tahmini Süre (Saat)</label>
                  <input
                    type="number"
                    name="estimatedHours"
                    min="0"
                    max="1000"
                    step="0.5"
                    value={newTask.estimatedHours}
                    onChange={handleTaskChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.estimatedHours ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.estimatedHours && (
                    <p className="mt-1 text-sm text-red-600">{errors.estimatedHours}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori</label>
                  <input
                    type="text"
                    name="category"
                    value={newTask.category}
                    onChange={handleTaskChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Örn: Üretim, Kalite Kontrol, Paketleme"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etiketler</label>
                  <input
                    type="text"
                    name="tags"
                    value={newTask.tags}
                    onChange={handleTaskChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Virgülle ayırın: acil, önemli, test"
                  />
                </div>

                {/* Related Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">İlgili Sipariş</label>
                  <select
                    name="relatedOrder"
                    value={newTask.relatedOrder}
                    onChange={handleTaskChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Seçiniz</option>
                    {orders.map(order => (
                      <option key={order._id} value={order._id}>
                        {order.orderNumber} - {order.customerName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Açıklama *</label>
                <textarea
                  name="description"
                  rows={4}
                  value={newTask.description}
                  onChange={handleTaskChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Görevin detaylı açıklaması..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
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
                  Görev Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showDetailsModal && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Görev Detayları - {selectedTask.title}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Görev Bilgileri</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Başlık</dt>
                        <dd className="text-sm text-gray-900">{selectedTask.title}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Atanan Kişi</dt>
                        <dd className="text-sm text-gray-900">{selectedTask.assignedTo?.name || 'Atanmamış'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Durum</dt>
                        <dd>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                            {getStatusText(selectedTask.status)}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Öncelik</dt>
                        <dd>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                            {getPriorityText(selectedTask.priority)}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
                        <dd className="text-sm text-gray-900">{formatDate(selectedTask.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Bitiş Tarihi</dt>
                        <dd className="text-sm text-gray-900">{formatDate(selectedTask.dueDate)}</dd>
                      </div>
                      {selectedTask.estimatedHours && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Tahmini Süre</dt>
                          <dd className="text-sm text-gray-900">{selectedTask.estimatedHours} saat</dd>
                        </div>
                      )}
                      {selectedTask.category && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Kategori</dt>
                          <dd className="text-sm text-gray-900">{selectedTask.category}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Açıklama</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTask.description}</p>
                  </div>
                </div>

                {/* Tags */}
                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Etiketler</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Yorumlar</h4>
                
                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Yorum ekleyin..."
                  />
                  <button
                    type="submit"
                    disabled={isAddingComment || !newComment.trim()}
                    className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingComment ? (
                      <LoadingSpinner size="sm" className="text-white mr-2" />
                    ) : null}
                    Yorum Ekle
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {taskComments.map((comment) => (
                    <div key={comment._id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-xs">
                              {comment.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {comment.author?.name || 'Bilinmeyen Kullanıcı'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                  {taskComments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Henüz yorum yok</p>
                  )}
                </div>
              </div>
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

export default Tasks;