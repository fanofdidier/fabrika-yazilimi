import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Table, Badge, Alert, LoadingSpinner } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';


const UsersPage = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users');
        const backendUsers = response.data?.success && response.data?.data?.users ? response.data.data.users : [];
        
        // Backend verilerini normalize et
        const normalizedUsers = backendUsers.map((user) => ({
          id: user._id,
          username: user.username || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email || '',
          role: user.role || 'fabrika_iscisi',
          department: user.department || 'Genel',
          position: user.position || 'Çalışan',
          phone: user.phone || '',
          status: user.isActive !== false ? 'active' : 'inactive',
          lastLogin: user.lastLogin || null,
          createdAt: user.createdAt || new Date().toISOString()
        }));
        
        setUsers(normalizedUsers);
      } catch (error) {
        console.error('Users fetch error:', error);
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
      magaza_personeli: { variant: 'warning', label: 'Mağaza Personeli' },
      fabrika_iscisi: { variant: 'primary', label: 'Fabrika İşçisi' }
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
      if (action === 'delete') {
        if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
          await api.delete(`/users/${userId}`);
          setUsers(prev => prev.filter(user => user.id !== userId));
          setMessage({ type: 'success', text: 'Kullanıcı başarıyla silindi.' });
        }
      }
    } catch (error) {
      console.error('User action error:', error);
      setMessage({ type: 'error', text: 'İşlem gerçekleştirilirken bir hata oluştu.' });
    }
  };

  const tableColumns = [
    {
      key: 'name',
      label: 'Kullanıcı Bilgileri',
      render: (value, user) => (
        <div>
          <div className="font-medium text-gray-900">
            {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '-'}
          </div>
          <div className="text-sm text-gray-500">
            <div>👤 {user?.username || '-'}</div>
            <div>📧 {user?.email || '-'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Rol',
      render: (value, user) => getRoleBadge(user.role)
    },
    {
      key: 'department',
      label: 'İş Bilgileri',
      render: (value, user) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            🏢 {user?.department || 'Genel'}
          </div>
          <div className="text-sm text-gray-500">
            💼 {user?.position || 'Çalışan'}
          </div>
          {user?.phone && (
            <div className="text-sm text-gray-500">
              📞 {user.phone}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      render: (value, user) => getStatusBadge(user.status)
    },
    {
      key: 'lastLogin',
      label: 'Son Giriş',
      render: (value, user) => (
        <div className="text-sm text-gray-900">
          {user?.lastLogin ? formatDate(user.lastLogin) : 'Hiç giriş yapmamış'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (value, user) => (
        <div className="flex gap-2">
          <Link to={`/users/${user?.id || ''}`}>
            <Button variant="outline" size="sm">
              Detay
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUserAction(user?.id, 'delete')}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Sil
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
            <Link to="/users/new">
              <Button>
                Yeni Kullanıcı Ekle
              </Button>
            </Link>
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
                <option value="magaza_personeli">Mağaza Personeli</option>
                <option value="fabrika_iscisi">Fabrika İşçisi</option>
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