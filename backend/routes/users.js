const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Tüm kullanıcıları listele
// @access  Private (Admin)
router.get('/', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { role, isActive, search } = req.query;
    
    // Filtreleme koşulları
    let filter = {};
    
    if (role) {
      filter.role = role;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/stats
// @desc    Kullanıcı istatistikleri
// @access  Private (Admin)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        roleStats,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/:id
// @desc    Belirli bir kullanıcıyı getir
// @access  Private (Owner or Admin)
router.get('/:id', authenticateToken, requireOwnerOrAdmin, validateObjectId(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Kullanıcı bilgilerini güncelle
// @access  Private (Owner or Admin)
router.put('/:id', authenticateToken, requireOwnerOrAdmin, validateObjectId(), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      whatsappNumber,
      department,
      role,
      isActive,
      notifications
    } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Email kontrolü (değiştiriliyorsa)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Bu email adresi zaten kullanılıyor'
        });
      }
    }
    
    // Sadece admin rol değiştirebilir
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Rol değiştirmek için admin yetkisi gereklidir'
      });
    }
    
    // Sadece admin hesap durumunu değiştirebilir
    if (isActive !== undefined && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hesap durumunu değiştirmek için admin yetkisi gereklidir'
      });
    }
    
    // Güncelleme
    const updateData = {
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      phone: phone || user.phone,
      whatsappNumber: whatsappNumber || user.whatsappNumber,
      department: department || user.department
    };
    
    if (req.user.role === 'admin') {
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
    }
    
    if (notifications) {
      updateData.notifications = {
        ...user.notifications,
        ...notifications
      };
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Kullanıcı bilgileri güncellendi',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Kullanıcıyı sil
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kendi hesabını silmeyi engelle
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı silemezsiniz'
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/users/:id/toggle-status
// @desc    Kullanıcı durumunu değiştir (aktif/pasif)
// @access  Private (Admin)
router.put('/:id/toggle-status', authenticateToken, requireAdmin, validateObjectId(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kendi hesabını devre dışı bırakmayı engelle
    if (req.params.id === req.user._id.toString() && user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı devre dışı bırakamazsınız'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({
      success: true,
      message: `Kullanıcı ${user.isActive ? 'aktif' : 'pasif'} duruma getirildi`,
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/role/:role
// @desc    Belirli role sahip kullanıcıları getir
// @access  Private
router.get('/role/:role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!['admin', 'magaza_personeli', 'fabrika_iscisi'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz rol'
      });
    }
    
    const users = await User.find({ role, isActive: true })
      .select('firstName lastName username email role')
      .sort({ firstName: 1 });
    
    res.json({
      success: true,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;