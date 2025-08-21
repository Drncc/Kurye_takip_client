const { nominatimBase } = require('../config/env');

// Use global fetch if available (Node 18+), otherwise lazy-load node-fetch
async function fetchFn(url, options) {
  if (typeof fetch === 'function') {
    return fetch(url, options);
  }
  const mod = await import('node-fetch');
  return mod.default(url, options);
}

async function geocodeAddressToPoint(addressText) {
  const url = `${nominatimBase}/search?format=json&q=${encodeURIComponent(addressText)}&limit=1`;
  const res = await fetchFn(url, { headers: { 'User-Agent': 'dispatch-mvp/1.0 (contact@example.com)' } });
  if (!res.ok) throw new Error('Adres konumlandırma başarısız');
  const data = await res.json();
  if (!data.length) throw new Error('Adres bulunamadı. Lütfen daha net bir adres girin.');
  const { lon, lat } = data[0];
  return { type: 'Point', coordinates: [Number(lon), Number(lat)] };
}

module.exports = { geocodeAddressToPoint };