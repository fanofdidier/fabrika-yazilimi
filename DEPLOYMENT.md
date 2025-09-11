# FabrikaYazılımı Deployment Rehberi

## Gereksinimler

- Docker ve Docker Compose
- Node.js 18+ (geliştirme için)
- PostgreSQL 15+ (manuel kurulum için)
- Redis (manuel kurulum için)

## Hızlı Başlangıç (Docker ile)

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd fabrikayazilimi
```

### 2. Environment Dosyalarını Hazırlayın
```bash
# Backend için
cp backend/.env.example backend/.env

# Frontend için (opsiyonel)
cp frontend/.env.production frontend/.env.local
```

### 3. Docker Compose ile Başlatın
```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları takip et
docker-compose logs -f
```

### 4. Veritabanını Hazırlayın
```bash
# Seed verilerini yükle
docker-compose exec backend npm run seed
```

### 5. Uygulamaya Erişin
- Frontend: http://localhost
- Backend API: http://localhost:5000
- Database: localhost:5432

## Manuel Kurulum

### Backend Kurulumu
```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npm run seed
npm start
```

### Frontend Kurulumu
```bash
cd frontend
npm install
npm run build
npm install -g serve
serve -s build -l 3000
```

## Production Deployment

### 1. Environment Variables
Production ortamında aşağıdaki environment variable'ları ayarlayın:

**Backend (.env):**
```env
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=fabrika_db
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
JWT_SECRET=your-super-secure-jwt-secret
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_TOKEN=your-whatsapp-token
```

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_ENVIRONMENT=production
```

### 2. SSL Sertifikası
Production için SSL sertifikası ekleyin:
```bash
mkdir -p nginx/ssl
# SSL sertifikalarınızı nginx/ssl/ klasörüne kopyalayın
```

### 3. Production ile Başlatma
```bash
# Production profili ile başlat
docker-compose --profile production up -d
```

## Monitoring ve Bakım

### Logları İnceleme
```bash
# Tüm servislerin logları
docker-compose logs

# Belirli bir servisin logları
docker-compose logs backend
docker-compose logs frontend
```

### Veritabanı Backup
```bash
# Backup oluştur
docker-compose exec postgres pg_dump -U fabrika_user fabrika_db > backup.sql

# Backup'ı geri yükle
docker-compose exec -T postgres psql -U fabrika_user fabrika_db < backup.sql
```

### Güncelleme
```bash
# Servisleri durdur
docker-compose down

# Yeni kodu çek
git pull

# Image'ları yeniden oluştur
docker-compose build

# Servisleri başlat
docker-compose up -d
```

## Güvenlik

### 1. Firewall Ayarları
- Port 80 (HTTP) ve 443 (HTTPS) açık olmalı
- Port 5432 (PostgreSQL) ve 6379 (Redis) sadece internal network'ten erişilebilir olmalı

### 2. SSL/TLS
- Production'da mutlaka HTTPS kullanın
- Let's Encrypt ile ücretsiz SSL sertifikası alabilirsiniz

### 3. Environment Variables
- Tüm şifreler ve secret key'ler güvenli olmalı
- Production'da default şifreler kullanmayın

## Troubleshooting

### Yaygın Sorunlar

1. **Port çakışması**
   ```bash
   # Kullanılan portları kontrol et
   netstat -tulpn | grep :80
   netstat -tulpn | grep :5000
   ```

2. **Veritabanı bağlantı sorunu**
   ```bash
   # PostgreSQL container'ının çalıştığını kontrol et
   docker-compose ps postgres
   
   # Veritabanı loglarını incele
   docker-compose logs postgres
   ```

3. **Frontend build sorunu**
   ```bash
   # Node modules'ları temizle ve yeniden yükle
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### Performance Optimizasyonu

1. **Database Indexing**
   - Sık kullanılan sorgular için index ekleyin
   - Query performance'ını monitör edin

2. **Caching**
   - Redis cache'i aktif kullanın
   - Static asset'ler için CDN kullanın

3. **Load Balancing**
   - Yüksek trafik için multiple backend instance'ları çalıştırın
   - Nginx load balancer kullanın

## Destek

Sorularınız için:
- Email: support@fabrikayazilimi.com
- Documentation: https://docs.fabrikayazilimi.com
- GitHub Issues: https://github.com/fabrikayazilimi/issues