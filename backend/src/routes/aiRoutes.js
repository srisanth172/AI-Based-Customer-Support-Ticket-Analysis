const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

// Standardized AI Query endpoint for Admin Copilot
router.post('/query', authMiddleware, adminMiddleware, aiController.askAI);

// Image Analysis route for Admin Copilot
router.post('/analyze-image', authMiddleware, adminMiddleware, aiController.analyzeImage);

// Customer-facing AI Chatbot
router.post('/chat', authMiddleware, aiController.customerChat);

module.exports = router;
