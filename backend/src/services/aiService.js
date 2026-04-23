const fs = require('fs');

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
      '  "priority": "low|medium|high",',
      '  "priorityScore": number,',
      '  "category": "billing|technical|delivery|account|product|general",',
      '  "suggestedReply": string,',
      '  "reasoning": string,',
      '  "keywords": string[],',
      '  "suggestedTeam": "unassigned|billing_team|tech_support|customer_success|shipping_dept"',
      '}',
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
      suggestedTeam: parsed.suggestedTeam || 'unassigned',
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

  predictPriority(text, sentiment, category) {
    let priority = 'low';
    
    // Use Category-based rules per User Request:
    if (category === 'billing') {
      priority = 'high';
    } else if (category === 'technical') {
      priority = 'medium';
    } else if (category === 'general') {
      priority = 'low';
    }

    // Still scan for urgent keywords as a fallback escalation
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'money', 'refund'];
    const keywords = [];
    const lowerText = text.toLowerCase();
    
    urgentKeywords.forEach(k => { 
      if (lowerText.includes(k)) { 
        keywords.push(k);
        if (priority !== 'high') priority = 'high';
      } 
    });

    if (sentiment === 'negative' && priority === 'low') {
      priority = 'medium';
    }

    return { priority, score: priority === 'high' ? 0.9 : priority === 'medium' ? 0.5 : 0.1, keywords };
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
    const category = this.classifyCategory(text);
    const priorityAnalysis = this.predictPriority(text, sentimentAnalysis.sentiment, category);
    const suggestedReply = this.generateSuggestedReply(text, category, sentimentAnalysis.sentiment);
    const reasoning = [];
    if (sentimentAnalysis.sentiment === 'negative') reasoning.push(`Negative sentiment detected`);
    if (priorityAnalysis.priority === 'high') reasoning.push(`Assigned High Priority (Billing issue or Critical Keywords)`);
    if (priorityAnalysis.keywords.length) reasoning.push(`Key indicators: ${priorityAnalysis.keywords.join(', ')}`);
    const teamMap = {
      billing: 'billing_team',
      technical: 'tech_support',
      delivery: 'shipping_dept',
      account: 'customer_success',
      product: 'tech_support',
      general: 'customer_success'
    };
    const suggestedTeam = teamMap[category] || 'customer_success';

    return {
      sentiment: sentimentAnalysis.sentiment,
      priority: priorityAnalysis.priority,
      category,
      suggestedReply,
      suggestedTeam,
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

  async analyzeTicketWithImage(text, imagePath) {
    if (!process.env.OPENROUTER_API_KEY) {
      // Fallback
      return { ...this.analyzeTicket(text), isSpam: false };
    }

    try {
      let base64Image = '';
      if (imagePath && fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        base64Image = imageBuffer.toString('base64');
      }

      const openRouterUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

      const promptText = `
      Analyze the customer support message and the attached image.
      If the image is completely unrelated to the description or issue category (e.g. random internet meme, spam, unrelated picture), you MUST classify it as isSpam: true.
      Return strictly valid JSON only.
      JSON schema:
      {
        "isSpam": boolean,
        "sentiment": "positive|neutral|negative",
        "sentimentScore": number,
        "priority": "low|medium|high",
        "priorityScore": number,
        "category": "billing|technical|delivery|account|product|general",
        "reasoning": string,
        "suggestedReply": string,
        "keywords": string[],
        "suggestedTeam": "unassigned|billing_team|tech_support|customer_success|shipping_dept"
      }
      
      Message description: ${text}`;

      let messagesContent = [{ type: 'text', text: promptText }];
      
      if (base64Image) {
        // Detect mime type
        const extension = imagePath.split('.').pop().toLowerCase();
        let mimeType = 'image/jpeg';
        if (extension === 'png') mimeType = 'image/png';
        if (extension === 'webp') mimeType = 'image/webp';

        messagesContent.push({
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`
          }
        });
      }

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
              content: 'You are a support-ticket classification engine that analyzes both text and images. Output strict JSON only.'
            },
            {
              role: 'user',
              content: messagesContent
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return { ...this.analyzeTicket(text), isSpam: false };

      const normalized = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(normalized);
      
      return {
        sentiment: parsed.sentiment || 'neutral',
        priority: parsed.priority || 'medium',
        category: parsed.category || 'general',
        suggestedReply: parsed.suggestedReply || 'Thanks for your message. We are reviewing it now.',
        suggestedTeam: parsed.suggestedTeam || 'unassigned',
        reasoning: parsed.reasoning || 'Classified by model output.',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        sentimentScore: Number(parsed.sentimentScore || 0),
        priorityScore: Number(parsed.priorityScore || 0.5),
        isSpam: Boolean(parsed.isSpam || false)
      };

    } catch (error) {
      console.error('Vision AI failed, using fallback:', error.message);
      return { ...this.analyzeTicket(text), isSpam: false };
    }
  }

  async askCopilot(question, contextData) {
    if (!process.env.OPENROUTER_API_KEY) {
      return "I'm currently running in offline mode. I can only do basic local reasoning right now!";
    }

    const openRouterUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    const systemPrompt = `You are an AI assistant for a customer support admin dashboard. 
    Analyze the provided ticket data and provide short, actionable insights. 
    Focus on trends, problems, and recommendations. Keep answers concise and useful.
    
    Current Dashboard Context:
    - Tickets Created Today: ${contextData.trends?.[contextData.trends.length - 1]?.count || 0}
    - Open Tickets: ${contextData.openTickets || 0}
    - Top Issue Category: ${contextData.topCategory || 'N/A'}
    - Unhappy Customers (Angry Sentiment): ${contextData.negativeTickets || 0}
    - Historical Trends (Last 7 Days): ${JSON.stringify(contextData.trends || [])}`;

    try {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('No API Key');
      }

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
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ]
        })
      });

      if (!response.ok) throw new Error('Copilot API failed');
      const data = await response.json();
      return data?.choices?.[0]?.message?.content || "Sorry, I couldn't process that request at this moment.";
    } catch (error) {
      console.warn('Copilot using local intelligence fallback:', error.message);
      
      const { totalTickets, openTickets, negativeTickets, trends } = contextData;
      const lowerQ = question.toLowerCase();

      if (lowerQ.includes('problem') || lowerQ.includes('prediction') || lowerQ.includes('future')) {
        let prediction = "Based on our current dashboard analytics: ";
        if (negativeTickets > totalTickets * 0.15) {
          prediction += "I predict a high risk of customer churn due to the high volume of 'Angry' tickets. We should prioritize resolving high-priority technical issues immediately.";
        } else if (openTickets > totalTickets * 0.5) {
          prediction += "Our resolution throughput is currently falling behind. At this rate, we will likely face a significant backlog by next week unless we increase staffing.";
        } else {
          prediction += "Operations are currently stable. I predict a smooth upcoming week with no major bottlenecks anticipated.";
        }
        return prediction;
      }

      if (lowerQ.includes('status') || lowerQ.includes('how') || lowerQ.includes('stats')) {
        return `We currently have ${totalTickets} total tickets, with ${openTickets} still open. ${negativeTickets} customers are currently expressing negative sentiment. Our trend line shows ${trends?.length || 0} days of historical data available.`;
      }

      return "I'm Nexa Copilot. I'm currently operating in high-performance local mode. I can analyze your ticket volumes and predict bottlenecks. Ask me about our performance trends or future predictions!";
    }
  }

  async chatWithCustomer(messages) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('No API Key');
    }

    const openRouterUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    const systemPrompt = `You are a helpful and polite customer support agent for a SaaS text-based application. 
    Analyze the user's issue. If they are just saying hello, greet them.
    If they are describing a technical issue, billing issue, or problem, offer brief troubleshooting steps. 
    If they are very upset or explicitly ask for human help or to create a ticket, ask them: "Would you like me to raise a support ticket for this issue?". Keep your answers concise, empathetic, and professional. Use markdown formatting.`;

    // messages is already an array of { role: 'user' | 'assistant', content: string }
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role || (m.sender === 'bot' ? 'assistant' : 'user'),
        content: m.text || m.content
      }))
    ];

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
        temperature: 0.5,
        messages: apiMessages
      })
    });

    if (!response.ok) throw new Error('Customer Chatbot API failed');
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "Sorry, I couldn't treat that request at this moment.";
  }

  async chatWithCopilot(message, context = "") {
    if (!process.env.OPENROUTER_API_KEY) {
      return "Nex-AI Copilot is currently offline. How can I assist you otherwise?";
    }

    const openRouterUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    const systemPrompt = `You are a helpful AI Copilot for a customer support administrator. 
    You help analyze tickets, suggest replies, and provide insights.
    ${context ? `Here is some context about the current ticket: ${context}` : ''}
    Keep your answers concise and professional.`;

    try {
      const response = await fetch(openRouterUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        })
      });

      if (!response.ok) return "I'm having trouble connecting to my brain right now.";
      const data = await response.json();
      return data?.choices?.[0]?.message?.content || "I'm not sure how to respond to that.";
    } catch (error) {
      return "An error occurred while talking to Copilot.";
    }
  }
}

module.exports = new AIService();