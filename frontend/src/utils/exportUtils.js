// Export utilities for PDF and Excel functionality

export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    alert('İndirilecek veri bulunamadı.');
    return;
  }

  // CSV başlıklarını oluştur
  const headers = Object.keys(data[0]);
  
  // CSV içeriğini oluştur
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Virgül, tırnak veya yeni satır içeren değerleri tırnak içine al
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  // BOM ekle (Türkçe karakterler için)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Dosyayı indir
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data, filename = 'export.json') => {
  if (!data || data.length === 0) {
    alert('İndirilecek veri bulunamadı.');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportOrdersToCSV = (orders) => {
  const csvData = orders.map(order => ({
    'Sipariş No': order.orderNumber,
    'Başlık': order.title,
    'Durum': order.status,
    'Öncelik': order.priority,
    'Oluşturan': order.createdBy.name,
    'Oluşturma Tarihi': new Date(order.createdAt).toLocaleDateString('tr-TR'),
    'Teslim Tarihi': order.dueDate ? new Date(order.dueDate).toLocaleDateString('tr-TR') : '',
    'Lokasyon': order.location,
    'Ürünler': order.items.map(item => item.productName).join('; '),
    'Açıklama': order.description
  }));

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  exportToCSV(csvData, `siparis-raporu-${timestamp}.csv`);
};

export const exportOrderLogsToCSV = (order, logs) => {
  const csvData = [
    // Sipariş bilgileri
    {
      'Tip': 'Sipariş Bilgisi',
      'Sipariş No': order.orderNumber,
      'Başlık': order.title,
      'Durum': order.status,
      'Öncelik': order.priority,
      'Oluşturan': order.createdBy.name,
      'Oluşturma Tarihi': new Date(order.createdAt).toLocaleDateString('tr-TR'),
      'Açıklama': order.description,
      'Kullanıcı': '',
      'Not': ''
    },
    // Timeline logları
    ...(order.timeline || []).map(log => ({
      'Tip': 'İşlem Logu',
      'Sipariş No': order.orderNumber,
      'Başlık': '',
      'Durum': '',
      'Öncelik': '',
      'Oluşturan': '',
      'Oluşturma Tarihi': new Date(log.timestamp).toLocaleDateString('tr-TR'),
      'Açıklama': log.description,
      'Kullanıcı': log.user,
      'Not': log.note || ''
    })),
    // Response logları
    ...(order.responses || []).map(response => ({
      'Tip': 'Sipariş Cevabı',
      'Sipariş No': order.orderNumber,
      'Başlık': '',
      'Durum': response.status,
      'Öncelik': '',
      'Oluşturan': '',
      'Oluşturma Tarihi': new Date(response.timestamp).toLocaleDateString('tr-TR'),
      'Açıklama': '',
      'Kullanıcı': response.userName,
      'Not': response.note || ''
    }))
  ];

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  exportToCSV(csvData, `siparis-log-${order.orderNumber}-${timestamp}.csv`);
};

// Basit PDF export (HTML'den PDF'e dönüştürme)
export const exportToPDF = (data, title = 'Rapor') => {
  // Bu özellik için daha gelişmiş bir PDF kütüphanesi gerekli
  // Şimdilik basit bir HTML tablosu oluşturup yazdırma önerisi
  const printWindow = window.open('', '_blank');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { margin-bottom: 20px; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
        <p>Toplam Kayıt: ${data.length}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => 
            `<tr>${Object.values(row).map(value => `<td>${value || ''}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Bu rapor Fabrika Sipariş Takip Sistemi tarafından oluşturulmuştur.</p>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
};

export const exportOrdersToPDF = (orders) => {
  const pdfData = orders.map(order => ({
    'Sipariş No': order.orderNumber,
    'Başlık': order.title,
    'Durum': order.status,
    'Öncelik': order.priority,
    'Oluşturan': order.createdBy.name,
    'Oluşturma Tarihi': new Date(order.createdAt).toLocaleDateString('tr-TR'),
    'Teslim Tarihi': order.dueDate ? new Date(order.dueDate).toLocaleDateString('tr-TR') : '',
    'Lokasyon': order.location
  }));

  exportToPDF(pdfData, 'Sipariş Raporu');
};

export const exportOrderLogsToPDF = (order, logs) => {
  const pdfData = [
    // Sipariş bilgileri
    {
      'Tip': 'Sipariş Bilgisi',
      'Sipariş No': order.orderNumber,
      'Başlık': order.title,
      'Durum': order.status,
      'Oluşturan': order.createdBy.name,
      'Tarih': new Date(order.createdAt).toLocaleDateString('tr-TR'),
      'Açıklama': order.description,
      'Kullanıcı': '',
      'Not': ''
    },
    // Timeline logları
    ...(order.timeline || []).map(log => ({
      'Tip': 'İşlem Logu',
      'Sipariş No': '',
      'Başlık': '',
      'Durum': '',
      'Oluşturan': '',
      'Tarih': new Date(log.timestamp).toLocaleDateString('tr-TR'),
      'Açıklama': log.description,
      'Kullanıcı': log.user,
      'Not': log.note || ''
    })),
    // Response logları
    ...(order.responses || []).map(response => ({
      'Tip': 'Sipariş Cevabı',
      'Sipariş No': '',
      'Başlık': '',
      'Durum': response.status,
      'Oluşturan': '',
      'Tarih': new Date(response.timestamp).toLocaleDateString('tr-TR'),
      'Açıklama': '',
      'Kullanıcı': response.userName,
      'Not': response.note || ''
    }))
  ];

  exportToPDF(pdfData, `Sipariş Log Raporu - ${order.orderNumber}`);
};
