import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, SparklesIcon, TicketIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi there! I'm your ClarityHelp AI assistant. Ask me to check your ticket status or help you troubleshoot!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuedTicketId, setIssuedTicketId] = useState(null);
  const [status, setStatus] = useState('online'); // Default to online for better UX
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await api.get('/auth/me'); // Simple heartbeat
        setStatus('online');
      } catch (err) {
        setStatus('offline');
      }
    };
    if (isOpen) {
      checkStatus();
      // Focus input when chat opens
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      if (e.detail?.query) {
        setInput(e.detail.query);
      }
    };
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const payloadMessages = [...messages, { role: 'user', text: userMessage }].map(m => ({ sender: m.role, text: m.text }));
      const response = await api.post('/chat/interact', { messages: payloadMessages });
      
      const botResponse = response.data.text;
      const action = response.data.action;

      setMessages(prev => [...prev, { role: 'assistant', text: botResponse, action }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble retrieving data right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (action === 'raise_ticket') {
      setIsIssuing(true);
      try {
        const payload = {
          messages: messages.map(m => ({
            sender: m.role === 'assistant' ? 'bot' : 'user',
            text: m.text,
            timestamp: new Date()
          }))
        };
        const response = await api.post('/tickets', payload);
        const ticketId = response.data.ticketId;
        
        setIssuedTicketId(ticketId);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: `Your ticket has been issued. Your ticket ID is ${ticketId}. You can track its progress in the "My Tickets" section.`
        }]);
      } catch (error) {
        setMessages(prev => [...prev, { role: 'assistant', text: "I'm sorry, I couldn't issue the ticket automatically. Please use the 'New Ticket' page." }]);
      } finally {
        setIsIssuing(false);
      }
    }
  };

  return (
    <>
      {/* ─── Floating Button ─── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 p-4 rounded-2xl chat-button-glow text-white z-40 group"
          >
            <ChatBubbleLeftRightIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
            {/* Ping indicator */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white border-2 border-indigo-500"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Chat Window ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-6 right-6 w-[340px] sm:w-[400px] bg-white rounded-2xl z-50 flex flex-col overflow-hidden border border-black/[0.06]"
            style={{ 
              maxHeight: 'calc(100vh - 100px)',
              boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.03)',
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                    <SparklesIcon className="h-[18px] w-[18px] text-indigo-300" />
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${
                    status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-[13px] tracking-tight">Clarity AI</h3>
                  <p className="text-[10px] text-white/40 font-medium tracking-wide">
                    {status === 'online' ? 'Online · Ready to help' : 'Currently Offline'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/30 hover:text-white transition-all p-1.5 hover:bg-white/10 rounded-xl"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* ─── Messages ─── */}
            <div 
              className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-3 min-h-[300px] max-h-[400px]" 
              ref={scrollRef}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`px-4 py-2.5 max-w-[85%] text-[13px] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'chat-bubble-user' 
                      : 'chat-bubble-bot'
                  }`}>
                    {msg.text}
                  </div>
                  
                  {/* Raise Ticket Action */}
                  {msg.action === 'raise_ticket' && !issuedTicketId && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => handleAction('raise_ticket')}
                      disabled={isIssuing}
                      className="mt-2 text-[12px] font-semibold px-4 py-2 btn-primary rounded-xl flex items-center gap-2"
                    >
                      {isIssuing ? (
                        <>
                          <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Issuing Ticket...
                        </>
                      ) : (
                        <>
                          <TicketIcon className="h-4 w-4" />
                          Issue Ticket Now
                        </>
                      )}
                    </motion.button>
                  )}
                  
                  {/* View Ticket Button */}
                  {msg.role === 'assistant' && msg.text.includes('ticket ID is') && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => { setIsOpen(false); navigate(`/customer/tickets/${issuedTicketId}`); }}
                      className="mt-2 text-[12px] font-semibold px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
                    >
                      View Ticket Status
                    </motion.button>
                  )}
                </motion.div>
              ))}
              
              {/* Typing Indicator */}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start"
                >
                  <div className="chat-bubble-bot px-4 py-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" />
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </motion.div>
              )}
            </div>

            {/* ─── Input Form ─── */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 shrink-0">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full pl-4 pr-12 py-2.5 bg-slate-50/80 border-0 ring-1 ring-inset ring-slate-200/80 rounded-xl focus:ring-2 focus:ring-indigo-500 text-[13px] font-medium placeholder:text-slate-400 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all duration-200 hover:shadow-md hover:shadow-indigo-600/20"
                >
                  <PaperAirplaneIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatWidget;
