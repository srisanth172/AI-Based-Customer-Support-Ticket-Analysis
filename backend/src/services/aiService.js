const fs = require('fs');

class AIService {
  async callCategorizationAPI(text) {
    const groqApiKey = process.env.GROQ_API_KEY;
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const model = 'llama3-8b-8192';

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
      '- Is irrelevant (e.g., "my pen is lost")',
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

    const response = await fetch(groqUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
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
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const textBody = await response.text();
      throw new Error(`Groq request failed: ${response.status} ${textBody}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const normalized = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(normalized);
    return {
      sentiment: parsed.sentiment || 'neutral',
      priority: (parsed.priority || 'Medium').toLowerCase(),
      category: parsed.category || 'Technical Issues',
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
      'Product Issues': ['damaged', 'defective', 'not working', 'broken', 'quality'],
      'Account Issues': ['login', 'password', 'account', 'locked', 'reset', 'sign in', 'email change'],
      'Notifications & Communication': ['otp', 'email', 'sms', 'message', 'notification', 'alert'],
      'Subscription & Plans': ['plan', 'upgrade', 'activation', 'subscription', 'renew', 'tier', 'membership'],
    };
    let bestMatch = 'Technical Issues';
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
    if (sentimentAnalysis.sentiment === 'negative') reasoning.push(`Negative sentiment detected`);
    if (priorityAnalysis.priority === 'high') reasoning.push(`Assigned High Priority (Billing issue or Critical Keywords)`);
    if (priorityAnalysis.keywords.length) reasoning.push(`Key indicators: ${priorityAnalysis.keywords.join(', ')}`);
    const teamMap = {
      'Payments': 'payments_team',
      'Orders & Delivery': 'fulfillment_team',
      'Returns & Refunds': 'customer_success',
      'Product Issues': 'hardware_support',
      'Account Issues': 'tech_support',
      'Notifications & Communication': 'customer_success',
      'Subscription & Plans': 'customer_success'
    };
    const suggestedTeam = teamMap[category] || 'customer_success';

    return {
      sentiment: sentimentAnalysis.sentiment,
      priority: priorityAnalysis.priority,
      category,
      suggestedReply,
      suggestedSolutions: [
        "Please provide more details about the issue.",
        "Have you tried restarting the application?",
        "Can you clear your browser cache and try again?",
        "Our technical team is looking into this."
      ],
      suggestedTeam,
      reasoning: reasoning.join('. ') || 'No specific indicators.',
      keywords: [...new Set([...sentimentAnalysis.keywords, ...priorityAnalysis.keywords])],
      sentimentScore: sentimentAnalysis.score,
      priorityScore: priorityAnalysis.score,
    };
  }

  async analyzeTicketWithAI(text) {
    try {
      const modelAnalysis = await this.callCategorizationAPI(text);
      if (modelAnalysis) return modelAnalysis;
    } catch (error) {
      console.error('Groq analysis failed, using fallback:', error.message);
    }

    return this.analyzeTicket(text);
  }

  async analyzeTicketWithImage(text, imagePath) {
    try {
      let base64Image = '';
      if (imagePath && fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        base64Image = imageBuffer.toString('base64');
      }

      const groqApiKey = process.env.GROQ_API_KEY;
      const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
      const model = 'llama-3.2-11b-vision-preview';

      const promptText = `
      Analyze the customer support message and the attached image.
      If the image is completely unrelated to the description or issue category (e.g. random internet meme, spam, unrelated picture), you MUST classify it as isSpam: true.
      Return strictly valid JSON only.
      JSON schema:
      {
        "isValid": boolean,
        "sentiment": "positive|neutral|negative",
        "priority": "low|medium|high",
        "category": "Payments | Electronic Goods | Notifications & Communication | Integrations | Connectivity Issues | Subscription & Plans | Technical Issues | OutOfScope",
        "reasoning": string,
        "suggestedReply": "A highly empathetic and dynamic 1-sentence quick acknowledgment tailored to the user's intent and emotion (e.g. 'I am so sorry to hear you are facing this error. We are looking into it immediately.' or 'Thank you for providing those details. Please wait a moment while we review.')",
        "suggestedSolutions": ["A 2-3 line draft reply written directly to the customer in first person (e.g. 'Could you please provide more details about your issue?')", "Another 2-3 line drafted reply written to the customer", "..."],
        "keywords": string[]
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

      const response = await fetch(groqUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
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
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Groq request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return { ...this.analyzeTicket(text), isSpam: false };

      const normalized = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(normalized);
      
      return {
        sentiment: parsed.sentiment || 'neutral',
        priority: parsed.priority || 'medium',
        category: parsed.category || 'Technical Issues',
        suggestedReply: parsed.suggestedReply || 'Thanks for your message. We are reviewing it now.',
        suggestedSolutions: Array.isArray(parsed.suggestedSolutions) ? parsed.suggestedSolutions : ['Please provide more details.', 'Restart your device.', 'Clear your cache.', 'Contact our team.'],
        reasoning: parsed.reasoning || 'Classified by model output.',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        isValid: parsed.isValid !== undefined ? parsed.isValid : true,
        isSpam: parsed.category === 'OutOfScope' || parsed.isValid === false
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



    const systemPrompt = `You are an AI assistant for a customer support admin dashboard. 
    Analyze the provided ticket data and provide short, actionable insights. 
    Focus on trends, problems, and recommendations. Keep answers concise and useful.
    
    Current Dashboard Context:
    - Tickets Created Today: ${contextData.trends?.[contextData.trends.length - 1]?.count || 0}
    - Open Tickets: ${contextData.openTickets || 0}
    - Top Issue Category: ${contextData.topCategory || 'N/A'}
    - Unhappy Customers (Angry Sentiment): ${contextData.negativeTickets || 0}
    - Historical Trends (Last 7 Days): ${JSON.stringify(contextData.trends || [])}`;

    const groqApiKey = process.env.GROQ_API_KEY;
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const model = 'llama3-8b-8192';

    try {
      const response = await fetch(groqUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
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

      if (!response.ok) throw new Error('Copilot Groq API failed');
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
    const groqApiKey = process.env.GROQ_API_KEY;
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const model = 'llama3-8b-8192';

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

    const response = await fetch(groqUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
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
    const groqApiKey = process.env.GROQ_API_KEY;
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const model = 'llama3-8b-8192';

    const systemPrompt = `You are a helpful AI Copilot for a customer support administrator. 
    You help analyze tickets, suggest replies, and provide insights.
    ${context ? `Here is some context about the current ticket: ${context}` : ''}
    Keep your answers concise and professional.`;

    try {
      const response = await fetch(groqUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
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
      return data?.choices?.[0]?.message?.content || "I couldn't process that request.";
    } catch (error) {
      console.error('Copilot Chat error:', error);
      return "Something went wrong with the Copilot service.";
    }
  }
}

module.exports = new AIService();