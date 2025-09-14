const crypto = require('crypto');

// PII (Personally Identifiable Information) koruma middleware

// Hassas PII alanları
const PII_FIELDS = [
  'email',
  'phone',
  'address',
  'firstName',
  'lastName',
  'username',
  'personalId',
  'socialSecurityNumber',
  'creditCard',
  'bankAccount'
];

// PII verilerini maskele
function maskPII(data, fields = PII_FIELDS) {
  if (!data || typeof data !== 'object') return data;
  
  const masked = { ...data };
  
  fields.forEach(field => {
    if (masked[field] && typeof masked[field] === 'string') {
      const value = masked[field];
      if (value.length > 4) {
        // İlk 2 ve son 2 karakteri göster, ortasını * ile maskele
        masked[field] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
      } else {
        // Kısa değerler için tamamen maskele
        masked[field] = '*'.repeat(value.length);
      }
    }
  });
  
  return masked;
}

// Email'i maskele
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return '*'.repeat(localPart.length) + '@' + domain;
  }
  
  return localPart.substring(0, 2) + '*'.repeat(localPart.length - 2) + '@' + domain;
}

// Telefon numarasını maskele
function maskPhone(phone) {
  if (!phone) return phone;
  
  // Sadece son 4 rakamı göster
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 4) {
    return '*'.repeat(cleaned.length);
  }
  
  return '*'.repeat(cleaned.length - 4) + cleaned.substring(cleaned.length - 4);
}

// Adres bilgisini maskele
function maskAddress(address) {
  if (!address) return address;
  
  // Sadece ilk kelimeyi göster, geri kalanını maskele
  const words = address.split(' ');
  if (words.length <= 1) {
    return '*'.repeat(address.length);
  }
  
  return words[0] + ' ' + '*'.repeat(words.slice(1).join(' ').length);
}

// PII verilerini hash'le (loglar için)
function hashPII(data, fields = PII_FIELDS) {
  if (!data || typeof data !== 'object') return data;
  
  const hashed = { ...data };
  
  fields.forEach(field => {
    if (hashed[field] && typeof hashed[field] === 'string') {
      hashed[field] = crypto.createHash('sha256').update(hashed[field]).digest('hex').substring(0, 8);
    }
  });
  
  return hashed;
}

// PII koruma middleware
function protectPII(fields = PII_FIELDS, mode = 'mask') {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (data) {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          let protectedData = parsed;
          
          if (mode === 'mask') {
            protectedData = maskPII(parsed, fields);
          } else if (mode === 'hash') {
            protectedData = hashPII(parsed, fields);
          }
          
          return originalSend.call(this, JSON.stringify(protectedData));
        } catch (error) {
          return originalSend.call(this, data);
        }
      }
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Audit log için PII koruma
function protectPIIForAudit(data, fields = PII_FIELDS) {
  return hashPII(data, fields);
}

// Test ortamı için PII maskeleme
function maskPIIForTesting(data, fields = PII_FIELDS) {
  return maskPII(data, fields);
}

module.exports = {
  PII_FIELDS,
  maskPII,
  maskEmail,
  maskPhone,
  maskAddress,
  hashPII,
  protectPII,
  protectPIIForAudit,
  maskPIIForTesting
};
