import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Alert, LoadingSpinner, Input } from '../../components/UI';


const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({});

  // Mock user data
  const mockUsers = {
    1: {
      id: 1,
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      email: 'ahmet.yilmaz@fabrika.com',
      phone: '+90 532 123 4567',
      role: 'admin',
      department: 'Yönetim',
      position: 'Fabrika Müdürü',
      status: 'active',
      lastLogin: '2024-01-15T10:30:00Z',
      createdAt: '2023-06-01T09:00:00Z',
      address: 'İstanbul, Türkiye',
      emergencyContact: '+90 532 987 6543',
      startDate: '2023-06-01',
      salary: '15000',
      notes: 'Fabrika müdürü olarak tüm operasyonlardan sorumlu.'
    },
    2: {
      id: 2,
      firstName: 'Fatma',
      lastName: 'Demir',
      email: 'fatma.demir@fabrika.com',
      phone: '+90 533 234 5678',
      role: 'manager',
      department: 'Üretim',
      position: 'Üretim Müdürü',
      status: 'active',
      lastLogin: '2024-01-15T08:45:00Z',
      createdAt: '2023-07-15T10:00:00Z',
      address: 'Ankara, Türkiye',
      emergencyContact: '+90 533 876 5432',
      startDate: '2023-07-15',
      salary: '12000',
      notes: 'Üretim süreçlerinin yönetiminden sorumlu.'
    },
    3: {
      id: 3,
      firstName: 'Mehmet',
      lastName: 'Kaya',
      email: 'mehmet.kaya@fabrika.com',
      phone: '+90 534 345 6789',
      role: 'employee',
      department: 'Üretim',
      position: 'Operatör',
      status: 'active',
      lastLogin: '2024-01-14T16:20:00Z',
      createdAt: '2023-08-01T11:00:00Z',
      address: 'İzmir, Türkiye',
      emergencyContact: '+90 534 765 4321',
      startDate: '2023-08-01',
      salary: '8000',
      notes: 'Deneyimli makine operatörü.'
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const userData = mockUsers[id];
        if (userData) {
          setUser(userData);
          setFormData(userData);
        } else {
          setMessage({ type: 'error', text: 'Kullanıcı bulunamadı.' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Kullanıcı bilgileri yüklenirken bir hata oluştu.' });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUser(formData);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Kullanıcı bilgileri başarıyla güncellendi.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Kullanıcı bilgileri güncellenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  const handleStatusToggle = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const updatedUser = { ...user, status: newStatus };
      setUser(updatedUser);
      setFormData(updatedUser);
      setMessage({ 
        type: 'success', 
        text: `Kullanıcı ${newStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'}.` 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Kullanıcı durumu güncellenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { variant: 'danger', label: 'Yönetici' },
      manager: { variant: 'warning', label: 'Müdür' },
      employee: { variant: 'primary', label: 'Çalışan' }
    };
    
    const config = roleConfig[role] || { variant: 'secondary', label: role };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    return (
      <Badge variant={status === 'active' ? 'success' : 'secondary'}>
        {status === 'active' ? 'Aktif' : 'Pasif'}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Kullanıcı bilgileri yükleniyor..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="error">
          Kullanıcı bulunamadı.
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate('/users')}>Kullanıcı Listesine Dön</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/users')}
              >
                Geri Dön
              </Button>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                >
                  Düzenle
                </Button>
              )}
            </div>
          </div>

          {/* Status and Role */}
          <div className="flex gap-3">
            {getRoleBadge(user.role)}
            {getStatusBadge(user.status)}
          </div>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <div className="mb-6">
            <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })}>
              {message.text}
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kişisel Bilgiler</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Ad"
                  name="firstName"
                  value={formData.firstName || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                <Input
                  label="Soyad"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              
              <Input
                label="E-posta"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Telefon"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Adres"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Acil Durum İletişim"
                name="emergencyContact"
                value={formData.emergencyContact || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </Card>

          {/* Work Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">İş Bilgileri</h2>
            <div className="space-y-4">
              <Input
                label="Departman"
                name="department"
                value={formData.department || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Pozisyon"
                name="position"
                value={formData.position || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    name="role"
                    value={formData.role || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  >
                    <option value="employee">Çalışan</option>
                    <option value="manager">Müdür</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>
                
                <Input
                  label="İşe Başlama Tarihi"
                  name="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              
              <Input
                label="Maaş"
                name="salary"
                value={formData.salary || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </Card>
        </div>

        {/* Notes */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notlar</h2>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
            placeholder="Kullanıcı hakkında notlar..."
          />
        </Card>

        {/* System Information */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sistem Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Kullanıcı ID:</span>
              <span className="ml-2 font-mono">{user.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Kayıt Tarihi:</span>
              <span className="ml-2">{formatDate(user.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-600">Son Giriş:</span>
              <span className="ml-2">{formatDate(user.lastLogin)}</span>
            </div>
            <div>
              <span className="text-gray-600">Durum:</span>
              <span className="ml-2">{getStatusBadge(user.status)}</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        {isEditing ? (
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSave}
              loading={loading}
              disabled={loading}
            >
              Kaydet
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              İptal
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 mt-6">
            <Button
              variant={user.status === 'active' ? 'danger' : 'success'}
              onClick={handleStatusToggle}
              loading={loading}
              disabled={loading}
            >
              {user.status === 'active' ? 'Pasifleştir' : 'Aktifleştir'}
            </Button>
          </div>
        )}
    </div>
  );
};

export default UserDetailPage;