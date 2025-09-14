// Status mapping utilities for consistent backend-frontend communication

// Backend to Frontend status mapping
export const ORDER_STATUS_MAPPING = {
  // Backend status -> Frontend status
  'siparis_olusturuldu': 'pending',      // 1. Sipariş Oluşturuldu
  'siparis_onaylandi': 'pending',        // 2. Sipariş Onaylandı
  'hammadde_hazirlaniyor': 'in_progress', // 3. Hammadde Hazırlanıyor
  'uretim_basladi': 'in_progress',       // 4. Üretim Başladı
  'uretim_tamamlandi': 'in_progress',    // 5. Üretim Tamamlandı
  'kalite_kontrol': 'in_progress',       // 6. Kalite Kontrol
  'sevkiyata_hazir': 'in_progress',      // 7. Sevkiyata Hazır
  'yola_cikti': 'in_progress',           // 8. Yola Çıktı
  'teslim_edildi': 'completed',          // 9. Teslim Edildi
  'tamamlandi': 'completed',             // 10. Tamamlandı
  'iptal_edildi': 'cancelled'            // İptal Edildi
};

export const TASK_STATUS_MAPPING = {
  // Backend status -> Frontend status
  'beklemede': 'pending',
  'devam_ediyor': 'in_progress',
  'tamamlandi': 'completed',
  'iptal_edildi': 'cancelled',
  'ertelendi': 'pending'  // Ertelenen görevler beklemede kategorisinde
};

export const PRIORITY_MAPPING = {
  // Backend priority -> Frontend priority
  'düşük': 'low',
  'normal': 'medium',
  'yüksek': 'high',
  'acil': 'high'
};

// Status display labels
export const ORDER_STATUS_LABELS = {
  'siparis_olusturuldu': 'Sipariş Oluşturuldu',
  'siparis_onaylandi': 'Sipariş Onaylandı',
  'hammadde_hazirlaniyor': 'Hammadde Hazırlanıyor',
  'uretim_basladi': 'Üretim Başladı',
  'uretim_tamamlandi': 'Üretim Tamamlandı',
  'kalite_kontrol': 'Kalite Kontrol',
  'sevkiyata_hazir': 'Sevkiyata Hazır',
  'yola_cikti': 'Yola Çıktı',
  'teslim_edildi': 'Teslim Edildi',
  'tamamlandi': 'Tamamlandı',
  'iptal_edildi': 'İptal Edildi'
};

export const TASK_STATUS_LABELS = {
  'beklemede': 'Beklemede',
  'devam_ediyor': 'Devam Ediyor',
  'tamamlandi': 'Tamamlandı',
  'iptal_edildi': 'İptal Edildi',
  'ertelendi': 'Ertelendi'
};

export const PRIORITY_LABELS = {
  'düşük': 'Düşük',
  'normal': 'Normal',
  'yüksek': 'Yüksek',
  'acil': 'Acil'
};

// Status colors for UI
export const ORDER_STATUS_COLORS = {
  'siparis_olusturuldu': 'warning',      // Sarı - Beklemede
  'siparis_onaylandi': 'primary',        // Mavi - Onaylandı
  'hammadde_hazirlaniyor': 'primary',    // Mavi - İşlemde
  'uretim_basladi': 'primary',           // Mavi - İşlemde
  'uretim_tamamlandi': 'primary',        // Mavi - İşlemde
  'kalite_kontrol': 'info',              // Mavi - İşlemde
  'sevkiyata_hazir': 'primary',          // Mavi - İşlemde
  'yola_cikti': 'info',                  // Mavi - İşlemde
  'teslim_edildi': 'success',            // Yeşil - Tamamlandı
  'tamamlandi': 'success',               // Yeşil - Tamamlandı
  'iptal_edildi': 'danger'               // Kırmızı - İptal
};

export const TASK_STATUS_COLORS = {
  'beklemede': 'warning',
  'devam_ediyor': 'primary',
  'tamamlandi': 'success',
  'iptal_edildi': 'danger',
  'ertelendi': 'warning'
};

export const PRIORITY_COLORS = {
  'düşük': 'success',
  'normal': 'warning',
  'yüksek': 'danger',
  'acil': 'danger'
};

// Utility functions
export const mapOrderStatus = (backendStatus) => {
  return ORDER_STATUS_MAPPING[backendStatus] || backendStatus;
};

export const mapTaskStatus = (backendStatus) => {
  return TASK_STATUS_MAPPING[backendStatus] || backendStatus;
};

export const mapPriority = (backendPriority) => {
  return PRIORITY_MAPPING[backendPriority] || backendPriority;
};

export const getOrderStatusLabel = (status) => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const getTaskStatusLabel = (status) => {
  return TASK_STATUS_LABELS[status] || status;
};

export const getPriorityLabel = (priority) => {
  return PRIORITY_LABELS[priority] || priority;
};

export const getOrderStatusColor = (status) => {
  return ORDER_STATUS_COLORS[status] || 'secondary';
};

export const getTaskStatusColor = (status) => {
  return TASK_STATUS_COLORS[status] || 'secondary';
};

export const getPriorityColor = (priority) => {
  return PRIORITY_COLORS[priority] || 'secondary';
};

// Count statuses with mapping
export const countOrderStatuses = (orders) => {
  const counts = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
  
  orders.forEach(order => {
    if (order?.status) {
      const mappedStatus = mapOrderStatus(order.status);
      if (counts.hasOwnProperty(mappedStatus)) {
        counts[mappedStatus] += 1;
      }
    }
  });
  
  return counts;
};

export const countTaskStatuses = (tasks) => {
  const counts = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
  
  tasks.forEach(task => {
    if (task?.status) {
      const mappedStatus = mapTaskStatus(task.status);
      if (counts.hasOwnProperty(mappedStatus)) {
        counts[mappedStatus] += 1;
      }
    }
  });
  
  return counts;
};

// Filter options for UI
export const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'Tüm Durumlar' },
  { value: 'pending', label: 'Beklemede' },
  { value: 'in_progress', label: 'İşlemde' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal Edildi' }
];

export const TASK_STATUS_OPTIONS = [
  { value: 'all', label: 'Tüm Durumlar' },
  { value: 'pending', label: 'Beklemede' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal Edildi' }
];

export const PRIORITY_OPTIONS = [
  { value: 'all', label: 'Tüm Öncelikler' },
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Normal' },
  { value: 'high', label: 'Yüksek' }
];
