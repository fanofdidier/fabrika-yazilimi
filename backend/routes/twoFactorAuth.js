const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  enable2FA,
  verifyAndEnable2FA,
  disable2FA,
  verify2FAForLogin,
  regenerateBackupCodes,
  check2FAStatus
} = require('../middleware/twoFactorAuth');

const router = express.Router();

// 2FA durumu kontrol et
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const result = await check2FAStatus(req.user._id);
    res.json(result);
  } catch (error) {
    console.error('2FA durum kontrolü hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// 2FA etkinleştir (QR kod ve backup kodları oluştur)
router.post('/enable', authenticateToken, async (req, res) => {
  try {
    const result = await enable2FA(req.user._id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('2FA etkinleştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// 2FA doğrula ve etkinleştir
router.post('/verify', authenticateToken, [
  body('token')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Doğrulama kodu 6 haneli sayı olmalıdır')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz doğrulama kodu',
        errors: errors.array()
      });
    }

    const { token } = req.body;
    const result = await verifyAndEnable2FA(req.user._id, token);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('2FA doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// 2FA devre dışı bırak
router.post('/disable', authenticateToken, [
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const { password } = req.body;
    const result = await disable2FA(req.user._id, password);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('2FA devre dışı bırakma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Backup kodları yenile
router.post('/regenerate-backup-codes', authenticateToken, [
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const { password } = req.body;
    const result = await regenerateBackupCodes(req.user._id, password);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Backup kod yenileme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Login sırasında 2FA doğrula (public endpoint)
router.post('/verify-login', [
  body('userId')
    .isMongoId()
    .withMessage('Geçersiz kullanıcı ID'),
  body('token')
    .isLength({ min: 6, max: 8 })
    .withMessage('Doğrulama kodu 6-8 karakter arasında olmalıdır')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const { userId, token } = req.body;
    const result = await verify2FAForLogin(userId, token);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('2FA login doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
