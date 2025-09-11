import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Table, Badge, Alert, LoadingSpinner } from '../../components/UI';


const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Mock users data
  const mockUsers = [
    {
      id: 1,
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      email: 'ahmet.yilmaz@fabrika.com',
      role: 'admin',
      department: 'Yönetim',
      position: 'Fabrika Müdürü',
      status: 'active',
      lastLogin: '2024-01-15T10:30:00Z',
      createdAt: '2023-06-01T09:00:00Z'
    },
    {
      id: 2,
      firstName: 'Fatma',
      lastName: 'Demir',
      email: 'fatma.demir@fabrika.com',
      role: 'manager',
      department: 'Üretim',
      position: 'Üretim Müdürü',
      status: 'active',
      lastLogin: '2024-01-15T08:45:00Z',
      createdAt: '2023-07-15T10:00:00Z'
    },
    {
      id: 3,
      firstName: 'Mehmet',
      lastName: 'Kaya',
      email: 'mehmet.kaya@fabrika.com',
      role: 'employee',
      department: 'Üretim',
      position: 'Operatör',
      status: 'active',
      lastLogin: '2024-01-14T16:20:00Z',
      createdAt: '2023-08-01T11:00:00Z'
    },
    {
      id: 4,
      firstName: 'Ayşe',
      lastName: 'Özkan',
      email: 'ayse.ozkan@fabrika.com',
      role: 'employee',
      department: 'Kalite Kontrol',
      position: 'Kalite Uzmanı',
      status: 'inactive',
      lastLogin: '2024-01-10T14:15:00Z',
      createdAt: '2023-09-10T12:00:00Z'
    },
    {
      id: 5,
      firstName: 'Ali',
      lastName: 'Çelik',
      email: 'ali.celik@fabrika.com',
      role: 'employee',
      department: 'Lojistik',
      position: 'Depo Sorumlusu',
      status: 'active',
      lastLogin: '2024-01-15T07:30:00Z',
      createdAt: '2023-10-05T13:00:00Z'
    }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUsers(mockUsers);
      } catch (error) {
        setMessage({ type: 'error', text: 'Kullanıcılar yüklenirken bir hata oluştu.' });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { variant: 'danger', label: 'Yönetici' },
      manager: { variant: 'warning', label: 'Müdür' },
      employee: { variant: 'primary', label: 'Çalışan' }
    };
    
    const config = roleConfig[role] || { variant: 'secondary', label: role };
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    return (
      <Badge 
        variant={status === 'active' ? 'success' : 'secondary'} 
        size="sm"
      >
        {status === 'active' ? 'Aktif' : 'Pasif'}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUserAction = async (userId, action) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (action === 'toggle_status') {
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
            : user
        ));
        setMessage({ type: 'success', text: 'Kullanıcı durumu güncellendi.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'İşlem gerçekleştirilirken bir hata oluştu.' });
    }
  };

  const tableColumns = [
    {
      key: 'name',
      label: 'Ad Soyad',
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">
            {user?.firstName || ''} {user?.lastName || ''}
          </div>
          <div className="text-sm text-gray-500">{user?.email || '-'}</div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Rol',
      render: (user) => getRoleBadge(user.role)
    },
    {
      key: 'department',
      label: 'Departman',
      render: (user) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{user?.department || '-'}</div>
          <div className="text-sm text-gray-500">{user?.position || '-'}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      render: (user) => getStatusBadge(user.status)
    },
    {
      key: 'lastLogin',
      label: 'Son Giriş',
      render: (user) => (
        <div className="text-sm text-gray-900">
          {user?.lastLogin ? formatDate(user.lastLogin) : 'Hiç giriş yapmamış'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (user) => (
        <div className="flex gap-2">
          <Link to={`/users/${user?.id || ''}`}>
            <Button variant="outline" size="sm">
              Detay
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUserAction(user?.id, 'toggle_status')}
            className={user?.status === 'active' ? 'text-red-600 border-red-300 hover:bg-red-50' : 'text-green-600 border-green-300 hover:bg-green-50'}
          >
            {user?.status === 'active' ? 'Pasifleştir' : 'Aktifleştir'}
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Kullanıcılar yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
              <p className="text-gray-600 mt-1">
                Toplam {users.length} kullanıcı • {filteredUsers.length} sonuç gösteriliyor
              </p>
            </div>
            <Button>
              Yeni Kullanıcı Ekle
            </Button>
          </div>

          {/* Alert Messages */}
          {message.text && (
            <div className="mb-4">
              <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })}>
                {message.text}
              </Alert>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Kullanıcı ara (ad, soyad, e-posta, departman...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Tüm Roller</option>
                <option value="admin">Yönetici</option>
                <option value="manager">Müdür</option>
                <option value="employee">Çalışan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">👥</div>
              <p className="text-gray-600">
                {searchTerm || filterRole !== 'all' 
                  ? 'Arama kriterlerinize uygun kullanıcı bulunamadı.' 
                  : 'Henüz kullanıcı bulunmuyor.'}
              </p>
            </div>
          ) : (
            <Table
              data={filteredUsers}
              columns={tableColumns}
              className="w-full"
            />
          )}
        </Card>
    </div>
  );
};

export default UsersPage;