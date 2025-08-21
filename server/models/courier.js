const mongoose = require('mongoose');

const CourierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  addressText: { type: String },
  district: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  active: { type: Boolean, default: false },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

CourierSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Courier', CourierSchema);