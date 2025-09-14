const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');

// 2FA secret oluştur
function generate2FASecret(user) {
  const secret = speakeasy.generateSecret({
    name: `Fabrika Yazılımı (${user.email})`,
    issuer: 'Fabrika Yazılımı',
    length: 32
  });
  return secret;
}

// QR kod oluştur
async function generateQRCode(secret) {
  try {
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    return qrCodeUrl;
  } catch (error) {
    console.error('QR kod oluşturma hatası:', error);
    throw new Error('QR kod oluşturulamadı');
  }
}

// Backup kodları oluştur
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push({
      code: code,
      used: false,
      usedAt: null
    });
  }
  return codes;
}

// TOTP token doğrula
function verifyTOTPToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // 2 adım tolerans (±60 saniye)
  });
}

// Backup kod doğrula
function verifyBackupCode(user, code) {
  if (!user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
    return false;
  }

  const backupCode = user.twoFactorBackupCodes.find(bc => 
    bc.code === code.toUpperCase() && !bc.used
  );

  if (backupCode) {
    backupCode.used = true;
    backupCode.usedAt = new Date();
    return true;
  }

  return false;
}

// 2FA etkinleştir
async function enable2FA(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'Kullanıcı bulunamadı' };
    }

    if (user.twoFactorEnabled) {
      return { success: false, message: '2FA zaten etkin' };
    }

    // Secret oluştur
    const secret = generate2FASecret(user);
    
    // QR kod oluştur
    const qrCodeUrl = await generateQRCode(secret);
    
    // Backup kodları oluştur
    const backupCodes = generateBackupCodes();

    // Geçici olarak secret'ı kaydet (henüz etkin değil)
    user.twoFactorSecret = secret.base32;
    user.twoFactorBackupCodes = backupCodes;
    await user.save();

    return {
      success: true,
      message: '2FA kurulumu başlatıldı',
      qrCode: qrCodeUrl,
      secret: secret.base32,
      backupCodes: backupCodes.map(bc => bc.code)
    };
  } catch (error) {
    console.error('2FA etkinleştirme hatası:', error);
    return { success: false, message: '2FA etkinleştirilemedi' };
  }
}

// 2FA doğrula ve etkinleştir
async function verifyAndEnable2FA(userId, token) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'Kullanıcı bulunamadı' };
    }

    if (!user.twoFactorSecret) {
      return { success: false, message: '2FA kurulumu bulunamadı' };
    }

    // Token doğrula
    const isValid = verifyTOTPToken(user.twoFactorSecret, token);
    if (!isValid) {
      return { success: false, message: 'Geçersiz doğrulama kodu' };
    }

    // 2FA'yı etkinleştir
    user.twoFactorEnabled = true;
    await user.save();

    return {
      success: true,
      message: '2FA başarıyla etkinleştirildi',
      backupCodes: user.twoFactorBackupCodes.map(bc => bc.code)
    };
  } catch (error) {
    console.error('2FA doğrulama hatası:', error);
    return { success: false, message: '2FA doğrulanamadı' };
  }
}

// 2FA devre dışı bırak
async function disable2FA(userId, password) {
  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return { success: false, message: 'Kullanıcı bulunamadı' };
    }

    if (!user.twoFactorEnabled) {
      return { success: false, message: '2FA zaten devre dışı' };
    }

    // Şifre doğrula
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return { success: false, message: 'Geçersiz şifre' };
    }

    // 2FA'yı devre dışı bırak
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await user.save();

    return { success: true, message: '2FA başarıyla devre dışı bırakıldı' };
  } catch (error) {
    console.error('2FA devre dışı bırakma hatası:', error);
    return { success: false, message: '2FA devre dışı bırakılamadı' };
  }
}

// 2FA token doğrula (login sırasında)
async function verify2FAForLogin(userId, token) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'Kullanıcı bulunamadı' };
    }

    if (!user.twoFactorEnabled) {
      return { success: true, message: '2FA gerekli değil' };
    }

    // TOTP token doğrula
    const isTOTPValid = verifyTOTPToken(user.twoFactorSecret, token);
    if (isTOTPValid) {
      return { success: true, message: '2FA doğrulandı' };
    }

    // Backup kod doğrula (8 karakter)
    if (token.length === 8) {
      const isBackupValid = verifyBackupCode(user, token);
      if (isBackupValid) {
        await user.save(); // Backup kod kullanımını kaydet
        return { success: true, message: 'Backup kod ile doğrulandı' };
      }
    }

    return { success: false, message: 'Geçersiz doğrulama kodu' };
  } catch (error) {
    console.error('2FA login doğrulama hatası:', error);
    return { success: false, message: '2FA doğrulanamadı' };
  }
}

// Backup kodları yenile
async function regenerateBackupCodes(userId, password) {
  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return { success: false, message: 'Kullanıcı bulunamadı' };
    }

    if (!user.twoFactorEnabled) {
      return { success: false, message: '2FA etkin değil' };
    }

    // Şifre doğrula
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return { success: false, message: 'Geçersiz şifre' };
    }

    // Yeni backup kodları oluştur
    const newBackupCodes = generateBackupCodes();
    user.twoFactorBackupCodes = newBackupCodes;
    await user.save();

    return {
      success: true,
      message: 'Backup kodları yenilendi',
      backupCodes: newBackupCodes.map(bc => bc.code)
    };
  } catch (error) {
    console.error('Backup kod yenileme hatası:', error);
    return { success: false, message: 'Backup kodları yenilenemedi' };
  }
}

// 2FA durumu kontrol et
async function check2FAStatus(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'Kullanıcı bulunamadı' };
    }

    return {
      success: true,
      twoFactorEnabled: user.twoFactorEnabled || false,
      hasBackupCodes: user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0
    };
  } catch (error) {
    console.error('2FA durum kontrolü hatası:', error);
    return { success: false, message: '2FA durumu kontrol edilemedi' };
  }
}

module.exports = {
  enable2FA,
  verifyAndEnable2FA,
  disable2FA,
  verify2FAForLogin,
  regenerateBackupCodes,
  check2FAStatus,
  verifyTOTPToken,
  verifyBackupCode
};
