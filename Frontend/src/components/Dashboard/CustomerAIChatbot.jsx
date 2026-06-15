import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PaperAirplaneIcon,
  PhotoIcon,
  SparklesIcon,
  ArrowPathIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import api from '../../services/api';

const INITIAL_MESSAGE = {
  sender: 'bot',
  text: 'Hello! I am **Swift AI**. 👋\n\nI can help you with questions or raise a support ticket if needed. I specialize in:\n\n• **Payments** & Billing\n• **Orders** & Delivery\n• **Returns** & Refunds\n• **Product** Issues\n• **Account** Access\n• **Notifications**\n• **Subscriptions**\n\nHow can I assist you today?',
  timestamp: new Date(),
};

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const renderMarkdown = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

// Animated gradient bot avatar
const BotAvatar = ({ size = 'sm' }) => {
  const sz = size === 'lg' ? 'h-10 w-10' : 'h-7 w-7';
  const icon = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0`}>
      <SparklesIcon className={`${icon} text-white`} />
    </div>
  );
};

const CustomerAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1:Chat 2:UploadPhoto 3:Analyzing 4:Result 5:SpamResubmit
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [resubmitPhoto, setResubmitPhoto] = useState(null);
  const [resubmitPreview, setResubmitPreview] = useState(null);
  const [spamTicketId, setSpamTicketId] = useState(null);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [result, setResult] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen && messages.length > 1) setHasUnread(true);
    if (isOpen) setHasUnread(false);
  }, [messages, isOpen]);

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text, timestamp: new Date() }]);
  };

  const handleSendDescription = async () => {
    if (!description.trim() || isTyping) return;
    const userMsg = description;
    addMessage('user', userMsg);
    setDescription('');
    setIsTyping(true);

    try {
      const response = await api.post('/ai/chat', {
        messages: [...messages, { sender: 'user', text: userMsg }]
      });

      let botReply = response.data.reply;
      const shouldPromptTicket = botReply.includes('[PROMPT_TICKET]');
      botReply = botReply.replace('[PROMPT_TICKET]', '').trim();

      setIsTyping(false);
      addMessage('bot', botReply);

      if (shouldPromptTicket) {
        setTimeout(() => {
          addMessage('bot', 'To raise a ticket, please confirm the **description** below and **upload a screenshot or photo** of the issue.');
          setStep(2);
          setDescription(userMsg);
        }, 1200);
      }
    } catch (error) {
      setIsTyping(false);
      addMessage('bot', 'Sorry, I am having trouble right now. You can still raise a ticket manually below.');
      setStep(2);
      setDescription(userMsg);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRaiseTicket = async () => {
    if (!description || !photo) return;
    setStep(3);
    setIsTyping(true);
    addMessage('bot', 'Analyzing your request with Swift AI... Please hold on. 🧠✨');

    const formData = new FormData();
    formData.append('title', description.slice(0, 50));
    formData.append('description', description);
    formData.append('category', 'Product Issues');
    formData.append('photo', photo);

    try {
      const response = await api.post('/tickets/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsTyping(false);
      const { ticket, isSpam } = response.data;
      const ticketId = ticket.ticketId;

      if (isSpam) {
        // Image mismatch — move to spam resubmit step
        setSpamTicketId(ticketId);
        // Bot message is already in the ticket messages from backend, show it here too
        addMessage('bot', `⚠️ **Image Mismatch Detected**\n\nThe photo you uploaded does not appear to match your description. Your ticket **${ticketId}** has been flagged.\n\nPlease upload a **correct screenshot or photo** that clearly shows the issue. Both photos will be visible to the admin.`);
        setStep(5);
      } else {
        setResult({ success: true, ticketId });
        addMessage('bot', `✅ **Ticket Raised Successfully!**\n\nYour Ticket ID is **${ticketId}**.\n\nOur team has been notified and will respond shortly. Track it under **My Tickets**.`);
        setStep(4);
      }
    } catch (error) {
      setIsTyping(false);
      const msg = error.response?.data?.message || 'This issue does not fall under our supported categories.';
      setResult({ success: false, message: msg });
      addMessage('bot', `❌ **Ticket Declined**\n\n${msg}\n\nSupported: Payments, Delivery, Returns, Product, Account, Notifications, Subscriptions.`);
      setStep(4);
    }
  };

  const handleResubmitPhoto = async () => {
    if (!resubmitPhoto || !spamTicketId) return;
    setIsTyping(true);
    addMessage('user', 'Here is the correct photo. 📎');

    const formData = new FormData();
    formData.append('message', 'Resubmitting correct photo for review.');
    formData.append('sender', 'user');
    formData.append('photo', resubmitPhoto);

    try {
      const response = await api.post(`/tickets/${spamTicketId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsTyping(false);
      const ticket = response.data;
      const lastBotMsg = [...ticket.messages].reverse().find(m => m.sender === 'bot');
      if (lastBotMsg) addMessage('bot', lastBotMsg.text);

      const isResolved = ticket.status === 'open';
      setResult({ success: isResolved, ticketId: spamTicketId });
      setStep(4);
    } catch (err) {
      setIsTyping(false);
      addMessage('bot', 'Failed to send your photo. Please try again.');
    }
  };

  const resetChat = () => {
    setStep(1);
    setDescription('');
    setPhoto(null);
    setPhotoPreview(null);
    setResubmitPhoto(null);
    setResubmitPreview(null);
    setSpamTicketId(null);
    setResult(null);
    setMessages([{ ...INITIAL_MESSAGE, timestamp: new Date() }]);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl shadow-emerald-900/50 flex items-center justify-center z-[100] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
      >
        {/* Pulse ring */}
        {hasUnread && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 animate-ping" />
        )}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <XMarkIcon className="h-7 w-7 text-white" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }} className="relative">
              <SparklesIcon className="h-7 w-7 text-white" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-emerald-700" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 w-[380px] sm:w-[420px] flex flex-col z-[90]"
            style={{ height: '580px', maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Glass card */}
            <div className="flex flex-col h-full rounded-[28px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-white/10"
              style={{ background: 'linear-gradient(160deg, rgba(4,20,10,0.97) 0%, rgba(2,10,6,0.99) 100%)', backdropFilter: 'blur(24px)' }}>

              {/* ── Header ── */}
              <div className="relative flex-shrink-0 px-5 py-4" style={{ background: 'linear-gradient(135deg, #065f46 0%, #0f766e 100%)' }}>
                {/* Subtle grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BotAvatar size="lg" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base leading-tight">Swift AI</h3>
                        <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                      </div>
                      <p className="text-[10px] text-emerald-200/70 font-semibold uppercase tracking-widest mt-0.5">Online · AI Support Assistant</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Step indicator pills */}
                    <div className="flex gap-1">
                      {[1,2,3,4].map(s => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'w-4 bg-emerald-300' : 'w-1.5 bg-white/20'}`} />
                      ))}
                    </div>
                    <button onClick={() => setIsOpen(false)} className="ml-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors">
                      <XMarkIcon className="h-5 w-5 text-white/70" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Messages ── */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {msg.sender === 'bot' && <BotAvatar size="sm" />}
                      <div className={`flex flex-col gap-1 max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-sm shadow-lg shadow-emerald-900/40'
                            : 'bg-white/[0.07] text-slate-200 border border-white/8 rounded-bl-sm'
                        }`}>
                          <p dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                        </div>
                        <span className="text-[10px] text-slate-600 px-1">{formatTime(msg.timestamp)}</span>
                      </div>
                      {msg.sender === 'user' && (
                        <div className="h-7 w-7 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-300">
                          U
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-2">
                      <BotAvatar size="sm" />
                      <div className="bg-white/[0.07] border border-white/8 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-emerald-400 rounded-full"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Input / Action Area ── */}
              <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-white/5 space-y-3">

                {/* Step 1: Chat input */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                    <textarea
                      ref={textareaRef}
                      rows={2}
                      placeholder="Ask me anything or describe your issue…"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendDescription(); }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pr-14 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all resize-none"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSendDescription}
                      disabled={!description.trim() || isTyping}
                      className="absolute right-3 bottom-3 h-8 w-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                )}

                {/* Step 2: Photo upload + confirm */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {/* Description confirm */}
                    <div>
                      <label className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest ml-1 mb-1 block">Confirm Description</label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-emerald-500/30 outline-none resize-none transition-all"
                      />
                    </div>

                    {/* Photo upload */}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                    {photoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20 group">
                        <img src={photoPreview} alt="Preview" className="w-full h-28 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => { setPhoto(null); setPhotoPreview(null); }} className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                            <XMarkIcon className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          ✓ Photo attached
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                      >
                        <PhotoIcon className="h-7 w-7 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-400 uppercase tracking-widest transition-colors">Upload Screenshot / Photo</span>
                      </button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!photo || !description.trim()}
                      onClick={handleRaiseTicket}
                      className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                      style={{ background: photo && description.trim() ? 'linear-gradient(135deg, #059669, #0f766e)' : undefined, backgroundColor: !(photo && description.trim()) ? '#1a2e25' : undefined }}
                    >
                      <SparklesIcon className="h-4 w-4" />
                      Raise Ticket via Swift AI
                    </motion.button>
                  </motion.div>
                )}

                {/* Step 3: Analyzing */}
                {step === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-3 flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-3 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" style={{ borderWidth: '3px' }} />
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest animate-pulse">Analyzing with Swift AI…</p>
                  </motion.div>
                )}

                {/* Step 4: Result */}
                {step === 4 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    {result?.success ? (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircleIcon className="h-8 w-8 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-300">Ticket Created</p>
                          <p className="text-[11px] text-slate-400 font-mono">{result.ticketId}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <XCircleIcon className="h-8 w-8 text-red-400 flex-shrink-0" />
                        <p className="text-xs font-bold text-red-300">Ticket Declined</p>
                      </div>
                    )}
                    <button
                      onClick={resetChat}
                      className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/8"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      Start New Conversation
                    </button>
                  </motion.div>
                )}

                {/* Step 5: Spam — Resubmit Correct Photo */}
                {step === 5 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {/* Warning banner */}
                    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                      <span className="text-lg mt-0.5">⚠️</span>
                      <div>
                        <p className="text-xs font-bold text-amber-300 leading-tight">Image Mismatch Flagged</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Your ticket is on hold. Upload a photo that matches your description. The original photo is preserved for admin review.</p>
                      </div>
                    </div>

                    {/* New photo uploader */}
                    <input
                      type="file"
                      id="resubmit-file-input"
                      className="hidden"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setResubmitPhoto(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setResubmitPreview(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    {resubmitPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 group">
                        <img src={resubmitPreview} alt="New photo" className="w-full h-24 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => { setResubmitPhoto(null); setResubmitPreview(null); }}
                            className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          New photo attached
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => document.getElementById('resubmit-file-input').click()}
                        className="w-full py-5 border-2 border-dashed border-amber-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
                      >
                        <PhotoIcon className="h-7 w-7 text-slate-500 group-hover:text-amber-400 transition-colors" />
                        <span className="text-xs font-bold text-slate-500 group-hover:text-amber-400 uppercase tracking-widest transition-colors">Upload Correct Photo</span>
                      </button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!resubmitPhoto || isTyping}
                      onClick={handleResubmitPhoto}
                      className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                      style={{ background: resubmitPhoto ? 'linear-gradient(135deg, #d97706, #b45309)' : undefined, backgroundColor: !resubmitPhoto ? '#1a2e25' : undefined }}
                    >
                      <PhotoIcon className="h-4 w-4" />
                      Submit Correct Photo
                    </motion.button>
                  </motion.div>
                )}

                {/* Powered by tag */}
                <p className="text-center text-[10px] text-slate-700 font-medium">Powered by <span className="text-emerald-700">Swift AI</span> · Groq LLaMA</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CustomerAIChatbot;
