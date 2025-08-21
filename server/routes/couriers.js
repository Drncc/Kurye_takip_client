const express = require('express');
const { auth } = require('../middleware/auth');
const Courier = require('../models/Courier');
const { geocodeAddressToPoint } = require('../utils/geocode');

const router = express.Router();

router.get('/me', auth('courier'), async (req, res) => {
  const me = await Courier.findById(req.user.id).lean();
  res.json({ me });
});

router.post('/status', auth('courier'), async (req, res) => {
  const { active } = req.body;
  const updated = await Courier.findByIdAndUpdate(req.user.id, { active }, { new: true }).lean();
  res.json({ active: updated.active });
});

router.post('/location', auth('courier'), async (req, res) => {
  const { addressText, coords } = req.body; // coords: { lng, lat }
  let location;
  if (coords) location = { type: 'Point', coordinates: [coords.lng, coords.lat] };
  else if (addressText) location = await geocodeAddressToPoint(addressText);
  else return res.status(400).json({ error: 'Provide addressText or coords' });
  await Courier.findByIdAndUpdate(req.user.id, { location }, { new: true });
  res.json({ ok: true });
});

// List nearby active couriers for a given pickup point (shop)
router.post('/nearby', auth('shop'), async (req, res) => {
  const { pickup } = req.body; // { type:'Point', coordinates:[lng,lat] }
  if (!pickup || !pickup.coordinates) return res.status(400).json({ error: 'pickup required' });
  const items = await Courier.find({
    active: true,
    location: {
      $near: {
        $geometry: pickup,
        $maxDistance: 20000
      }
    }
  })
    .select('name location createdAt')
    .limit(10)
    .lean();
  res.json({ couriers: items });
});

module.exports = router;