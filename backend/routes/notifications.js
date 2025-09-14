const express = require('express');
const Notification = require('../models/Notification');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateNotificationCreation, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Kullanıcının bildirimlerini getir
// @access  Private
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { type, isRead, priority } = req.query;
    
    // Kullanıcının bildirimlerini getir
    const notifications = await Notification.findForUser(
      req.user._id,
      { type, isRead, priority },
      { page, limit }
    );
    
    const total = await Notification.countDocuments({
      $or: [
        { recipients: { $elemMatch: { user: req.user._id } } },
        { 
          isGlobal: true,
          targetRoles: { $in: [req.user.role] },
          createdAt: { $gte: req.user.createdAt }
        }
      ]
    });
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Okunmamış bildirim sayısını getir
// @access  Private
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      data: {
        unreadCount: count
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/notifications/stats
// @desc    Bildirim istatistikleri (Admin)
// @access  Private (Admin)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    
    const typeStats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const priorityStats = await Notification.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const deliveryStats = await Notification.aggregate([
      { $unwind: '$recipients' },
      {
        $group: {
          _id: '$recipients.deliveryStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const recentNotifications = await Notification.find()
      .populate('sender', 'firstName lastName username')
      .populate('relatedOrder', 'orderNumber title')
      .populate('relatedTask', 'title')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        totalNotifications,
        typeStats,
        priorityStats,
        deliveryStats,
        recentNotifications
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/notifications
// @desc    Yeni bildirim oluştur (Admin)
// @access  Private (Admin)
router.post('/', authenticateToken, requireAdmin, validateNotificationCreation, async (req, res) => {
  try {
    const { recipients, targetRoles, isGlobal, ...notificationData } = req.body;
    
    notificationData.sender = req.user._id;
    
    let notification;
    
    if (isGlobal && targetRoles && targetRoles.length > 0) {
      // Global bildirim
      notification = await Notification.createGlobal(notificationData, targetRoles);
    } else if (recipients && recipients.length > 0) {
      // Belirli kullanıcılara bildirim
      notification = await Notification.createForUsers(notificationData, recipients);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Alıcılar veya hedef roller belirtilmelidir'
      });
    }
    
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'firstName lastName username')
      .populate('relatedOrder', 'orderNumber title')
      .populate('relatedTask', 'title');
    
    // Socket.io ile gerçek zamanlı bildirim
    const io = req.app.get('io');
    if (io) {
      // Global bildirim için tüm kullanıcılara gönder
      if (isGlobal && targetRoles) {
        targetRoles.forEach(role => {
          io.to(`role_${role}`).emit('newNotification', {
            type: populatedNotification.type,
            title: populatedNotification.title,
            message: populatedNotification.message,
            orderId: populatedNotification.relatedOrder?._id,
            timestamp: populatedNotification.createdAt
          });
        });
      }
      
      // Belirli kullanıcılara bildirim
      if (recipients && recipients.length > 0) {
        recipients.forEach(recipient => {
          io.to(`user_${recipient}`).emit('newNotification', {
            type: populatedNotification.type,
            title: populatedNotification.title,
            message: populatedNotification.message,
            orderId: populatedNotification.relatedOrder?._id,
            timestamp: populatedNotification.createdAt
          });
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Bildirim başarıyla oluşturuldu',
      data: {
        notification: populatedNotification
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Tüm bildirimleri okundu olarak işaretle
// @access  Private
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Kullanıcının tüm bildirimlerini okundu olarak işaretle
    await Notification.updateMany(
      {
        $or: [
          { recipients: { $elemMatch: { user: userId } } },
          { 
            isGlobal: true,
            targetRoles: { $in: [req.user.role] },
            createdAt: { $gte: req.user.createdAt }
          }
        ]
      },
      {
        $set: {
          'recipients.$[elem].isRead': true,
          'recipients.$[elem].readAt': new Date()
        }
      },
      {
        arrayFilters: [{ 'elem.user': userId }]
      }
    );
    
    res.json({
      success: true,
      message: 'Tüm bildirimler okundu olarak işaretlendi'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Tüm bildirimleri temizle
// @access  Private
router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Kullanıcının tüm bildirimlerini sil
    await Notification.updateMany(
      {
        $or: [
          { recipients: { $elemMatch: { user: userId } } },
          { 
            isGlobal: true,
            targetRoles: { $in: [req.user.role] },
            createdAt: { $gte: req.user.createdAt }
          }
        ]
      },
      {
        $pull: {
          recipients: { user: userId }
        }
      }
    );
    
    // Eğer recipients array'i boş kaldıysa bildirimi tamamen sil
    await Notification.deleteMany({
      recipients: { $size: 0 },
      isGlobal: false
    });
    
    res.json({
      success: true,
      message: 'Tüm bildirimler temizlendi'
    });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/notifications/:id
// @desc    Belirli bir bildirimi getir
// @access  Private
router.get('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('sender', 'firstName lastName username email')
      .populate('relatedOrder', 'orderNumber title status')
      .populate('relatedTask', 'title status');
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }
    
    // Kullanıcının bu bildirimi görme yetkisi var mı kontrol et
    const hasAccess = notification.isGlobal && 
                     notification.targetRoles.includes(req.user.role) &&
                     notification.createdAt >= req.user.createdAt ||
                     notification.recipients.some(r => r.user.toString() === req.user._id.toString());
    
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu bildirimi görme yetkiniz bulunmuyor'
      });
    }
    
    // Bildirimi okundu olarak işaretle
    await notification.markAsRead(req.user._id);
    
    res.json({
      success: true,
      data: {
        notification
      }
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Bildirimi okundu olarak işaretle
// @access  Private
router.put('/:id/read', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }
    
    await notification.markAsRead(req.user._id);
    
    res.json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Tüm bildirimleri okundu olarak işaretle
// @access  Private
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    // Kullanıcının tüm okunmamış bildirimlerini bul ve okundu olarak işaretle
    const notifications = await Notification.find({
      $or: [
        { 
          recipients: { 
            $elemMatch: { 
              user: req.user._id,
              isRead: false
            }
          }
        },
        {
          isGlobal: true,
          targetRoles: { $in: [req.user.role] },
          createdAt: { $gte: req.user.createdAt },
          'recipients.user': { $ne: req.user._id }
        }
      ]
    });
    
    for (const notification of notifications) {
      await notification.markAsRead(req.user._id);
    }
    
    res.json({
      success: true,
      message: `${notifications.length} bildirim okundu olarak işaretlendi`
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Bildirimi sil (Admin)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId(), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }
    
    await Notification.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Bildirim başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/notifications/broadcast
// @desc    Toplu bildirim gönder (Admin)
// @access  Private (Admin)
router.post('/broadcast', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, message, type, priority, targetRoles, actionUrl, actionText } = req.body;
    
    if (!title || !message || !targetRoles || targetRoles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Başlık, mesaj ve hedef roller gereklidir'
      });
    }
    
    const notification = await Notification.createGlobal({
      title,
      message,
      type: type || 'genel',
      priority: priority || 'orta',
      sender: req.user._id,
      actionUrl,
      actionText
    }, targetRoles);
    
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'firstName lastName username');
    
    // Socket.io ile gerçek zamanlı bildirim
    const io = req.app.get('io');
    io.emit('broadcast-notification', {
      notification: populatedNotification,
      targetRoles,
      message: 'Yeni duyuru'
    });
    
    res.status(201).json({
      success: true,
      message: 'Duyuru başarıyla gönderildi',
      data: {
        notification: populatedNotification
      }
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/notifications/:id/delivery-status
// @desc    Bildirim teslimat durumunu güncelle
// @access  Private (Admin)
router.put('/:id/delivery-status', authenticateToken, requireAdmin, validateObjectId(), async (req, res) => {
  try {
    const { userId, status, error } = req.body;
    
    if (!userId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID ve durum gereklidir'
      });
    }
    
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }
    
    await notification.updateDeliveryStatus(userId, status, error);
    
    res.json({
      success: true,
      message: 'Teslimat durumu güncellendi'
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;