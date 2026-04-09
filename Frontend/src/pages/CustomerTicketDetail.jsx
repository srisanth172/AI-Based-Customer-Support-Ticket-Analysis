import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChatBubbleLeftRightIcon, PaperClipIcon, PaperAirplaneIcon, ArrowPathIcon, HandThumbUpIcon, HandThumbDownIcon, SparklesIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';
import { debounce } from 'lodash';

const CustomerTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [sending, setSending] = useState(false);
  
  // Live Triage State
  const [triage, setTriage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!isNew) {
      fetchTicket();
      
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      socket.emit('joinTicket', id);
      socket.on('ticketUpdate', (updatedTicket) => {
        setTicket(updatedTicket);
        scrollToBottom();
      });
      return () => socket.disconnect();
    }
  }, [id, isNew]);

  // Live AI Triage Logic
  const debouncedTriage = useRef(
    debounce(async (text) => {
      if (text.length < 20) {
        setTriage(null);
        return;
      }
      setIsAnalyzing(true);
      try {
        const response = await api.post('/ai/predict', { text });
        setTriage(response.data);
      } catch (error) {
        console.error("Triage failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000)
  ).current;

  useEffect(() => {
    if (isNew && message.trim()) {
      debouncedTriage(message);
    } else {
      setTriage(null);
    }
  }, [message, isNew]);

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data);
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      toast.error('Ticket not found');
      navigate('/customer/tickets');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        return toast.error('Please upload an image file.');
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedImage) return;
    
    setSending(true);
    try {
      let attachmentUrl = null;
      
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        attachmentUrl = uploadRes.data.url;
      }

      if (isNew) {
        const payload = {
          messages: [{ sender: 'user', text: message, attachmentUrl }]
        };
        const res = await api.post('/tickets', payload);
        
        // Celebration!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#3b82f6']
        });

        toast.success('Ticket created successfully!');
        navigate(`/customer/tickets/${res.data.ticketId}`);
      } else {
        await api.post(`/tickets/${id}/messages`, {
          message: message,
          sender: 'user',
          attachmentUrl
        });
        setMessage('');
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchTicket(); // In real app, socket handles this, but we'll fetch just in case
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReopen = async () => {
    try {
      await api.patch(`/tickets/${id}/status`, { status: 'open' });
      toast.success('Ticket reopened');
      fetchTicket();
    } catch (error) {
      toast.error('Failed to reopen ticket');
    }
  };

  if (loading && !isNew) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isResolved = ticket?.status === 'resolved';

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isNew ? 'Create New Ticket' : `Ticket #${ticket.ticketId}`}
          </h2>
          {!isNew && (
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase ring-1 ring-inset ${
                isResolved ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 
                'bg-amber-50 text-amber-700 ring-amber-600/20'
              }`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase ring-1 ring-inset ${
                ticket.priority === 'high' ? 'bg-red-50 text-red-700 ring-red-600/20' : 
                'bg-slate-50 text-slate-700 ring-slate-600/20'
              }`}>
                {ticket.priority} Priority
              </span>
            </div>
          )}
        </div>
        {!isNew && isResolved && (
          <button onClick={handleReopen} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors">
            <ArrowPathIcon className="h-4 w-4" /> Reopen Ticket
          </button>
        )}
      </div>

      {/* AI Summary Banner */}
      {!isNew && ticket?.aiAnalysis?.reasoning && ticket.messages?.length > 1 && (
        <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-start gap-3 shrink-0">
          <SparklesIcon className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-0.5">AI Summary</p>
            <p className="text-sm text-indigo-700">{ticket.aiAnalysis.reasoning}</p>
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
        {isNew ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto opacity-60">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-600 font-medium text-lg">Describe your issue below</p>
            <p className="text-slate-400 text-sm mt-2">Our AI agent or a human specialist will review your request immediately.</p>
            
            {/* Live Triage Panel */}
            {(isAnalyzing || triage) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-4 glass rounded-2xl w-full border-indigo-100/50 shadow-lg text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className={`h-4 w-4 text-indigo-500 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-widest">Real-time Triage</span>
                  </div>
                  {isAnalyzing && (
                    <span className="text-[10px] text-indigo-400 font-medium animate-pulse italic">Clarity AI is analyzing...</span>
                  )}
                </div>
                
                {triage ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Predicted Category</p>
                      <p className="text-sm font-semibold text-slate-700 capitalize">{triage.category}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Auto-Priority</p>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        triage.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {triage.priority}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-10 flex items-center justify-center">
                    <div className="flex space-x-1">
                      <div className="h-1.5 w-1.5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="h-1.5 w-1.5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-1.5 w-1.5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {ticket.messages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-3.5 ${
                    isUser 
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' 
                      : msg.sender === 'bot' 
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm' 
                        : 'bg-white border border-indigo-100 ring-1 ring-indigo-50 text-slate-800 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.sender === 'bot' && (
                      <div className="flex items-center gap-1.5 mb-2 opacity-70">
                        <SparklesIcon className="h-3 w-3" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">AI Agent</span>
                      </div>
                    )}
                    {msg.sender === 'admin' && (
                      <div className="flex items-center gap-1.5 mb-2 text-indigo-600">
                        <span className="text-[10px] uppercase font-bold tracking-wider">Support Team</span>
                      </div>
                    )}
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    {msg.attachmentUrl && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-black/10">
                        <img 
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${msg.attachmentUrl}`} 
                          alt="Attachment" 
                          className="max-h-64 object-cover"
                        />
                      </div>
                    )}
                    <div className={`text-[10px] mt-2 font-medium ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isResolved && (
              <div className="mt-8 mb-4 border border-emerald-200 bg-emerald-50 rounded-2xl p-5 text-center shadow-sm">
                <p className="text-emerald-800 font-medium mb-3">This ticket has been resolved.</p>
                <p className="text-emerald-600 text-sm mb-4">How was your experience?</p>
                <div className="flex justify-center gap-3">
                  <button className="p-2 bg-white rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500">
                    <HandThumbUpIcon className="h-6 w-6" />
                  </button>
                  <button className="p-2 bg-white rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm focus:ring-2 focus:ring-red-500">
                    <HandThumbDownIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        {imagePreview && (
          <div className="mb-3 flex items-start">
            <div className="relative inline-block border border-slate-200 p-1 rounded-xl bg-slate-50 shadow-sm">
              <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
              <button 
                onClick={() => { setImagePreview(null); setSelectedImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-md"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 mb-2 font-medium">
          <span className="inline-block mr-1 text-emerald-500">&bull;</span>
          You will be notified via email when your ticket is resolved.
        </div>

        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isResolved || sending}
            className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors shrink-0 disabled:opacity-50 border border-slate-200"
          >
            <PhotoIcon className="h-6 w-6" />
          </button>
          <div className="relative flex-1">
            <textarea
              rows={imagePreview ? 2 : 1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isResolved || sending}
              placeholder={isResolved ? "Cannot reply to a resolved ticket..." : isNew ? "Please describe your problem in detail..." : "Reply to support..."}
              className="block w-full resize-none rounded-2xl border-0 py-3.5 px-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={(!message.trim() && !selectedImage) || isResolved || sending}
            className="p-3.5 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 hover:shadow-md transition-all shrink-0 disabled:opacity-50 disabled:hover:shadow-none mb-0.5"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerTicketDetail;
