const express = require('express');
const router = express.Router();
const liveChatController = require('../controllers/liveChatController');
const { protect } = require('../middleware/auth');

router.get('/customer', protect, liveChatController.getChat);
router.get('/admin', protect, liveChatController.getAllChats);
router.get('/admin/:id', protect, liveChatController.getChat);
router.post('/message/:id?', protect, liveChatController.addMessage);

module.exports = router;
