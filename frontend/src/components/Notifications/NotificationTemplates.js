import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import api from '../../services/api';

const NotificationTemplates = ({ isOpen, onClose, onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    search: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    category: 'general',
    subject: '',
    content: '',
    variables: [],
    isActive: true,
    description: ''
  });
  const [newVariable, setNewVariable] = useState({ name: '', description: '', defaultValue: '' });
  const [previewData, setPreviewData] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, filters]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const params = {
        ...filters,
        type: filters.type === 'all' ? undefined : filters.type,
        category: filters.category === 'all' ? undefined : filters.category
      };

      const response = await api.get('/notifications/templates', { params });
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Şablonlar yüklenirken hata:', error);
      toast.error('Şablonlar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Şablon adı ve içerik zorunludur');
      return;
    }

    try {
      await api.post('/notifications/templates', formData);
      toast.success('Şablon başarıyla oluşturuldu');
      setShowCreateModal(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Şablon oluşturulurken hata:', error);
      toast.error(error.response?.data?.message || 'Şablon oluşturulamadı');
    }
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Şablon adı ve içerik zorunludur');
      return;
    }

    try {
      await api.put(`/notifications/templates/${selectedTemplate._id}`, formData);
      toast.success('Şablon başarıyla güncellendi');
      setShowEditModal(false);
      setSelectedTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Şablon güncellenirken hata:', error);
      toast.error(error.response?.data?.message || 'Şablon güncellenemedi');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await api.delete(`/notifications/templates/${templateId}`);
      toast.success('Şablon başarıyla silindi');
      fetchTemplates();
    } catch (error) {
      console.error('Şablon silinirken hata:', error);
      toast.error('Şablon silinemedi');
    }
  };

  const handleDuplicateTemplate = async (template) => {
    try {
      const duplicatedTemplate = {
        ...template,
        name: `${template.name} (Kopya)`,
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined
      };
      
      await api.post('/notifications/templates', duplicatedTemplate);
      toast.success('Şablon başarıyla kopyalandı');
      fetchTemplates();
    } catch (error) {
      console.error('Şablon kopyalanırken hata:', error);
      toast.error('Şablon kopyalanamadı');
    }
  };

  const handleToggleActive = async (templateId, isActive) => {
    try {
      await api.patch(`/notifications/templates/${templateId}`, { isActive: !isActive });
      toast.success(`Şablon ${!isActive ? 'aktif' : 'pasif'} edildi`);
      fetchTemplates();
    } catch (error) {
      console.error('Şablon durumu değiştirilirken hata:', error);
      toast.error('Şablon durumu değiştirilemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      category: 'general',
      subject: '',
      content: '',
      variables: [],
      isActive: true,
      description: ''
    });
    setNewVariable({ name: '', description: '', defaultValue: '' });
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      category: template.category,
      subject: template.subject || '',
      content: template.content,
      variables: template.variables || [],
      isActive: template.isActive,
      description: template.description || ''
    });
    setShowEditModal(true);
  };

  const addVariable = () => {
    if (!newVariable.name.trim()) {
      toast.error('Değişken adı zorunludur');
      return;
    }

    if (formData.variables.some(v => v.name === newVariable.name)) {
      toast.error('Bu değişken zaten mevcut');
      return;
    }

    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, { ...newVariable }]
    }));
    setNewVariable({ name: '', description: '', defaultValue: '' });
  };

  const removeVariable = (index) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    
    // Initialize preview data with default values
    const initialPreviewData = {};
    template.variables?.forEach(variable => {
      initialPreviewData[variable.name] = variable.defaultValue || `{${variable.name}}`;
    });
    setPreviewData(initialPreviewData);
    setShowPreview(true);
  };

  const renderPreviewContent = () => {
    if (!selectedTemplate) return '';
    
    let content = selectedTemplate.content;
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value);
    });
    
    return content;
  };

  const renderPreviewSubject = () => {
    if (!selectedTemplate?.subject) return '';
    
    let subject = selectedTemplate.subject;
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      subject = subject.replace(regex, value);
    });
    
    return subject;
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

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      general: { color: 'bg-gray-100 text-gray-800', text: 'Genel' },
      order: { color: 'bg-blue-100 text-blue-800', text: 'Sipariş' },
      task: { color: 'bg-green-100 text-green-800', text: 'Görev' },
      user: { color: 'bg-purple-100 text-purple-800', text: 'Kullanıcı' },
      system: { color: 'bg-red-100 text-red-800', text: 'Sistem' },
      marketing: { color: 'bg-yellow-100 text-yellow-800', text: 'Pazarlama' }
    };

    const config = categoryConfig[category] || categoryConfig.general;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const filterOptions = {
    type: [
      { value: 'all', label: 'Tüm Türler' },
      { value: 'email', label: 'Email' },
      { value: 'whatsapp', label: 'WhatsApp' },
      { value: 'web', label: 'Web' },
      { value: 'sms', label: 'SMS' }
    ],
    category: [
      { value: 'all', label: 'Tüm Kategoriler' },
      { value: 'general', label: 'Genel' },
      { value: 'order', label: 'Sipariş' },
      { value: 'task', label: 'Görev' },
      { value: 'user', label: 'Kullanıcı' },
      { value: 'system', label: 'Sistem' },
      { value: 'marketing', label: 'Pazarlama' }
    ]
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !filters.search || 
      template.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      template.content.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Bildirim Şablonları
            </h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Yeni Şablon
              </button>
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
        </div>

        {/* Filters */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Şablon ara..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {Object.entries(filterOptions).map(([key, options]) => (
              <div key={key}>
                <select
                  value={filters[key]}
                  onChange={(e) => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
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
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">Şablon bulunamadı</p>
              <p className="text-sm">Yeni bir şablon oluşturun veya filtreleri değiştirin</p>
            </div>
          ) : (
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <div key={template._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getTypeIcon(template.type)}</span>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 truncate">{template.name}</h3>
                            <p className="text-xs text-gray-500 capitalize">{template.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleActive(template._id, template.isActive)}
                            className={`w-8 h-4 rounded-full transition-colors ${
                              template.isActive ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                              template.isActive ? 'translate-x-4' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        {getCategoryBadge(template.category)}
                      </div>
                      
                      {template.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500 mb-3">
                        <p className="truncate">{template.content}</p>
                      </div>
                      
                      {template.variables && template.variables.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Değişkenler:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((variable, index) => (
                              <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {variable.name}
                              </span>
                            ))}
                            {template.variables.length > 3 && (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{template.variables.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Oluşturulma: {new Date(template.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePreview(template)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Önizle
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="text-green-600 hover:text-green-800 text-xs"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(template)}
                            className="text-purple-600 hover:text-purple-800 text-xs"
                          >
                            Kopyala
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          {onSelectTemplate && (
                            <button
                              onClick={() => {
                                onSelectTemplate(template);
                                onClose();
                              }}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Seç
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTemplate(template._id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {showCreateModal ? 'Yeni Şablon Oluştur' : 'Şablon Düzenle'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedTemplate(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={showCreateModal ? handleCreateTemplate : handleUpdateTemplate} className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şablon Adı *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="web">Web</option>
                        <option value="sms">SMS</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="general">Genel</option>
                        <option value="order">Sipariş</option>
                        <option value="task">Görev</option>
                        <option value="user">Kullanıcı</option>
                        <option value="system">Sistem</option>
                        <option value="marketing">Pazarlama</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Şablon açıklaması..."
                    />
                  </div>
                  
                  {(formData.type === 'email' || formData.type === 'web') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Bildirim konusu..."
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Aktif
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İçerik *</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Şablon içeriği... Değişkenler için {{değişken_adı}} formatını kullanın."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Değişkenler</label>
                    
                    {/* Add Variable */}
                    <div className="border border-gray-200 rounded-md p-3 mb-3">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <input
                          type="text"
                          value={newVariable.name}
                          onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Değişken adı"
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={newVariable.description}
                          onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Açıklama"
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={newVariable.defaultValue}
                          onChange={(e) => setNewVariable(prev => ({ ...prev, defaultValue: e.target.value }))}
                          placeholder="Varsayılan değer"
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addVariable}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Ekle
                      </button>
                    </div>
                    
                    {/* Variables List */}
                    {formData.variables.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {formData.variables.map((variable, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex-1">
                              <span className="font-medium text-sm">{`{${variable.name}}`}</span>
                              {variable.description && (
                                <span className="text-xs text-gray-500 ml-2">- {variable.description}</span>
                              )}
                              {variable.defaultValue && (
                                <span className="text-xs text-blue-600 ml-2">(Varsayılan: {variable.defaultValue})</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVariable(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Sil
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedTemplate(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {showCreateModal ? 'Oluştur' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Şablon Önizleme: {selectedTemplate.name}</h3>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setSelectedTemplate(null);
                    setPreviewData({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Variable Inputs */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Değişken Değerleri</h4>
                  {selectedTemplate.variables && selectedTemplate.variables.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTemplate.variables.map((variable, index) => (
                        <div key={index}>
                          <label className="block text-sm text-gray-600 mb-1">
                            {variable.name}
                            {variable.description && (
                              <span className="text-xs text-gray-500 ml-1">- {variable.description}</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={previewData[variable.name] || ''}
                            onChange={(e) => setPreviewData(prev => ({ ...prev, [variable.name]: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={variable.defaultValue || `{${variable.name}}`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Bu şablonda değişken bulunmuyor.</p>
                  )}
                </div>
                
                {/* Preview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Önizleme</h4>
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    {selectedTemplate.subject && (
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">KONU:</label>
                        <div className="text-sm font-medium text-gray-900">{renderPreviewSubject()}</div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">İÇERİK:</label>
                      <div className="text-sm text-gray-900 whitespace-pre-wrap">{renderPreviewContent()}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {onSelectTemplate && (
                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      onSelectTemplate(selectedTemplate);
                      setShowPreview(false);
                      onClose();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Bu Şablonu Kullan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTemplates;