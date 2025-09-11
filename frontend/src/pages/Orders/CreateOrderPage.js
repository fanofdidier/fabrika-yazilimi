import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, Input, LoadingSpinner } from '../../components/UI';
import AutoComplete from '../../components/UI/AutoComplete';
import api from '../../services/api';

const CreateOrderPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    productName: '',
    productCode: '',
    priority: 'normal',
    deliveryDate: '',
    notes: ''
  });
  
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleProductNameChange = (value) => {
    setFormData(prev => ({
      ...prev,
      productName: value
    }));
    
    // Clear error when user starts typing
    if (errors.productName) {
      setErrors(prev => ({
        ...prev,
        productName: ''
      }));
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      productName: product.name
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.productName.trim()) {
      newErrors.productName = 'Ürün adı gereklidir';
    }
    
    if (!formData.productCode.trim()) {
      newErrors.productCode = 'Ürün kodu gereklidir';
    }
    
    if (!formData.deliveryDate) {
      newErrors.deliveryDate = 'Teslimat tarihi gereklidir';
    } else {
      const deliveryDate = new Date(formData.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate <= today) {
        newErrors.deliveryDate = 'Teslimat tarihi bugünden sonra olmalıdır';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // First, ensure the product exists in the system
      if (!selectedProduct && formData.productName.trim()) {
        // Create or find the product
        await api.post('/products', {
          name: formData.productName.trim(),
          description: formData.notes || '',
          category: 'diğer'
        });
      }

      const orderData = {
        title: formData.productName,
        description: formData.notes || `${formData.productCode} - ${formData.productName}`,
        priority: formData.priority,
        dueDate: formData.deliveryDate,
        location: 'fabrika',
        items: [{
          productName: formData.productName,
          quantity: 1,
          unit: 'adet',
          description: formData.notes || `${formData.productCode} - ${formData.productName}`,
          urgency: formData.priority
        }]
      };
      
      const response = await api.post('/orders', orderData);
      
      if (response.data.success) {
        console.log('Sipariş başarıyla oluşturuldu:', response.data.data.order);
        
        navigate('/orders', { 
          state: { 
            message: 'Sipariş başarıyla oluşturuldu!',
            type: 'success'
          }
        });
      } else {
        throw new Error('API response error');
      }
    } catch (error) {
      console.error('Sipariş oluşturma hatası:', error);
      setErrors({ submit: 'Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yeni Sipariş Oluştur</h1>
          <p className="text-gray-600 mt-2">Basit sipariş oluşturma formu</p>
        </div>
        <Link to="/orders">
          <Button variant="outline">Geri Dön</Button>
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Ürün Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Adı *
              </label>
              <AutoComplete
                value={formData.productName}
                onChange={handleProductNameChange}
                onProductSelect={handleProductSelect}
                placeholder="Ürün adını yazın (otomatik tamamlama)"
                error={errors.productName}
              />
              {selectedProduct && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ {selectedProduct.usageCount} kez kullanılan ürün seçildi
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Kodu *
              </label>
              <Input
                name="productCode"
                value={formData.productCode}
                onChange={handleInputChange}
                placeholder="Ürün kodunu girin"
                error={errors.productCode}
              />
            </div>
          </div>
        </Card>

        {/* Order Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sipariş Detayları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Öncelik
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="düşük">Düşük</option>
                <option value="normal">Normal</option>
                <option value="yüksek">Yüksek</option>
                <option value="acil">Acil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teslimat Tarihi *
              </label>
              <Input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                error={errors.deliveryDate}
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Sipariş açıklaması (opsiyonel)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </Card>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Link to="/orders">
            <Button type="button" variant="outline">
              İptal
            </Button>
          </Link>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Sipariş Oluşturuluyor...
              </>
            ) : (
              'Sipariş Oluştur'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrderPage;