// src/pages/CustomerChat.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ChatBox from '../components/UI/ChatBox';
import api from '../services/api';

const CustomerChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  React.useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await api.get('/live-chat/customer');
        setMessages(response.data.messages || []);
        setChatId(response.data._id);
      } catch (error) {
        console.error('Failed to fetch chat', error);
      }
    };
    if (isOpen) fetchChat();
  }, [isOpen]);

  const handleSendMessage = async (text) => {
    try {
      const response = await api.post(`/live-chat/message/${chatId || ''}`, {
        message: text,
        sender: 'user'
      });
      setMessages(response.data.messages);
      if (!chatId) setChatId(response.data._id);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };
  
  // Auto-fetch new messages (polling for simplicity, or use socket)
  React.useEffect(() => {
    let interval;
    if (isOpen) {
      interval = setInterval(async () => {
        try {
          const response = await api.get('/live-chat/customer');
          if (response.data.messages.length !== messages.length) {
            setMessages(response.data.messages);
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isOpen, messages.length]);
  
  return (
    <>
      {/* Floating Button Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 hover:bg-emerald-700 transition-all z-50 ${isOpen ? 'hidden' : 'block'}`}
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
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/10 ring-1 ring-white/10">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] tracking-tight text-white/90">Live Support Chat</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[11px] font-bold text-emerald-500/80 uppercase tracking-widest">Admin Online</p>
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
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CustomerChat;