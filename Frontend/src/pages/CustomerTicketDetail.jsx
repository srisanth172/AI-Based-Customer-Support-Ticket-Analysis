import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftRightIcon, PaperClipIcon, PaperAirplaneIcon, ArrowPathIcon, HandThumbUpIcon, HandThumbDownIcon, SparklesIcon, PhotoIcon, XMarkIcon, CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';
import { debounce } from 'lodash';
import FeedbackModal from '../components/UI/FeedbackModal';
import { getAssetUrl } from '../utils/assets';

const CustomerTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Ticket State
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchTicket();
    
    // Check if API URL is available
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5003';
    const socket = io(apiUrl.replace('/api', ''));
    
    socket.emit('join-ticket', id);
    socket.on('ticket-updated', (updatedTicket) => {
      console.log('Ticket Update Received:', updatedTicket?.ticketId, 'Status:', updatedTicket?.status);
      if (updatedTicket?.ticketId === id) {
        setTicket(updatedTicket);
        if (updatedTicket.status === 'closed' && !updatedTicket.feedback?.rating) {
          console.log('Triggering Feedback Modal');
          setShowFeedbackModal(true);
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#34d399', '#059669']
          });
        }
        scrollToBottom();
      }
    });
    return () => socket.disconnect();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${id}`);
      const ticketData = response.data;
      setTicket(ticketData);
      
      if (ticketData.status === 'closed' && !ticketData.feedback?.rating) {
        setShowFeedbackModal(true);
      }
      
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
    const topCategory = 'Technical Issues';
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
      const formData = new FormData();
      formData.append('message', message);
      formData.append('sender', 'user');
      if (selectedImage) {
        formData.append('photo', selectedImage);
      }

      await api.post(`/tickets/${id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchTicket();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReopen = async () => {
    try {
      await api.patch(`/tickets/${id}/reopen`);
      toast.success('Ticket reopened with high priority');
      fetchTicket();
    } catch (error) {
      toast.error('Failed to reopen ticket');
    }
  };

  const handleMarkResolved = async () => {
    try {
      await api.post(`/tickets/${id}/request-resolution`);
      toast.success('AI is asking for your confirmation in chat');
      fetchTicket();
    } catch (error) {
      toast.error('Failed to request resolution');
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      await api.post(`/tickets/${id}/feedback`, feedbackData);
      toast.success('Thank you for your feedback!');
      setShowFeedbackModal(false);
      fetchTicket();
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-semibold animate-pulse">Loading conversation...</p>
      </div>
    );
  }

  const isResolved = ticket?.status?.toLowerCase() === 'resolved' || ticket?.status?.toLowerCase() === 'closed';

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Top Header Card */}
      <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/customer/tickets')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
          >
            <ArrowRightIcon className="h-5 w-5 rotate-180" />
          </button>
          <div className="h-10 w-[1px] bg-white/10" />
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Ticket #{ticket?.ticketId}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                ticket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                ticket.status === 'reopened' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {ticket.priority} Priority
              </span>
            </div>
          </div>
        </div>
        
        {isResolved && (
          <button onClick={handleReopen} className="px-6 py-3 text-xs font-black text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 rounded-xl transition-all flex items-center gap-2 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <ArrowPathIcon className="h-4 w-4" /> REOPEN TICKET
          </button>
        )}
      </div>

      {/* Ticket Details & Image Panel */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Issue Description</h4>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description || ticket.subject}</p>
                </div>
                <div className="pt-4 border-t border-white/5">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Category</h4>
                   <span className="text-sm font-bold text-white">{ticket.category}</span>
                </div>
              </div>
              {ticket.photoUrl && (
                <div>
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3 text-center md:text-left">Submitted Proof</h4>
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl group relative cursor-zoom-in aspect-video max-w-sm mx-auto md:mx-0">
                    <img 
                      src={getAssetUrl(ticket.photoUrl)} 
                      alt="Primary Proof" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <span className="bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-xl">Primary Screenshot</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Conversation Area */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          


          {/* Chat Container */}
          <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 h-[650px] flex flex-col overflow-hidden shadow-2xl">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
              {ticket?.messages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] md:max-w-[70%] rounded-[24px] px-6 py-4 shadow-xl ${
                      isUser 
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-emerald-600/10' 
                        : msg.sender === 'bot' 
                          ? 'bg-[#0A1612] border border-emerald-500/20 text-slate-200 rounded-bl-none backdrop-blur-md' 
                          : 'bg-slate-100 border border-slate-200 text-slate-900 rounded-bl-none font-medium'
                    }`}>
                      {(msg.sender === 'bot' || msg.sender === 'admin') && (
                        <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b ${msg.sender === 'admin' ? 'border-slate-200' : 'border-emerald-500/20'}`}>
                          {msg.sender === 'bot' ? <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" /> : <div className="h-2 w-2 rounded-full bg-emerald-600" />}
                          <span className={`text-[10px] uppercase font-black tracking-[0.2em] ${msg.sender === 'admin' ? 'text-slate-500' : 'text-emerald-400'}`}>
                            {msg.sender === 'bot' ? 'Swift AI' : 'Human Support'}
                          </span>
                        </div>
                      )}
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                      
                      {msg.attachmentUrl && 
                       msg.attachmentUrl !== ticket.photoUrl && 
                       !(ticket.additionalPhotos || []).find(p => p.url === msg.attachmentUrl) && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                          <img 
                            src={getAssetUrl(msg.attachmentUrl)} 
                            alt="Attachment" 
                            className="max-h-80 w-full object-contain bg-black/40 hover:scale-105 transition-transform duration-500"
                          />
                          {msg.aiVerification && (
                            <div className="px-3 py-2 text-center">
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${
                                msg.aiVerification === 'Genuine' 
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              }`}>
                                {msg.aiVerification}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`text-[9px] mt-3 font-black uppercase tracking-widest ${isUser ? 'text-emerald-200/60' : msg.sender === 'admin' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            {!isResolved && (
              <div className="p-6 bg-white/[0.02] border-t border-white/5">
                {imagePreview && (
                  <div className="mb-4 flex items-start">
                    <div className="relative group p-1.5 bg-white/5 border border-white/10 rounded-2xl shadow-2xl">
                      <img src={imagePreview} alt="Preview" className="h-28 w-auto rounded-xl object-cover" />
                      <button 
                        onClick={() => { setImagePreview(null); setSelectedImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-xl p-2 hover:bg-red-600 shadow-2xl transition-all"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-14 w-14 flex items-center justify-center bg-white/5 text-slate-400 rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-all border border-white/5 shrink-0"
                    >
                      <PhotoIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <textarea
                      rows={imagePreview ? 2 : 1}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="block w-full resize-none rounded-2xl border-0 py-4 px-6 text-white ring-1 ring-inset ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/50 sm:text-sm bg-white/5 transition-all font-medium outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={(!message.trim() && !selectedImage) || sending}
                    className="h-14 px-8 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </form>
              </div>
            )}
            
            {isResolved && (
              <div className="p-10 bg-emerald-500/5 border-t border-white/5 text-center space-y-4">
                 <div className="h-16 w-16 bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                    <CheckIcon className="h-8 w-8" />
                 </div>
                 <div>
                   <h4 className="text-xl font-bold text-white">Case Resolved</h4>
                   <p className="text-sm text-slate-400 font-medium mt-1">This ticket has been finalized. You can reopen it if the issue persists.</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
           <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 p-6 space-y-6 shadow-2xl">
              <div>
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Ticket Intelligence</h4>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{ticket.status}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Team</span>
                      <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{ticket.assignedTeam?.replace('_', ' ') || 'Sorting...'}</span>
                    </div>
                 </div>
              </div>
           </div>
           
           {!isResolved && (
             <div className="rounded-[24px] border border-emerald-500/20 p-8 bg-emerald-900/40 shadow-2xl shadow-emerald-900/20 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <CheckIcon className="h-24 w-24 text-emerald-400" />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-2">Issue Resolved?</h4>
                <p className="text-sm font-medium leading-relaxed mb-6 text-emerald-100/80">If our team has fully resolved your issue, please mark it as resolved.</p>
                <button 
                  onClick={handleMarkResolved}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl active:scale-95 relative z-10"
                >
                  MARK AS RESOLVED
                </button>
             </div>
           )}
        </div>
      </div>
      
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        ticketId={id}
      />
    </div>
  );
};



export default CustomerTicketDetail;

