const express = require('express');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { authenticateToken, requireStoreOrAdmin } = require('../middleware/auth');
const { validateTaskCreation, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Görevleri listele
// @access  Private
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { status, priority, category, assignedTo, createdBy, search, sortBy, sortOrder } = req.query;
    
    // Filtreleme koşulları
    let filter = {};
    
    // Rol bazlı filtreleme
    if (req.user.role === 'fabrika_iscisi') {
      filter.$or = [
        { assignedTo: req.user._id },
        { assignedTo: null, location: { $in: ['fabrika', 'her_ikisi'] } }
      ];
    } else if (req.user.role === 'magaza_personeli') {
      filter.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id },
        { location: { $in: ['magaza', 'her_ikisi'] } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (category) {
      filter.category = category;
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
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sıralama
    let sort = { createdAt: -1 };
    if (sortBy) {
      const order = sortOrder === 'asc' ? 1 : -1;
      sort = { [sortBy]: order };
    }
    
    const tasks = await Task.find(filter)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('relatedOrder', 'orderNumber title')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Task.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/tasks/stats
// @desc    Görev istatistikleri
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    let filter = {};
    
    // Rol bazlı filtreleme
    if (req.user.role === 'fabrika_iscisi') {
      filter.$or = [
        { assignedTo: req.user._id },
        { assignedTo: null, location: { $in: ['fabrika', 'her_ikisi'] } }
      ];
    } else if (req.user.role === 'magaza_personeli') {
      filter.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id },
        { location: { $in: ['magaza', 'her_ikisi'] } }
      ];
    }
    
    const totalTasks = await Task.countDocuments(filter);
    
    const statusStats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const priorityStats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const categoryStats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const urgentTasks = await Task.countDocuments({
      ...filter,
      $or: [
        { isUrgent: true },
        { priority: 'acil' }
      ]
    });
    
    const overdueTasks = await Task.countDocuments({
      ...filter,
      dueDate: { $lt: new Date() },
      status: { $nin: ['tamamlandi', 'iptal_edildi'] }
    });
    
    const myTasks = await Task.countDocuments({
      assignedTo: req.user._id,
      status: { $nin: ['tamamlandi', 'iptal_edildi'] }
    });
    
    const recentTasks = await Task.find(filter)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('relatedOrder', 'orderNumber title')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      success: true,
      data: {
        totalTasks,
        statusStats,
        priorityStats,
        categoryStats,
        urgentTasks,
        overdueTasks,
        myTasks,
        recentTasks
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/tasks
// @desc    Yeni görev oluştur
// @access  Private (Store or Admin)
router.post('/', authenticateToken, requireStoreOrAdmin, validateTaskCreation, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const task = new Task(taskData);
    await task.save();
    
    // Populate edilmiş görev bilgilerini al
    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('relatedOrder', 'orderNumber title');
    
    // Bildirim oluştur
    if (task.assignedTo) {
      // Kişiye özel görev bildirimi
      await Notification.createForUsers({
        title: 'Size Yeni Görev Atandı',
        message: `"${task.title}" başlıklı yeni bir görev size atandı.`,
        type: 'gorev_atandi',
        sender: req.user._id,
        relatedTask: task._id,
        priority: task.priority,
        actionUrl: `/tasks/${task._id}`,
        actionText: 'Görevi Görüntüle'
      }, [task.assignedTo]);
    } else {
      // Genel görev bildirimi
      await Notification.createGlobal({
        title: 'Yeni Genel Görev Oluşturuldu',
        message: `"${task.title}" başlıklı yeni bir genel görev oluşturuldu.`,
        type: 'gorev_atandi',
        sender: req.user._id,
        relatedTask: task._id,
        priority: task.priority,
        actionUrl: `/tasks/${task._id}`,
        actionText: 'Görevi Görüntüle'
      }, ['fabrika_iscisi']);
    }
    
    // Socket.io ile gerçek zamanlı bildirim
    const io = req.app.get('io');
    io.emit('new-task', {
      task: populatedTask,
      message: 'Yeni görev oluşturuldu'
    });
    
    res.status(201).json({
      success: true,
      message: 'Görev başarıyla oluşturuldu',
      data: {
        task: populatedTask
      }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Belirli bir görevi getir
// @access  Private
router.get('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'firstName lastName username email')
      .populate('assignedTo', 'firstName lastName username email')
      .populate('relatedOrder', 'orderNumber title status')
      .populate('comments.user', 'firstName lastName username');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Görev bulunamadı'
      });
    }
    
    // Erişim kontrolü
    if (req.user.role === 'fabrika_iscisi') {
      if (task.assignedTo && task.assignedTo._id.toString() !== req.user._id.toString() && 
          !['fabrika', 'her_ikisi'].includes(task.location)) {
        return res.status(403).json({
          success: false,
          message: 'Bu göreve erişim yetkiniz bulunmuyor'
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        task
      }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Görevi güncelle
// @access  Private
router.put('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Görev bulunamadı'
      });
    }
    
    // Erişim kontrolü
    const canEdit = req.user.role === 'admin' || 
                   task.createdBy.toString() === req.user._id.toString() ||
                   (task.assignedTo && task.assignedTo.toString() === req.user._id.toString());
    
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Bu görevi düzenleme yetkiniz bulunmuyor'
      });
    }
    
    const oldStatus = task.status;
    
    // Güncelleme
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'firstName lastName username')
    .populate('assignedTo', 'firstName lastName username')
    .populate('relatedOrder', 'orderNumber title');
    
    // Durum değişikliği bildirimi
    if (oldStatus !== updatedTask.status && updatedTask.status === 'tamamlandi') {
      await Notification.createGlobal({
        title: 'Görev Tamamlandı',
        message: `"${updatedTask.title}" görevi tamamlandı.`,
        type: 'gorev_tamamlandi',
        sender: req.user._id,
        relatedTask: updatedTask._id,
        priority: updatedTask.priority,
        actionUrl: `/tasks/${updatedTask._id}`,
        actionText: 'Görevi Görüntüle'
      }, ['admin', 'magaza_personeli']);
      
      // Socket.io ile gerçek zamanlı bildirim
      const io = req.app.get('io');
      io.emit('task-completed', {
        task: updatedTask,
        message: 'Görev tamamlandı'
      });
    }
    
    res.json({
      success: true,
      message: 'Görev başarıyla güncellendi',
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Görevi sil
// @access  Private (Admin or Creator)
router.delete('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Görev bulunamadı'
      });
    }
    
    // Sadece admin veya görev oluşturan silebilir
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu görevi silme yetkiniz bulunmuyor'
      });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Görev başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/tasks/:id/start
// @desc    Görevi başlat
// @access  Private
router.post('/:id/start', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Görev bulunamadı'
      });
    }
    
    // Sadece atanan kişi veya admin başlatabilir
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu görevi başlatma yetkiniz bulunmuyor'
      });
    }
    
    if (task.status !== 'beklemede') {
      return res.status(400).json({
        success: false,
        message: 'Sadece beklemedeki görevler başlatılabilir'
      });
    }
    
    await task.startTask();
    
    const updatedTask = await Task.findById(req.params.id)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('relatedOrder', 'orderNumber title');
    
    res.json({
      success: true,
      message: 'Görev başlatıldı',
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    console.error('Start task error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/tasks/:id/complete
// @desc    Görevi tamamla
// @access  Private
router.post('/:id/complete', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Görev bulunamadı'
      });
    }
    
    // Sadece atanan kişi veya admin tamamlayabilir
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu görevi tamamlama yetkiniz bulunmuyor'
      });
    }
    
    if (task.status === 'tamamlandi') {
      return res.status(400).json({
        success: false,
        message: 'Görev zaten tamamlanmış'
      });
    }
    
    await task.completeTask();
    
    const updatedTask = await Task.findById(req.params.id)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .populate('relatedOrder', 'orderNumber title');
    
    // Tamamlanma bildirimi
    await Notification.createGlobal({
      title: 'Görev Tamamlandı',
      message: `"${updatedTask.title}" görevi ${req.user.fullName} tarafından tamamlandı.`,
      type: 'gorev_tamamlandi',
      sender: req.user._id,
      relatedTask: updatedTask._id,
      priority: updatedTask.priority,
      actionUrl: `/tasks/${updatedTask._id}`,
      actionText: 'Görevi Görüntüle'
    }, ['admin', 'magaza_personeli']);
    
    // Socket.io ile gerçek zamanlı bildirim
    const io = req.app.get('io');
    io.emit('task-completed', {
      task: updatedTask,
      completedBy: req.user,
      message: 'Görev tamamlandı'
    });
    
    res.json({
      success: true,
      message: 'Görev tamamlandı',
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Göreve yorum ekle
// @access  Private
router.post('/:id/comments', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Yorum mesajı gereklidir'
      });
    }
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Görev bulunamadı'
      });
    }
    
    task.comments.push({
      user: req.user._id,
      message: message.trim()
    });
    
    await task.save();
    
    const updatedTask = await Task.findById(req.params.id)
      .populate('comments.user', 'firstName lastName username');
    
    res.json({
      success: true,
      message: 'Yorum başarıyla eklendi',
      data: {
        comments: updatedTask.comments
      }
    });
  } catch (error) {
    console.error('Add task comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/tasks/:id/steps/:stepId
// @desc    Görev adımını güncelle
// @access  Private
router.put('/:id/steps/:stepId', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { isCompleted } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Görev bulunamadı'
      });
    }
    
    const step = task.steps.id(req.params.stepId);
    
    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'Adım bulunamadı'
      });
    }
    
    // Sadece atanan kişi veya admin adımları güncelleyebilir
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu adımı güncelleme yetkiniz bulunmuyor'
      });
    }
    
    step.isCompleted = isCompleted;
    if (isCompleted) {
      step.completedBy = req.user._id;
      step.completedAt = new Date();
    } else {
      step.completedBy = null;
      step.completedAt = null;
    }
    
    await task.save();
    
    const updatedTask = await Task.findById(req.params.id)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username');
    
    res.json({
      success: true,
      message: 'Adım başarıyla güncellendi',
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    console.error('Update task step error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;