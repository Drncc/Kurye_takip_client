const fetch = require('node-fetch');
const { nominatimBase } = require('../config/env');

async function geocodeAddressToPoint(addressText) {
  const url = `${nominatimBase}/search?format=json&q=${encodeURIComponent(addressText)}&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'dispatch-mvp/1.0 (contact@example.com)' } });
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  if (!data.length) throw new Error('Address not found');
  const { lon, lat } = data[0];
  return { type: 'Point', coordinates: [Number(lon), Number(lat)] };
}

module.exports = { geocodeAddressToPoint };