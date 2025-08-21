const express = require('express');
const { auth } = require('../middleware/auth');
const Shop = require('../models/Shop');

const router = express.Router();

router.get('/me', auth('shop'), async (req, res) => {
  const me = await Shop.findById(req.user.id).lean();
  res.json({ me });
});

module.exports = router;