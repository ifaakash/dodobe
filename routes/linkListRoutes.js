const express = require('express');
const { createLinks, getBlockLinkList, editLink, deleteLink, getLink, reorderLinks } = require('../controllers/linkListController');
const authenticateToken = require('../middlewares/authenticateToken');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/create-links', authenticateToken, upload.fields([
    { name: 'audio', maxCount: 1 },
]), createLinks);

router.post('/reorder-links', authenticateToken, reorderLinks);
router.get('/block-links/:userId', authenticateToken, getBlockLinkList);
router.post('/link/edit', authenticateToken, upload.fields([
    { name: 'audio', maxCount: 1 },
]), editLink);
router.post('/link/delete', authenticateToken, deleteLink);
router.get("/link/:linkId", authenticateToken, getLink);

module.exports = router;
