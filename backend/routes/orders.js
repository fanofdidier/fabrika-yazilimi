const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticateToken, requireStoreOrAdmin } = require('../middleware/auth');
const { validateOrderCreation, validateObjectId, validatePagination } = require('../middleware/validation');

// Durum etiketleri
const getStatusLabel = (status) => {
  const statusLabels = {
    'siparis_kabul_edildi': '✅ Sipariş Kabul Edildi',
    'siparis_reddedildi': '❌ Sipariş Reddedildi',
    'ek_bilgi_gerekli': 'ℹ️ Ek Bilgi Gerekli',
    'teslim_tarihi_değişti': '📅 Teslim Tarihi Değişti',
    'fiyat_teklifi': '💰 Fiyat Teklifi',
    'not': '📝 NOT'
  };
  return statusLabels[status] || status;
};

const router = express.Router();

// Multer konfigürasyonu - ses dosyaları için
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/voice-recordings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `voice-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Sadece ses dosyalarını kabul et
    if (file.mimetype.startsWith('audio/') || file.originalname.endsWith('.webm')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece ses dosyaları kabul edilir!'), false);
    }
  }
});

// @route   GET /api/orders
// @desc    Siparişleri listele
// @access  Private
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { status, priority, location, assignedTo, createdBy, search, sortBy, sortOrder } = req.query;
    
    // Filtreleme koşulları
    let filter = {};
    
    // Rol bazlı filtreleme
    if (req.user.role === 'fabrika_iscisi') {
      filter.$or = [
        { assignedTo: req.user._id },
        { assignedTo: null, location: 'fabrika' }
      ];
    } else if (req.user.role === 'magaza_personeli') {
      filter.$or = [
        { createdBy: req.user._id },
        { location: 'magaza' }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (location) {
      filter.location = location;
    }
    
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    
    if (createdBy) {
      filter.createdBy = createdBy;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sıralama
    let sort = { createdAt: -1 };
    if (sortBy) {
      const order = sortOrder === 'asc' ? 1 : -1;
      sort = { [sortBy]: order };
    }
    
    const orders = await Order.find(filter)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders/stats
// @desc    Sipariş istatistikleri
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    let filter = {};
    
    // Rol bazlı filtreleme
    if (req.user.role === 'fabrika_iscisi') {
      filter.$or = [
        { assignedTo: req.user._id },
        { assignedTo: null, location: 'fabrika' }
      ];
    } else if (req.user.role === 'magaza_personeli') {
      filter.$or = [
        { createdBy: req.user._id },
        { location: 'magaza' }
      ];
    }
    
    const totalOrders = await Order.countDocuments(filter);
    
    const statusStats = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const priorityStats = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const urgentOrders = await Order.countDocuments({
      ...filter,
      $or: [
        { isUrgent: true },
        { priority: 'acil' }
      ]
    });
    
    const overdueOrders = await Order.countDocuments({
      ...filter,
      dueDate: { $lt: new Date() },
      status: { $nin: ['teslim_edildi', 'iptal_edildi'] }
    });
    
    const recentOrders = await Order.find(filter)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      success: true,
      data: {
        totalOrders,
        statusStats,
        priorityStats,
        urgentOrders,
        overdueOrders,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/orders
// @desc    Yeni sipariş oluştur
// @access  Private (Store or Admin)
router.post('/', authenticateToken, requireStoreOrAdmin, validateOrderCreation, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const order = new Order(orderData);
    await order.save();
    
    // Populate edilmiş sipariş bilgilerini al
    const populatedOrder = await Order.findById(order._id)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username');
    
    // Bildirim oluştur
    await Notification.createGlobal({
      title: 'Yeni Sipariş Oluşturuldu',
      message: `${populatedOrder.title} başlıklı yeni bir sipariş oluşturuldu.`,
      type: 'siparis_olusturuldu',
      sender: req.user._id,
      relatedOrder: order._id,
      priority: order.priority,
      actionUrl: `/orders/${order._id}`,
      actionText: 'Siparişi Görüntüle'
    }, ['admin', 'fabrika_iscisi']);
    
    // Socket.io ile gerçek zamanlı bildirim
    const io = req.app.get('io');
    io.emit('new-order', {
      order: populatedOrder,
      message: 'Yeni sipariş oluşturuldu'
    });
    
    res.status(201).json({
      success: true,
      message: 'Sipariş başarıyla oluşturuldu',
      data: {
        order: populatedOrder
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Belirli bir siparişi getir
// @access  Private
router.get('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('createdBy', 'firstName lastName username email')
      .populate('assignedTo', 'firstName lastName username email')
      .populate('notes.user', 'firstName lastName username');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }
    
    // Erişim kontrolü
    if (req.user.role === 'fabrika_iscisi') {
      if (order.assignedTo && order.assignedTo._id.toString() !== req.user._id.toString() && 
          order.location !== 'fabrika') {
        return res.status(403).json({
          success: false,
          message: 'Bu siparişe erişim yetkiniz bulunmuyor'
        });
      }
    } else if (req.user.role === 'magaza_personeli') {
      if (order.createdBy._id.toString() !== req.user._id.toString() && 
          order.location !== 'magaza') {
        return res.status(403).json({
          success: false,
          message: 'Bu siparişe erişim yetkiniz bulunmuyor'
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/orders/:id
// @desc    Siparişi güncelle
// @access  Private
router.put('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }
    
    // Erişim kontrolü
    const canEdit = req.user.role === 'admin' || 
                   order.createdBy.toString() === req.user._id.toString() ||
                   (order.assignedTo && order.assignedTo.toString() === req.user._id.toString());
    
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Bu siparişi düzenleme yetkiniz bulunmuyor'
      });
    }
    
    const oldStatus = order.status;
    
    // Güncelleme
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'firstName lastName username')
    .populate('assignedTo', 'firstName lastName username');
    
    // Durum değişikliği bildirimi
    if (oldStatus !== updatedOrder.status) {
      await Notification.createGlobal({
        title: 'Sipariş Durumu Güncellendi',
        message: `${updatedOrder.title} siparişinin durumu "${updatedOrder.status}" olarak güncellendi.`,
        type: 'siparis_guncellendi',
        sender: req.user._id,
        relatedOrder: updatedOrder._id,
        priority: updatedOrder.priority,
        actionUrl: `/orders/${updatedOrder._id}`,
        actionText: 'Siparişi Görüntüle'
      }, ['admin', 'magaza_personeli', 'fabrika_iscisi']);
      
      // Socket.io ile gerçek zamanlı bildirim
      const io = req.app.get('io');
      io.emit('order-updated', {
        order: updatedOrder,
        oldStatus,
        newStatus: updatedOrder.status,
        message: 'Sipariş durumu güncellendi'
      });
    }
    
    res.json({
      success: true,
      message: 'Sipariş başarıyla güncellendi',
      data: {
        order: updatedOrder
      }
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Siparişi sil
// @access  Private (Admin or Creator)
router.delete('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }
    
    // Sadece admin veya sipariş oluşturan silebilir
    if (req.user.role !== 'admin' && order.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu siparişi silme yetkiniz bulunmuyor'
      });
    }
    
    await Order.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Sipariş başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/orders/:id/notes
// @desc    Siparişe not ekle
// @access  Private
router.post('/:id/notes', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Not mesajı gereklidir'
      });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }
    
    order.notes.push({
      user: req.user._id,
      message: message.trim()
    });
    
    await order.save();
    
    const updatedOrder = await Order.findById(req.params.id)
      .populate('notes.user', 'firstName lastName username');
    
    res.json({
      success: true,
      message: 'Not başarıyla eklendi',
      data: {
        notes: updatedOrder.notes
      }
    });
  } catch (error) {
    console.error('Add order note error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/orders/:id/assign
// @desc    Siparişi kullanıcıya ata
// @access  Private (Admin)
router.put('/:id/assign', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Sipariş atama yetkisi sadece admin kullanıcılarda bulunur'
      });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { assignedTo: assignedTo || null },
      { new: true }
    )
    .populate('createdBy', 'firstName lastName username')
    .populate('assignedTo', 'firstName lastName username');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }
    
    // Atama bildirimi
    if (assignedTo) {
      await Notification.createForUsers({
        title: 'Size Yeni Sipariş Atandı',
        message: `${order.title} başlıklı sipariş size atandı.`,
        type: 'siparis_guncellendi',
        sender: req.user._id,
        relatedOrder: order._id,
        priority: order.priority,
        actionUrl: `/orders/${order._id}`,
        actionText: 'Siparişi Görüntüle'
      }, [assignedTo]);
    }
    
    res.json({
      success: true,
      message: assignedTo ? 'Sipariş başarıyla atandı' : 'Sipariş ataması kaldırıldı',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Assign order error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/orders/:id/responses
// @desc    Siparişe cevap gönder (JSON veya FormData)
// @access  Private (Admin, Fabrika, Mağaza)
router.post('/:id/responses', authenticateToken, requireStoreOrAdmin, upload.single('voiceRecording'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const userId = req.user._id;
    const userName = req.user.name || req.user.username;

    // Debug log
    console.log('📝 Content-Type:', req.get('Content-Type'));
    console.log('📝 Request body:', req.body);
    console.log('📝 Status:', status, 'Type:', typeof status);
    console.log('📝 Note:', note, 'Type:', typeof note);
    console.log('📝 File:', req.file);

    // Status validation
    if (!status || status.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Durum seçimi zorunludur'
      });
    }

    // Siparişi bul
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // Cevap objesi oluştur
    const response = {
      status,
      note: note || '',
      userId,
      userName,
      timestamp: new Date(),
      voiceRecording: req.file ? {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null
    };

    // Siparişe cevabı ekle
    if (!order.responses) {
      order.responses = [];
    }
    order.responses.push(response);

    // Siparişi kaydet
    await order.save();

    // Timeline description'ını oluştur - not varsa ekle
    let timelineDescription;
    if (status === 'not') {
      // NOT durumu seçildiyse sadece notu göster
      timelineDescription = `${userName} siparişe not gönderdi: ${note || 'Not eklendi'}`;
    } else {
      // Diğer durumlar için normal mesaj + not
      timelineDescription = `${userName} siparişe cevap verdi: ${getStatusLabel(status)}`;
      if (note && note.trim()) {
        timelineDescription += ` - Not: ${note}`;
      }
    }
    
    // Ses kaydı varsa özel gösterim ekle
    if (response.voiceRecording) {
      timelineDescription += ` 🎤 (Ses Kaydı)`;
    }
    
    console.log('🎤 Timeline description with voice recording:', timelineDescription);

    // Timeline'a cevap ekle
    const timelineEntry = {
      type: 'response',
      description: timelineDescription,
      timestamp: new Date(),
      user: userName,
      status: status,
      note: note,
      voiceRecording: response.voiceRecording
    };
    
    // Timeline array'ini kontrol et ve ekle
    if (!order.timeline) {
      order.timeline = [];
    }
    order.timeline.push(timelineEntry);
    
    // Siparişi tekrar kaydet
    await order.save();
    
    console.log('Timeline entry added:', timelineEntry);
    console.log('Order timeline length:', order.timeline.length);

    // Bildirim mesajını oluştur - NOT durumu için özel mantık
    let notificationMessage;
    if (status === 'not') {
      // NOT durumu seçildiyse sadece notu göster
      notificationMessage = `${userName} sipariş ${id} için not gönderdi: ${note || 'Not eklendi'}`;
    } else {
      // Diğer durumlar için normal mesaj + not
      notificationMessage = `${userName} sipariş ${id} için cevap gönderdi: ${getStatusLabel(status)}`;
      if (note && note.trim()) {
        notificationMessage += ` - Not: ${note}`;
      }
    }

    // Bildirim alıcılarını belirle - hem sipariş sahibine hem de atanan kişiye
    const recipients = [{
      user: order.createdBy, // Sipariş sahibine bildirim gönder
      isRead: false
    }];
    
    // Eğer sipariş atanmışsa ve atanan kişi gönderen değilse, ona da bildirim gönder
    if (order.assignedTo && order.assignedTo.toString() !== userId.toString()) {
      recipients.push({
        user: order.assignedTo,
        isRead: false
      });
    }

    // Bildirim oluştur
    const notification = new Notification({
      type: 'siparis_cevabi',
      title: 'Sipariş Cevabı',
      message: notificationMessage,
      sender: userId, // Gönderen kullanıcı
      recipients: recipients,
      relatedOrder: order._id,
      priority: 'normal'
    });
    await notification.save();

    // Socket.io ile real-time bildirim gönder
    const io = req.app.get('io');
    if (io) {
    console.log('Socket.io bildirim gönderiliyor...');
    console.log('Gönderen userId:', userId.toString());
    console.log('Gönderen userName:', userName);
    console.log('Order createdBy:', order.createdBy.toString());
    console.log('Order assignedTo:', order.assignedTo ? order.assignedTo.toString() : 'null');
    console.log('Order ID:', order._id.toString());
      
      // Room'daki kullanıcı sayısını kontrol et
      const room = io.sockets.adapter.rooms.get(`user-${order.createdBy}`);
      console.log(`Room user-${order.createdBy} kullanıcı sayısı:`, room ? room.size : 0);
      
      // Sipariş sahibine bildirim gönder
      const notificationData = {
        type: 'siparis_cevabi',
        title: 'Sipariş Cevabı',
        message: notificationMessage, // Not ile birlikte mesaj
        orderId: order._id.toString(),
        timestamp: new Date()
      };
      
      const orderUpdateData = {
        orderId: order._id.toString(),
        type: 'response_added',
        response: response,
        timelineEntry: timelineEntry
      };
      
      console.log('newNotification data:', notificationData);
      console.log('orderUpdated data:', orderUpdateData);
      
      // Tüm ilgili kullanıcılara bildirim gönder
      const targetRooms = new Set();
      
      // Sipariş sahibine bildirim gönder - ama gönderen kendisi değilse
      if (order.createdBy.toString() !== userId.toString()) {
        targetRooms.add(`user-${order.createdBy}`);
      }
      
      // Eğer sipariş atanmışsa ve atanan kişi gönderen değilse, ona da bildirim gönder
      if (order.assignedTo && order.assignedTo.toString() !== userId.toString()) {
        targetRooms.add(`user-${order.assignedTo}`);
      }
      
      // Gönderen kullanıcının kendi odasına bildirim gönderme - kendi gönderdiği mesajı pop-up olarak görmesin
      // targetRooms.add(`user-${userId}`); // Bu satırı kaldırdık

      // Eğer gönderen admin ise, tüm fabrika kullanıcılarını da hedeflere ekle
      // Bu, admin'in gönderdiği mesajların fabrika paneline real-time yansımasını sağlar.
      if (req.user.role === 'admin') {
          const factoryUsers = await User.find({ role: 'fabrika_iscisi' });
          factoryUsers.forEach(factoryUser => {
              if (factoryUser && factoryUser._id.toString() !== userId.toString() && !targetRooms.has(`user-${factoryUser._id.toString()}`)) {
                  targetRooms.add(`user-${factoryUser._id.toString()}`);
                  console.log(`Admin gönderdiği için fabrika kullanıcısı ${factoryUser._id.toString()} hedeflere eklendi.`);
              }
          });
      }
      
      // Her room'a bildirim gönder
      targetRooms.forEach(room => {
        const roomSockets = io.sockets.adapter.rooms.get(room);
        console.log(`Room ${room} kullanıcı sayısı:`, roomSockets ? roomSockets.size : 0);
        io.to(room).emit('newNotification', notificationData);
        io.to(room).emit('orderUpdated', orderUpdateData);
      });

      console.log('Socket.io bildirimleri gönderildi');
    } else {
      console.log('Socket.io instance bulunamadı!');
    }

    res.status(201).json({
      success: true,
      message: 'Cevap başarıyla gönderildi',
      data: {
        response,
        order
      }
    });
  } catch (error) {
    console.error('Send response error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;