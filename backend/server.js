const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "http://192.168.1.101:3000"
    ],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://192.168.1.101:3000"
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ses dosyalarını serve et - CORS header'ları ile
app.use('/uploads/voice-recordings', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static('uploads/voice-recordings'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 1000, // IP başına maksimum 1000 istek (daha esnek)
  message: {
    error: 'Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.',
    retryAfter: '15 dakika'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fabrika-magaza', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch(err => console.error('MongoDB bağlantı hatası:', err));

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  } else {
    next(new Error('Authentication error'));
  }
});

// Socket.io bağlantı yönetimi
io.on('connection', (socket) => {
  console.log('Kullanıcı bağlandı:', socket.id, 'User ID:', socket.userId);
  
  // Kullanıcıyı kendi room'una otomatik katıl
  if (socket.userId) {
    socket.join(`user-${socket.userId}`);
    console.log(`Kullanıcı ${socket.userId} kendi odasına katıldı`);
  }
  
  socket.on('joinRoom', (roomName) => {
    socket.join(roomName);
    console.log(`Kullanıcı ${socket.userId} ${roomName} odasına katıldı`);
  });

  socket.on('leaveRoom', (roomName) => {
    socket.leave(roomName);
    console.log(`Kullanıcı ${socket.userId} ${roomName} odasından ayrıldı`);
  });
  
  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

// Socket.io instance'ını app'e ekle
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/products', require('./routes/products'));

// Ana route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Fabrika-Mağaza Sipariş Takip Sistemi API',
    version: '1.0.0',
    status: 'Çalışıyor'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint bulunamadı' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});