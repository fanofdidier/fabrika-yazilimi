import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, Input, Alert } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';
import TwoFactorVerification from '../../components/Auth/TwoFactorVerification';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginStep, setLoginStep] = useState(1); // 1: Normal login, 2: 2FA
  const [userId, setUserId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

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
    setError('');

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        throw new Error('Lütfen tüm alanları doldurun');
      }

      // Call login function from AuthContext
      const result = await login({ 
        username: formData.email, // Backend username veya email kabul ediyor
        password: formData.password 
      });
      
      if (result.success) {
        if (result.requires2FA) {
          // 2FA gerekli
          setUserId(result.userId);
          setUserInfo(result.user);
          setLoginStep(2);
        } else {
          // Normal login tamamlandı
          navigate('/dashboard');
        }
      } else {
        throw new Error(result.error || 'Giriş yapılamadı');
      }
    } catch (error) {
      setError(error.message || 'Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = () => {
    navigate('/dashboard');
  };

  const handle2FACancel = () => {
    setLoginStep(1);
    setUserId(null);
    setUserInfo(null);
    setError('');
  };

  // 2FA doğrulama adımı
  if (loginStep === 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">FabrikaYazılımı</h1>
            <p className="text-sm text-gray-600">
              Hoş geldiniz, {userInfo?.firstName} {userInfo?.lastName}
            </p>
          </div>
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <TwoFactorVerification 
            userId={userId}
            onSuccess={handle2FASuccess}
            onCancel={handle2FACancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">FabrikaYazılımı</h1>
          <h2 className="text-2xl font-bold text-gray-900">Giriş Yap</h2>
          <p className="mt-2 text-sm text-gray-600">
            Hesabınıza giriş yaparak sistemi kullanmaya başlayın
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="danger">
                {error}
              </Alert>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Kullanıcı Adı veya E-posta
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin veya admin@fabrika.com"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Şifre
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Şifrenizi girin"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Beni hatırla
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Şifremi unuttum
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Hesapları</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm font-medium text-blue-800 mb-1">Yönetici Hesabı</p>
                <p className="text-xs text-blue-600">admin / admin123</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm font-medium text-green-800 mb-1">Mağaza Personeli</p>
                <p className="text-xs text-green-600">magaza1 / magaza123</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm font-medium text-yellow-800 mb-1">Fabrika İşçisi</p>
                <p className="text-xs text-yellow-600">fabrika1 / fabrika123</p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Kayıt olun
              </Link>
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2024 FabrikaYazılımı. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;