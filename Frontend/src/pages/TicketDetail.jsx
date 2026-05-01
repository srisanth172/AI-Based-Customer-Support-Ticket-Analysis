import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTickets } from '../hooks/useTickets';
import ChatBox from '../components/UI/ChatBox';
import AIPanel from '../components/Ticket/AIPanel';
import Button from '../components/UI/Button';
import { toast } from 'react-hot-toast';
import { CheckCircleIcon, RocketLaunchIcon, ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import io from 'socket.io-client';
import { getAssetUrl } from '../utils/assets';
import api from '../services/api';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTicketById, updateTicketAdmin, addMessage, escalateTicket } = useTickets();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState('');
  const [status, setStatus] = useState('');
  const [noteText, setNoteText] = useState('');
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  
  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const fetched = await getTicketById(id);
        setTicket(fetched);
        setTeam(fetched.assignedTeam || 'unassigned');
        setStatus(fetched.status);
        
        const userMsgs = (fetched.messages || []).filter(m => m.sender === 'user').length;
        setUserMessageCount(userMsgs);

        // Fetch fresh AI suggestions in background (non-blocking)
        setSuggestionsLoading(true);
        api.post(`/tickets/${fetched.ticketId}/suggestions`)
          .then(res => {
            if (res.data?.suggestedSolutions || res.data?.suggestedReply) {
              setAiSuggestions(res.data);
            }
          })
          .catch(err => console.warn('AI suggestions unavailable:', err.message))
          .finally(() => setSuggestionsLoading(false));

      } catch (error) {
        toast.error('Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();

    // Set up real-time socket connection
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5003';
    const socket = io(apiUrl.replace('/api', ''));
    
    socket.emit('join-ticket', id);
    socket.on('ticket-updated', (updatedTicket) => {
      if (updatedTicket?.ticketId === id) {
        setTicket(updatedTicket);
        
        // Count existing user messages to set initial turn count
        const userMsgs = (updatedTicket.messages || []).filter(m => m.sender === 'user').length;
        setUserMessageCount(userMsgs);

        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });

    return () => socket.disconnect();
  }, [id]);
  
  const chatRef = React.useRef(null);
  const chatEndRef = React.useRef(null);
  
  // Auto-prefill removed as per user request. Admin must click explicitly.

  const handleSendMessage = async (text, photo = null) => {
    try {
      const updated = await addMessage(id, text, 'admin', photo);
      setTicket(updated);
      toast.success('Reply sent successfully');
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };
  
  const handleUseAISuggestion = (suggestion) => {
    if (chatRef.current) {
      // Check if this solution was already tried
      const adminTexts = (ticket.messages || []).filter(m => m.sender === 'admin').map(m => m.text);
      if (adminTexts.some(text => text.includes(suggestion.substring(0, 30)))) {
        toast('This solution was already sent previously!', { icon: '⚠️' });
      } else {
        toast.success('Suggestion added to chat box');
      }
      chatRef.current.setText(suggestion);
    }
  };

  const handleAdminUpdate = async (field, value) => {
    try {
      const updated = await updateTicketAdmin(id, { [field]: value });
      setTicket(updated);
      toast.success('Ticket updated');
    } catch {
      toast.error('Failed to update ticket');
    }
  };

  const handleEscalate = async () => {
    const teamName = ticket.category || 'Support';
                     
    const escalationText = `This issue is getting forwarded to the ${teamName} department and it will be resolved within 24 hours.`;
    
    if (chatRef.current) {
      chatRef.current.setText(escalationText);
      toast.success('Escalation message drafted. Click Send to confirm.');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      const updated = await updateTicketAdmin(id, { internalNote: noteText });
      setTicket(updated);
      setNoteText('');
      toast.success('Internal note added');
    } catch {
      toast.error('Failed to add note');
    }
  };
  
  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-semibold animate-pulse">Loading Ticket Details...</p>
    </div>
  );
  if (!ticket) return <div className="text-center py-20 text-slate-500">Ticket not found</div>;
  
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Ticket {ticket.ticketId}</h1>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              ticket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              ticket.status === 'escalated' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-slate-400 font-medium">
            Created {new Date(ticket.createdAt).toLocaleString()} &bull; 
            <span className="ml-2 text-emerald-500">Category: {ticket.category}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
      
      {/* SPAM WARNING BANNER */}
      {ticket.ticket_ai_status === 'SPAM' && (
        <div className={`p-4 rounded-xl border-2 flex items-start gap-4 ${ticket.verification_attempts >= 2 ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
          <div className={`mt-0.5 text-xl ${ticket.verification_attempts >= 2 ? 'text-red-500' : 'text-amber-500'}`}>
            {ticket.verification_attempts >= 2 ? '🚫' : '⚠'}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${ticket.verification_attempts >= 2 ? 'text-red-400' : 'text-amber-400'}`}>
              {ticket.verification_attempts >= 2 ? 'Customer failed proof verification twice.' : 'AI ALERT: This ticket is classified as SPAM.'}
            </h3>
            <p className="text-slate-300 mt-1">
              {ticket.verification_attempts >= 2 
                ? 'Recommended Action: Close this ticket as SPAM.' 
                : 'Reason: Uploaded proof does not match description or appears fake/AI-generated. Recommended: Ask customer to upload genuine proof.'}
            </p>
          </div>
          {ticket.verification_attempts >= 2 && (
            <button 
              onClick={() => handleAdminUpdate('status', 'closed')}
              className="bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors border border-red-500/50 flex-shrink-0"
            >
              Close Ticket
            </button>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* User Issue Summary & Image */}
          <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-bold text-white text-lg">Customer Issue Report</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Description</h4>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {ticket.description || ticket.subject}
                </p>
              </div>
              {ticket.photoUrl && (
                <div>
                  <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Attached Proof</h4>
                  {/* Only show the PRIMARY photo here. Any resubmitted photos appear naturally
                      inside the conversation timeline where the user actually uploaded them. */}
                  <div className="relative group cursor-zoom-in rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/40">
                    <img 
                      src={getAssetUrl(ticket.photoUrl)} 
                      alt="Primary Attachment" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-emerald-600 px-3 py-1.5 rounded-lg shadow-lg">Primary Proof</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 overflow-hidden shadow-2xl h-[600px] flex flex-col relative">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <h3 className="font-bold text-white">Conversation History</h3>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Live Support</span>
              </div>
            </div>

            {/* AI Suggested Solutions Chips — loaded fresh from Groq for this specific ticket */}
            <div className="bg-emerald-900/10 border-b border-white/5 p-3 flex gap-2 overflow-x-auto custom-scrollbar shadow-inner min-h-[52px] items-center">
              {suggestionsLoading ? (
                <div className="flex items-center gap-2 text-emerald-400/60 text-[11px] font-bold uppercase tracking-widest">
                  <span className="w-3 h-3 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
                  Generating AI suggestions...
                </div>
              ) : (
                <>
                  {/* Quick Acknowledgment chip — dynamic, ticket-specific */}
                  {(aiSuggestions?.suggestedReply || ticket?.aiAnalysis?.suggestedReply) && (
                    <button 
                      onClick={() => handleUseAISuggestion(aiSuggestions?.suggestedReply || ticket.aiAnalysis.suggestedReply)}
                      className="whitespace-nowrap px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[12px] font-bold rounded-xl border border-amber-500/30 transition-all shadow-sm flex items-center gap-2"
                    >
                      <span className="text-amber-400">⚡</span>
                      Quick Acknowledgment
                    </button>
                  )}

                  {/* Solution chips — dynamic from Groq, fall back to stored aiAnalysis */}
                  {(aiSuggestions?.suggestedSolutions || ticket?.aiAnalysis?.suggestedSolutions || []).map((sol, idx) => {
                    const adminTexts = (ticket.messages || []).filter(m => m.sender === 'admin').map(m => m.text);
                    const isTried = adminTexts.some(text => text.includes(sol.substring(0, 30)));
                    return (
                      <button 
                        key={idx}
                        onClick={() => handleUseAISuggestion(sol)}
                        className={`whitespace-nowrap px-4 py-2 ${isTried ? 'bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 border-slate-500/30' : 'bg-white/5 hover:bg-emerald-500/20 text-emerald-100 border-white/10 hover:border-emerald-500/30'} text-[12px] font-bold rounded-xl border transition-all shadow-sm flex items-center gap-2`}
                      >
                        <span className={isTried ? 'text-slate-400' : 'text-emerald-400'}>{isTried ? '✓' : '💡'}</span>
                        {isTried ? 'Tried: ' : `Step ${idx + 1}: `}
                        {sol.length > 32 ? sol.substring(0, 32) + '…' : sol}
                      </button>
                    );
                  })}

                  {!suggestionsLoading && !aiSuggestions && !ticket?.aiAnalysis?.suggestedSolutions && (
                    <span className="text-slate-500 text-[11px] italic">No suggestions available</span>
                  )}
                </>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <ChatBox
                ref={chatRef}
                messages={ticket.messages || []}
                ticketId={ticket.ticketId}
                ticketStatus={ticket.status}
                primaryPhotoUrl={ticket.photoUrl}
                additionalPhotoUrls={(ticket.additionalPhotos || []).map(p => p.url)}
                onSendMessage={handleSendMessage}
                onUpdateTicket={handleAdminUpdate}
                disabled={ticket.status === 'closed'}
              />
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 p-6 shadow-2xl">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <div className="h-5 w-1 bg-emerald-500 rounded-full" />
              Activity Timeline
            </h3>
            <div className="space-y-6 ml-2">
              {(ticket.activityLog || []).map((log, idx) => (
                <div key={idx} className="relative pl-8 border-l-2 border-emerald-500/20 pb-2 last:border-0 last:pb-0">
                  <div className="absolute w-4 h-4 bg-[#020B06] border-2 border-emerald-500 rounded-full -left-[9px] top-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  <p className="text-sm font-bold text-slate-100">{log.message}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              ))}
              {(!ticket.activityLog || ticket.activityLog.length === 0) && <p className="text-sm text-slate-500 italic">No activity recorded yet.</p>}
            </div>
          </div>
        </div>
        
        {/* Sidebar Actions */}
        <div className="lg:col-span-4 space-y-6">
          <AIPanel ticket={ticket} onUseSuggestion={handleUseAISuggestion} />
          
          <div className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 p-6 shadow-2xl sticky top-24">
            <div className="space-y-6">
              {/* Assignment Status */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Ownership</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  ticket.assignedTeam && ticket.assignedTeam !== 'unassigned'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}>
                  {ticket.assignedTeam && ticket.assignedTeam !== 'unassigned' ? `Assigned: ${ticket.assignedTeam.replace('_', ' ')}` : 'Unassigned'}
                </span>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Internal Staff Notes</label>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                  {(ticket.internalNotes || []).map((note, i) => (
                    <div key={i} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs text-slate-300">
                      <p className="mb-1 leading-relaxed">{note.text}</p>
                      <span className="text-[10px] text-slate-500 font-bold opacity-60 italic">{new Date(note.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={noteText} 
                    onChange={(e) => setNoteText(e.target.value)} 
                    placeholder="Add private note..." 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                  <button onClick={handleAddNote} className="bg-emerald-600 text-white font-bold p-2 rounded-xl hover:bg-emerald-700 transition-colors">
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                </div>
                {/* Admin Actions */}
                <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                  {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                    <button 
                      onClick={() => handleAdminUpdate('status', 'resolved')}
                      className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest rounded-xl border border-emerald-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Resolve Ticket
                    </button>
                  )}
                  <button 
                    onClick={handleEscalate}
                    className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <RocketLaunchIcon className="h-4 w-4" />
                    Escalate Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;