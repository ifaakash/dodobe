const express = require('express');
const { createBlock, getUserBlocks } = require('../controllers/blockController');
const authenticateToken = require('../middlewares/authenticateToken');

const router = express.Router();

router.post('/create-block', authenticateToken, createBlock);
router.get('/user-blocks/:userId', authenticateToken, getUserBlocks);

module.exports = router;
