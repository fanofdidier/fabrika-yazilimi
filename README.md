# Fabrika-Mağaza Sipariş Takip Sistemi

İki farklı lokasyonda (mağaza-fabrika) bulunan işletme için sipariş yönetimi ve görev takip sistemi.

## Özellikler

- 🏪 Mağazadan fabrikaya sipariş gönderme
- 📊 Sipariş durumu takibi ve güncelleme
- 📦 Ham madde durumu bildirimi
- ✅ Görev atama ve takip
- 🔔 Güçlü bildirim sistemi (Web + WhatsApp)
- 👥 Kullanıcı yetkilendirme sistemi

## Roller

### İşletme Sahibi (Admin)
- Tüm sisteme erişim
- Sipariş oluşturma
- Görev atama (kişiye özel/genel)
- Bildirim gönderme
- Raporlama

### Mağaza Personeli
- Sipariş oluşturma
- Sipariş takibi
- Fabrikadan gelen bildirimleri görme

### Fabrika İşçileri
- Tablet/telefon ile erişim
- Atanan görevleri görme
- Görev tamamlama onayı
- Sipariş durumu güncelleme

## Teknoloji Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Veritabanı**: MongoDB
- **Bildirimler**: Socket.io + WhatsApp API
- **Authentication**: JWT

## Kurulum

```bash
# Projeyi klonlayın
git clone [repo-url]

# Backend bağımlılıklarını yükleyin
cd backend
npm install

# Frontend bağımlılıklarını yükleyin
cd ../frontend
npm install

# Backend'i başlatın
cd ../backend
npm start

# Frontend'i başlatın
cd ../frontend
npm start
```

## Lisans

MIT License