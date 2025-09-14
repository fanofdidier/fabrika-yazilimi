const crypto = require('crypto');

// Encryption key (production'da environment variable'dan alınmalı)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'Fabrika2024!GüvenliEncryptionKey32Bytes!!';
const ALGORITHM = 'aes-256-gcm';

// IV (Initialization Vector) oluştur
function generateIV() {
  return crypto.randomBytes(16);
}

// Hassas veriyi şifrele
function encrypt(text) {
  if (!text) return text;
  
  const iv = generateIV();
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('fabrika-app', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

// Şifrelenmiş veriyi çöz
function decrypt(encryptedData) {
  if (!encryptedData || !encryptedData.encrypted) return encryptedData;
  
  try {
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('fabrika-app', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Hassas alanları şifrele
function encryptSensitiveFields(obj, sensitiveFields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const encrypted = { ...obj };
  
  sensitiveFields.forEach(field => {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]);
    }
  });
  
  return encrypted;
}

// Hassas alanları çöz
function decryptSensitiveFields(obj, sensitiveFields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const decrypted = { ...obj };
  
  sensitiveFields.forEach(field => {
    if (decrypted[field] && typeof decrypted[field] === 'object' && decrypted[field].encrypted) {
      decrypted[field] = decrypt(decrypted[field]);
    }
  });
  
  return decrypted;
}

// Middleware: Gelen veriyi şifrele
function encryptIncomingData(sensitiveFields = []) {
  return (req, res, next) => {
    if (req.body && sensitiveFields.length > 0) {
      req.body = encryptSensitiveFields(req.body, sensitiveFields);
    }
    next();
  };
}

// Middleware: Giden veriyi çöz
function decryptOutgoingData(sensitiveFields = []) {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (data && sensitiveFields.length > 0) {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          const decrypted = decryptSensitiveFields(parsed, sensitiveFields);
          return originalSend.call(this, JSON.stringify(decrypted));
        } catch (error) {
          return originalSend.call(this, data);
        }
      }
      return originalSend.call(this, data);
    };
    
    next();
  };
}

module.exports = {
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,
  encryptIncomingData,
  decryptOutgoingData
};
