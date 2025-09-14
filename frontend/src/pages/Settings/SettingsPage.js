import React, { useState } from 'react';
import { Card, Button, Form, Alert, Badge } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';
import TwoFactorManagement from '../../components/Auth/TwoFactorManagement';
import TwoFactorSetup from '../../components/Auth/TwoFactorSetup';

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showSuccess, setShowSuccess] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    notifications: {
      email: true,
      whatsapp: true,
      push: false
    },
    theme: 'light'
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 500);
  };

  const tabs = [
    { id: 'profile', label: 'Profil Bilgileri', icon: '👤' },
    { id: 'notifications', label: 'Bildirimler', icon: '🔔' },
    { id: 'security', label: 'Güvenlik', icon: '🔒' },
    { id: 'twofactor', label: '2FA Yönetimi', icon: '🔐' },
    { id: 'preferences', label: 'Tercihler', icon: '⚙️' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <Form.Group>
              <Form.Label required>Ad Soyad</Form.Label>
              <Form.Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Adınızı ve soyadınızı girin"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label required>E-posta</Form.Label>
              <Form.Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="E-posta adresinizi girin"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Telefon</Form.Label>
              <Form.Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Telefon numaranızı girin"
              />
            </Form.Group>

            <div className="flex items-center space-x-2">
              <Badge variant="success">Aktif</Badge>
              <span className="text-sm text-gray-600">Hesap durumu</span>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bildirim Tercihleri</h3>
              <div className="space-y-4">
                <Form.Group>
                  <div className="flex items-center justify-between">
                    <div>
                      <Form.Label className="mb-0">E-posta Bildirimleri</Form.Label>
                      <p className="text-sm text-gray-600">Önemli güncellemeler için e-posta alın</p>
                    </div>
                    <Form.Checkbox
                      name="notifications.email"
                      checked={formData.notifications.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </Form.Group>

                <Form.Group>
                  <div className="flex items-center justify-between">
                    <div>
                      <Form.Label className="mb-0">WhatsApp Bildirimleri</Form.Label>
                      <p className="text-sm text-gray-600">Acil durumlar için WhatsApp mesajı alın</p>
                    </div>
                    <Form.Checkbox
                      name="notifications.whatsapp"
                      checked={formData.notifications.whatsapp}
                      onChange={handleInputChange}
                    />
                  </div>
                </Form.Group>

                <Form.Group>
                  <div className="flex items-center justify-between">
                    <div>
                      <Form.Label className="mb-0">Push Bildirimleri</Form.Label>
                      <p className="text-sm text-gray-600">Tarayıcı bildirimleri alın</p>
                    </div>
                    <Form.Checkbox
                      name="notifications.push"
                      checked={formData.notifications.push}
                      onChange={handleInputChange}
                    />
                  </div>
                </Form.Group>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Şifre Değiştir</h3>
              <div className="space-y-4">
                <Form.Group>
                  <Form.Label required>Mevcut Şifre</Form.Label>
                  <Form.Input
                    type="password"
                    placeholder="Mevcut şifrenizi girin"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label required>Yeni Şifre</Form.Label>
                  <Form.Input
                    type="password"
                    placeholder="Yeni şifrenizi girin"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label required>Yeni Şifre (Tekrar)</Form.Label>
                  <Form.Input
                    type="password"
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Oturum Güvenliği</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Aktif Oturumlar</p>
                    <p className="text-sm text-gray-600">Tüm cihazlardaki oturumları yönetin</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Oturumları Görüntüle
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'twofactor':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">İki Faktörlü Kimlik Doğrulama</h3>
              <p className="text-sm text-gray-600 mb-6">
                Hesabınızı daha güvenli hale getirmek için 2FA'yı etkinleştirin.
              </p>
              <TwoFactorManagement onStartSetup={() => setShow2FASetup(true)} />
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <Form.Group>
              <Form.Label>Tema</Form.Label>
              <Form.Select
                name="theme"
                value={formData.theme}
                onChange={handleInputChange}
              >
                <option value="light">Açık Tema</option>
                <option value="dark">Koyu Tema</option>
                <option value="auto">Sistem Ayarı</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Dil</Form.Label>
              <Form.Select defaultValue="tr">
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Saat Dilimi</Form.Label>
              <Form.Select defaultValue="Europe/Istanbul">
                <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                <option value="Europe/London">Londra (UTC+0)</option>
                <option value="America/New_York">New York (UTC-5)</option>
              </Form.Select>
            </Form.Group>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600">Hesap ayarlarınızı ve tercihlerinizi yönetin</p>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <TwoFactorSetup 
              onComplete={() => {
                setShow2FASetup(false);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
              }}
              onCancel={() => setShow2FASetup(false)}
            />
          </div>
        </div>
      )}

      {/* Success Alert */}
      {showSuccess && (
        <Alert variant="success" dismissible onDismiss={() => setShowSuccess(false)}>
          Ayarlarınız başarıyla güncellendi!
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <Card.Body className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </Card.Body>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            <Card.Header>
              <Card.Title>
                {tabs.find(tab => tab.id === activeTab)?.label || 'Ayarlar'}
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleSubmit}>
                {renderTabContent()}
                
                <div className="flex justify-end pt-6 border-t">
                  <div className="space-x-3">
                    <Button type="button" variant="outline">
                      İptal
                    </Button>
                    <Button type="submit" variant="primary">
                      Kaydet
                    </Button>
                  </div>
                </div>
              </form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;