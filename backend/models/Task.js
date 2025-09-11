const mongoose = require('mongoose');

const taskStepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Adım başlığı gereklidir'],
    trim: true,
    maxlength: [200, 'Başlık en fazla 200 karakter olabilir']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Açıklama en fazla 500 karakter olabilir']
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  order: {
    type: Number,
    required: true,
    min: 1
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Görev başlığı gereklidir'],
    trim: true,
    maxlength: [200, 'Başlık en fazla 200 karakter olabilir']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Açıklama en fazla 1000 karakter olabilir']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Görev oluşturan kişi gereklidir']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null ise genel görev
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  status: {
    type: String,
    enum: [
      'beklemede',
      'devam_ediyor',
      'tamamlandi',
      'iptal_edildi',
      'ertelendi'
    ],
    default: 'beklemede'
  },
  priority: {
    type: String,
    enum: ['düşük', 'normal', 'yüksek', 'acil'],
    default: 'normal'
  },
  type: {
    type: String,
    enum: ['genel', 'kişiye_özel', 'sipariş_bağlantılı'],
    default: 'genel'
  },
  category: {
    type: String,
    enum: [
      'üretim',
      'kalite_kontrol',
      'paketleme',
      'sevkiyat',
      'temizlik',
      'bakım',
      'stok_kontrol',
      'diğer'
    ],
    default: 'diğer'
  },
  dueDate: {
    type: Date,
    required: [true, 'Bitiş tarihi gereklidir']
  },
  estimatedDuration: {
    type: Number, // dakika cinsinden
    min: [1, 'Tahmini süre en az 1 dakika olmalıdır']
  },
  actualDuration: {
    type: Number, // dakika cinsinden
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  steps: [taskStepSchema],
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
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Yorum en fazla 500 karakter olabilir']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    type: String,
    enum: ['magaza', 'fabrika', 'her_ikisi'],
    default: 'fabrika'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['günlük', 'haftalık', 'aylık'],
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Etiket en fazla 50 karakter olabilir']
  }],
  isUrgent: {
    type: Boolean,
    default: false
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days remaining
taskSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate) return null;
  const today = new Date();
  const diffTime = this.dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'tamamlandi') return false;
  return new Date() > this.dueDate;
});

// Virtual for completed steps count
taskSchema.virtual('completedStepsCount').get(function() {
  return (this.steps || []).filter(step => step.isCompleted).length;
});

// Virtual for total steps count
taskSchema.virtual('totalStepsCount').get(function() {
  return (this.steps || []).length;
});

// Index for better performance
taskSchema.index({ createdBy: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ location: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ relatedOrder: 1 });

// Pre-save middleware to update completion percentage
taskSchema.pre('save', function(next) {
  if (this.steps && this.steps.length > 0) {
    const completedSteps = this.steps.filter(step => step.isCompleted).length;
    this.completionPercentage = Math.round((completedSteps / this.steps.length) * 100);
    
    // Eğer tüm adımlar tamamlandıysa görevi tamamla
    if (this.completionPercentage === 100 && this.status !== 'tamamlandi') {
      this.status = 'tamamlandi';
      this.completedAt = new Date();
    }
  }
  next();
});

// Static method to find tasks by status
taskSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .populate('createdBy assignedTo', 'firstName lastName username')
    .populate('relatedOrder', 'orderNumber title');
};

// Static method to find urgent tasks
taskSchema.statics.findUrgent = function() {
  return this.find({ 
    $or: [
      { isUrgent: true },
      { priority: 'acil' }
    ]
  })
  .populate('createdBy assignedTo', 'firstName lastName username')
  .populate('relatedOrder', 'orderNumber title');
};

// Static method to find tasks assigned to user
taskSchema.statics.findByAssignee = function(userId) {
  return this.find({ 
    $or: [
      { assignedTo: userId },
      { assignedTo: null } // Genel görevler
    ]
  })
  .populate('createdBy assignedTo', 'firstName lastName username')
  .populate('relatedOrder', 'orderNumber title');
};

// Method to start task
taskSchema.methods.startTask = function() {
  this.status = 'devam_ediyor';
  this.startedAt = new Date();
  return this.save();
};

// Method to complete task
taskSchema.methods.completeTask = function() {
  this.status = 'tamamlandi';
  this.completedAt = new Date();
  this.completionPercentage = 100;
  
  if (this.startedAt) {
    this.actualDuration = Math.round((new Date() - this.startedAt) / (1000 * 60)); // dakika
  }
  
  return this.save();
};

module.exports = mongoose.model('Task', taskSchema);