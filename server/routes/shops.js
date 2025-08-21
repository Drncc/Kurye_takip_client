const express = require('express');
const { auth } = require('../middleware/auth');
const Shop = require('../models/Shop');

const router = express.Router();

router.get('/me', auth('shop'), async (req, res) => {
  const me = await Shop.findById(req.user.id).lean();
  res.json({ me });
});

// List nearby shops for a given courier location
router.post('/nearby', auth('courier'), async (req, res) => {
  const { courierLocation } = req.body; // { type:'Point', coordinates:[lng,lat] }
  if (!courierLocation || !courierLocation.coordinates) return res.status(400).json({ error: 'courierLocation required' });
  
  const items = await Shop.find({
    location: {
      $near: {
        $geometry: courierLocation,
        $maxDistance: 20000 // 20km
      }
    }
  })
    .select('name addressText location createdAt')
    .limit(10)
    .lean();
    
  res.json({ shops: items });
});

module.exports = router;