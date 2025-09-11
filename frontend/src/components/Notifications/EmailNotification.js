import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import api from '../../services/api';

const EmailNotification = ({ isOpen, onClose, recipients = [], subject = '', message = '' }) => {
  const [formData, setFormData] = useState({
    recipients: recipients.join(', '),
    subject: subject,
    message: message,
    priority: 'normal',
    sendAt: '',
    template: '',
    attachments: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [recipientList, setRecipientList] = useState([]);
  const [showRecipientManager, setShowRecipientManager] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setFormData({
        recipients: recipients.join(', '),
        subject: subject,
        message: message,
        priority: 'normal',
        sendAt: '',
        template: '',
        attachments: []
      });
    }
  }, [isOpen, recipients, subject, message]);

  useEffect(() => {
    calculateEstimatedCost();
  }, [formData.recipients, formData.message]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/notifications/email-templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Email şablonları yüklenirken hata:', error);
    }
  };

  const calculateEstimatedCost = () => {
    const recipientCount = formData.recipients.split(',').filter(r => r.trim()).length;
    const messageLength = formData.message.length;
    const baseCost = 0.01; // Base cost per email
    const lengthMultiplier = Math.ceil(messageLength / 1000) * 0.005;
    const cost = recipientCount * (baseCost + lengthMultiplier);
    setEstimatedCost(cost);
  };

  const validateForm = () => {
    const errors = {};

    // Recipients validation
    if (!formData.recipients.trim()) {
      errors.recipients = 'En az bir alıcı gerekli';
    } else {
      const emails = formData.recipients.split(',').map(email => email.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(email => email && !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        errors.recipients = `Geçersiz email adresleri: ${invalidEmails.join(', ')}`;
      }
    }

    // Subject validation
    if (!formData.subject.trim()) {
      errors.subject = 'Konu gerekli';
    } else if (formData.subject.length > 200) {
      errors.subject = 'Konu 200 karakterden uzun olamaz';
    }

    // Message validation
    if (!formData.message.trim()) {
      errors.message = 'Mesaj gerekli';
    } else if (formData.message.length > 10000) {
      errors.message = 'Mesaj 10.000 karakterden uzun olamaz';
    }

    // Send time validation
    if (formData.sendAt) {
      const sendTime = new Date(formData.sendAt);
      const now = new Date();
      if (sendTime <= now) {
        errors.sendAt = 'Gönderim zamanı gelecekte olmalı';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTemplateSelect = async (templateId) => {
    if (!templateId) {
      setFormData(prev => ({ ...prev, template: '', subject: '', message: '' }));
      return;
    }

    try {
      const response = await api.get(`/notifications/email-templates/${templateId}`);
      const template = response.data.template;
      
      setFormData(prev => ({
        ...prev,
        template: templateId,
        subject: template.subject || prev.subject,
        message: template.content || prev.message
      }));
    } catch (error) {
      toast.error('Şablon yüklenirken hata oluştu');
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} dosyası çok büyük (max 10MB)`);
        return false;
      }
      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        toast.error(`${file.name} dosya türü desteklenmiyor`);
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const generatePreview = () => {
    let content = formData.message;
    
    // Replace common variables
    content = content.replace(/{{name}}/g, 'Örnek Kullanıcı');
    content = content.replace(/{{company}}/g, 'Şirket Adı');
    content = content.replace(/{{date}}/g, new Date().toLocaleDateString('tr-TR'));
    content = content.replace(/{{time}}/g, new Date().toLocaleTimeString('tr-TR'));
    
    setPreviewContent(content);
    setShowPreview(true);
  };

  const addQuickRecipient = (email) => {
    const currentRecipients = formData.recipients.split(',').map(r => r.trim()).filter(r => r);
    if (!currentRecipients.includes(email)) {
      setFormData(prev => ({
        ...prev,
        recipients: [...currentRecipients, email].join(', ')
      }));
    }
  };

  const handleSend = async () => {
    if (!validateForm()) {
      toast.error('Lütfen form hatalarını düzeltin');
      return;
    }

    setIsLoading(true);
    try {
      const emailData = new FormData();
      
      // Add form data
      emailData.append('recipients', formData.recipients);
      emailData.append('subject', formData.subject);
      emailData.append('message', formData.message);
      emailData.append('priority', formData.priority);
      if (formData.sendAt) {
        emailData.append('sendAt', formData.sendAt);
      }
      if (formData.template) {
        emailData.append('template', formData.template);
      }

      // Add attachments
      formData.attachments.forEach((file, index) => {
        emailData.append(`attachments`, file);
      });

      const response = await api.post('/notifications/send-email', emailData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(response.data.message || 'Email başarıyla gönderildi');
      onClose();
      
      // Reset form
      setFormData({
        recipients: '',
        subject: '',
        message: '',
        priority: 'normal',
        sendAt: '',
        template: '',
        attachments: []
      });
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      toast.error(error.response?.data?.message || 'Email gönderilirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const quickRecipients = [
    { label: 'Tüm Yöneticiler', value: 'managers@company.com' },
    { label: 'Üretim Ekibi', value: 'production@company.com' },
    { label: 'Satış Ekibi', value: 'sales@company.com' },
    { label: 'Muhasebe', value: 'accounting@company.com' },
    { label: 'İK Departmanı', value: 'hr@company.com' }
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Gönder
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Main Form */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Şablonu
                  </label>
                  <select
                    value={formData.template}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Şablon seçin (isteğe bağlı)</option>
                    {templates.map(template => (
                      <option key={template._id} value={template._id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alıcılar *
                  </label>
                  <div className="space-y-2">
                    <textarea
                      name="recipients"
                      value={formData.recipients}
                      onChange={handleInputChange}
                      placeholder="Email adreslerini virgülle ayırarak girin (örn: user1@example.com, user2@example.com)"
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.recipients ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.recipients && (
                      <p className="text-sm text-red-600">{validationErrors.recipients}</p>
                    )}
                    
                    {/* Quick Recipients */}
                    <div className="flex flex-wrap gap-2">
                      {quickRecipients.map((recipient, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => addQuickRecipient(recipient.value)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          + {recipient.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konu *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Email konusu"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.subject ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.subject && (
                    <p className="text-sm text-red-600">{validationErrors.subject}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mesaj *
                    </label>
                    <button
                      type="button"
                      onClick={generatePreview}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Önizleme
                    </button>
                  </div>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Email mesajınızı buraya yazın...\n\nDeğişkenler:\n{{name}} - Alıcı adı\n{{company}} - Şirket adı\n{{date}} - Bugünün tarihi\n{{time}} - Şu anki saat"
                    rows={8}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.message && (
                    <p className="text-sm text-red-600">{validationErrors.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.message.length}/10,000 karakter
                  </p>
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ekler
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500">
                      Desteklenen formatlar: PDF, Word, Resim dosyaları (Max 10MB)
                    </p>
                    
                    {formData.attachments.length > 0 && (
                      <div className="space-y-1">
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">
                              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority and Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Öncelik
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Düşük</option>
                      <option value="normal">Normal</option>
                      <option value="high">Yüksek</option>
                      <option value="urgent">Acil</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zamanlanmış Gönderim
                    </label>
                    <input
                      type="datetime-local"
                      name="sendAt"
                      value={formData.sendAt}
                      onChange={handleInputChange}
                      min={new Date().toISOString().slice(0, 16)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.sendAt ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.sendAt && (
                      <p className="text-sm text-red-600">{validationErrors.sendAt}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
              <div className="space-y-6">
                {/* Cost Estimation */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Maliyet Tahmini</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Alıcı Sayısı:</span>
                      <span>{formData.recipients.split(',').filter(r => r.trim()).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mesaj Uzunluğu:</span>
                      <span>{formData.message.length} karakter</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ek Sayısı:</span>
                      <span>{formData.attachments.length}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-medium">
                      <span>Tahmini Maliyet:</span>
                      <span>${estimatedCost.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                {/* Send Options */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Gönderim Seçenekleri</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      HTML formatı desteklenir
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Otomatik yeniden deneme
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Gönderim raporu
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Zamanlanmış gönderim
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={generatePreview}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Mesaj Önizlemesi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        recipients: '',
                        subject: '',
                        message: '',
                        priority: 'normal',
                        sendAt: '',
                        template: '',
                        attachments: []
                      });
                      setValidationErrors({});
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Formu Temizle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {formData.sendAt ? (
                <span>Zamanlanmış gönderim: {new Date(formData.sendAt).toLocaleString('tr-TR')}</span>
              ) : (
                <span>Hemen gönderilecek</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {formData.sendAt ? 'Zamanla' : 'Gönder'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Mesaj Önizlemesi</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Konu: {formData.subject}</h4>
                </div>
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: previewContent.replace(/\n/g, '<br>') }} />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmailNotification;