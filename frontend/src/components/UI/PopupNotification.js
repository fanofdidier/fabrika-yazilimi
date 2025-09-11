import React, { useState, useEffect } from 'react';

// SVG Icons
const XIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BellIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828z" />
  </svg>
);

const MessageSquareIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DollarSignIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const FileTextIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PopupNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    console.log('🎭 PopupNotification useEffect triggered:', { notification, isVisible, isClosing });
    
    if (notification) {
      console.log('🎭 Setting popup visible:', notification);
      setIsVisible(true);
      setIsClosing(false);
      
      // Otomatik kapanma devre dışı - sadece manuel kapatma
      // Fabrika çalışanları pop-up'ı manuel olarak kapatabilir
    }
  }, [notification, onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const getTitle = () => {
    if (notification.type === 'new_order') {
      return 'SİPARİŞ GELDİ';
    }
    return 'CEVAP GELDİ';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'siparis_kabul_edildi':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'siparis_reddedildi':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case 'ek_bilgi_gerekli':
        return <InfoIcon className="w-6 h-6 text-blue-500" />;
      case 'teslim_tarihi_değişti':
        return <CalendarIcon className="w-6 h-6 text-orange-500" />;
      case 'fiyat_teklifi':
        return <DollarSignIcon className="w-6 h-6 text-yellow-500" />;
      case 'not':
        return <FileTextIcon className="w-6 h-6 text-purple-500" />;
      default:
        return <MessageSquareIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'siparis_kabul_edildi':
        return 'Sipariş Kabul Edildi';
      case 'siparis_reddedildi':
        return 'Sipariş Reddedildi';
      case 'ek_bilgi_gerekli':
        return 'Ek Bilgi Gerekli';
      case 'teslim_tarihi_değişti':
        return 'Teslim Tarihi Değişti';
      case 'fiyat_teklifi':
        return 'Fiyat Teklifi';
      case 'not':
        return 'Not';
      default:
        return 'Yeni Mesaj';
    }
  };

  console.log('🎭 PopupNotification render check:', { isVisible, isClosing, notification });
  
  if (!isVisible && !isClosing) {
    console.log('🎭 PopupNotification not rendering - not visible and not closing');
    return null;
  }

  // Progress bar artık gerekli değil - otomatik kapanma yok

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`} onClick={handleClose} />
      
      {/* Modal Popup */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-w-2xl w-full mx-4 transform hover:scale-105 transition-transform duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BellIcon className="w-8 h-8 text-white" />
              <h3 className="text-white font-bold text-xl">{getTitle()}</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex items-start space-x-6">
              {notification.timelineEntry && getStatusIcon(notification.timelineEntry.status)}
              {!notification.timelineEntry && <MessageSquareIcon className="w-10 h-10 text-gray-500" />}
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-800 leading-relaxed mb-4">{notification.message}</p>
                {notification.orderId && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-600 font-medium">Sipariş ID: {notification.orderId.substring(0, 8)}...</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 font-medium">
                    {notification.timestamp ? new Date(notification.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                  <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    Manuel kapatma gerekli
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Progress bar kaldırıldı, otomatik kapanma yok */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Bildirim aktif - Manuel kapatma gerekli</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PopupNotification;