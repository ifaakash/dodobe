const express = require('express');
const authenticateToken = require('../middlewares/authenticateToken');
const { publishChanges, getPublishedChanges } = require('../controllers/publishedData');

const router = express.Router();

router.post("/publish", authenticateToken, publishChanges);
router.get("/publish/:userId", authenticateToken, getPublishedChanges);

module.exports = router;
