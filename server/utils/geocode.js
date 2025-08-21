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
  try {
    // Alanya için özel arama
    const searchQuery = `Alanya, ${addressText}`;
    const url = `${nominatimBase}/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=tr&addressdetails=1`;
    
    const res = await fetchFn(url, { 
      headers: { 'User-Agent': 'DeliveryPro/1.0 (ddirenc5@gmail.com)' } 
    });
    
    if (!res.ok) {
      console.log('Geocoding API hatası:', res.status);
      // API hatası durumunda varsayılan Alanya koordinatları döndür
      return { type: 'Point', coordinates: [31.9957, 36.5441] };
    }
    
    const data = await res.json();
    
    if (!data.length) {
      console.log('Adres bulunamadı:', searchQuery);
      // Adres bulunamadığında varsayılan Alanya koordinatları döndür
      return { type: 'Point', coordinates: [31.9957, 36.5441] };
    }
    
    const { lon, lat, display_name } = data[0];
    
    // Alanya içinde mi kontrol et
    if (display_name && display_name.toLowerCase().includes('alanya')) {
      return { type: 'Point', coordinates: [Number(lon), Number(lat)] };
    } else {
      console.log('Adres Alanya dışında:', display_name);
      // Alanya dışındaysa varsayılan koordinatlar döndür
      return { type: 'Point', coordinates: [31.9957, 36.5441] };
    }
    
  } catch (error) {
    console.log('Geocoding hatası:', error.message);
    // Hata durumunda varsayılan Alanya koordinatları döndür
    return { type: 'Point', coordinates: [31.9957, 36.5441] };
  }
}

module.exports = { geocodeAddressToPoint };