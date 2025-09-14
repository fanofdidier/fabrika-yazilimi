import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TwoFactorVerification = ({ userId, onSuccess, onCancel }) => {
  const { verify2FA } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerification = async () => {
    if (!verificationCode || (useBackupCode ? verificationCode.length !== 8 : verificationCode.length !== 6)) {
      setError(useBackupCode ? 'Lütfen 8 karakterli backup kodunu girin' : 'Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const result = await verify2FA(userId, verificationCode);
      
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Doğrulama sırasında bir hata oluştu');
      console.error('2FA verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerification();
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          İki Faktörlü Doğrulama
        </h2>
        <p className="text-gray-600">
          {useBackupCode 
            ? 'Backup kodunuzu girin' 
            : 'Authenticator uygulamanızdan 6 haneli kodu girin'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {useBackupCode ? 'Backup Kod' : 'Doğrulama Kodu'}
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(useBackupCode ? e.target.value.toUpperCase().slice(0, 8) : e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyPress={handleKeyPress}
          placeholder={useBackupCode ? "ABCD1234" : "123456"}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
          maxLength={useBackupCode ? "8" : "6"}
          autoFocus
        />
      </div>

      <div className="mb-6">
        <button
          onClick={() => setUseBackupCode(!useBackupCode)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {useBackupCode 
            ? 'Authenticator kodu kullan' 
            : 'Backup kod kullan'
          }
        </button>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleVerification}
          disabled={loading || (useBackupCode ? verificationCode.length !== 8 : verificationCode.length !== 6)}
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

      {!useBackupCode && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Authenticator uygulamanızda kod görmüyor musunuz?
          </p>
          <p className="text-xs text-gray-500">
            Uygulamanızın saat ayarlarını kontrol edin.
          </p>
        </div>
      )}
    </div>
  );
};

export default TwoFactorVerification;
