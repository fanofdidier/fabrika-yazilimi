import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const TwoFactorSetup = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1); // 1: QR Code, 2: Verify, 3: Backup Codes
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 2FA kurulumunu başlat
  const start2FASetup = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/2fa/enable');
      
      if (response.data.success) {
        setQrCode(response.data.qrCode);
        setStep(2);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('2FA kurulumu başlatılamadı');
      console.error('2FA setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2FA doğrulama kodunu kontrol et
  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/2fa/verify', {
        token: verificationCode
      });
      
      if (response.data.success) {
        setBackupCodes(response.data.backupCodes);
        setStep(3);
        setSuccess('2FA başarıyla etkinleştirildi!');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('Doğrulama kodu geçersiz');
      console.error('2FA verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Backup kodları kopyala
  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText).then(() => {
      setSuccess('Backup kodları panoya kopyalandı!');
    });
  };

  // Kurulumu tamamla
  const completeSetup = () => {
    onComplete();
  };

  useEffect(() => {
    if (step === 1) {
      start2FASetup();
    }
  }, []);

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          İki Faktörlü Kimlik Doğrulama
        </h2>
        <p className="text-gray-600">
          Hesabınızı daha güvenli hale getirin
        </p>
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

      {/* Adım 1: QR Kod */}
      {step === 1 && (
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">2FA kurulumu hazırlanıyor...</p>
          </div>
        </div>
      )}

      {/* Adım 2: QR Kod ve Doğrulama */}
      {step === 2 && (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Authenticator Uygulaması Kurulumu
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-3">
                1. Google Authenticator, Authy veya benzeri bir uygulama indirin
              </p>
              <p className="text-sm text-gray-600 mb-3">
                2. Aşağıdaki QR kodu tarayın
              </p>
              
              {qrCode && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={qrCode} 
                    alt="2FA QR Code" 
                    className="border border-gray-300 rounded"
                  />
                </div>
              )}
              
              <p className="text-sm text-gray-600">
                3. Uygulamada görünen 6 haneli kodu aşağıya girin
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doğrulama Kodu
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
              maxLength="6"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={verify2FA}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula'}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Adım 3: Backup Kodları */}
      {step === 3 && (
        <div>
          <div className="text-center mb-6">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <h3 className="font-semibold">🎉 2FA Başarıyla Etkinleştirildi!</h3>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Backup Kodları
            </h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Önemli:</strong> Bu kodları güvenli bir yerde saklayın!
              </p>
              <p className="text-sm text-yellow-800">
                Telefonunuzu kaybederseniz bu kodlarla giriş yapabilirsiniz.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-white p-2 rounded border text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={copyBackupCodes}
              className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700"
            >
              Kodları Kopyala
            </button>
            <button
              onClick={completeSetup}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Tamamla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
