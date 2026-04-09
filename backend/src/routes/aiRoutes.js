const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { authMiddleware } = require('../middleware/auth');

router.post('/predict', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.length < 10) {
      return res.status(400).json({ error: 'Text too short for analysis' });
    }
    
    // Use the cheaper/faster fallback analysis for live triage if possible, 
    // or call OpenRouter for a quick classification.
    const analysis = await aiService.analyzeTicketWithAI(text);
    
    res.json({
      category: analysis.category,
      priority: analysis.priority,
      sentiment: analysis.sentiment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
