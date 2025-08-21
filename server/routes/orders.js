const express = require('express');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Courier = require('../models/Courier'); // Added Courier import
const { findNearestActiveCourier } = require('../services/assignment');

const router = express.Router();

// Yeni sipariş oluştur
router.post('/', auth, async (req, res) => {
  try {
    const { customerName, customerPhone, deliveryAddress, deliveryDistrict, packageDetails, priority } = req.body;
    
    if (req.user.role !== 'shop') {
      return res.status(403).json({ error: 'Sadece dükkanlar sipariş oluşturabilir' });
    }
    
    // Dükkanın konum bilgisini al
    const shop = await Shop.findById(req.user.id);
    if (!shop || !shop.location) {
      return res.status(400).json({ error: 'Dükkan konum bilgisi bulunamadı' });
    }
    
    // Sipariş oluştur
    const order = new Order({
      shop: req.user.id,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryDistrict,
      packageDetails,
      priority: priority || 'normal',
      status: 'pending'
    });
    
    await order.save();
    
    // En yakın müsait kuryeyi bul ve ata
    const nearbyCourier = await Courier.findOne({
      active: true,
      location: {
        $near: {
          $geometry: shop.location,
          $maxDistance: 10000 // 10km
        }
      }
    }).sort({ 'location.coordinates': 1 });
    
    let assignedCourier = null;
    if (nearbyCourier) {
      order.assignedCourier = nearbyCourier._id;
      order.status = 'assigned';
      order.assignedAt = new Date();
      await order.save();
      
      assignedCourier = {
        _id: nearbyCourier._id,
        name: nearbyCourier.name,
        phone: nearbyCourier.phone
      };
    }
    
    res.status(201).json({ 
      message: 'Sipariş oluşturuldu', 
      order,
      assignedCourier 
    });
  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    res.status(500).json({ error: 'Sipariş oluşturulamadı' });
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    if (req.user.role !== 'courier') {
      return res.status(403).json({ error: 'Sadece kuryeler bu endpoint\'i kullanabilir' });
    }
    
    const orders = await Order.find({ 
      assignedCourier: req.user.id,
      status: { $in: ['assigned', 'picked'] }
    })
    .populate('shop', 'name addressText')
    .sort({ createdAt: -1 });
    
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Siparişler alınamadı' });
  }
});

// Dükkan siparişlerini getir
router.get('/store', auth, async (req, res) => {
  try {
    const orders = await Order.find({ shop: req.user.id })
      .populate('assignedCourier', 'name phone')
      .sort({ createdAt: -1 });
    
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Siparişler alınamadı' });
  }
});

// Kurye siparişlerini getir

// Sipariş durumunu güncelle
router.post('/:id/status', auth(), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    
    // Sadece dükkan sahibi veya atanan kurye durumu güncelleyebilir
    if (req.user.role === 'shop' && order.shop.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
    
    if (req.user.role === 'courier' && order.assignedCourier?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
    
    // Durum güncelleme kuralları
    if (req.user.role === 'shop') {
      // Dükkan sadece bekleyen siparişleri iptal edebilir
      if (status === 'cancelled' && order.status !== 'pending') {
        return res.status(400).json({ error: 'Sadece bekleyen siparişler iptal edilebilir' });
      }
    }
    
    if (req.user.role === 'courier') {
      // Kurye sadece atanan siparişleri güncelleyebilir
      if (order.status === 'assigned' && status === 'picked') {
        order.status = status;
        order.pickedAt = new Date();
      } else if (order.status === 'picked' && status === 'delivered') {
        order.status = status;
        order.deliveredAt = new Date();
      } else {
        return res.status(400).json({ error: 'Geçersiz durum güncellemesi' });
      }
    } else {
      order.status = status;
    }
    
    await order.save();
    
    res.json({ message: 'Sipariş durumu güncellendi', order });
  } catch (error) {
    res.status(500).json({ error: 'Durum güncellenemedi' });
  }
});

module.exports = router;