import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftRightIcon, PaperClipIcon, PaperAirplaneIcon, ArrowPathIcon, HandThumbUpIcon, HandThumbDownIcon, SparklesIcon, PhotoIcon, XMarkIcon, CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';
import { debounce } from 'lodash';

const CustomerTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  // Ticket State
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [triage, setTriage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Wizard State
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!isNew) {
      fetchTicket();
      
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      socket.emit('join-ticket', id);
      socket.on('ticket-updated', (updatedTicket) => {
        if (updatedTicket?.ticketId === id) {
          setTicket(updatedTicket);
          scrollToBottom();
        }
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

        setSubmittedId(res.data.ticketId);
        setIsSubmitted(true);
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
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/customer/tickets')}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
          >
            <ArrowRightIcon className="h-5 w-5 rotate-180" />
          </button>
          <div className="h-10 w-1px bg-slate-200" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {isNew ? 'New Support Request' : `Ticket #${ticket?.ticketId}`}
            </h2>
            {!isNew && ticket && (
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${
                  ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                  ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 
                  'bg-amber-50 text-amber-700 ring-amber-600/20'
                }`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {ticket.priority} Priority
                </span>
              </div>
            )}
          </div>
        </div>
        
        {!isNew && isResolved && (
          <button onClick={handleReopen} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4" /> Reopen Ticket
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Conversation Area */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          {/* AI Reasoning Banner (Existing Tickets) */}
          {!isNew && ticket?.aiAnalysis?.reasoning && ticket.messages?.length > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 text-white flex items-start gap-4"
            >
              <div className="p-2 bg-white/20 rounded-lg shrink-0">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">AI Recommendation</p>
                <p className="text-sm font-medium leading-relaxed">{ticket.aiAnalysis.reasoning}</p>
              </div>
            </motion.div>
          )}

          {/* Core Content: Wizard or Chat */}
          <div className="bg-white rounded-2xl border border-black/[0.06] min-h-[500px] flex flex-col overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50/30">
              {isNew ? (
                <div className="w-full max-w-2xl mx-auto py-4">
                  {/* Progress Stepper */}
                  <div className="flex items-center justify-between mb-16 px-4">
                    {[1, 2, 3].map((s) => (
                      <React.Fragment key={s}>
                        <div className="relative group">
                          <div className={`flex items-center justify-center h-10 w-10 rounded-2xl border-2 transition-all duration-500 z-10 relative ${
                            step >= s ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border-slate-200 text-slate-400'
                          }`}>
                            {step > s ? <CheckIcon className="h-6 w-6" /> : <span className="text-sm font-black">{s}</span>}
                          </div>
                          <p className={`absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${step >= s ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {s === 1 ? 'Details' : s === 2 ? 'Evidence' : 'Review'}
                          </p>
                        </div>
                        {s < 3 && (
                          <div className={`h-1 flex-1 mx-4 rounded-full transition-all duration-700 ${step > s ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {isSubmitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 px-8 bg-white rounded-[40px] shadow-2xl space-y-8 border border-slate-100"
                      >
                         <div className="h-24 w-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/30">
                            <CheckIcon className="h-12 w-12 text-white" />
                         </div>
                         <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Ticket Issued</h3>
                            <p className="text-slate-500 font-medium mt-2">Your support request has been formalized.</p>
                         </div>

                         <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl group transition-all hover:bg-white hover:shadow-xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Your Reference ID</p>
                            <p className="text-3xl font-black text-indigo-600 font-mono tracking-tighter select-all">{submittedId}</p>
                         </div>

                         <div className="pt-8 flex flex-col gap-3">
                            <button 
                              onClick={() => navigate(`/customer/tickets/${submittedId}`)}
                              className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                            >
                              View Ticket Thread
                            </button>
                            <button 
                              onClick={() => navigate('/customer')}
                              className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                            >
                              Return to Dashboard
                            </button>
                         </div>
                      </motion.div>
                    ) : step === 1 ? (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                      >
                        <div className="text-center">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tell us everything.</h3>
                          <p className="text-slate-500 font-medium text-sm mt-2">Describe your issue in detail. Our AI is listening in real-time.</p>
                        </div>
                        
                        <div className="space-y-4">
                          <textarea
                            autoFocus
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="I'm having trouble with..."
                            className="w-full h-56 rounded-3xl border-0 p-8 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 sm:text-lg bg-white shadow-inner transition-all resize-none"
                          />
                          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                             <div className="flex items-center gap-3">
                               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-analyzing your input</span>
                             </div>
                             <button
                                onClick={() => setStep(2)}
                                disabled={message.length < 20}
                                className="px-8 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                              >
                                Continue
                              </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : step === 2 ? (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-10"
                      >
                        <div className="text-center">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Any visual evidence?</h3>
                          <p className="text-slate-500 font-medium text-sm mt-2">Screenshots help our team resolve issues 3x faster.</p>
                        </div>

                        <div className="flex flex-col items-center">
                          {imagePreview ? (
                            <div className="relative group">
                              <img src={imagePreview} alt="Preview" className="h-80 w-auto rounded-3xl shadow-2xl border-8 border-white group-hover:scale-[1.02] transition-transform duration-500" />
                              <button 
                                onClick={() => { setImagePreview(null); setSelectedImage(null); }}
                                className="absolute -top-4 -right-4 p-3 bg-slate-900 text-white rounded-2xl shadow-2xl hover:bg-rose-500 transition-all hover:rotate-90"
                              >
                                <XMarkIcon className="h-6 w-6" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full max-w-lg aspect-video border-2 border-dashed border-slate-200 rounded-[40px] p-12 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-6 group relative overflow-hidden bg-white/50"
                            >
                              <div className="p-6 bg-slate-100 rounded-3xl group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-500">
                                <PhotoIcon className="h-10 w-10 text-slate-400 group-hover:text-indigo-600" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Click to upload screenshot</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">PNG, JPG or WEBP (MAX 5MB)</p>
                              </div>
                            </button>
                          )}
                          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                        </div>

                        <div className="flex justify-between items-center">
                          <button onClick={() => setStep(1)} className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Back to description</button>
                          <button
                            onClick={() => setStep(3)}
                            className="px-8 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                          >
                            Final Review
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto space-y-8"
                      >
                        <div className="text-center space-y-4">
                          <div className="h-20 w-20 bg-emerald-500 rounded-[30%] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 rotate-6">
                            <SparklesIcon className="h-10 w-10 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Everything set!</h3>
                            <p className="text-slate-500 font-medium text-sm mt-1">Our AI has pre-classified your ticket for instant routing.</p>
                          </div>
                        </div>

                        <div className="space-y-3 bg-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform">
                            <SparklesIcon className="h-20 w-20 text-indigo-400" />
                          </div>
                          <div className="relative z-10 flex flex-col gap-6">
                            <div>
                               <p className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.2em] mb-2">Predicted Category</p>
                               <p className="text-white text-xl font-bold capitalize">{triage?.category || 'General Support'}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.2em] mb-2">Priority Level</p>
                               <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${triage?.priority === 'high' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-800 text-indigo-300 border border-indigo-500/30'}`}>
                                 {triage?.priority === 'low' ? 'Standard' : (triage?.priority || 'Normal')}
                               </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setStep(1)} className="px-6 py-4 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">Go Back</button>
                          <button
                            onClick={handleSendMessage}
                            disabled={sending}
                            className="px-6 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                          >
                            {sending ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Launch'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-8">
                  {ticket?.messages.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: isUser ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] md:max-w-[70%] rounded-[28px] px-6 py-4 shadow-sm ${
                          isUser 
                            ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-600/10' 
                            : msg.sender === 'bot' 
                              ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-none' 
                              : 'bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-bl-none'
                        }`}>
                          {(msg.sender === 'bot' || msg.sender === 'admin') && (
                            <div className="flex items-center gap-2 mb-2">
                              {msg.sender === 'bot' ? <SparklesIcon className="h-3 w-3 text-indigo-500" /> : <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                              <span className="text-[10px] uppercase font-black tracking-[0.15em] opacity-60">
                                {msg.sender === 'bot' ? 'Clarity AI' : 'Support Specialist'}
                              </span>
                            </div>
                          )}
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                          
                          {msg.attachmentUrl && (
                            <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-slate-100">
                              <img 
                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${msg.attachmentUrl}`} 
                                alt="Attachment" 
                                className="max-h-72 w-full object-cover hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <div className={`text-[10px] mt-3 font-bold uppercase tracking-widest ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Input Footer (Only for existing chat) */}
            {!isNew && !isResolved && (
              <div className="p-6 bg-white border-t border-slate-100">
                {imagePreview && (
                  <div className="mb-4 flex items-start">
                    <div className="relative group p-1 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner">
                      <img src={imagePreview} alt="Preview" className="h-24 w-auto rounded-xl object-cover" />
                      <button 
                        onClick={() => { setImagePreview(null); setSelectedImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute -top-3 -right-3 bg-slate-900 text-white rounded-xl p-2 hover:bg-rose-500 shadow-xl transition-all"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-14 w-14 flex items-center justify-center bg-slate-100 text-slate-500 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 shrink-0"
                    >
                      <PhotoIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <textarea
                      rows={imagePreview ? 2 : 1}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="block w-full resize-none rounded-2xl border-0 py-4 px-6 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 sm:text-sm bg-slate-50 transition-all font-medium"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={(!message.trim() && !selectedImage) || sending}
                    className="h-14 px-8 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </form>
              </div>
            )}
            
            {isResolved && (
              <div className="p-8 bg-emerald-50/50 border-t border-emerald-100 text-center space-y-4">
                 <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckIcon className="h-6 w-6" />
                 </div>
                 <div>
                   <h4 className="text-lg font-bold text-emerald-900">Case Resolved</h4>
                   <p className="text-sm text-emerald-700 font-medium">This ticket is now closed. You can reopen it if needed.</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: AI Info (Existing Tickets) */}
        {!isNew && (
          <div className="w-full lg:w-80 shrink-0 space-y-6">
             <div className="bg-white rounded-2xl border border-black/[0.06] p-6 space-y-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div>
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ticket Intelligence</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stability</span>
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">In Sync</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Latency</span>
                        <span className="text-xs font-black text-slate-900 font-mono">1.2s</span>
                      </div>
                   </div>
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Metadata</h4>
                   <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer ID</p>
                        <p className="text-xs font-mono font-bold mt-1 text-slate-900">{id}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created Channel</p>
                        <p className="text-xs font-bold mt-1 text-slate-900">Direct Portal</p>
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="rounded-2xl border border-indigo-800/20 p-6 bg-indigo-900 shadow-xl shadow-indigo-900/20 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <SparklesIcon className="h-24 w-24" />
                </div>
                <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">Need live help?</h4>
                <p className="text-sm font-medium leading-relaxed mb-4 text-indigo-100">Our support engineers are available 24/7 for Enterprise accounts.</p>
                <button className="w-full py-2.5 bg-white text-indigo-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-colors">
                  Contact Support
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerTicketDetail;

