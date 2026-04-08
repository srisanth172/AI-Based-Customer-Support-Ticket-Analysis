// src/pages/CustomerChat.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ChatBox from '../components/UI/ChatBox';
import Button from '../components/UI/Button';

const CustomerChat = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?', timestamp: new Date().toISOString() }
  ]);
  const [ticketStatus, setTicketStatus] = useState(null);
  const [isTicketRaised, setIsTicketRaised] = useState(false);
  
  const handleSendMessage = (text) => {
    // Add user message
    const userMessage = { sender: 'user', text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse = { 
        sender: 'bot', 
        text: 'Thank you for reaching out. I understand your concern. Would you like to create a support ticket?', 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };
  
  const handleRaiseTicket = () => {
    const newTicket = {
      id: 'TKT-' + Math.floor(Math.random() * 10000),
      subject: 'Customer support request',
      status: 'open',
      priority: 'medium',
      messages: messages
    };
    
    setIsTicketRaised(true);
    setTicketStatus({ id: newTicket.id, status: 'open' });
    toast.success(`Ticket #${newTicket.id} created successfully! Our team will review it shortly.`);
    
    // Add confirmation message
    setMessages(prev => [...prev, { 
      sender: 'bot', 
      text: `Great! I've created ticket #${newTicket.id} for you. You can track its status here.`, 
      timestamp: new Date().toISOString() 
    }]);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Support</h1>
            <p className="text-gray-600 mt-1">Chat with our AI assistant</p>
          </div>
          {ticketStatus && (
            <div className="px-4 py-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Ticket #{ticketStatus.id}: <span className="font-semibold uppercase">{ticketStatus.status}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[60vh] min-h-[420px]">
        <ChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          showRaiseButton={!isTicketRaised && messages.length > 2}
          onRaiseTicket={handleRaiseTicket}
        />
      </div>
    </motion.div>
  );
};

export default CustomerChat;