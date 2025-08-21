const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Shop = require('../models/Shop');
const Courier = require('../models/Courier');
const { geocodeAddressToPoint } = require('../utils/geocode');
const { jwtSecret } = require('../config/env');

const router = express.Router();

router.post('/register/shop', async (req, res) => {
  try {
    const { name, email, password, addressText } = req.body;
    const location = await geocodeAddressToPoint(addressText);
    const passwordHash = await bcrypt.hash(password, 10);
    const shop = await Shop.create({ name, email, passwordHash, addressText, location });
    const token = jwt.sign({ id: shop._id, role: 'shop' }, jwtSecret, { expiresIn: '7d' });
    res.json({ token });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/register/courier', async (req, res) => {
  try {
    const { name, email, password, addressText } = req.body;
    const location = addressText ? await geocodeAddressToPoint(addressText) : { type: 'Point', coordinates: [0, 0] };
    const passwordHash = await bcrypt.hash(password, 10);
    const courier = await Courier.create({ name, email, passwordHash, addressText, location, active: false });
    const token = jwt.sign({ id: courier._id, role: 'courier' }, jwtSecret, { expiresIn: '7d' });
    res.json({ token });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/login/shop', async (req, res) => {
  const { email, password } = req.body;
  const shop = await Shop.findOne({ email });
  if (!shop) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, shop.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: shop._id, role: 'shop' }, jwtSecret, { expiresIn: '7d' });
  res.json({ token });
});

router.post('/login/courier', async (req, res) => {
  const { email, password } = req.body;
  const courier = await Courier.findOne({ email });
  if (!courier) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, courier.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: courier._id, role: 'courier' }, jwtSecret, { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;