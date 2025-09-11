import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Textarea, Select, Alert } from '../../components/UI';


const CreateTaskPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    assignedTo: '',
    dueDate: '',
    category: '',
    tags: ''
  });

  const priorityOptions = [
    { value: 'low', label: 'Düşük' },
    { value: 'medium', label: 'Orta' },
    { value: 'high', label: 'Yüksek' },
    { value: 'urgent', label: 'Acil' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Beklemede' },
    { value: 'in_progress', label: 'Devam Ediyor' },
    { value: 'completed', label: 'Tamamlandı' },
    { value: 'cancelled', label: 'İptal Edildi' }
  ];

  const categoryOptions = [
    { value: 'production', label: 'Üretim' },
    { value: 'quality', label: 'Kalite Kontrol' },
    { value: 'maintenance', label: 'Bakım' },
    { value: 'logistics', label: 'Lojistik' },
    { value: 'administration', label: 'Yönetim' },
    { value: 'other', label: 'Diğer' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // API call to create task
      const taskData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Görev başarıyla oluşturuldu!' });
      
      // Redirect to tasks page after success
      setTimeout(() => {
        navigate('/tasks');
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Görev oluşturulurken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/tasks');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Yeni Görev Oluştur</h1>
          <p className="text-gray-600 mt-1">Yeni bir görev tanımlayın ve atayın</p>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <div className="mb-6">
            <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })}>
              {message.text}
            </Alert>
          </div>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Temel Bilgiler</h3>
                <div className="space-y-4">
                  <Input
                    label="Görev Başlığı"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Görev başlığını girin"
                  />
                  
                  <Textarea
                    label="Açıklama"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Görev detaylarını açıklayın"
                  />
                  
                  <Input
                    label="Kategori"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="Görev kategorisi"
                  />
                </div>
              </div>

              {/* Task Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Görev Detayları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Öncelik
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durum
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Input
                    label="Atanan Kişi"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    placeholder="Kullanıcı ID veya e-posta"
                  />
                  
                  <Input
                    label="Bitiş Tarihi"
                    name="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ek Bilgiler</h3>
                <Input
                  label="Etiketler"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="Etiketleri virgülle ayırın (örn: üretim, kalite, acil)"
                  helperText="Görevleri kategorize etmek için etiketler ekleyin"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                loading={loading}
                disabled={loading || !formData.title}
                className="flex-1 md:flex-none"
              >
                Görevi Oluştur
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 md:flex-none"
              >
                İptal
              </Button>
            </div>
          </form>
        </Card>
    </div>
  );
};

export default CreateTaskPage;