import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Badge, LoadingSpinner, Input } from '../../components/UI';


const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [progressUpdate, setProgressUpdate] = useState('');
  const [timeLog, setTimeLog] = useState('');

  // Mock task data
  const mockTask = {
    id: parseInt(id),
    title: 'Malzeme Hazırlığı',
    description: 'ORD-2024-001 siparişi için çelik malzeme hazırlığı. Kalite standartlarına uygun malzeme seçimi ve hazırlık işlemleri.',
    assignee: 'Ali Çelik',
    assigneeEmail: 'ali.celik@fabrika.com',
    assigneePhone: '+90 532 123 4567',
    status: 'in_progress',
    priority: 'high',
    category: 'material',
    createdDate: '2024-01-15T10:30:00Z',
    dueDate: '2024-01-18T17:00:00Z',
    completedDate: null,
    orderId: 1,
    orderNumber: 'ORD-2024-001',
    estimatedHours: 4,
    actualHours: 2.5,
    progress: 60,
    createdBy: 'Mehmet Yönetici',
    requirements: [
      'Çelik malzeme kalite sertifikası kontrolü',
      'Boyut ve ağırlık ölçümlerinin yapılması',
      'Depo alanında uygun şekilde yerleştirilmesi',
      'Üretim takımına bilgi verilmesi'
    ],
    attachments: [
      {
        id: 1,
        name: 'malzeme_listesi.pdf',
        size: '245 KB',
        uploadDate: '2024-01-15T11:00:00Z',
        uploadedBy: 'Mehmet Yönetici'
      },
      {
        id: 2,
        name: 'kalite_sertifikasi.pdf',
        size: '1.2 MB',
        uploadDate: '2024-01-15T14:30:00Z',
        uploadedBy: 'Ali Çelik'
      }
    ],
    comments: [
      {
        id: 1,
        author: 'Ali Çelik',
        content: 'Malzeme deposundan çelik levhalar alındı. Kalite kontrol başlatıldı.',
        timestamp: '2024-01-16T09:15:00Z'
      },
      {
        id: 2,
        author: 'Mehmet Yönetici',
        content: 'Harika! Kalite kontrol sonuçlarını bekliyoruz.',
        timestamp: '2024-01-16T10:30:00Z'
      }
    ],
    timeline: [
      {
        id: 1,
        action: 'created',
        title: 'Görev Oluşturuldu',
        description: 'Görev sisteme kaydedildi ve Ali Çelik\'e atandı',
        timestamp: '2024-01-15T10:30:00Z',
        user: 'Mehmet Yönetici'
      },
      {
        id: 2,
        action: 'started',
        title: 'Göreve Başlandı',
        description: 'Ali Çelik göreve başladı',
        timestamp: '2024-01-16T08:00:00Z',
        user: 'Ali Çelik'
      },
      {
        id: 3,
        action: 'progress_update',
        title: 'İlerleme Güncellendi',
        description: 'İlerleme %60 olarak güncellendi',
        timestamp: '2024-01-16T14:00:00Z',
        user: 'Ali Çelik'
      }
    ],
    subtasks: [
      {
        id: 1,
        title: 'Malzeme listesi kontrolü',
        completed: true,
        completedDate: '2024-01-16T09:00:00Z'
      },
      {
        id: 2,
        title: 'Kalite sertifikası incelemesi',
        completed: true,
        completedDate: '2024-01-16T11:30:00Z'
      },
      {
        id: 3,
        title: 'Boyut ölçümlerinin yapılması',
        completed: false,
        completedDate: null
      },
      {
        id: 4,
        title: 'Depo yerleşimi',
        completed: false,
        completedDate: null
      }
    ]
  };

  useEffect(() => {
    const loadTask = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTask(mockTask);
        setEditForm(mockTask);
        setProgressUpdate(mockTask.progress.toString());
      } catch (error) {
        console.error('Task loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [id]);

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
    return <Badge variant={config.variant}>{config.text}</Badge>;
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
      <Badge variant={config.variant}>
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

  const handleSave = async () => {
    try {
      setTask(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const updatedTask = { ...task, status: newStatus };
      if (newStatus === 'completed') {
        updatedTask.completedDate = new Date().toISOString();
        updatedTask.progress = 100;
      }
      setTask(updatedTask);
      
      // Add to timeline
      const newTimelineEntry = {
        id: task.timeline.length + 1,
        action: newStatus,
        title: `Durum ${newStatus} olarak güncellendi`,
        description: `Görev durumu ${newStatus} olarak değiştirildi`,
        timestamp: new Date().toISOString(),
        user: 'Mevcut Kullanıcı'
      };
      updatedTask.timeline.push(newTimelineEntry);
      setTask(updatedTask);
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const handleProgressUpdate = async () => {
    try {
      const newProgress = parseInt(progressUpdate);
      if (newProgress >= 0 && newProgress <= 100) {
        const updatedTask = { ...task, progress: newProgress };
        setTask(updatedTask);
        
        // Add to timeline
        const newTimelineEntry = {
          id: task.timeline.length + 1,
          action: 'progress_update',
          title: 'İlerleme Güncellendi',
          description: `İlerleme %${newProgress} olarak güncellendi`,
          timestamp: new Date().toISOString(),
          user: 'Mevcut Kullanıcı'
        };
        updatedTask.timeline.push(newTimelineEntry);
        setTask(updatedTask);
      }
    } catch (error) {
      console.error('Progress update error:', error);
    }
  };

  const handleTimeLog = async () => {
    try {
      const hours = parseFloat(timeLog);
      if (hours > 0) {
        const updatedTask = { 
          ...task, 
          actualHours: (task.actualHours || 0) + hours 
        };
        setTask(updatedTask);
        setTimeLog('');
        
        // Add to timeline
        const newTimelineEntry = {
          id: task.timeline.length + 1,
          action: 'time_log',
          title: 'Zaman Kaydı Eklendi',
          description: `${hours} saat çalışma süresi eklendi`,
          timestamp: new Date().toISOString(),
          user: 'Mevcut Kullanıcı'
        };
        updatedTask.timeline.push(newTimelineEntry);
        setTask(updatedTask);
      }
    } catch (error) {
      console.error('Time log error:', error);
    }
  };

  const toggleSubtask = (subtaskId) => {
    const updatedTask = {
      ...task,
      subtasks: task.subtasks.map(subtask => {
        if (subtask.id === subtaskId) {
          return {
            ...subtask,
            completed: !subtask.completed,
            completedDate: !subtask.completed ? new Date().toISOString() : null
          };
        }
        return subtask;
      })
    };
    
    // Update overall progress based on completed subtasks
    const completedSubtasks = updatedTask.subtasks.filter(st => st.completed).length;
    const totalSubtasks = updatedTask.subtasks.length;
    const newProgress = Math.round((completedSubtasks / totalSubtasks) * 100);
    updatedTask.progress = newProgress;
    
    setTask(updatedTask);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Görev detayları yükleniyor..." />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Görev Bulunamadı</h2>
        <p className="text-gray-600 mb-6">Aradığınız görev mevcut değil.</p>
        <Link to="/tasks">
          <Button variant="primary">Görevlere Dön</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              {getStatusBadge(isOverdue(task.dueDate, task.status) ? 'overdue' : task.status)}
              {getPriorityBadge(task.priority)}
              {getCategoryBadge(task.category)}
            </div>
            <p className="text-gray-600">
              Oluşturulma: {formatDate(task.createdDate)} | Bitiş: {formatDate(task.dueDate)}
            </p>
            {task.orderNumber && (
              <p className="text-blue-600">
                İlgili Sipariş: 
                <Link to={`/orders/${task.orderId}`} className="ml-1 hover:underline">
                  {task.orderNumber}
                </Link>
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <Link to="/tasks">
              <Button variant="outline">
                ← Geri Dön
              </Button>
            </Link>
            {!isEditing ? (
              <Button 
                variant="primary" 
                onClick={() => setIsEditing(true)}
              >
                Düzenle
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(task);
                  }}
                >
                  İptal
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  Kaydet
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Görev Bilgileri</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  {isEditing ? (
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    />
                  ) : (
                    <p className="text-gray-900">{task.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tahmini Süre
                    </label>
                    <p className="text-gray-900">{task.estimatedHours} saat</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gerçekleşen Süre
                    </label>
                    <p className="text-gray-900">{task.actualHours || 0} saat</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Oluşturan
                    </label>
                    <p className="text-gray-900">{task.createdBy}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İlerleme
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            task.progress === 100 ? 'bg-green-500' :
                            task.progress > 50 ? 'bg-blue-500' :
                            task.progress > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{task.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Requirements */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Gereksinimler</h2>
              <ul className="space-y-2">
                {task.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-900">{requirement}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Subtasks */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Alt Görevler</h2>
              <div className="space-y-3">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(subtask.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <span className={`${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {subtask.title}
                      </span>
                      {subtask.completed && subtask.completedDate && (
                        <div className="text-sm text-green-600">
                          Tamamlandı: {formatDateTime(subtask.completedDate)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Attachments */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Ekler</h2>
              <div className="space-y-3">
                {task.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="font-medium text-gray-900">{attachment.name}</p>
                        <p className="text-sm text-gray-500">
                          {attachment.size} • {attachment.uploadedBy} • {formatDate(attachment.uploadDate)}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      İndir
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  + Dosya Ekle
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignee Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Atanan Kişi</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">{task.assignee}</p>
                  <p className="text-sm text-gray-600">{task.assigneeEmail}</p>
                  <p className="text-sm text-gray-600">{task.assigneePhone}</p>
                </div>
              </div>
            </Card>

            {/* Status Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Durum İşlemleri</h3>
              <div className="space-y-3">
                {task.status === 'pending' && (
                  <Button 
                    className="w-full" 
                    variant="primary"
                    onClick={() => handleStatusChange('in_progress')}
                  >
                    Göreve Başla
                  </Button>
                )}
                {task.status === 'in_progress' && (
                  <Button 
                    className="w-full" 
                    variant="success"
                    onClick={() => handleStatusChange('completed')}
                  >
                    Tamamla
                  </Button>
                )}
                {task.status !== 'cancelled' && task.status !== 'completed' && (
                  <Button 
                    className="w-full" 
                    variant="danger"
                    onClick={() => handleStatusChange('cancelled')}
                  >
                    İptal Et
                  </Button>
                )}
              </div>
            </Card>

            {/* Progress Update */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İlerleme Güncelle</h3>
              <div className="space-y-3">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={progressUpdate}
                  onChange={(e) => setProgressUpdate(e.target.value)}
                  placeholder="İlerleme yüzdesi"
                />
                <Button 
                  className="w-full" 
                  variant="primary"
                  onClick={handleProgressUpdate}
                >
                  İlerlemeyi Güncelle
                </Button>
              </div>
            </Card>

            {/* Time Logging */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Zaman Kaydı</h3>
              <div className="space-y-3">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={timeLog}
                  onChange={(e) => setTimeLog(e.target.value)}
                  placeholder="Çalışılan saat"
                />
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleTimeLog}
                >
                  Zaman Ekle
                </Button>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Görev Geçmişi</h3>
              <div className="space-y-4">
                {task.timeline.map((entry, index) => (
                  <div key={entry.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {entry.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(entry.timestamp)} - {entry.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
    </div>
  );
};

export default TaskDetailPage;