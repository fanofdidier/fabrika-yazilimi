const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (!user.isActive) {
        return next(new Error('Authentication error: User account is inactive'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.user = user;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.user.role})`);
    
    // Kullanıcıyı role-based room'a ekle
    socket.join(socket.userRole);
    socket.join(`user_${socket.userId}`);
    
    // Admin ve mağaza personeli için özel room
    if (['admin', 'magaza_personeli'].includes(socket.userRole)) {
      socket.join('management');
    }
    
    // Fabrika işçileri için özel room
    if (socket.userRole === 'fabrika_iscisi') {
      socket.join('factory');
    }

    // Kullanıcının online durumunu güncelle
    User.findByIdAndUpdate(socket.userId, { 
      lastSeen: new Date(),
      isOnline: true 
    }).exec();

    // Diğer kullanıcılara online durumunu bildir
    socket.broadcast.emit('user-online', {
      userId: socket.userId,
      username: socket.user.username,
      role: socket.userRole
    });

    // Ping-pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Bildirim okundu işaretleme
    socket.on('mark-notification-read', (data) => {
      socket.broadcast.to('management').emit('notification-read', {
        notificationId: data.notificationId,
        userId: socket.userId
      });
    });

    // Sipariş durumu güncelleme bildirimi
    socket.on('order-status-updated', (data) => {
      socket.broadcast.to('management').emit('order-status-changed', {
        orderId: data.orderId,
        newStatus: data.newStatus,
        updatedBy: socket.userId,
        timestamp: new Date()
      });
    });

    // Görev durumu güncelleme bildirimi
    socket.on('task-status-updated', (data) => {
      socket.broadcast.emit('task-status-changed', {
        taskId: data.taskId,
        newStatus: data.newStatus,
        updatedBy: socket.userId,
        timestamp: new Date()
      });
    });

    // Typing indicator for comments
    socket.on('typing-start', (data) => {
      socket.broadcast.to(`${data.type}_${data.id}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.user.username,
        type: data.type,
        id: data.id
      });
    });

    socket.on('typing-stop', (data) => {
      socket.broadcast.to(`${data.type}_${data.id}`).emit('user-stopped-typing', {
        userId: socket.userId,
        type: data.type,
        id: data.id
      });
    });

    // Join specific order/task rooms for real-time updates
    socket.on('join-order', (orderId) => {
      socket.join(`order_${orderId}`);
    });

    socket.on('leave-order', (orderId) => {
      socket.leave(`order_${orderId}`);
    });

    socket.on('join-task', (taskId) => {
      socket.join(`task_${taskId}`);
    });

    socket.on('leave-task', (taskId) => {
      socket.leave(`task_${taskId}`);
    });

    // Emergency notification
    socket.on('emergency-alert', (data) => {
      if (socket.userRole === 'admin') {
        io.emit('emergency-notification', {
          message: data.message,
          severity: data.severity || 'high',
          timestamp: new Date(),
          from: socket.user.username
        });
      }
    });

    // Disconnect event
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.user.username} (${reason})`);
      
      // Kullanıcının offline durumunu güncelle
      User.findByIdAndUpdate(socket.userId, { 
        lastSeen: new Date(),
        isOnline: false 
      }).exec();

      // Diğer kullanıcılara offline durumunu bildir
      socket.broadcast.emit('user-offline', {
        userId: socket.userId,
        username: socket.user.username,
        role: socket.userRole,
        lastSeen: new Date()
      });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.username}:`, error);
    });
  });

  // Global socket events for broadcasting
  io.broadcastToRole = (role, event, data) => {
    io.to(role).emit(event, data);
  };

  io.broadcastToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  io.broadcastToManagement = (event, data) => {
    io.to('management').emit(event, data);
  };

  io.broadcastToFactory = (event, data) => {
    io.to('factory').emit(event, data);
  };

  io.broadcastToOrder = (orderId, event, data) => {
    io.to(`order_${orderId}`).emit(event, data);
  };

  io.broadcastToTask = (taskId, event, data) => {
    io.to(`task_${taskId}`).emit(event, data);
  };

  return io;
};

module.exports = initializeSocket;