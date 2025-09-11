const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Ürün adı gereklidir'],
    trim: true,
    maxlength: [200, 'Ürün adı en fazla 200 karakter olabilir']
  },
  quantity: {
    type: Number,
    required: [true, 'Miktar gereklidir'],
    min: [1, 'Miktar en az 1 olmalıdır']
  },
  unit: {
    type: String,
    required: [true, 'Birim gereklidir'],
    enum: ['adet', 'kg', 'gram', 'litre', 'ml', 'metre', 'cm', 'paket', 'kutu'],
    default: 'adet'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Açıklama en fazla 500 karakter olabilir']
  },
  urgency: {
    type: String,
    enum: ['düşük', 'normal', 'yüksek', 'acil'],
    default: 'normal'
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: false // Pre-save middleware otomatik oluşturacak
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sipariş oluşturan kişi gereklidir']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Sipariş başlığı gereklidir'],
    trim: true,
    maxlength: [200, 'Başlık en fazla 200 karakter olabilir']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Açıklama en fazla 1000 karakter olabilir']
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: [
      'siparis_olusturuldu',      // 1. Sipariş Oluşturuldu
      'siparis_onaylandi',        // 2. Sipariş Onaylandı / Üretim Planlandı
      'hammadde_hazirlaniyor',    // 3. Hammadde Hazırlanıyor
      'uretim_basladi',          // 4. Üretim Başladı
      'uretim_tamamlandi',       // 5. Üretim Tamamlandı
      'kalite_kontrol',          // 6. Kalite Kontrol / Paketleme
      'sevkiyata_hazir',         // 7. Sevkiyata Hazır
      'yola_cikti',              // 8. Yola Çıktı
      'teslim_edildi',           // 9. Teslim Edildi
      'tamamlandi',              // 10. Tamamlandı
      'iptal_edildi'             // İptal Edildi
    ],
    default: 'siparis_olusturuldu'
  },
  priority: {
    type: String,
    enum: ['düşük', 'normal', 'yüksek', 'acil'],
    default: 'normal'
  },
  dueDate: {
    type: Date,
    required: [true, 'Teslim tarihi gereklidir']
  },
  estimatedCompletionDate: {
    type: Date
  },
  actualCompletionDate: {
    type: Date
  },
  notes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Not en fazla 500 karakter olabilir']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  responses: [{
    status: {
      type: String,
      required: true,
      enum: [
        'siparis_kabul_edildi',
        'siparis_reddedildi', 
        'ek_bilgi_gerekli',
        'teslim_tarihi_değişti',
        'fiyat_teklifi',
        'not'
      ]
    },
    note: {
      type: String,
      trim: true,
      maxlength: [1000, 'Not en fazla 1000 karakter olabilir']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    type: {
      type: String,
      required: true,
      enum: ['created', 'updated', 'response', 'status_change', 'note_added']
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    user: {
      type: String,
      required: true
    },
    status: {
      type: String,
      default: null
    },
    note: {
      type: String,
      default: null
    },
    voiceRecording: {
      filename: {
        type: String,
        default: null
      },
      originalName: {
        type: String,
        default: null
      },
      path: {
        type: String,
        default: null
      },
      size: {
        type: Number,
        default: null
      },
      mimetype: {
        type: String,
        default: null
      }
    }
  }],
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  rawMaterials: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    requiredQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'gram', 'litre', 'ml', 'metre', 'cm', 'adet', 'paket']
    },
    status: {
      type: String,
      enum: ['yeterli', 'yetersiz', 'siparis_verildi', 'bekleniyor'],
      default: 'bekleniyor'
    }
  }],
  location: {
    type: String,
    enum: ['magaza', 'fabrika'],
    required: true
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Etiket en fazla 50 karakter olabilir']
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days remaining
orderSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate) return null;
  const today = new Date();
  const diffTime = this.dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is overdue
orderSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'teslim_edildi') return false;
  return new Date() > this.dueDate;
});

// Index for better performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdBy: 1 });
orderSchema.index({ assignedTo: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ priority: 1 });
orderSchema.index({ dueDate: 1 });
orderSchema.index({ location: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Find the last order of today
    const todayStart = new Date(year, date.getMonth(), date.getDate());
    const todayEnd = new Date(year, date.getMonth(), date.getDate() + 1);
    
    const lastOrder = await this.constructor.findOne({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    }).sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-').pop());
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `SIP-${year}${month}${day}-${String(sequence).padStart(3, '0')}`;
  }
  next();
});

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('createdBy assignedTo', 'firstName lastName username');
};

// Static method to find urgent orders
orderSchema.statics.findUrgent = function() {
  return this.find({ 
    $or: [
      { isUrgent: true },
      { priority: 'acil' }
    ]
  }).populate('createdBy assignedTo', 'firstName lastName username');
};

module.exports = mongoose.model('Order', orderSchema);