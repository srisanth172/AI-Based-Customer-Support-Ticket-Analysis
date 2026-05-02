const axios = require('axios');
const Ticket = require('../models/Ticket');

exports.askAI = async (req, res) => {
  try {
    const { message } = req.body;
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    
    // Gather REAL dashboard context for "Useful AI"
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: { $ne: 'resolved' } });
    const negativeTickets = await Ticket.countDocuments({ sentiment: 'negative' });
    const ticketsToday = await Ticket.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } });
    
    const categoryStats = await Ticket.aggregate([
      { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const topCategory = categoryStats[0]?._id || 'N/A';

    const resolutionStats = await Ticket.aggregate([
      { $match: { resolutionTime: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$resolutionTime' } } }
    ]);
    const avgResTime = Math.round(resolutionStats[0]?.avg || 0);

    const systemPrompt = `You are an AI assistant for a customer support admin dashboard. Analyze the following data and provide short, actionable insights focus on trends, problems, and recommendations. Keep answers concise and useful.

Current Dashboard Context:
- Tickets Created Today: ${ticketsToday}
- Total Open Tickets: ${openTickets}
- Main Issue Category: ${topCategory}
- Negative Customer Sentiment: ${negativeTickets}
- Average Resolution Time: ${avgResTime} minutes.`;

    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    const orKey = (process.env.OPENROUTER_API_KEY || '').trim();
    const apiKey = groqKey || orKey;
    
    if (!apiKey) {
      return res.status(500).json({ error: "AI API Key missing" });
    }

    const apiUrl = groqKey 
      ? "https://api.groq.com/openai/v1/chat/completions" 
      : "https://openrouter.ai/api/v1/chat/completions";
    
    const model = groqKey ? "llama-3.1-8b-instant" : (process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini");

    console.log(`--- SENDING TO ${groqKey ? 'GROQ' : 'OPENROUTER'} ---`);
    
    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "Shiva Admin AI",
        },
      }
    );

    console.log('--- RESPONSE RECEIVED ---');
    res.json({
      reply: response.data.choices[0].message.content,
    });
  } catch (error) {
    console.log("FULL ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: "AI unavailable, try again",
      details: error.response?.data || error.message,
    });
  }
};

const fs = require('fs');
const path = require('path');

exports.analyzeImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    console.log('[AI Vision] Analyzing Image:', imageUrl);

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    let base64Image = imageUrl; // Default to using the URL directly
    
    if (!imageUrl.startsWith('http')) {
      // Resolve correct uploads directory for local files
      const fileName = path.basename(imageUrl);
      const uploadsDir = path.join(__dirname, '../..', 'uploads');
      const resolvedPath = path.join(uploadsDir, fileName);
      console.log('[AI Vision] Resolved local uploads path:', resolvedPath);
      
      if (fs.existsSync(resolvedPath)) {
        console.log('[AI Vision] File found locally.');
        const fileData = fs.readFileSync(resolvedPath);
        const ext = path.extname(fileName).toLowerCase().replace('.', '') || 'jpeg';
        base64Image = `data:image/${ext};base64,${fileData.toString('base64')}`;
      } else {
        return res.status(404).json({ error: 'Image not found on server' });
      }
    }

    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    const orKey = (process.env.OPENROUTER_API_KEY || '').trim();
    const apiKey = groqKey || orKey;

    if (!apiKey) {
      return res.status(500).json({ error: "AI API Key missing" });
    }

    const apiUrl = groqKey 
      ? "https://api.groq.com/openai/v1/chat/completions" 
      : "https://openrouter.ai/api/v1/chat/completions";
    
    // Use vision-capable model. Groq's llama-3.2-11b-vision-preview is deprecated;
    // use meta-llama/llama-4-scout-17b-16e-instruct which has vision support.
    const model = groqKey ? "meta-llama/llama-4-scout-17b-16e-instruct" : "google/gemini-2.0-flash-001";
    
    console.log(`[AI Vision] Sending to ${groqKey ? 'Groq' : 'OpenRouter'} model:`, model);

    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "You are an image authenticity checker. Analyze this image carefully. Determine if it is AI-generated (created by Stable Diffusion, Midjourney, DALL-E, or similar AI art tools) OR a real, genuine screenshot/photo. Look for tell-tale signs: unnatural textures, perfect symmetry, dreamlike quality, watermarks, UI elements, etc. Respond with ONLY one of these exact strings: 'AI Generated' or 'Human-Verified Genuine'." 
              },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "Support AI Vision",
        },
        timeout: 30000 // 30s timeout for vision tasks
      }
    );

    const aiResponse = response.data?.choices?.[0]?.message?.content?.trim() || "Analysis failed";
    console.log('[AI Vision] Result:', aiResponse);

    res.json({ analysis: aiResponse });
  } catch (error) {
    console.error('[AI Vision] Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: "AI Vision analysis failed", 
      details: error.response?.data?.error?.message || error.message 
    });
  }
};
const aiService = require('../services/aiService');

exports.customerChat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const reply = await aiService.chatWithCustomer(messages);
    res.json({ reply });
  } catch (error) {
    console.error('[AI Chat] Error:', error.message);
    res.status(500).json({ error: 'Chat failed', details: error.message });
  }
};
