// src/pages/CustomerChat.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ChatBox from '../components/UI/ChatBox';
import api from '../services/api';

const CustomerChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?', timestamp: new Date().toISOString() }
  ]);
  const [ticketStatus, setTicketStatus] = useState(null);
  const [isTicketRaised, setIsTicketRaised] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  
  const handleSendMessage = async (text) => {
    // Add user message immediately for real-time UI
    const userMessage = { sender: 'user', text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Connect to the backend
      const response = await api.post('/tickets/chatbot', {
        message: text,
        conversationHistory: messages
      });
      
      const botResponse = { 
        sender: 'bot', 
        text: response.data.reply, 
        timestamp: new Date().toISOString() 
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // If the AI specifically tags [RAISE_TICKET] or asks a very direct question, show the ticket button
      if (response.data.reply.includes('raise a support ticket') || response.data.reply.includes('[RAISE_TICKET]')) {
        // Do nothing special, the UI already handles "showRaiseButton" via messages length or we can trigger it
      }
    } catch (error) {
      console.error(error);
      const errorResponse = { 
        sender: 'bot', 
        text: 'I am experiencing connection issues. Please try again or open a ticket directly.', 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, errorResponse]);
    }
  };
  
  const handleRaiseTicket = async () => {
    if (isIssuing || isTicketRaised) return;

    setIsIssuing(true);
    try {
      const issueMessage = [...messages].reverse().find((entry) => entry.sender === 'user')?.text || messages[messages.length - 1]?.text || 'Customer requested support assistance.';
      const response = await api.post('/tickets', {
        messages: [{ sender: 'user', text: issueMessage, timestamp: new Date().toISOString() }],
      });

      const createdTicket = response.data.ticket || response.data;
      const ticketId = createdTicket.ticketId;

      setIsTicketRaised(true);
      setTicketStatus({ id: ticketId, status: createdTicket.status || 'open' });
      toast.success(`Ticket #${ticketId} created successfully! Our team will review it shortly.`);

      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: `Great! I've created ticket #${ticketId} for you. You can track its status in your dashboard.`,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Failed to create ticket from chat:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setIsIssuing(false);
    }
  };
  
  return (
    <>
      {/* Floating Button Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 hover:bg-indigo-700 transition-all z-50 ${isOpen ? 'hidden' : 'block'}`}
      >
        <ChatBubbleLeftRightIcon className="h-7 w-7" />
      </button>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-80 sm:w-[400px] bg-[#0d111c] rounded-[24px] shadow-2xl z-50 flex flex-col border border-white/5 overflow-hidden h-[600px] max-h-[85vh] backdrop-blur-2xl"
          >
            <div className="bg-[#161b26]/80 p-5 flex justify-between items-center text-white shrink-0 border-b border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/10 ring-1 ring-white/10">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] tracking-tight text-white/90">AI Support IQ</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[11px] font-bold text-emerald-500/80 uppercase tracking-widest">Online Now</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ChatBox
                messages={messages}
                onSendMessage={handleSendMessage}
                showRaiseButton={!isTicketRaised && !isIssuing && (messages.some(m => m.text?.includes('[RAISE_TICKET]') || m.text?.toLowerCase().includes('raise a support ticket')))}
                onRaiseTicket={handleRaiseTicket}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CustomerChat;