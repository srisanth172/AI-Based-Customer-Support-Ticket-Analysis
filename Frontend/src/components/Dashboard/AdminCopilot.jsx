import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../services/api';

const AdminCopilot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello Admin! I'm your AI Copilot. I have live access to your ticket volume, SLAs, and customer sentiment. How can I assist you with predictions or insights today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Using apiClient to ensure Auth Tokens are included automatically
      const response = await apiClient.post('/ai/query', { message: userMessage });
      
      const { reply } = response.data;
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      console.error('AI Error:', error);
      const detail = error.response?.data?.details?.error?.message || error.response?.data?.error || '';
      setMessages(prev => [...prev, { role: 'assistant', text: `AI unavailable: ${detail || 'Please try again.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[450px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 border-b border-emerald-700/50 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight flex items-center gap-1.5">Swift Admin AI <Sparkles className="w-3 h-3 text-emerald-200" /></h3>
            <p className="text-[10px] text-emerald-100 uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-300 animate-pulse" />
              Operational Intelligence
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-emerald-100 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 text-slate-500 overflow-hidden border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                 <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                 <span className="text-xs font-semibold">Analyzing dashboard context...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 rounded-b-2xl">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about predictions or current operations..." 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors flex items-center justify-center group"
          >
            <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminCopilot;
