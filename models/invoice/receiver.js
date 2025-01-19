const mongoose = require('mongoose');

const receiverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  gstin: String,
  pan: String,
  logo: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Receiver', receiverSchema);