const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
});

const paymentSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  ifscCode: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  upiId: String,
  qrCode: String
});

const invoiceSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sender',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receiver',
    required: true
  },
  items: [invoiceItemSchema],
  discount: {
    type: Number,
    default: 0
  },
  subTotal: {
    type: Number,
    required: true
  },
  note: String,
  number: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  payment: paymentSchema
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);