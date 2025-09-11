const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');

// @route   GET /api/products
// @desc    Get all products or search by name
// @access  Private
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    const products = await Product.find(query).sort({ usageCount: -1, name: 1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Ürünler getirilirken bir hata oluştu', error: error.message });
  }
});

// @route   GET /api/products/search
// @desc    Search products with auto-complete
// @access  Private
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { products: [] }
      });
    }

    // Search products with text index
    const products = await Product.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .sort({ usageCount: -1, lastUsed: -1 })
    .limit(parseInt(limit))
    .select('name description category usageCount');

    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün arama hatası'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Ürün adı en az 2 karakter olmalıdır'
      });
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ 
      name: { $regex: `^${name.trim()}$`, $options: 'i' } 
    });

    if (existingProduct) {
      // Update usage count and last used
      existingProduct.usageCount += 1;
      existingProduct.lastUsed = new Date();
      await existingProduct.save();

      return res.json({
        success: true,
        data: { product: existingProduct },
        message: 'Mevcut ürün kullanım sayısı güncellendi'
      });
    }

    // Create new product
    const product = new Product({
      name: name.trim(),
      description: description?.trim(),
      category: category || 'diğer',
      createdBy: req.user.id
    });

    await product.save();

    res.status(201).json({
      success: true,
      data: { product },
      message: 'Yeni ürün oluşturuldu'
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün oluşturma hatası'
    });
  }
});

// @route   GET /api/products/popular
// @desc    Get most used products
// @access  Private
router.get('/popular', requireAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const products = await Product.find({ isActive: true })
      .sort({ usageCount: -1, lastUsed: -1 })
      .limit(parseInt(limit))
      .select('name description category usageCount');

    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Popular products error:', error);
    res.status(500).json({
      success: false,
      message: 'Popüler ürünler getirme hatası'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    // Check if user can edit (admin or creator)
    if (req.user.role !== 'admin' && product.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu ürünü düzenleme yetkiniz yok'
      });
    }

    product.name = name?.trim() || product.name;
    product.description = description?.trim() || product.description;
    product.category = category || product.category;

    await product.save();

    res.json({
      success: true,
      data: { product },
      message: 'Ürün güncellendi'
    });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün güncelleme hatası'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private (Admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gereklidir'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Ürün silindi'
    });
  } catch (error) {
    console.error('Product delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün silme hatası'
    });
  }
});

module.exports = router;
