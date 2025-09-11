const { body, param, query, validationResult } = require('express-validator');

// Validation sonuçlarını kontrol eden middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation hatası',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Kullanıcı kayıt validation
const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Kullanıcı adı 3-30 karakter arasında olmalıdır')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  
  body('email')
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad 2-50 karakter arasında olmalıdır')
    .matches(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/)
    .withMessage('Ad sadece harf içerebilir'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad 2-50 karakter arasında olmalıdır')
    .matches(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/)
    .withMessage('Soyad sadece harf içerebilir'),
  
  body('role')
    .optional()
    .isIn(['admin', 'magaza_personeli', 'fabrika_iscisi'])
    .withMessage('Geçersiz rol'),
  
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Geçerli bir telefon numarası giriniz'),
  
  body('whatsappNumber')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Geçerli bir WhatsApp numarası giriniz'),
  
  handleValidationErrors
];

// Kullanıcı giriş validation
const validateUserLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Kullanıcı adı veya email gereklidir'),
  
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir'),
  
  handleValidationErrors
];

// Sipariş oluşturma validation
const validateOrderCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Başlık 3-200 karakter arasında olmalıdır'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Açıklama en fazla 1000 karakter olabilir'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('En az bir ürün eklemelisiniz'),
  
  body('items.*.productName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Ürün adı 2-200 karakter arasında olmalıdır'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Miktar pozitif bir sayı olmalıdır'),
  
  body('items.*.unit')
    .isIn(['adet', 'kg', 'gram', 'litre', 'ml', 'metre', 'cm', 'paket', 'kutu'])
    .withMessage('Geçersiz birim'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Geçerli bir tarih giriniz')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Teslim tarihi gelecekte olmalıdır');
      }
      return true;
    }),
  
  body('priority')
    .optional()
    .isIn(['düşük', 'normal', 'yüksek', 'acil'])
    .withMessage('Geçersiz öncelik'),
  
  body('location')
    .isIn(['magaza', 'fabrika'])
    .withMessage('Geçersiz lokasyon'),
  
  handleValidationErrors
];

// Görev oluşturma validation
const validateTaskCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Başlık 3-200 karakter arasında olmalıdır'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Açıklama en fazla 1000 karakter olabilir'),
  
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Geçersiz kullanıcı ID'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Geçerli bir tarih giriniz')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Bitiş tarihi gelecekte olmalıdır');
      }
      return true;
    }),
  
  body('priority')
    .optional()
    .isIn(['düşük', 'normal', 'yüksek', 'acil'])
    .withMessage('Geçersiz öncelik'),
  
  body('category')
    .optional()
    .isIn(['üretim', 'kalite_kontrol', 'paketleme', 'sevkiyat', 'temizlik', 'bakım', 'stok_kontrol', 'diğer'])
    .withMessage('Geçersiz kategori'),
  
  body('location')
    .optional()
    .isIn(['magaza', 'fabrika', 'her_ikisi'])
    .withMessage('Geçersiz lokasyon'),
  
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Tahmini süre pozitif bir sayı olmalıdır'),
  
  handleValidationErrors
];

// Bildirim oluşturma validation
const validateNotificationCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Başlık 3-200 karakter arasında olmalıdır'),
  
  body('message')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Mesaj 5-1000 karakter arasında olmalıdır'),
  
  body('type')
    .isIn([
      'siparis_olusturuldu', 'siparis_guncellendi', 'siparis_tamamlandi',
      'gorev_atandi', 'gorev_tamamlandi', 'ham_madde_yetersiz',
      'termin_yaklasti', 'termin_gecti', 'sistem_bildirimi', 'genel_duyuru'
    ])
    .withMessage('Geçersiz bildirim türü'),
  
  body('priority')
    .optional()
    .isIn(['düşük', 'normal', 'yüksek', 'acil'])
    .withMessage('Geçersiz öncelik'),
  
  body('recipients')
    .optional()
    .isArray()
    .withMessage('Alıcılar dizi formatında olmalıdır'),
  
  body('recipients.*')
    .optional()
    .isMongoId()
    .withMessage('Geçersiz kullanıcı ID'),
  
  body('targetRoles')
    .optional()
    .isArray()
    .withMessage('Hedef roller dizi formatında olmalıdır'),
  
  body('targetRoles.*')
    .optional()
    .isIn(['admin', 'magaza_personeli', 'fabrika_iscisi'])
    .withMessage('Geçersiz rol'),
  
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('Geçersiz ID formatı'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sayfa numarası pozitif bir sayı olmalıdır'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit 1-100 arasında olmalıdır'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateOrderCreation,
  validateTaskCreation,
  validateNotificationCreation,
  validateObjectId,
  validatePagination
};