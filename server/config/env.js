require('dotenv').config();
module.exports = {
  port: process.env.PORT || 4000,
  // Fallback to local Mongo for development if env is missing
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kurye',
  // Provide a weak dev default; override in production via env
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  nominatimBase: process.env.NOMINATIM_BASE || 'https://nominatim.openstreetmap.org'
};