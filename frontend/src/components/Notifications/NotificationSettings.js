import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const NotificationSettings = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    email: {
      enabled: true,
      orderUpdates: true,
      taskAssignments: true,
      systemAlerts: true,
      reminders: true,
      marketing: false,
      frequency: 'immediate' // immediate, daily, weekly
    },
    whatsapp: {
      enabled: false,
      orderUpdates: true,
      taskAssignments: true,
      systemAlerts: false,
      reminders: true,
      frequency: 'immediate'
    },
    web: {
      enabled: true,
      orderUpdates: true,
      taskAssignments: true,
      systemAlerts: true,
      reminders: true,
      sound: true,
      desktop: true
    },
    general: {
      timezone: 'Europe/Istanbul',
      language: 'tr',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      priority: {
        low: true,
        normal: true,
        high: true,
        urgent: true
      }
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  const [testNotification, setTestNotification] = useState({
    type: 'email',
    message: 'Bu bir test bildirimidir.',
    isSending: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/notifications/settings');
      if (response.data.settings) {
        setSettings(prev => ({
          ...prev,
          ...response.data.settings
        }));
      }
    } catch (error) {
      console.error('Bildirim ayarları yüklenirken hata:', error);
      toast.error('Ayarlar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await api.put('/notifications/settings', { settings });
      toast.success('Bildirim ayarları başarıyla kaydedildi');
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestNotification = async () => {
    setTestNotification(prev => ({ ...prev, isSending: true }));
    try {
      await api.post('/notifications/test', {
        type: testNotification.type,
        message: testNotification.message
      });
      toast.success('Test bildirimi gönderildi');
    } catch (error) {
      console.error('Test bildirimi gönderilirken hata:', error);
      toast.error('Test bildirimi gönderilemedi');
    } finally {
      setTestNotification(prev => ({ ...prev, isSending: false }));
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const updateNestedSetting = (category, parentKey, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [parentKey]: {
          ...prev[category][parentKey],
          [key]: value
        }
      }
    }));
  };

  const toggleWorkingDay = (day) => {
    setSettings(prev => {
      const workingDays = prev.general.workingDays.includes(day)
        ? prev.general.workingDays.filter(d => d !== day)
        : [...prev.general.workingDays, day].sort();
      
      return {
        ...prev,
        general: {
          ...prev.general,
          workingDays
        }
      };
    });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Tarayıcı bildirimleri etkinleştirildi');
        updateSetting('web', 'desktop', true);
      } else {
        toast.error('Tarayıcı bildirimleri reddedildi');
        updateSetting('web', 'desktop', false);
      }
    } else {
      toast.error('Bu tarayıcı bildirimleri desteklemiyor');
    }
  };

  const tabs = [
    { id: 'email', name: 'Email', icon: '📧' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
    { id: 'web', name: 'Web', icon: '🌐' },
    { id: 'general', name: 'Genel', icon: '⚙️' }
  ];

  const notificationTypes = [
    { key: 'orderUpdates', name: 'Sipariş Güncellemeleri', description: 'Yeni siparişler ve durum değişiklikleri' },
    { key: 'taskAssignments', name: 'Görev Atamaları', description: 'Size atanan yeni görevler' },
    { key: 'systemAlerts', name: 'Sistem Uyarıları', description: 'Önemli sistem bildirimleri' },
    { key: 'reminders', name: 'Hatırlatmalar', description: 'Görev ve randevu hatırlatmaları' }
  ];

  const frequencyOptions = [
    { value: 'immediate', label: 'Anında' },
    { value: 'daily', label: 'Günlük Özet' },
    { value: 'weekly', label: 'Haftalık Özet' }
  ];

  const timezones = [
    { value: 'Europe/Istanbul', label: 'İstanbul (GMT+3)' },
    { value: 'Europe/London', label: 'Londra (GMT+0)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' }
  ];

  const weekDays = [
    { value: 1, label: 'Pazartesi', short: 'Pzt' },
    { value: 2, label: 'Salı', short: 'Sal' },
    { value: 3, label: 'Çarşamba', short: 'Çar' },
    { value: 4, label: 'Perşembe', short: 'Per' },
    { value: 5, label: 'Cuma', short: 'Cum' },
    { value: 6, label: 'Cumartesi', short: 'Cmt' },
    { value: 0, label: 'Pazar', short: 'Paz' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM12 3v12M7 8l5-5 5 5" />
              </svg>
              Bildirim Ayarları
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

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="flex h-[calc(90vh-120px)]">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
              <nav className="p-4 space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3 text-lg">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>

              {/* Test Notification */}
              <div className="p-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Test Bildirimi</h3>
                <div className="space-y-2">
                  <select
                    value={testNotification.type}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="web">Web</option>
                  </select>
                  <textarea
                    value={testNotification.message}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Test mesajı"
                    rows={2}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendTestNotification}
                    disabled={testNotification.isSending}
                    className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testNotification.isSending ? 'Gönderiliyor...' : 'Test Gönder'}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Email Settings */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Email Bildirimleri</h3>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.email.enabled}
                        onChange={(e) => updateSetting('email', 'enabled', e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Email bildirimlerini etkinleştir</span>
                    </label>
                  </div>

                  {settings.email.enabled && (
                    <>
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">Bildirim Türleri</h4>
                        <div className="space-y-3">
                          {notificationTypes.map(type => (
                            <div key={type.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">{type.name}</h5>
                                <p className="text-sm text-gray-600">{type.description}</p>
                              </div>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={settings.email[type.key]}
                                  onChange={(e) => updateSetting('email', type.key, e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </label>
                            </div>
                          ))}
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">Pazarlama Emailları</h5>
                              <p className="text-sm text-gray-600">Ürün güncellemeleri ve promosyonlar</p>
                            </div>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.email.marketing}
                                onChange={(e) => updateSetting('email', 'marketing', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">Gönderim Sıklığı</h4>
                        <select
                          value={settings.email.frequency}
                          onChange={(e) => updateSetting('email', 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {frequencyOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* WhatsApp Settings */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">WhatsApp Bildirimleri</h3>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.whatsapp.enabled}
                        onChange={(e) => updateSetting('whatsapp', 'enabled', e.target.checked)}
                        className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">WhatsApp bildirimlerini etkinleştir</span>
                    </label>
                  </div>

                  {!user.phone && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex">
                        <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">Telefon Numarası Gerekli</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            WhatsApp bildirimleri için profilinizde telefon numaranızı güncellemeniz gerekiyor.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {settings.whatsapp.enabled && (
                    <>
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">Bildirim Türleri</h4>
                        <div className="space-y-3">
                          {notificationTypes.map(type => (
                            <div key={type.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">{type.name}</h5>
                                <p className="text-sm text-gray-600">{type.description}</p>
                              </div>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={settings.whatsapp[type.key]}
                                  onChange={(e) => updateSetting('whatsapp', type.key, e.target.checked)}
                                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">Gönderim Sıklığı</h4>
                        <select
                          value={settings.whatsapp.frequency}
                          onChange={(e) => updateSetting('whatsapp', 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          {frequencyOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Web Settings */}
              {activeTab === 'web' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Web Bildirimleri</h3>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.web.enabled}
                        onChange={(e) => updateSetting('web', 'enabled', e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Web bildirimlerini etkinleştir</span>
                    </label>
                  </div>

                  {settings.web.enabled && (
                    <>
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">Bildirim Türleri</h4>
                        <div className="space-y-3">
                          {notificationTypes.map(type => (
                            <div key={type.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">{type.name}</h5>
                                <p className="text-sm text-gray-600">{type.description}</p>
                              </div>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={settings.web[type.key]}
                                  onChange={(e) => updateSetting('web', type.key, e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">Görünüm Ayarları</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">Ses Bildirimi</h5>
                              <p className="text-sm text-gray-600">Yeni bildirimler için ses çal</p>
                            </div>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.web.sound}
                                onChange={(e) => updateSetting('web', 'sound', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">Masaüstü Bildirimleri</h5>
                              <p className="text-sm text-gray-600">Tarayıcı masaüstü bildirimleri</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={settings.web.desktop}
                                  onChange={(e) => updateSetting('web', 'desktop', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </label>
                              {!settings.web.desktop && (
                                <button
                                  onClick={requestNotificationPermission}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  İzin Ver
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Genel Ayarlar</h3>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Zaman Dilimi</h4>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {timezones.map(tz => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Sessiz Saatler</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.general.quietHours.enabled}
                          onChange={(e) => updateNestedSetting('general', 'quietHours', 'enabled', e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Sessiz saatleri etkinleştir</span>
                      </label>
                      
                      {settings.general.quietHours.enabled && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
                            <input
                              type="time"
                              value={settings.general.quietHours.start}
                              onChange={(e) => updateNestedSetting('general', 'quietHours', 'start', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                            <input
                              type="time"
                              value={settings.general.quietHours.end}
                              onChange={(e) => updateNestedSetting('general', 'quietHours', 'end', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Çalışma Günleri</h4>
                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map(day => (
                        <button
                          key={day.value}
                          onClick={() => toggleWorkingDay(day.value)}
                          className={`p-2 text-sm rounded-md border transition-colors ${
                            settings.general.workingDays.includes(day.value)
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {day.short}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Seçili günlerde bildirimler gönderilecek
                    </p>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Öncelik Filtreleri</h4>
                    <div className="space-y-2">
                      {Object.entries(settings.general.priority).map(([priority, enabled]) => (
                        <label key={priority} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => updateNestedSetting('general', 'priority', priority, e.target.checked)}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {priority === 'low' ? 'Düşük' : 
                             priority === 'normal' ? 'Normal' :
                             priority === 'high' ? 'Yüksek' : 'Acil'} öncelikli bildirimler
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Son güncelleme: {new Date().toLocaleString('tr-TR')}
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
              onClick={saveSettings}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                'Kaydet'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;