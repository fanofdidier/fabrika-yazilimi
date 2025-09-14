import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const TwoFactorManagement = ({ onStartSetup }) => {
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const [password, setPassword] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState([]);

  // 2FA durumunu kontrol et
  const check2FAStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/2fa/status');
      
      if (response.data.success) {
        setTwoFactorStatus(response.data);
      } else {
        setError('2FA durumu kontrol edilemedi');
      }
    } catch (error) {
      setError('2FA durumu kontrol edilemedi');
      console.error('2FA status check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2FA'yı devre dışı bırak
  const disable2FA = async () => {
    if (!password) {
      setError('Şifre gereklidir');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/2fa/disable', {
        password: password
      });
      
      if (response.data.success) {
        setSuccess('2FA başarıyla devre dışı bırakıldı');
        setShowDisableForm(false);
        setPassword('');
        check2FAStatus();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('2FA devre dışı bırakılamadı');
      console.error('2FA disable error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Backup kodları yenile
  const regenerateBackupCodes = async () => {
    if (!password) {
      setError('Şifre gereklidir');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/2fa/regenerate-backup-codes', {
        password: password
      });
      
      if (response.data.success) {
        setNewBackupCodes(response.data.backupCodes);
        setShowRegenerateForm(false);
        setPassword('');
        setSuccess('Backup kodları başarıyla yenilendi');
        check2FAStatus();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('Backup kodları yenilenemedi');
      console.error('Backup codes regenerate error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Backup kodları kopyala
  const copyBackupCodes = () => {
    const codesText = newBackupCodes.join('\n');
    navigator.clipboard.writeText(codesText).then(() => {
      setSuccess('Backup kodları panoya kopyalandı!');
    });
  };

  useEffect(() => {
    check2FAStatus();
  }, []);

  if (loading && !twoFactorStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          İki Faktörlü Kimlik Doğrulama
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          twoFactorStatus?.twoFactorEnabled 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {twoFactorStatus?.twoFactorEnabled ? 'Etkin' : 'Devre Dışı'}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Yeni Backup Kodları */}
      {newBackupCodes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 mb-2">Yeni Backup Kodları</h4>
          <p className="text-sm text-yellow-700 mb-3">
            Bu kodları güvenli bir yerde saklayın!
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm font-mono mb-3">
            {newBackupCodes.map((code, index) => (
              <div key={index} className="bg-white p-2 rounded border text-center">
                {code}
              </div>
            ))}
          </div>
          <button
            onClick={copyBackupCodes}
            className="bg-yellow-600 text-white py-1 px-3 rounded text-sm hover:bg-yellow-700"
          >
            Kodları Kopyala
          </button>
        </div>
      )}

      {twoFactorStatus?.twoFactorEnabled ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-medium">
                2FA hesabınızda etkin
              </p>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Hesabınız ek güvenlik katmanı ile korunuyor.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowRegenerateForm(true)}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Backup Kodları Yenile
            </button>
            <button
              onClick={() => setShowDisableForm(true)}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              2FA'yı Devre Dışı Bırak
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-gray-800 font-medium">
              2FA devre dışı
            </p>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Hesabınızı daha güvenli hale getirmek için 2FA'yı etkinleştirin.
          </p>
          <div className="mt-4">
            <button
              onClick={onStartSetup}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              2FA'yı Etkinleştir
            </button>
          </div>
        </div>
      )}

      {/* 2FA Devre Dışı Bırakma Formu */}
      {showDisableForm && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-3">2FA'yı Devre Dışı Bırak</h4>
          <p className="text-sm text-red-700 mb-4">
            Bu işlem hesabınızın güvenliğini azaltacaktır. Devam etmek için şifrenizi girin.
          </p>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={disable2FA}
              disabled={loading || !password}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Devre Dışı Bırakılıyor...' : 'Devre Dışı Bırak'}
            </button>
            <button
              onClick={() => {
                setShowDisableForm(false);
                setPassword('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Backup Kodları Yenileme Formu */}
      {showRegenerateForm && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-3">Backup Kodları Yenile</h4>
          <p className="text-sm text-blue-700 mb-4">
            Yeni backup kodları oluşturmak için şifrenizi girin. Eski kodlar geçersiz olacaktır.
          </p>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={regenerateBackupCodes}
              disabled={loading || !password}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Yenileniyor...' : 'Kodları Yenile'}
            </button>
            <button
              onClick={() => {
                setShowRegenerateForm(false);
                setPassword('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorManagement;
