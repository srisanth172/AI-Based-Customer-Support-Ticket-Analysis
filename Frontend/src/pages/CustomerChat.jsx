// src/pages/CustomerChat.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { SparklesIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import ChatBox from '../components/UI/ChatBox';
import Button from '../components/UI/Button';
import aiService from '../services/aiService';
import ticketService from '../services/ticketService';

const CustomerChat = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your ClarityHelp AI assistant. How can I help you today?', timestamp: new Date().toISOString() }
  ]);
  const [ticketStatus, setTicketStatus] = useState(null);
  const [isTicketRaised, setIsTicketRaised] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendMessage = async (text) => {
    // Add user message
    const userMessage = { sender: 'user', text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    setIsLoading(true);
    try {
      // Get AI response
      const botText = await aiService.getChatbotResponse(updatedMessages);
      
      const botResponse = { 
        sender: 'bot', 
        text: botText, 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('The AI assistant is temporarily unavailable. You can still raise a manual ticket.');
      
      // Add fallback bot message
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: 'I am having trouble connecting to my brain right now. Please feel free to raise a ticket if you need urgent assistance.', 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRaiseTicket = async () => {
    setIsLoading(true);
    try {
      // Find the first user message for the subject
      const firstUserMessage = messages.find(m => m.sender === 'user')?.text || 'Support Request';
      const subject = firstUserMessage.length > 50 
        ? firstUserMessage.substring(0, 47) + '...' 
        : firstUserMessage;

      const ticketData = {
        subject,
        messages: messages.map(m => ({
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp
        }))
      };
      
      const response = await ticketService.createTicket(ticketData);
      const ticketId = response.ticketId || response.ticket?.ticketId || response._id || response.id;
      
      setIsTicketRaised(true);
      setTicketStatus({ id: ticketId, status: 'open' });
      toast.success(`Ticket #${ticketId} created successfully! Our team will review it shortly.`);
      
      // Add confirmation message
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: `Great! I've created ticket #${ticketId} for you. Our support team has been notified and will get back to you soon.`, 
        timestamp: new Date().toISOString() 
      }]);
    } catch (error) {
      console.error('Ticket creation error:', error);
      toast.error('Failed to create ticket. Please try again or contact support directly.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="max-w-4xl mx-auto space-y-5"
    >
      {/* Header Card */}
      <div 
        className="bg-white rounded-2xl border border-black/[0.06] p-6"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">AI Support Assistant</h1>
              <p className="text-slate-400 text-[13px] mt-0.5">Chat with our AI to get instant help or raise a ticket</p>
            </div>
          </div>
          {ticketStatus && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 rounded-xl ring-1 ring-inset ring-indigo-200">
              <InformationCircleIcon className="h-4 w-4 text-indigo-500" />
              <p className="text-[12px] font-semibold text-indigo-700">
                Ticket #{ticketStatus.id}: <span className="uppercase">{ticketStatus.status}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Container */}
      <div 
        className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden h-[70vh] min-h-[500px]"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
      >
        <ChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          showRaiseButton={!isTicketRaised && messages.length >= 2}
          onRaiseTicket={handleRaiseTicket}
          disabled={isLoading}
        />
      </div>
    </motion.div>
  );
};

export default CustomerChat;