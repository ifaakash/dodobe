const Sender = require('../models/invoice/sender');

exports.getSenderProfile = async (req, res) => {
  try {
    const sender = await Sender.findOne();
    if (!sender) {
      return res.status(404).json({ message: 'Sender profile not found' });
    }
    res.json(sender);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSenderProfile = async (req, res) => {
  try {
    const existingSender = await Sender.findOne();
    if (existingSender) {
      return res.status(400).json({ message: 'Sender profile already exists' });
    }

    const sender = new Sender(req.body);
    if (req.file) {
      sender.logo = req.file.path;
    }

    await sender.save();
    res.status(201).json(sender);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateSenderProfile = async (req, res) => {
  try {
    const sender = await Sender.findOne();
    if (!sender) {
      return res.status(404).json({ message: 'Sender profile not found' });
    }

    Object.assign(sender, req.body);
    if (req.file) {
      sender.logo = req.file.path;
    }

    await sender.save();
    res.json(sender);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};