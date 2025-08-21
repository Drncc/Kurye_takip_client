require('dotenv').config();
module.exports = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  nominatimBase: process.env.NOMINATIM_BASE || 'https://nominatim.openstreetmap.org'
};