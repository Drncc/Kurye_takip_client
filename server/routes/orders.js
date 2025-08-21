const express = require('express');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const { findNearestActiveCourier } = require('../services/assignment');

const router = express.Router();

router.post('/', auth('shop'), async (req, res) => {
  const shop = await Shop.findById(req.user.id);
  if (!shop) return res.status(400).json({ error: 'Dükkan bulunamadı' });
  const pickupLocation = shop.location;
  const courier = await findNearestActiveCourier(pickupLocation);

  const { customerName, customerPhone, deliveryAddress, deliveryDistrict, priority, notes } = req.body;

  const order = await Order.create({
    shopId: shop._id,
    courierId: courier ? courier._id : undefined,
    status: courier ? 'assigned' : 'pending',
    pickupLocation,
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryDistrict,
    priority: priority || 'normal',
    notes: notes || ''
  });

  res.json({ order, assignedCourier: courier || null });
});

router.get('/mine', auth('courier'), async (req, res) => {
  const orders = await Order.find({ courierId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ orders });
});

router.post('/:id/status', auth(), async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
  res.json({ order });
});

module.exports = router;