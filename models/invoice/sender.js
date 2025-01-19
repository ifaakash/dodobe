const mongoose = require('mongoose');

const senderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  zipCode: {
    type: String,
    required: true
  },
  state: {
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

module.exports = mongoose.model('Sender', senderSchema);