const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  courierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Courier' },
  status: { type: String, enum: ['pending', 'assigned', 'picked', 'delivered', 'cancelled'], default: 'pending' },
  pickupLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // shop coords
  },
  // Delivery details
  customerName: { type: String },
  customerPhone: { type: String },
  deliveryAddress: { type: String },
  deliveryDistrict: { type: String },
  priority: { type: String, enum: ['normal', 'urgent', 'express'], default: 'normal' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);