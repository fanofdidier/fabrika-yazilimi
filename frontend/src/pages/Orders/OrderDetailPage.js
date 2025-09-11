import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Input, LoadingSpinner } from '../../components/UI';
import VoiceRecorder from '../../components/UI/VoiceRecorder';
import VoicePlayer from '../../components/UI/VoicePlayer';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { fetchNotifications } = useNotification();
  const { socket, connected } = useSocket();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [responseStatus, setResponseStatus] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  
  // Ses kaydı state'leri
  const [voiceRecording, setVoiceRecording] = useState(null);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);

  const canEdit = user && (user.role === 'admin' || user.role === 'manager');

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status label helper
  const getStatusLabel = (status) => {
    const statusLabels = {
      'siparis_kabul_edildi': '✅ Sipariş Kabul Edildi',
      'siparis_reddedildi': '❌ Sipariş Reddedildi',
      'ek_bilgi_gerekli': 'ℹ️ Ek Bilgi Gerekli',
      'teslim_tarihi_değişti': '📅 Teslim Tarihi Değişti',
      'fiyat_teklifi': '💰 Fiyat Teklifi'
    };
    return statusLabels[status] || status;
  };

    const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      const apiOrder = response.data.data.order;
      
          const orderData = {
        ...apiOrder,
        timeline: apiOrder.timeline || [
              {
                id: 1,
            type: 'created',
                description: 'Sipariş sisteme kaydedildi',
            timestamp: apiOrder.createdAt,
            user: apiOrder.createdBy ?
              `${apiOrder.createdBy.firstName || ''} ${apiOrder.createdBy.lastName || ''}`.trim() ||
              apiOrder.createdBy.username : 'Sistem'
          }
        ],
        responses: apiOrder.responses || []
      };
      
          setOrder(orderData);
          setEditForm(orderData);
        
      // Debug: Timeline verilerini kontrol et
      console.log('🎤 Order timeline data:', orderData.timeline);
      const voiceEntries = orderData.timeline.filter(entry => entry.voiceRecording);
      console.log('🎤 Timeline entries with voice recording:', voiceEntries);
      } catch (error) {
      console.error('Order load error:', error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadOrder();
  }, [id]);

  // Socket.io real-time güncellemeleri
  useEffect(() => {
    console.log('Socket useEffect çalıştı:', { 
      socket: !!socket, 
      connected, 
      id,
      socketId: socket?.id,
      socketConnected: socket?.connected
    });
    
    // Socket varsa event listener'ları ekle
    if (socket) {
      console.log('Socket event listener\'ları ekleniyor...');
      
      // Sipariş güncellemelerini dinle
      const handleOrderUpdated = (data) => {
        console.log('🔔 orderUpdated event alındı:', data);
        console.log('🔍 Karşılaştırma:', { receivedId: data.orderId, currentId: id, match: data.orderId === id });
        
        if (data.orderId === id) {
          console.log('✅ Sipariş güncellendi, sayfa yenileniyor:', data);
          // Siparişi yeniden yükle
          loadOrder();
          // Bildirimleri yenile
          fetchNotifications();
        } else {
          console.log('❌ Farklı sipariş ID\'si, güncelleme yapılmıyor');
        }
      };

      // Yeni bildirimleri dinle
      const handleNewNotification = (notification) => {
        console.log('🔔 newNotification event alındı:', notification);
        // Bildirimleri yenile
        fetchNotifications();
      };

      socket.on('orderUpdated', handleOrderUpdated);
      socket.on('newNotification', handleNewNotification);

      // Cleanup
      return () => {
        console.log('Socket event listener\'ları temizleniyor...');
        socket.off('orderUpdated', handleOrderUpdated);
        socket.off('newNotification', handleNewNotification);
      };
    } else {
      console.log('Socket event listener\'ları eklenmedi - socket yok:', { 
        socket: !!socket, 
        connected, 
        socketConnected: socket?.connected 
      });
    }
  }, [socket, id]); // connected dependency'sini de kaldırdık

  // Alternatif: Socket bağlantısı olmasa bile event listener'ları ekle
  useEffect(() => {
    console.log('Alternatif Socket useEffect çalıştı:', { 
      socket: !!socket, 
      connected, 
      id,
      socketId: socket?.id,
      socketConnected: socket?.connected
    });
    
    // Socket varsa event listener'ları ekle
    if (socket) {
      console.log('Alternatif Socket event listener\'ları ekleniyor...');
      
      // Sipariş güncellemelerini dinle
      const handleOrderUpdated = (data) => {
        console.log('Alternatif orderUpdated event alındı:', data);
        console.log('Alternatif Karşılaştırma:', { receivedId: data.orderId, currentId: id, match: data.orderId === id });
        
        if (data.orderId === id) {
          console.log('Alternatif Sipariş güncellendi, sayfa yenileniyor:', data);
          // Siparişi yeniden yükle
          loadOrder();
          // Bildirimleri yenile
          fetchNotifications();
        }
      };

      // Yeni bildirimleri dinle
      const handleNewNotification = (notification) => {
        console.log('Alternatif newNotification event alındı:', notification);
        // Bildirimleri yenile
        fetchNotifications();
      };

      socket.on('orderUpdated', handleOrderUpdated);
      socket.on('newNotification', handleNewNotification);

      // Cleanup
      return () => {
        console.log('Alternatif Socket event listener\'ları temizleniyor...');
        socket.off('orderUpdated', handleOrderUpdated);
        socket.off('newNotification', handleNewNotification);
      };
    }
  }, [id]); // Sadece id dependency'si

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({ ...order });
  };

  const handleSave = async () => {
    try {
      await api.put(`/orders/${id}`, editForm);
      await loadOrder();
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({ ...order });
  };

  // Ses kaydı handler'ları
  const handleVoiceRecordingComplete = (audioBlob) => {
    setVoiceRecording(audioBlob);
    setHasVoiceRecording(true);
  };

  const handleVoiceRecordingDelete = () => {
    setVoiceRecording(null);
    setHasVoiceRecording(false);
  };

  const handleSendResponse = async () => {
    if (!responseStatus) return;
    
    try {
      setIsSendingResponse(true);
      
      // Debug log
      console.log('📤 Sending response:', {
        status: responseStatus,
        note: responseNote,
        hasVoiceRecording: !!voiceRecording
      });
      
      // Ses kaydı varsa FormData, yoksa normal JSON gönder
      if (voiceRecording) {
        // FormData oluştur
        const formData = new FormData();
        formData.append('status', responseStatus);
        formData.append('note', responseNote);
        formData.append('voiceRecording', voiceRecording, 'voice-recording.webm');
        
        // FormData içeriğini logla
        console.log('📤 FormData contents:');
        for (let [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value);
        }
        
        await api.post(`/orders/${id}/responses`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Normal JSON gönder
        console.log('📤 Sending JSON data:', { status: responseStatus, note: responseNote });
        await api.post(`/orders/${id}/responses`, {
          status: responseStatus,
          note: responseNote
        });
      }
      
      // Form'u temizle
      setResponseStatus('');
      setResponseNote('');
      setVoiceRecording(null);
      setHasVoiceRecording(false);
      
      await loadOrder();
      await fetchNotifications();
    } catch (error) {
      console.error('Send response error:', error);
    } finally {
      setIsSendingResponse(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      await loadOrder();
    } catch (error) {
      console.error('Status update error:', error);
      
      // API hatası durumunda local olarak güncelle
      const updatedOrder = { ...order, status: newStatus };
      setOrder(updatedOrder);
      setEditForm(updatedOrder);
      
      // Add to timeline
      const newTimelineEntry = {
        id: order.timeline.length + 1,
        status: newStatus,
        title: `Durum ${newStatus} olarak güncellendi`,
        description: `Sipariş durumu ${newStatus} olarak değiştirildi`,
        timestamp: new Date().toISOString(),
        user: 'Mevcut Kullanıcı'
      };
      updatedOrder.timeline.push(newTimelineEntry);
      setOrder(updatedOrder);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Sipariş detayları yükleniyor..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Sipariş Bulunamadı</h2>
        <p className="text-gray-600 mb-6">Aradığınız sipariş mevcut değil.</p>
        <Link to="/orders">
          <Button variant="primary">Siparişlere Dön</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sipariş Detayı</h1>
            <p className="text-gray-600 mt-2">Sipariş #{order.orderNumber || id}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/orders">
              <Button variant="secondary">Geri Dön</Button>
            </Link>
            {canEdit && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                <Button variant="primary" onClick={handleSave}>
                  Kaydet
                </Button>
                    <Button variant="secondary" onClick={handleCancel}>
                      İptal
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" onClick={handleEdit}>
                    Düzenle
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
            order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            order.status === 'completed' ? 'bg-green-100 text-green-800' :
            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Sütun - Sipariş Bilgileri (%25) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sipariş Bilgileri */}
            <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Bilgileri</h3>
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.product}
                      onChange={(e) => setEditForm({...editForm, product: e.target.value})}
                    />
                  ) : (
                  <p className="text-gray-900">{order.product || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün Kodu
                  </label>
                <p className="text-gray-900">{order.productCode || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Miktar
                  </label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value)})}
                    />
                  ) : (
                  <p className="text-gray-900">{order.quantity || 0} adet</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birim Fiyat
                  </label>
                <p className="text-gray-900">₺{order.unitPrice ? order.unitPrice.toFixed(2) : '0.00'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Toplam Tutar
                  </label>
                <p className="text-gray-900">₺{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teslimat Tarihi
                  </label>
                    <p className="text-gray-900">{formatDate(order.deliveryDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                {isEditing ? (
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="3"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  />
                ) : (
                  <p className="text-gray-900">{order.description || '-'}</p>
                )}
              </div>
              </div>
            </Card>

        </div>

        {/* Orta Sütun - Sipariş Geçmişi ve Bildirimler (%37.5) */}
        <div className="lg:col-span-4">
            <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sipariş Geçmişi</h3>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718A8.966 8.966 0 003 12a9 9 0 0118 0 8.966 8.966 0 00-1.868 7.718" />
                </svg>
                <span className="text-sm text-gray-600">Gerçek Zamanlı</span>
              </div>
                </div>
            <div className="space-y-4">
              {/* Sipariş Geçmişi */}
                <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sipariş Geçmişi
                </h4>
                <div className="space-y-3">
                  {order.timeline && order.timeline.length > 0 ? (
                    order.timeline.map((entry, index) => {
                      // Kullanıcı tipine göre renk belirle
              const isAdmin = entry.user === 'admin';
              const hasVoiceRecording = entry.voiceRecording && entry.voiceRecording.filename;
                      
                      // Debug log
                      if (hasVoiceRecording) {
                        console.log('🎤 Timeline entry with voice recording:', entry);
                      }
                      
                      return (
                        <div key={entry.id || index} className={`flex space-x-3 p-3 rounded-lg ${
                          isAdmin 
                            ? 'bg-blue-50 border-l-4 border-blue-400' 
                            : 'bg-green-50 border-l-4 border-green-400'
                        }`}>
                          <div className="flex-shrink-0">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              isAdmin 
                                ? hasVoiceRecording ? 'bg-blue-600' : 'bg-blue-500'
                                : hasVoiceRecording ? 'bg-green-600' : 'bg-green-500'
                            }`}>
                      {hasVoiceRecording && entry.voiceRecording && entry.voiceRecording.filename ? (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                </div>
                </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              isAdmin ? 'text-blue-900' : 'text-green-900'
                            }`}>{entry.description}</p>
                            <p className={`text-xs ${
                              isAdmin ? 'text-blue-600' : 'text-green-600'
                            }`}>{formatDate(entry.timestamp)}</p>
                          
                          {/* Ses dosyası varsa göster */}
                  {entry.voiceRecording && entry.voiceRecording.filename && (
                    <VoicePlayer
                      voiceRecording={entry.voiceRecording}
                      userName={entry.user}
                      timestamp={entry.timestamp}
                    />
                  )}
                </div>
              </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 italic">Henüz geçmiş kaydı yok</p>
                  )}
                  </div>
              </div>
              </div>
            </Card>
          </div>

        {/* Sağ Sütun - Sipariş Cevap Sistemi (%37.5) */}
        <div className="lg:col-span-5">
          {/* Durum İşlemleri */}
          <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Durum İşlemleri</h3>
              <div className="space-y-3">
              {canEdit && (
                  <Button 
                  variant="danger"
                    className="w-full" 
                  onClick={() => handleStatusUpdate('cancelled')}
                  >
                    İptal Et
                  </Button>
                )}
              </div>
            </Card>

          {/* Sipariş Cevap Sistemi */}
            <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Cevap Sistemi</h3>
            <div className="space-y-4">
              {/* Siparişe Cevap Ver */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Siparişe Cevap Ver</h4>
                
                {/* Durum Seçimi */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durum Seçin
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={responseStatus}
                    onChange={(e) => setResponseStatus(e.target.value)}
                  >
                    <option value="">Durum seçin...</option>
                    <option value="siparis_kabul_edildi">✅ Sipariş Kabul Edildi</option>
                    <option value="siparis_reddedildi">❌ Sipariş Reddedildi</option>
                    <option value="ek_bilgi_gerekli">ℹ️ Ek Bilgi Gerekli</option>
                    <option value="teslim_tarihi_değişti">📅 Teslim Tarihi Değişti</option>
                    <option value="fiyat_teklifi">💰 Fiyat Teklifi</option>
                    <option value="not">📝 NOT</option>
                  </select>
                    </div>

                {/* Not Alanı */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {responseStatus === 'not' ? 'Not (Zorunlu)' : 'Not (Opsiyonel)'}
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="3"
                    placeholder="Sipariş hakkında notlarınızı yazın..."
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                  />
                  </div>

                {/* Ses Kaydı */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎤 Ses Kaydı (Opsiyonel)
                  </label>
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceRecordingComplete}
                    onRecordingDelete={handleVoiceRecordingDelete}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Ses kaydı ile daha detaylı açıklama yapabilirsiniz. Hem yazılı not hem de ses kaydı gönderebilirsiniz.
                  </p>
                </div>

                {/* Gönder Butonu */}
                <Button 
                  className="w-full"
                  variant="primary"
                  onClick={handleSendResponse}
                  disabled={!responseStatus || isSendingResponse || (responseStatus === 'not' && !responseNote.trim() && !hasVoiceRecording)}
                >
                  {isSendingResponse ? 'Gönderiliyor...' : 'Cevabı Gönder'}
                  </Button>
              </div>

              </div>
            </Card>
          </div>
        </div>
    </div>
  );
};

export default OrderDetailPage;