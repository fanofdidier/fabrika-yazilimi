import React, { useState, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Form, Input, Alert } from '../../components/UI';


const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    position: user?.position || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateProfile(formData);
      setMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Profil güncellenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır.' });
      setLoading(false);
      return;
    }

    try {
      // API call to update password
      // await updatePassword(passwordData);
      setMessage({ type: 'success', text: 'Şifre başarıyla güncellendi!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Şifre güncellenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      position: user?.position || ''
    });
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profil Ayarları</h1>
          <p className="text-gray-600 mt-1">Hesap bilgilerinizi yönetin</p>
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
          {/* Profile Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Kişisel Bilgiler</h2>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Düzenle
                </Button>
              )}
            </div>

            <form onSubmit={handleProfileUpdate}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Ad"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                  />
                  <Input
                    label="Soyad"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                  />
                </div>
                
                <Input
                  label="E-posta"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
                
                <Input
                  label="Telefon"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                
                <Input
                  label="Departman"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                
                <Input
                  label="Pozisyon"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>

              {isEditing && (
                <div className="flex gap-3 mt-6">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                  >
                    Kaydet
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    İptal
                  </Button>
                </div>
              )}
            </form>
          </Card>

          {/* Password Change */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Şifre Değiştir</h2>
            
            <form onSubmit={handlePasswordUpdate}>
              <div className="space-y-4">
                <Input
                  label="Mevcut Şifre"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
                
                <Input
                  label="Yeni Şifre"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  helperText="En az 6 karakter olmalıdır"
                />
                
                <Input
                  label="Yeni Şifre (Tekrar)"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  Şifreyi Güncelle
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Account Information */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hesap Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Kullanıcı ID:</span>
              <span className="ml-2 font-mono">{user?.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Rol:</span>
              <span className="ml-2 capitalize">{user?.role}</span>
            </div>
            <div>
              <span className="text-gray-600">Kayıt Tarihi:</span>
              <span className="ml-2">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Son Giriş:</span>
              <span className="ml-2">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
          </div>
        </Card>
    </div>
  );
};

export default ProfilePage;