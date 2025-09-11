const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Order = require('../models/Order');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Mevcut kullanıcıları temizle
    await User.deleteMany({});
    
    const users = [
      {
        username: 'admin',
        email: 'admin@fabrika.com',
        password: 'admin123',
        firstName: 'Sistem',
        lastName: 'Yöneticisi',
        role: 'admin',
        phone: '+90 555 000 0001',
        whatsappNumber: '+90 555 000 0001',
        isActive: true,
        department: 'Yönetim'
      },
      {
        username: 'magaza1',
        email: 'magaza1@fabrika.com',
        password: 'magaza123',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        role: 'magaza_personeli',
        phone: '+90 555 000 0002',
        whatsappNumber: '+90 555 000 0002',
        isActive: true,
        department: 'Mağaza'
      },
      {
        username: 'magaza2',
        email: 'magaza2@fabrika.com',
        password: 'magaza123',
        firstName: 'Fatma',
        lastName: 'Demir',
        role: 'magaza_personeli',
        phone: '+90 555 000 0003',
        whatsappNumber: '+90 555 000 0003',
        isActive: true,
        department: 'Mağaza'
      },
      {
        username: 'fabrika1',
        email: 'fabrika1@fabrika.com',
        password: 'fabrika123',
        firstName: 'Mehmet',
        lastName: 'Kaya',
        role: 'fabrika_iscisi',
        phone: '+90 555 000 0004',
        whatsappNumber: '+90 555 000 0004',
        isActive: true,
        department: 'Üretim'
      },
      {
        username: 'fabrika2',
        email: 'fabrika2@fabrika.com',
        password: 'fabrika123',
        firstName: 'Ayşe',
        lastName: 'Özkan',
        role: 'fabrika_iscisi',
        phone: '+90 555 000 0005',
        whatsappNumber: '+90 555 000 0005',
        isActive: true,
        department: 'Kalite Kontrol'
      },
      {
        username: 'fabrika3',
        email: 'fabrika3@fabrika.com',
        password: 'fabrika123',
        firstName: 'Ali',
        lastName: 'Çelik',
        role: 'fabrika_iscisi',
        phone: '+90 555 000 0006',
        whatsappNumber: '+90 555 000 0006',
        isActive: true,
        department: 'Paketleme'
      }
    ];

    // Kullanıcıları tek tek oluştur (şifre hash'leme için)
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save(); // Bu şifreyi hash'leyecek
      createdUsers.push(user);
    }
    console.log(`${createdUsers.length} kullanıcı oluşturuldu`);
    return createdUsers;
  } catch (error) {
    console.error('Kullanıcı seed hatası:', error);
    throw error;
  }
};

const seedOrders = async (users) => {
  try {
    // Mevcut siparişleri temizle
    await Order.deleteMany({});
    
    const admin = users.find(u => u.role === 'admin');
    const magaza1 = users.find(u => u.username === 'magaza1');
    const magaza2 = users.find(u => u.username === 'magaza2');
    const fabrika1 = users.find(u => u.username === 'fabrika1');
    
    const orders = [
      {
        orderNumber: 'SIP-20240101-001',
        title: 'Kış Koleksiyonu Üretimi',
        description: 'Kış sezonu için mont ve ceket üretimi',
        items: [
          {
            productName: 'Erkek Mont',
            quantity: 100,
            unit: 'adet',
            description: 'XL, L, M bedenlerde, siyah ve lacivert renklerde'
          },
          {
            productName: 'Kadın Ceket',
            quantity: 150,
            unit: 'adet',
            description: 'S, M, L bedenlerde, kırmızı, siyah, beyaz renklerde'
          }
        ],
        priority: 'yüksek',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 gün sonra
        status: 'beklemede',
        createdBy: magaza1._id,
        assignedTo: fabrika1._id,
        location: 'fabrika',
        estimatedCost: 25000,
        materialStatus: {
          required: ['Kumaş', 'Fermuar', 'Düğme', 'Astar'],
          available: ['Kumaş', 'Düğme'],
          missing: ['Fermuar', 'Astar']
        }
      },
      {
        orderNumber: 'SIP-20240101-002',
        title: 'Acil Tamir İşlemi',
        description: 'Müşteri iadesi olan ürünlerin tamiri',
        items: [
          {
            productName: 'Pantolon Tamiri',
            quantity: 25,
            unit: 'adet',
            description: 'Fermuar değişimi ve dikiş tamiri'
          }
        ],
        priority: 'acil',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 gün sonra
        status: 'uretimde',
        createdBy: magaza2._id,
        assignedTo: fabrika1._id,
        location: 'fabrika',
        estimatedCost: 1500,
        isUrgent: true
      },
      {
        orderNumber: 'SIP-20240101-003',
        title: 'Yaz Koleksiyonu Hazırlık',
        description: 'Yaz sezonu için ürün geliştirme',
        items: [
          {
            productName: 'T-Shirt',
            quantity: 200,
            unit: 'adet',
            description: 'Pamuklu, çeşitli renklerde'
          },
          {
            productName: 'Şort',
            quantity: 100,
            unit: 'adet',
            description: 'Kot ve keten kumaş'
          }
        ],
        priority: 'normal',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
        status: 'beklemede',
        createdBy: admin._id,
        location: 'fabrika',
        estimatedCost: 15000
      }
    ];

    const createdOrders = await Order.insertMany(orders);
    console.log(`${createdOrders.length} sipariş oluşturuldu`);
    return createdOrders;
  } catch (error) {
    console.error('Sipariş seed hatası:', error);
    throw error;
  }
};

const seedTasks = async (users, orders) => {
  try {
    // Mevcut görevleri temizle
    await Task.deleteMany({});
    
    const admin = users.find(u => u.role === 'admin');
    const fabrika1 = users.find(u => u.username === 'fabrika1');
    const fabrika2 = users.find(u => u.username === 'fabrika2');
    const fabrika3 = users.find(u => u.username === 'fabrika3');
    const order1 = orders[0];
    const order2 = orders[1];
    
    const tasks = [
      {
        title: 'Kumaş Kalite Kontrolü',
        description: 'Gelen kumaşların kalite kontrolünün yapılması',
        category: 'kalite_kontrol',
        priority: 'yüksek',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'beklemede',
        createdBy: admin._id,
        assignedTo: fabrika2._id,
        relatedOrder: order1._id,
        location: 'fabrika',
        estimatedDuration: 4, // saat
        steps: [
          {
            title: 'Kumaş renklerini kontrol et',
            description: 'Renk uygunluğunu kontrol et',
            order: 1
          },
          {
            title: 'Kumaş kalitesini test et',
            description: 'Dayanıklılık testleri yap',
            order: 2
          },
          {
            title: 'Rapor hazırla',
            description: 'Kalite kontrol raporunu hazırla',
            order: 3
          }
        ]
      },
      {
        title: 'Acil Tamir Görevleri',
        description: 'İade edilen ürünlerin tamiri',
        category: 'diğer',
        priority: 'acil',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        status: 'devam_ediyor',
        createdBy: admin._id,
        assignedTo: fabrika1._id,
        relatedOrder: order2._id,
        location: 'fabrika',
        estimatedDuration: 6,
        isUrgent: true,
        steps: [
          {
            title: 'Hasarlı ürünleri ayır',
            description: 'Tamir edilecek ürünleri kategorize et',
            order: 1,
            isCompleted: true,
            completedBy: fabrika1._id,
            completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            title: 'Fermuar değişimi',
            description: 'Bozuk fermuarları değiştir',
            order: 2,
            isCompleted: true,
            completedBy: fabrika1._id,
            completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
          },
          {
            title: 'Dikiş tamiri',
            description: 'Açılan dikişleri onar',
            order: 3
          }
        ]
      },
      {
        title: 'Makine Bakımı',
        description: 'Üretim makinelerinin haftalık bakımı',
        category: 'bakım',
        priority: 'normal',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'beklemede',
        createdBy: admin._id,
        assignedTo: fabrika3._id,
        location: 'fabrika',
        estimatedDuration: 8,
        steps: [
          {
            title: 'Dikiş makinesi bakımı',
            description: 'Tüm dikiş makinelerini kontrol et',
            order: 1
          },
          {
            title: 'Ütü sistemleri kontrolü',
            description: 'Ütü ve pres makinelerini kontrol et',
            order: 2
          },
          {
            title: 'Kesim makinesi bakımı',
            description: 'Kumaş kesim makinelerini kontrol et',
            order: 3
          }
        ]
      },
      {
        title: 'Genel Temizlik',
        description: 'Fabrika genel temizlik işlemleri',
        category: 'temizlik',
        priority: 'düşük',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'beklemede',
        createdBy: admin._id,
        assignedTo: null, // Genel görev
        location: 'fabrika',
        estimatedDuration: 3
      }
    ];

    const createdTasks = await Task.insertMany(tasks);
    console.log(`${createdTasks.length} görev oluşturuldu`);
    return createdTasks;
  } catch (error) {
    console.error('Görev seed hatası:', error);
    throw error;
  }
};

const seedNotifications = async (users, orders, tasks) => {
  try {
    // Mevcut bildirimleri temizle
    await Notification.deleteMany({});
    
    const admin = users.find(u => u.role === 'admin');
    const magaza1 = users.find(u => u.username === 'magaza1');
    const fabrika1 = users.find(u => u.username === 'fabrika1');
    const order1 = orders[0];
    const task1 = tasks[0];
    
    const notifications = [
      {
        title: 'Hoş Geldiniz!',
        message: 'Fabrika-Mağaza Sipariş Takip Sistemine hoş geldiniz. Sistem başarıyla kurulmuştur.',
        type: 'sistem_bildirimi',
        priority: 'normal',
        sender: admin._id,
        isGlobal: true,
        targetRoles: ['admin', 'magaza_personeli', 'fabrika_iscisi'],
        actionUrl: '/dashboard',
        actionText: 'Panele Git'
      },
      {
        title: 'Yeni Sipariş Atandı',
        message: `"${order1.title}" siparişi size atandı. Lütfen detayları inceleyin.`,
        type: 'siparis_olusturuldu',
        priority: 'yüksek',
        sender: magaza1._id,
        relatedOrder: order1._id,
        recipients: [
          {
            user: fabrika1._id,
            isRead: false,
            readAt: null,
            deliveryStatus: 'delivered'
          }
        ],
        actionUrl: `/orders/${order1._id}`,
        actionText: 'Siparişi Görüntüle'
      },
      {
        title: 'Acil Görev!',
        message: `"${task1.title}" görevi acil olarak atandı. Lütfen öncelik verin.`,
        type: 'gorev_atandi',
        priority: 'acil',
        sender: admin._id,
        relatedTask: task1._id,
        recipients: [
          {
            user: fabrika1._id,
            isRead: false,
            readAt: null,
            deliveryStatus: 'delivered'
          }
        ],
        actionUrl: `/tasks/${task1._id}`,
        actionText: 'Görevi Görüntüle'
      },
      {
        title: 'Haftalık Rapor Hatırlatması',
        message: 'Haftalık üretim raporunuzu hazırlamayı unutmayın.',
        type: 'genel_duyuru',
        priority: 'normal',
        sender: admin._id,
        isGlobal: true,
        targetRoles: ['fabrika_iscisi'],
        actionUrl: '/reports',
        actionText: 'Rapor Hazırla'
      }
    ];

    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`${createdNotifications.length} bildirim oluşturuldu`);
    return createdNotifications;
  } catch (error) {
    console.error('Bildirim seed hatası:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('Veritabanı seed işlemi başlatılıyor...');
    
    await connectDB();
    
    const users = await seedUsers();
    const orders = await seedOrders(users);
    const tasks = await seedTasks(users, orders);
    const notifications = await seedNotifications(users, orders, tasks);
    
    console.log('\n=== SEED İŞLEMİ TAMAMLANDI ===');
    console.log(`✅ ${users.length} kullanıcı`);
    console.log(`✅ ${orders.length} sipariş`);
    console.log(`✅ ${tasks.length} görev`);
    console.log(`✅ ${notifications.length} bildirim`);
    console.log('\n=== TEST KULLANICILARI ===');
    console.log('Admin: username=admin, password=admin123');
    console.log('Mağaza 1: username=magaza1, password=magaza123');
    console.log('Mağaza 2: username=magaza2, password=magaza123');
    console.log('Fabrika 1: username=fabrika1, password=fabrika123');
    console.log('Fabrika 2: username=fabrika2, password=fabrika123');
    console.log('Fabrika 3: username=fabrika3, password=fabrika123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed işlemi hatası:', error);
    process.exit(1);
  }
};

// Script çalıştırıldığında seed işlemini başlat
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  seedUsers,
  seedOrders,
  seedTasks,
  seedNotifications
};