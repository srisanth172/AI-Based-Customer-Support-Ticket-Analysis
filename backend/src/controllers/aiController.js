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

    console.log('--- SENDING TO OPENROUTER ---');
    const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
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
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Attempt to map imageUrl to local file system
    // imageUrl is expected to be '/uploads/filename.ext'
    const fileName = path.basename(imageUrl);
    const filePath = path.join(__dirname, '../../../../uploads', fileName); // root/uploads

    let base64Image = '';
    const ext = path.extname(fileName).toLowerCase().replace('.', '');
    
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath);
      base64Image = `data:image/${ext || 'jpeg'};base64,${fileData.toString('base64')}`;
    } else {
      // If it's a fully qualified public URL or not found locally, just pass the URL
      // But openrouter models usually accept base64 or public URLs.
      if (imageUrl.startsWith('http') && !imageUrl.includes('localhost')) {
         base64Image = imageUrl;
      } else {
         return res.status(404).json({ error: 'Image not found locally or invalid URL' });
      }
    }

    const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    
    // Using simple text + image payload for GPT-4o-mini via OpenRouter
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image and guess what percentage of it appears to be AI-generated. Return ONLY a single percentage number followed by '%', e.g., '85%'." },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5174",
          "X-Title": "Support AI Vision",
        },
      }
    );

    const aiResponse = response.data?.choices?.[0]?.message?.content?.trim() || "Analysis failed";

    res.json({ analysis: aiResponse });
  } catch (error) {
    console.log("IMAGE ANALYSIS ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "AI Vision analysis failed", details: error.message });
  }
};
