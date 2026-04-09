class AIService {
  async callOpenRouter(text) {
    if (!process.env.OPENROUTER_API_KEY) return null;

    const openRouterUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    const prompt = [
      'Analyze the following customer support message and return valid JSON only.',
      'JSON schema:',
      '{',
      '  "sentiment": "positive|neutral|negative",',
      '  "sentimentScore": number,',
      '  "priority": "standard|medium|high",',
      '  "priorityScore": number,',
      '  "category": "billing|technical|delivery|account|product|general",',
      '  "suggestedReply": string,',
      '  "reasoning": string,',
      '  "keywords": string[]',
      '}',
      'Note: Do NOT use the word "low" for priority. Use "standard" instead.',
      '',
      `Message: ${text}`,
    ].join('\n');

    const response = await fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'Support System Backend',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'You are a support-ticket classification engine. Output strict JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const textBody = await response.text();
      throw new Error(`OpenRouter request failed: ${response.status} ${textBody}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const normalized = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(normalized);
    return {
      sentiment: parsed.sentiment || 'neutral',
      priority: parsed.priority || 'medium',
      category: parsed.category || 'general',
      suggestedReply: parsed.suggestedReply || 'Thanks for your message. We are reviewing it now.',
      reasoning: parsed.reasoning || 'Classified by model output.',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      sentimentScore: Number(parsed.sentimentScore || 0),
      priorityScore: Number(parsed.priorityScore || 0.5),
    };
  }

  analyzeSentiment(text) {
    const keywords = {
      positive: ['thanks', 'great', 'good', 'awesome', 'helpful', 'love', 'perfect', 'excellent', 'happy', 'satisfied'],
      negative: ['bad', 'terrible', 'awful', 'frustrated', 'angry', 'wrong', 'issue', 'problem', 'broken', 'fail', 'slow', 'annoying', 'horrible'],
      urgent: ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'blocked', 'down', 'not working']
    };
    let score = 0;
    let detectedKeywords = [];
    const lowerText = text.toLowerCase();
    keywords.positive.forEach(k => { if (lowerText.includes(k)) { score += 0.2; detectedKeywords.push(k); } });
    keywords.negative.forEach(k => { if (lowerText.includes(k)) { score -= 0.3; detectedKeywords.push(k); } });
    keywords.urgent.forEach(k => { if (lowerText.includes(k)) { score -= 0.4; detectedKeywords.push(k); } });
    score = Math.max(-1, Math.min(1, score));
    let sentiment = 'neutral';
    if (score > 0.2) sentiment = 'positive';
    if (score < -0.2) sentiment = 'negative';
    return { sentiment, score, keywords: [...new Set(detectedKeywords)] };
  }

  predictPriority(text, sentiment) {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'blocked', 'down', 'deadline'];
    const mediumKeywords = ['issue', 'problem', 'help', 'broken', 'error', 'fix', 'bug'];
    let priorityScore = 0;
    const keywords = [];
    const lowerText = text.toLowerCase();
    urgentKeywords.forEach(k => { if (lowerText.includes(k)) { priorityScore += 0.4; keywords.push(k); } });
    mediumKeywords.forEach(k => { if (lowerText.includes(k)) { priorityScore += 0.2; keywords.push(k); } });
    if (sentiment === 'negative') priorityScore += 0.2;
    if (text.length > 200) priorityScore += 0.1;
    let priority = 'low';
    if (priorityScore >= 0.4) priority = 'high';
    else if (priorityScore >= 0.2) priority = 'medium';
    return { priority, score: priorityScore, keywords };
  }

  classifyCategory(text) {
    const categories = {
      billing: ['billing', 'payment', 'charge', 'invoice', 'price', 'cost', 'refund', 'subscription'],
      technical: ['bug', 'error', 'crash', 'not working', 'fail', 'technical', 'system', 'loading'],
      delivery: ['delivery', 'shipping', 'track', 'package', 'order', 'received', 'arrive'],
      account: ['login', 'password', 'account', 'sign in', 'access', 'profile', 'username'],
      product: ['feature', 'product', 'functionality', 'option', 'setting', 'interface']
    };
    let bestMatch = 'general';
    let highestScore = 0;
    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      let score = 0;
      keywords.forEach(k => { if (lowerText.includes(k)) score += 0.2; });
      if (score > highestScore) { highestScore = score; bestMatch = category; }
    }
    return bestMatch;
  }

  generateSuggestedReply(text, category, sentiment) {
    const templates = {
      billing: {
        positive: "Thank you for your positive feedback about our billing system! We're glad it's working well for you.",
        neutral: "I understand you have a billing question. Could you please provide more details about the transaction?",
        negative: "I apologize for the billing issue. I'll prioritize this and have our billing team investigate immediately."
      },
      technical: {
        positive: "Great to hear the technical issue was resolved! Let me know if you need anything else.",
        neutral: "I'll help you troubleshoot this technical issue. Can you share any error messages?",
        negative: "I'm sorry you're experiencing technical difficulties. I'll escalate it to our engineering team."
      },
      delivery: {
        positive: "Wonderful news about your delivery! Thank you for letting us know.",
        neutral: "I'll help track your delivery. Could you please share your order number?",
        negative: "I apologize for the delivery delay. I'll contact our logistics team right away."
      },
      general: {
        positive: "Thank you for reaching out! I'm happy to help.",
        neutral: "Thanks for your message. I'll review this and get back to you shortly.",
        negative: "I understand your frustration and I'm here to help resolve this for you."
      }
    };
    const categoryTemplate = templates[category] || templates.general;
    return categoryTemplate[sentiment] || categoryTemplate.neutral;
  }

  analyzeTicket(text) {
    const sentimentAnalysis = this.analyzeSentiment(text);
    const priorityAnalysis = this.predictPriority(text, sentimentAnalysis.sentiment);
    const category = this.classifyCategory(text);
    const suggestedReply = this.generateSuggestedReply(text, category, sentimentAnalysis.sentiment);
    const reasoning = [];
    if (sentimentAnalysis.sentiment === 'negative') reasoning.push(`Negative sentiment detected (score ${sentimentAnalysis.score.toFixed(2)})`);
    if (priorityAnalysis.priority === 'high') reasoning.push(`High priority assigned due to urgency keywords and negative sentiment`);
    if (priorityAnalysis.keywords.length) reasoning.push(`Key indicators: ${priorityAnalysis.keywords.join(', ')}`);
    return {
      sentiment: sentimentAnalysis.sentiment,
      priority: priorityAnalysis.priority,
      category,
      suggestedReply,
      reasoning: reasoning.join('. ') || 'No specific indicators.',
      keywords: [...new Set([...sentimentAnalysis.keywords, ...priorityAnalysis.keywords])],
      sentimentScore: sentimentAnalysis.score,
      priorityScore: priorityAnalysis.score,
    };
  }

  async analyzeTicketWithAI(text) {
    try {
      const modelAnalysis = await this.callOpenRouter(text);
      if (modelAnalysis) return modelAnalysis;
    } catch (error) {
      console.error('OpenRouter analysis failed, using fallback:', error.message);
    }

    return this.analyzeTicket(text);
  }

  async handleCustomerChatInteraction(messages, contextTickets) {
    if (!process.env.OPENROUTER_API_KEY) {
      return { text: "I'm currently unable to process requests as the AI is offline.", action: "none" };
    }

    const openRouterUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    const systemPrompt = `You are the AI Assistant for ClarityHelp.
Be concise, helpful, and polite. 
You can help the user troubleshoot issues, or give them the status of their active tickets.
If the user's issue requires human intervention or they ask to raise a ticket, gracefully let them know and set the action to "raise_ticket".
IMPORTANT: NEVER use the word "low" to describe priority to a customer as it may frustrate them. Instead, use terms like "Standard" or "Regular".
ALWAYS respond in a PROFESSIONAL, WARM, AND CONCISE manner.
When confirming a ticket, use the phrase "Your ticket has been issued" if appropriate.

Current active tickets for this user:
${contextTickets || 'None'}

Return ONLY valid JSON in this exact format:
{
  "text": "Your conversational response to the user here",
  "action": "none" | "raise_ticket"
}`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
    ];

    const startTime = Date.now();
    try {
      const response = await fetch(openRouterUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': process.env.OPENROUTER_APP_NAME || 'Support System Backend',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: formattedMessages,
        }),
      });

      if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
      const data = await response.json();
      const endTime = Date.now();
      console.log(`OpenRouter Response Time: ${endTime - startTime}ms`);
      
      const content = data?.choices?.[0]?.message?.content;
      
      try {
        const parsed = JSON.parse(content);
        return { text: parsed.text || "I found something, but couldn't format it right.", action: parsed.action || "none" };
      } catch (e) {
        return { text: content, action: "none" }; // fallback if it didn't return json
      }
    } catch (error) {
      console.error("AI Chat Error:", error.message);
      return { text: "Sorry, I encountered an issue connecting to the AI service.", action: "none" };
    }
  }
}

module.exports = new AIService();