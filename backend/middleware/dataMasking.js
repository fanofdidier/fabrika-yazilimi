const faker = require('faker');

// Test ortamında gerçek verileri maskele
function maskDataForTesting(data, options = {}) {
  if (!data || typeof data !== 'object') return data;
  
  const masked = { ...data };
  const {
    preserveIds = true,
    preserveDates = true,
    preserveNumbers = false,
    locale = 'tr'
  } = options;
  
  // Faker locale ayarla
  faker.locale = locale;
  
  // Her alanı kontrol et ve maskele
  Object.keys(masked).forEach(key => {
    const value = masked[key];
    
    if (typeof value === 'string') {
      // Email alanları
      if (key.toLowerCase().includes('email')) {
        masked[key] = faker.internet.email();
      }
      // Telefon alanları
      else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('tel')) {
        masked[key] = faker.phone.phoneNumber();
      }
      // Ad alanları
      else if (key.toLowerCase().includes('name') || key.toLowerCase().includes('ad')) {
        if (key.toLowerCase().includes('first')) {
          masked[key] = faker.name.firstName();
        } else if (key.toLowerCase().includes('last')) {
          masked[key] = faker.name.lastName();
        } else {
          masked[key] = faker.name.findName();
        }
      }
      // Adres alanları
      else if (key.toLowerCase().includes('address') || key.toLowerCase().includes('adres')) {
        masked[key] = faker.address.streetAddress();
      }
      // Şehir alanları
      else if (key.toLowerCase().includes('city') || key.toLowerCase().includes('şehir')) {
        masked[key] = faker.address.city();
      }
      // Ülke alanları
      else if (key.toLowerCase().includes('country') || key.toLowerCase().includes('ülke')) {
        masked[key] = faker.address.country();
      }
      // Açıklama alanları
      else if (key.toLowerCase().includes('description') || key.toLowerCase().includes('açıklama')) {
        masked[key] = faker.lorem.sentence();
      }
      // Not alanları
      else if (key.toLowerCase().includes('note') || key.toLowerCase().includes('not')) {
        masked[key] = faker.lorem.paragraph();
      }
      // Diğer string alanlar
      else if (value.length > 3) {
        masked[key] = faker.lorem.words(3);
      }
    }
    // Sayısal alanlar
    else if (typeof value === 'number') {
      if (!preserveNumbers) {
        if (key.toLowerCase().includes('price') || key.toLowerCase().includes('fiyat')) {
          masked[key] = faker.commerce.price();
        } else if (key.toLowerCase().includes('quantity') || key.toLowerCase().includes('miktar')) {
          masked[key] = faker.random.number({ min: 1, max: 100 });
        } else {
          masked[key] = faker.random.number({ min: 1, max: 1000 });
        }
      }
    }
    // Tarih alanları
    else if (value instanceof Date) {
      if (!preserveDates) {
        masked[key] = faker.date.past();
      }
    }
    // ID alanları
    else if (key.toLowerCase().includes('id') && preserveIds) {
      // ID'leri koru
      masked[key] = value;
    }
  });
  
  return masked;
}

// Koleksiyon verilerini maskele
function maskCollectionData(collection, options = {}) {
  if (!Array.isArray(collection)) return collection;
  
  return collection.map(item => maskDataForTesting(item, options));
}

// Belirli alanları maskele
function maskSpecificFields(data, fieldsToMask = []) {
  if (!data || typeof data !== 'object') return data;
  
  const masked = { ...data };
  
  fieldsToMask.forEach(field => {
    if (masked[field]) {
      if (typeof masked[field] === 'string') {
        masked[field] = faker.lorem.words(2);
      } else if (typeof masked[field] === 'number') {
        masked[field] = faker.random.number({ min: 1, max: 100 });
      }
    }
  });
  
  return masked;
}

// Test ortamı kontrolü
function isTestEnvironment() {
  return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
}

// Data masking middleware
function dataMaskingMiddleware(options = {}) {
  return (req, res, next) => {
    // Sadece test/development ortamında çalış
    if (!isTestEnvironment()) {
      return next();
    }
    
    const originalSend = res.send;
    
    res.send = function(data) {
      if (data) {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          let maskedData = parsed;
          
          // Array ise her elemanı maskele
          if (Array.isArray(parsed)) {
            maskedData = maskCollectionData(parsed, options);
          } else {
            maskedData = maskDataForTesting(parsed, options);
          }
          
          return originalSend.call(this, JSON.stringify(maskedData));
        } catch (error) {
          return originalSend.call(this, data);
        }
      }
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Hassas veri maskeleme
function maskSensitiveData(data, sensitiveFields = []) {
  if (!data || typeof data !== 'object') return data;
  
  const masked = { ...data };
  
  sensitiveFields.forEach(field => {
    if (masked[field]) {
      if (typeof masked[field] === 'string') {
        // String verileri için rastgele metin
        masked[field] = faker.lorem.words(3);
      } else if (typeof masked[field] === 'number') {
        // Sayısal veriler için rastgele sayı
        masked[field] = faker.random.number({ min: 1, max: 999 });
      }
    }
  });
  
  return masked;
}

module.exports = {
  maskDataForTesting,
  maskCollectionData,
  maskSpecificFields,
  isTestEnvironment,
  dataMaskingMiddleware,
  maskSensitiveData
};
