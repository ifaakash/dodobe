const Receiver = require('../models/invoice/receiver');

exports.getAllReceivers = async (req, res) => {
  try {
    const receivers = await Receiver.find().sort({ createdAt: -1 });
    res.json(receivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReceiver = async (req, res) => {
  try {
    const receiver = new Receiver(req.body);
    if (req.file) {
      receiver.logo = req.file.path;
    }

    await receiver.save();
    res.status(201).json(receiver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getReceiver = async (req, res) => {
  try {
    const receiver = await Receiver.findById(req.params.id);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    res.json(receiver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReceiver = async (req, res) => {
  try {
    const receiver = await Receiver.findById(req.params.id);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    Object.assign(receiver, req.body);
    if (req.file) {
      receiver.logo = req.file.path;
    }

    await receiver.save();
    res.json(receiver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};