const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Bildirim başlığı gereklidir'],
    trim: true,
    maxlength: [200, 'Başlık en fazla 200 karakter olabilir']
  },
  message: {
    type: String,
    required: [true, 'Bildirim mesajı gereklidir'],
    trim: true,
    maxlength: [1000, 'Mesaj en fazla 1000 karakter olabilir']
  },
  type: {
    type: String,
    enum: [
      'siparis_olusturuldu',
      'siparis_guncellendi',
      'siparis_tamamlandi',
      'siparis_cevabi',
      'gorev_atandi',
      'gorev_tamamlandi',
      'ham_madde_yetersiz',
      'termin_yaklasti',
      'termin_gecti',
      'sistem_bildirimi',
      'genel_duyuru'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['düşük', 'normal', 'yüksek', 'acil'],
    default: 'normal'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },
    deliveryStatus: {
      web: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date, default: null }
      },
      email: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date, default: null },
        error: { type: String, default: null }
      },
      whatsapp: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date, default: null },
        error: { type: String, default: null }
      }
    }
  }],
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  channels: {
    web: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    whatsapp: {
      type: Boolean,
      default: false
    }
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  isSent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  actionUrl: {
    type: String,
    trim: true
  },
  actionText: {
    type: String,
    trim: true,
    maxlength: [50, 'Aksiyon metni en fazla 50 karakter olabilir']
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  targetRoles: [{
    type: String,
    enum: ['admin', 'magaza_personeli', 'fabrika_iscisi']
  }],
  icon: {
    type: String,
    trim: true,
    default: 'bell'
  },
  color: {
    type: String,
    enum: ['blue', 'green', 'yellow', 'red', 'purple', 'gray'],
    default: 'blue'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total recipients count
notificationSchema.virtual('totalRecipients').get(function() {
  return this.recipients.length;
});

// Virtual for read recipients count
notificationSchema.virtual('readCount').get(function() {
  return this.recipients.filter(r => r.isRead).length;
});

// Virtual for unread recipients count
notificationSchema.virtual('unreadCount').get(function() {
  return this.recipients.filter(r => !r.isRead).length;
});

// Virtual for read percentage
notificationSchema.virtual('readPercentage').get(function() {
  if (this.recipients.length === 0) return 0;
  return Math.round((this.readCount / this.totalRecipients) * 100);
});

// Index for better performance
notificationSchema.index({ sender: 1 });
notificationSchema.index({ 'recipients.user': 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ isSent: 1 });
notificationSchema.index({ relatedOrder: 1 });
notificationSchema.index({ relatedTask: 1 });
notificationSchema.index({ targetRoles: 1 });
notificationSchema.index({ expiresAt: 1 });

// TTL index for expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to find notifications for user
notificationSchema.statics.findForUser = function(userId, options = {}) {
  const query = {
    $or: [
      { 'recipients.user': userId },
      { isGlobal: true }
    ]
  };
  
  if (options.unreadOnly) {
    query['recipients.isRead'] = false;
  }
  
  return this.find(query)
    .populate('sender', 'firstName lastName username')
    .populate('relatedOrder', 'orderNumber title')
    .populate('relatedTask', 'title')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to find unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    $or: [
      { 
        'recipients': {
          $elemMatch: {
            user: userId,
            isRead: false
          }
        }
      },
      { 
        isGlobal: true,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Son 30 gün
      }
    ]
  });
};

// Static method to mark as read
notificationSchema.statics.markAsRead = function(notificationId, userId) {
  return this.updateOne(
    { 
      _id: notificationId,
      'recipients.user': userId
    },
    {
      $set: {
        'recipients.$.isRead': true,
        'recipients.$.readAt': new Date()
      }
    }
  );
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { 'recipients.user': userId },
    {
      $set: {
        'recipients.$.isRead': true,
        'recipients.$.readAt': new Date()
      }
    }
  );
};

// Static method to create notification for specific users
notificationSchema.statics.createForUsers = function(data, userIds) {
  const recipients = userIds.map(userId => ({
    user: userId,
    isRead: false
  }));
  
  return this.create({
    ...data,
    recipients,
    isGlobal: false
  });
};

// Static method to create global notification
notificationSchema.statics.createGlobal = function(data, targetRoles = []) {
  return this.create({
    ...data,
    isGlobal: true,
    targetRoles,
    recipients: []
  });
};

// Method to add recipient
notificationSchema.methods.addRecipient = function(userId) {
  const existingRecipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (!existingRecipient) {
    this.recipients.push({
      user: userId,
      isRead: false
    });
  }
  return this.save();
};

// Method to update delivery status
notificationSchema.methods.updateDeliveryStatus = function(userId, channel, status, error = null) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (recipient) {
    recipient.deliveryStatus[channel].sent = status;
    recipient.deliveryStatus[channel].sentAt = status ? new Date() : null;
    if (error) {
      recipient.deliveryStatus[channel].error = error;
    }
  }
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);