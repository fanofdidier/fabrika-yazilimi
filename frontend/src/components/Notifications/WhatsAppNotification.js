import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import api from '../../services/api';

const WhatsAppNotification = ({ isOpen, onClose, recipients = [], message = '', templateName = null }) => {
  const [formData, setFormData] = useState({
    phoneNumbers: recipients.join(', '),
    message: message,
    templateName: templateName || '',
    useTemplate: !!templateName,
    scheduledAt: '',
    priority: 'normal'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [errors, setErrors] = useState({});
  const [previewMessage, setPreviewMessage] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setFormData({
        phoneNumbers: recipients.join(', '),
        message: message,
        templateName: templateName || '',
        useTemplate: !!templateName,
        scheduledAt: '',
        priority: 'normal'
      });
    }
  }, [isOpen, recipients, message, templateName]);

  useEffect(() => {
    updatePreview();
    calculateCost();
  }, [formData]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/whatsapp/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error);
      toast.error('WhatsApp şablonları yüklenemedi');
    }
  };

  const updatePreview = () => {
    let preview = formData.message;
    
    if (formData.useTemplate && formData.templateName) {
      const template = templates.find(t => t.name === formData.templateName);
      if (template) {
        preview = template.content;
        // Replace placeholders with sample data
        preview = preview.replace(/{{name}}/g, '[Müşteri Adı]');
        preview = preview.replace(/{{orderNumber}}/g, '[Sipariş No]');
        preview = preview.replace(/{{date}}/g, '[Tarih]');
        preview = preview.replace(/{{amount}}/g, '[Tutar]');
        preview = preview.replace(/{{status}}/g, '[Durum]');
      }
    }
    
    setPreviewMessage(preview);
    setCharacterCount(preview.length);
  };

  const calculateCost = () => {
    const phoneCount = formData.phoneNumbers.split(',').filter(phone => phone.trim()).length;
    const messageLength = formData.message.length;
    
    // Estimate cost based on message length and recipient count
    let costPerMessage = 0.05; // Base cost in TL
    if (messageLength > 160) {
      costPerMessage = 0.08; // Higher cost for longer messages
    }
    
    setEstimatedCost(phoneCount * costPerMessage);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.phoneNumbers.trim()) {
      newErrors.phoneNumbers = 'En az bir telefon numarası gereklidir';
    } else {
      const phones = formData.phoneNumbers.split(',').map(phone => phone.trim());
      const invalidPhones = phones.filter(phone => {
        // Turkish phone number validation
        const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
        return !phoneRegex.test(phone.replace(/\s/g, ''));
      });
      
      if (invalidPhones.length > 0) {
        newErrors.phoneNumbers = `Geçersiz telefon numaraları: ${invalidPhones.join(', ')}`;
      }
    }
    
    if (!formData.useTemplate && !formData.message.trim()) {
      newErrors.message = 'Mesaj içeriği gereklidir';
    }
    
    if (formData.useTemplate && !formData.templateName) {
      newErrors.templateName = 'Şablon seçimi gereklidir';
    }
    
    if (formData.scheduledAt) {
      const scheduledDate = new Date(formData.scheduledAt);
      const now = new Date();
      if (scheduledDate <= now) {
        newErrors.scheduledAt = 'Zamanlama tarihi gelecekte olmalıdır';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const phoneNumbers = formData.phoneNumbers
        .split(',')
        .map(phone => phone.trim())
        .filter(phone => phone);
      
      const payload = {
        phoneNumbers,
        message: formData.useTemplate ? previewMessage : formData.message,
        templateName: formData.useTemplate ? formData.templateName : null,
        scheduledAt: formData.scheduledAt || null,
        priority: formData.priority
      };
      
      await api.post('/whatsapp/send', payload);
      
      toast.success(`WhatsApp mesajı ${phoneNumbers.length} kişiye gönderildi`);
      onClose();
      
      // Reset form
      setFormData({
        phoneNumbers: '',
        message: '',
        templateName: '',
        useTemplate: false,
        scheduledAt: '',
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          setErrors({ general: errorData.message || 'Geçersiz veri' });
        }
      } else if (error.response?.status === 429) {
        setErrors({ general: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' });
      } else {
        setErrors({ general: 'WhatsApp mesajı gönderilemedi' });
      }
      
      toast.error('WhatsApp mesajı gönderilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTemplateChange = (templateName) => {
    const template = templates.find(t => t.name === templateName);
    setFormData(prev => ({
      ...prev,
      templateName,
      message: template ? template.content : ''
    }));
  };

  const addQuickPhones = (type) => {
    let phones = [];
    
    switch (type) {
      case 'all_customers':
        // This would typically fetch from API
        phones = ['05551234567', '05559876543'];
        break;
      case 'pending_orders':
        phones = ['05551111111', '05552222222'];
        break;
      case 'overdue_tasks':
        phones = ['05553333333', '05554444444'];
        break;
      default:
        break;
    }
    
    const currentPhones = formData.phoneNumbers ? formData.phoneNumbers.split(',').map(p => p.trim()) : [];
    const newPhones = [...new Set([...currentPhones, ...phones])]; // Remove duplicates
    
    setFormData(prev => ({
      ...prev,
      phoneNumbers: newPhones.join(', ')
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">WhatsApp Bildirimi Gönder</h3>
              <p className="text-sm text-gray-500">Müşterilere WhatsApp üzerinden bildirim gönderin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Phone Numbers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numaraları *
                </label>
                <textarea
                  name="phoneNumbers"
                  value={formData.phoneNumbers}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                    errors.phoneNumbers ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="05551234567, 05559876543 (virgülle ayırın)"
                />
                {errors.phoneNumbers && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumbers}</p>
                )}
                
                {/* Quick Add Buttons */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addQuickPhones('all_customers')}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Tüm Müşteriler
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickPhones('pending_orders')}
                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  >
                    Bekleyen Siparişler
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickPhones('overdue_tasks')}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Geciken Görevler
                  </button>
                </div>
              </div>

              {/* Template Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="useTemplate"
                  checked={formData.useTemplate}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Hazır şablon kullan
                </label>
              </div>

              {/* Template Selection */}
              {formData.useTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şablon Seçin *
                  </label>
                  <select
                    name="templateName"
                    value={formData.templateName}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                      errors.templateName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Şablon seçiniz</option>
                    {templates.map(template => (
                      <option key={template.name} value={template.name}>
                        {template.displayName}
                      </option>
                    ))}
                  </select>
                  {errors.templateName && (
                    <p className="mt-1 text-sm text-red-600">{errors.templateName}</p>
                  )}
                </div>
              )}

              {/* Message Content */}
              {!formData.useTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mesaj İçeriği *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                      errors.message ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Mesajınızı buraya yazın..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {characterCount} karakter
                  </p>
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Öncelik
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="low">Düşük</option>
                  <option value="normal">Normal</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
              </div>

              {/* Scheduled Send */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zamanlanmış Gönderim (İsteğe Bağlı)
                </label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={handleInputChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                    errors.scheduledAt ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.scheduledAt && (
                  <p className="mt-1 text-sm text-red-600">{errors.scheduledAt}</p>
                )}
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Mesaj Önizlemesi</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900">Fabrika Yazılımı</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {previewMessage || 'Mesaj önizlemesi burada görünecek...'}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Gönderim İstatistikleri</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Alıcı Sayısı:</span>
                    <span className="font-medium">
                      {formData.phoneNumbers ? formData.phoneNumbers.split(',').filter(p => p.trim()).length : 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Karakter Sayısı:</span>
                    <span className="font-medium">{characterCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tahmini Maliyet:</span>
                    <span className="font-medium text-green-600">₺{estimatedCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gönderim Zamanı:</span>
                    <span className="font-medium">
                      {formData.scheduledAt ? 'Zamanlanmış' : 'Hemen'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Available Templates */}
              {templates.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Mevcut Şablonlar</h4>
                  <div className="space-y-2">
                    {templates.slice(0, 3).map(template => (
                      <div key={template.name} className="text-xs">
                        <span className="font-medium text-blue-700">{template.displayName}</span>
                        <p className="text-gray-600 truncate">{template.description}</p>
                      </div>
                    ))}
                    {templates.length > 3 && (
                      <p className="text-xs text-gray-500">+{templates.length - 3} şablon daha...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="text-white mr-2" />
              ) : (
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
              {formData.scheduledAt ? 'Zamanla' : 'Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppNotification;