import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Table, LoadingSpinner } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Simulated API call
      setTimeout(() => {
        setReports([
          {
            id: 1,
            title: 'Aylık Satış Raporu',
            type: 'sales',
            period: 'Ocak 2024',
            status: 'completed',
            createdAt: '2024-01-31'
          },
          {
            id: 2,
            title: 'Görev Performans Raporu',
            type: 'tasks',
            period: 'Ocak 2024',
            status: 'pending',
            createdAt: '2024-01-30'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Raporlar yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger'
    };
    
    const labels = {
      completed: 'Tamamlandı',
      pending: 'Bekliyor',
      failed: 'Başarısız'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'title',
      label: 'Rapor Adı',
      sortable: true
    },
    {
      key: 'type',
      label: 'Tür',
      render: (value) => (
        <Badge variant="outline">
          {value === 'sales' ? 'Satış' : 'Görev'}
        </Badge>
      )
    },
    {
      key: 'period',
      label: 'Dönem'
    },
    {
      key: 'status',
      label: 'Durum',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'createdAt',
      label: 'Oluşturulma Tarihi'
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (_, row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline">
            Görüntüle
          </Button>
          <Button size="sm" variant="primary">
            İndir
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Raporlar yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-gray-600">Sistem raporlarını görüntüleyin ve indirin</p>
        </div>
        <Button variant="primary">
          Yeni Rapor Oluştur
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <Card.Header>
          <Card.Title>Filtreler</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dönem
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Bu Hafta</option>
                <option value="month">Bu Ay</option>
                <option value="quarter">Bu Çeyrek</option>
                <option value="year">Bu Yıl</option>
              </select>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Reports Table */}
      <Card>
        <Card.Header>
          <Card.Title>Rapor Listesi</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table
            data={reports}
            columns={columns}
            sortable
            hoverable
            emptyMessage="Henüz rapor bulunmuyor"
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default ReportsPage;