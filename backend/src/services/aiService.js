const fs = require('fs');
const axios = require('axios');

class AIService {
  _getGroqConfig() {
    const groqKey = (process.env.GROQ_API_KEY || '').trim();
    if (!groqKey) return null;
    return {
      name: 'Groq',
      apiKey: groqKey,
      apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.1-8b-instant',
      visionModel: 'llama-3.2-11b-vision-preview'
    };
  }

  _getOpenRouterConfig() {
    const orKey = (process.env.OPENROUTER_API_KEY || '').trim();
    if (!orKey) return null;
    return {
      name: 'OpenRouter',
      apiKey: orKey,
      apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'meta-llama/llama-3-8b-instruct',
      visionModel: 'google/gemini-2.0-flash-001'
    };
  }

  async callCategorizationAPI(text, config) {
    if (!config) return null;
    const { apiKey, apiUrl, model } = config;

    const prompt = [
      'You are an AI system that classifies customer support tickets.',
      '',
      '---',
      '🎯 TASK',
      'Analyze the user’s issue description and classify into ONE of the following categories:',
      '1. Payments',
      '2. Orders & Delivery',
      '3. Returns & Refunds',
      '4. Product Issues',
      '5. Account Issues',
      '6. Notifications & Communication',
      '7. Subscription & Plans',
      '',
      '---',
      '🧠 CATEGORY GUIDELINES',
      '- Payments → failed transactions, money deducted, billing issues',
      '- Orders & Delivery → order not delivered, delayed delivery, wrong address, tracking issues',
      '- Returns & Refunds → return requests, refund not received, replacement issues',
      '- Product Issues → damaged product, defective item, not working properly',
      '- Account Issues → login problems, password reset, account locked',
      '- Notifications & Communication → OTP not received, email/SMS issues',
      '- Subscription & Plans → membership, plan activation, renewal issues',
      '',
      '---',
      '🚫 OUT OF SCOPE RULE',
      'If the issue:',
      '- Does NOT match any category',
      '- Is irrelevant (e.g., "my pen is lost", "toilet repair", "fan repair")',
      '- Is meaningless or spam',
      'Then return:',
      '- category = "OutOfScope"',
      '- valid = false',
      '',
      '---',
      '🔥 PRIORITY RULES',
      '- High → payment failure, missing order, refund not received, critical issue',
      '- Medium → product issues, delays, partial problems',
      '- Low → help requests, minor issues',
      '',
      '---',
      '📦 OUTPUT FORMAT (STRICT JSON ONLY)',
      'Return ONLY this JSON:',
      '{',
      '  "category": "<one of the 7 categories or OutOfScope>",',
      '  "priority": "High | Medium | Low",',
      '  "valid": true | false',
      '}',
      '',
      '---',
      '⚠️ STRICT RULES',
      '- Do NOT include explanations',
      '- Do NOT include extra text',
      '- Always return exactly one category',
      '- If unsure → mark as OutOfScope',
      '',
      '---',
      `classify the following user issue: ${text}`,
    ].join('\n');

    const response = await axios.post(apiUrl, {
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
        response_format: { type: "json_object" }
      }, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
        "X-Title": "Support System Classifier",
      }
    });

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    let parsed;
    try {
      const normalized = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim();
      parsed = JSON.parse(normalized);
    } catch (e) {
      console.error('[AI Categorization] JSON Parse Error:', e.message, 'Content:', content);
      return null;
    }
    return {
      sentiment: parsed.sentiment || 'neutral',
      priority: (parsed.priority || 'Medium').toLowerCase(),
      category: parsed.category || 'Product Issues',
      isValid: parsed.valid !== undefined ? parsed.valid : true,
      priorityScore: parsed.priorityScore || (parsed.priority === 'High' ? 0.9 : parsed.priority === 'Medium' ? 0.5 : 0.1),
      suggestedReply: parsed.suggestedReply || 'Thanks for your message. We are reviewing it now.',
      suggestedSolutions: Array.isArray(parsed.suggestedSolutions) ? parsed.suggestedSolutions : ['Please provide more details.', 'Restart your device.', 'Clear your cache.', 'Contact our team.'],
      reasoning: parsed.reasoning || 'Classified by model output.',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
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
    if (category === 'Payments' || category === 'Returns & Refunds' || category === 'Orders & Delivery') {
      priority = 'high';
    } else if (category === 'Product Issues' || category === 'Account Issues') {
      priority = 'medium';
    } else {
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
      'Payments': ['billing', 'payment', 'charge', 'invoice', 'price', 'cost', 'refund', 'transaction', 'failed', 'deducted'],
      'Orders & Delivery': ['order', 'delivery', 'delayed', 'address', 'tracking', 'shipped', 'shipping', 'not delivered'],
      'Returns & Refunds': ['return', 'refund', 'replacement', 'money back'],
      'Product Issues': ['damaged', 'defective', 'not working', 'broken', 'quality', 'error', 'bug', 'crash', 'slow'],
      'Account Issues': ['login', 'password', 'account', 'locked', 'reset', 'sign in', 'email change'],
      'Notifications & Communication': ['otp', 'email', 'sms', 'message', 'notification', 'alert'],
      'Subscription & Plans': ['plan', 'upgrade', 'activation', 'subscription', 'renew', 'tier', 'membership'],
    };
    let bestMatch = 'Product Issues';
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
      'Payments': {
        positive: "Glad your payment issue is resolved! We aim for seamless transactions.",
        neutral: "I understand you have a payment question. Could you please provide more details?",
        negative: "I apologize for the payment trouble. Our payments team is investigating this immediately."
      },
      'Product Issues': {
        positive: "Great to hear your product is working correctly again!",
        neutral: "I'll help you troubleshoot this product issue. Can you share more details?",
        negative: "I'm sorry you're experiencing product difficulties. Our team is on it."
      },
      'Orders & Delivery': {
        positive: "Glad your order arrived safely!",
        neutral: "I'll help you check your order status. Could you please provide the order number?",
        negative: "I apologize for the delivery trouble. We'll look into a solution for your order."
      }
    };
    const categoryTemplate = templates[category] || templates['Product Issues'];
    return categoryTemplate[sentiment] || categoryTemplate.neutral;
  }

  analyzeTicket(text) {
    const sentimentAnalysis = this.analyzeSentiment(text);
    const category = this.classifyCategory(text);
    const priorityAnalysis = this.predictPriority(text, sentimentAnalysis.sentiment, category);
    const suggestedReply = this.generateSuggestedReply(text, category, sentimentAnalysis.sentiment);
    const reasoning = [];
    let isValid = true;
    
    // Fallback gibberish check
    const gibberishRegex = /^[a-zA-Z0-9;']+$/;
    if (text.length < 5 || (text.length < 20 && gibberishRegex.test(text.replace(/\s/g, '')))) {
      isValid = false;
      reasoning.push(`Text appears to be gibberish or too short`);
    }

    if (sentimentAnalysis.sentiment === 'negative') reasoning.push(`Negative sentiment detected`);
    if (priorityAnalysis.priority === 'high') reasoning.push(`Assigned High Priority (Billing issue or Critical Keywords)`);
    if (priorityAnalysis.keywords.length) reasoning.push(`Key indicators: ${priorityAnalysis.keywords.join(', ')}`);
    const teamMap = {
      'Payments': 'Payments',
      'Orders & Delivery': 'Orders & Delivery',
      'Returns & Refunds': 'Returns & Refunds',
      'Product Issues': 'Product Issues',
      'Account Issues': 'Account Issues',
      'Notifications & Communication': 'Notifications & Communication',
      'Subscription & Plans': 'Subscription & Plans'
    };
    const suggestedTeam = teamMap[category] || 'Support Team';

    return {
      isValid,
      sentiment: sentimentAnalysis.sentiment,
      priority: priorityAnalysis.priority,
      category: isValid ? category : 'OutOfScope',
      suggestedReply,
      suggestedSolutions: [
        "Please provide more details about the issue.",
        "Have you tried restarting the application?",
        "Can you clear your browser cache and try again?",
        "Our support team is looking into this."
      ],
      suggestedTeam,
      reasoning: reasoning.join('. ') || 'No specific indicators.',
      keywords: [...new Set([...sentimentAnalysis.keywords, ...priorityAnalysis.keywords])],
      sentimentScore: sentimentAnalysis.score,
      priorityScore: priorityAnalysis.score,
    };
  }

  isInvalidDescription(text) {
    const cleanText = text.replace(/Title:/gi, '').replace(/Description:/gi, '').trim();
    const rawTextNoSpace = cleanText.replace(/\s+/g, '');
    
    // 1. Too short or total nonsense (less than 12 chars of actual content)
    if (cleanText.length < 12) return true;
    
    // 2. Repeated single character (e.g., "aaaaaaa") or two characters (e.g., "abababa")
    if (/^([a-zA-Z])\1+$/.test(rawTextNoSpace) || /^([a-zA-Z]{2})\1+$/.test(rawTextNoSpace)) return true;
    
    // 3. No spaces in a long string (e.g., "asdfghjklqwertyuiop")
    if (cleanText.length > 15 && !cleanText.includes(' ')) return true;
    
    // 4. Repeated words (e.g., "test test test test")
    const words = cleanText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 3) {
      const uniqueWords = new Set(words);
      if (uniqueWords.size === 1) return true;
    }

    // 5. Common nonsense/test/conversational phrases
    const nonsense = ['hello', 'hi', 'test', 'testing', 'asdf', 'ghjk', 'nonsense', 'nothing', 'console', 'chatter', 'talk', 'chat', 'someone'];
    if (words.length <= 4 && words.every(w => nonsense.includes(w))) return true;

    // 6. Support Relevance Check
    const supportKeywords = [
      'pay', 'order', 'delivery', 'return', 'refund', 'product', 'account', 'login', 'password', 'notification', 'subscription', 'plan',
      'broken', 'damaged', 'failed', 'issue', 'problem', 'help', 'support', 'working', 'error', 'billing', 'charge', 'track', 'shipping', 'sign', 'reset', 'email'
    ];
    const hasSupportIntent = words.some(w => supportKeywords.some(k => w.includes(k)));
    if (words.length < 15 && !hasSupportIntent) return true;
    
    // 7. No alphabetic characters
    if (!/[a-zA-Z]/.test(cleanText)) return true;
    
    return false;
  }

  async analyzeTicketWithAI(text) {
    if (this.isInvalidDescription(text)) {
      return {
        category: 'OutOfScope',
        priority: 'Low',
        keywords: ['invalid'],
        isValid: false,
        isSpam: false,
        isImageMismatch: false
      };
    }

    const providers = [this._getGroqConfig(), this._getOpenRouterConfig()].filter(Boolean);

    for (const config of providers) {
      try {
        console.log(`[AI Analysis] Attempting categorization with ${config.name}...`);
        const modelAnalysis = await this.callCategorizationAPI(text, config);
        
        if (modelAnalysis) {
          // If the model found a valid category, or it's the last provider, return the result
          if (modelAnalysis.category !== 'OutOfScope' || config === providers[providers.length - 1]) {
            return modelAnalysis;
          }
          console.warn(`[AI Analysis] ${config.name} marked as OutOfScope, trying fallback...`);
        }
      } catch (error) {
        console.error(`[AI Analysis] ${config.name} failed:`, error.message);
      }
    }

    return this.analyzeTicket(text);
  }

  async analyzeTicketWithImage(text, imagePath) {
    if (this.isInvalidDescription(text)) {
      return {
        category: 'OutOfScope',
        priority: 'Low',
        keywords: ['invalid'],
        isValid: false,
        isSpam: false,
        isImageMismatch: false
      };
    }

    const providers = [this._getGroqConfig(), this._getOpenRouterConfig()].filter(Boolean);

    let base64Image = '';
    if (imagePath && fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      base64Image = imageBuffer.toString('base64');
    }

    for (const config of providers) {
      try {
        console.log(`[AI Vision] Attempting analysis with ${config.name}...`);
        const { apiKey, apiUrl, visionModel: model } = config;

      const promptText = `
      Analyze the customer support message and the attached image.
      Classify the issue into ONE of these 7 categories ONLY if it is a genuine support request:
      1. Payments
      2. Orders & Delivery
      3. Returns & Refunds
      4. Product Issues
      5. Account Issues
      6. Notifications & Communication
      7. Subscription & Plans

      STRICT REJECTION RULES:
      1. If the text is nonsense, gibberish, "test", "hello", "hi", "how are you", personal chatter, conversational requests (e.g. "i need to talk", "console me"), or completely unrelated to the 7 categories above, you MUST set "isValid": false and "category": "OutOfScope". Do NOT force it into one of the 7 categories.
      2. If the text is valid but the attached image is unrelated to the description, set "isImageMismatch": true.
      3. If the image is AI-generated, set "isAI": true.

      Return strictly valid JSON only.
      JSON schema:
      {
        "isValid": boolean,
        "isImageMismatch": boolean,
        "isAI": boolean,
        "sentiment": "positive|neutral|negative",
        "priority": "low|medium|high",
        "category": "Payments | Orders & Delivery | Returns & Refunds | Product Issues | Account Issues | Notifications & Communication | Subscription & Plans | OutOfScope",
        "reasoning": string,
        "suggestedReply": "A highly empathetic and dynamic 1-sentence quick acknowledgment tailored to the user's intent and emotion.",
        "suggestedSolutions": string[],
        "keywords": string[]
      }
      
      Message description: ${text}`;

      let messagesContent = [{ type: 'text', text: promptText }];
      
      if (base64Image) {
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

      const response = await axios.post(apiUrl, {
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
          ],
          response_format: { type: "json_object" }
        }, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "Support AI Vision",
        }
      });

        if (content) {
          let parsed;
          try {
            const normalized = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim();
            parsed = JSON.parse(normalized);
            
            const result = {
              sentiment: parsed.sentiment || 'neutral',
              priority: parsed.priority || 'medium',
              category: parsed.category || 'Product Issues',
              suggestedReply: parsed.suggestedReply || 'Thanks for your message. We are reviewing it now.',
              suggestedSolutions: Array.isArray(parsed.suggestedSolutions) ? parsed.suggestedSolutions : ['Please provide more details.', 'Restart your device.', 'Clear your cache.', 'Contact our team.'],
              reasoning: parsed.reasoning || 'Classified by model output.',
              keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
              isValid: parsed.isValid !== undefined ? parsed.isValid : (parsed.category !== 'OutOfScope'),
              isSpam: parsed.isImageMismatch === true || parsed.isAI === true || parsed.category === 'OutOfScope',
              isAI: parsed.isAI === true
            };

            // If valid or last provider, return
            if (result.category !== 'OutOfScope' || config === providers[providers.length - 1]) {
              return result;
            }
            console.warn(`[AI Vision] ${config.name} marked as OutOfScope, trying fallback...`);
          } catch (e) {
            console.error(`[AI Vision] ${config.name} JSON Parse Error:`, e.message);
          }
        }
      } catch (error) {
        console.error(`[AI Vision] ${config.name} failed:`, error.message);
      }
    }

    return { ...this.analyzeTicket(text), isSpam: false };
  }

  async generateAdminSuggestions(ticket) {
    const config = this._getGroqConfig() || this._getOpenRouterConfig();
    if (!config) return null;

    const { apiKey, apiUrl, model } = config;

    // Build a readable conversation summary from the last 6 messages
    const recentMessages = (ticket.messages || [])
      .slice(-6)
      .filter(m => m.text)
      .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n');

    const prompt = `You are an expert customer support agent. A customer has raised a ticket with the following details.

TICKET INFO:
- Category: ${ticket.category}
- Priority: ${ticket.priority}
- Customer's Description: ${ticket.description || ticket.subject || 'No description provided'}

RECENT CONVERSATION:
${recentMessages || '(No conversation yet)'}

Your task:
1. Write a "suggestedReply" — a warm, empathetic 1-sentence opening message that directly acknowledges THIS customer's specific issue. Do NOT use generic phrases like "Thanks for contacting us". Make it specific to what the customer described.
2. Write "suggestedSolutions" — exactly 4 specific, step-by-step actions that an admin agent should take or say to resolve THIS exact ticket. Tailor each step to the category (${ticket.category}) and the customer's exact problem. Do NOT give generic steps like "clear browser cache" unless it is relevant to this ticket.

Return ONLY valid JSON:
{
  "suggestedReply": "...",
  "suggestedSolutions": ["action 1", "action 2", "action 3", "action 4"]
}`;

    const response = await axios.post(apiUrl, {
      model,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are a senior customer support specialist. Generate specific, contextual solutions for each unique ticket. Output strict JSON only. No markdown, no extra text.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'Admin Suggestions Generator'
      },
      timeout: 20000
    });

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const normalized = content.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/, '')
      .trim();

    return JSON.parse(normalized);
  }

  async askCopilot(question, contextData) {
    const config = this._getGroqConfig() || this._getOpenRouterConfig();
    if (!config) {
      return "I'm currently running in offline mode. I can only do basic local reasoning right now!";
    }

    const { apiKey, apiUrl, model } = config;

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
      const response = await axios.post(apiUrl, {
          model,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ]
        }, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "Nexa Admin Copilot",
        }
      });

      return response.data?.choices?.[0]?.message?.content || "Sorry, I couldn't process that request at this moment.";
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
    const config = this._getGroqConfig() || this._getOpenRouterConfig();
    if (!config) {
      console.warn('[AI Chat] API configuration is missing (GROQ_API_KEY or OPENROUTER_API_KEY).');
      return "I'm currently in offline mode because my AI brain (API key) hasn't been configured yet. Please check the server environment variables!";
    }

    const { apiKey, apiUrl, model } = config;

    const systemPrompt = `You are **Swift AI**, a helpful and professional customer support assistant for a SaaS platform. 

    Your goals:
    1. **Greeting**: If the user says "Hi", "Hello", or similar, respond warmly. Do NOT suggest a ticket.
    2. **Answering Questions**: If the user asks what you can do or what categories you support, explain the 7 categories: Payments, Orders & Delivery, Returns & Refunds, Product Issues, Account Issues, Notifications & Communication, and Subscription & Plans. Do NOT suggest a ticket.
    3. **Troubleshooting**: Offer brief troubleshooting steps for problems.
    4. **Ticket Escalation**: If (and only if) the user describes a clear issue that needs a ticket, ask: "Would you like me to raise a support ticket for this issue?". 
       IMPORTANT: If you ask this question, you MUST append the exact tag [PROMPT_TICKET] to the end of your message.
    
    CRITICAL: Never append [PROMPT_TICKET] unless you are explicitly asking the user to start the ticket creation process.`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role || (m.sender === 'bot' ? 'assistant' : 'user'),
        content: m.text || m.content
      }))
    ];

    try {
      const response = await axios.post(apiUrl, {
          model,
          temperature: 0.5,
          messages: apiMessages
        }, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "Swift AI Customer Chatbot",
        }
      });

      return response.data?.choices?.[0]?.message?.content || "Sorry, I couldn't treat that request at this moment.";
    } catch (error) {
      console.error('[AI Chat] Provider Error:', error.response?.data || error.message);
      const details = error.response?.data?.error?.message || error.message;
      return `⚠️ **AI Service Error**: ${details}\n\nPlease check your API keys and quotas in the dashboard.`;
    }
  }

  async chatWithCopilot(message, context = "") {
    const config = this._getGroqConfig() || this._getOpenRouterConfig();
    if (!config) return "I'm having trouble connecting to my brain right now.";

    const { apiKey, apiUrl, model } = config;

    const systemPrompt = `You are a helpful AI Copilot for a customer support administrator. 
    You help analyze tickets, suggest replies, and provide insights.
    ${context ? `Here is some context about the current ticket: ${context}` : ''}
    Keep your answers concise and professional.`;

    try {
      const response = await axios.post(apiUrl, {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        }, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "Support Admin Copilot Chat",
        }
      });

      return response.data?.choices?.[0]?.message?.content || "I couldn't process that request.";
    } catch (error) {
      console.error('Copilot Chat error:', error);
      return "Something went wrong with the Copilot service.";
    }
  }
}

module.exports = new AIService();