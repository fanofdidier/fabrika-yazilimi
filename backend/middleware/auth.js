const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token doğrulama middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Erişim token\'ı gereklidir' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // Kullanıcıyı veritabanından al
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz token - kullanıcı bulunamadı' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Hesap devre dışı bırakılmış' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token süresi dolmuş' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
};

// Rol kontrolü middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Önce giriş yapmalısınız' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu işlem için yetkiniz bulunmuyor' 
      });
    }

    next();
  };
};

// Admin kontrolü middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Önce giriş yapmalısınız' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için admin yetkisi gereklidir' 
    });
  }

  next();
};

// Mağaza personeli, fabrika işçisi veya admin kontrolü
const requireStoreOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Önce giriş yapmalısınız' 
    });
  }

  if (!['admin', 'magaza_personeli', 'fabrika_iscisi'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için yetkiniz bulunmuyor' 
    });
  }

  next();
};

// Kendi profilini düzenleme veya admin kontrolü
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Önce giriş yapmalısınız' 
    });
  }

  const targetUserId = req.params.id || req.params.userId;
  
  if (req.user.role === 'admin' || req.user._id.toString() === targetUserId) {
    return next();
  }

  return res.status(403).json({ 
    success: false, 
    message: 'Bu işlem için yetkiniz bulunmuyor' 
  });
};

// Optional auth - token varsa doğrula, yoksa devam et
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Token geçersizse de devam et
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAuth: authenticateToken, // Alias for backward compatibility
  authorizeRoles,
  requireAdmin,
  requireStoreOrAdmin,
  requireOwnerOrAdmin,
  optionalAuth
};