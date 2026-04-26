import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../UI/Button';
import { toast } from 'react-hot-toast';
import { Search, ChevronDown, CheckCircle2, AlertTriangle, ArrowUpDown, AlertCircle, X, Star as StarIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Avatar = ({ name }) => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white dark:ring-slate-800 shrink-0">
    {name ? name.substring(0, 2).toUpperCase() : 'U'}
  </div>
);


const TicketTable = ({ tickets, updateTicketAdmin, externalFilters }) => {
  const navigate = useNavigate();
  const { globalSearch } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('urgency'); 
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});
  
  useEffect(() => {
    if (globalSearch !== undefined) setSearchTerm(globalSearch);
  }, [globalSearch]);

  useEffect(() => {
    if (externalFilters) {
      if (externalFilters.status) setStatusFilter(externalFilters.status);
      if (externalFilters.priority) setPriorityFilter(externalFilters.priority);
      if (externalFilters.sentiment) setSentimentFilter(externalFilters.sentiment);
    }
  }, [externalFilters]);

  const getPriorityProps = (priority) => {
    switch(priority) {
      case 'high': return { className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800', badge: 'bg-rose-500' };
      case 'medium': return { className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800', badge: 'bg-amber-500' };
      case 'low': return { className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-500' };
      default: return { className: 'bg-slate-100 text-slate-700 border-slate-200', badge: 'bg-slate-400' };
    }
  };
  
  const getStatusProps = (status) => {
    switch(status) {
      case 'open': return 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'in_progress': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'resolved': return 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-500/20';
      case 'closed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'escalated': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = String(t.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
                          String(t.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(t.category).toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchSentiment = sentimentFilter === 'all' || (t.sentiment || 'neutral') === sentimentFilter;
      return matchSearch && matchStatus && matchPriority && matchSentiment;
    }).sort((a, b) => {
      // Always push resolved and closed to bottom
      const bottomStatus = ['resolved', 'closed'];
      if (bottomStatus.includes(a.status) && !bottomStatus.includes(b.status)) return 1;
      if (!bottomStatus.includes(a.status) && bottomStatus.includes(b.status)) return -1;
      
      if (sortOrder === 'latest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOrder === 'urgency') {
         const scoreA = a.aiAnalysis?.priorityScore || 0;
         const scoreB = b.aiAnalysis?.priorityScore || 0;
         return scoreB - scoreA || new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, sentimentFilter, sortOrder]);

  const handleInlineChange = async (id, field, value) => {
    if (!updateTicketAdmin) return;
    try {
      await updateTicketAdmin(id, { [field]: value });
      toast.success('Updated successfully');
      if (selectedTicket?.id === id) {
        setSelectedTicket(prev => ({ ...prev, [field]: value }));
      }
    } catch (e) {
      toast.error('Failed to update ticket');
    }
  };

  const verifyFile = async (imageUrl) => {
    if (!imageUrl) return;
    setVerifying(imageUrl);
    try {
      const response = await api.post('/ai/analyze-image', { imageUrl });
      const result = response.data.analysis;
      setAnalysisResults(prev => ({ ...prev, [imageUrl]: result }));
      toast.success('Verification Complete');
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error('AI Verification Service Offline');
      setAnalysisResults(prev => ({ ...prev, [imageUrl]: 'Error' }));
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-slate-50/50 dark:bg-[#041209]/30 p-2 rounded-2xl border border-slate-100 dark:border-emerald-900/20">
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500" />
            <input 
              type="text" placeholder="Search customer or ID..." 
              className="w-full bg-white dark:bg-[#020B06] border border-slate-200 dark:border-emerald-900/30 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-emerald-500 outline-none transition-all dark:text-white"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="bg-white dark:bg-[#020B06] border border-slate-200 dark:border-emerald-900/30 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved (Pending Approval)</option>
            <option value="closed">Closed</option>
          </select>
          <select className="bg-white dark:bg-[#020B06] border border-slate-200 dark:border-emerald-900/30 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
             <option value="all">All Priority</option>
             <option value="high">High</option>
             <option value="medium">Medium</option>
             <option value="low">Low</option>
          </select>
          <div className="ml-auto flex items-center gap-2">
             <ArrowUpDown className="w-4 h-4 text-slate-400" />
             <select className="bg-white dark:bg-[#020B06] border border-slate-200 dark:border-emerald-900/30 rounded-xl px-3 py-2 text-sm font-semibold outline-none dark:text-white" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="latest">Latest</option>
                <option value="urgency">Urgency</option>
             </select>
          </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-slate-50/80 dark:bg-[#041209]/80 sticky top-0 z-10 border-b border-slate-200 dark:border-emerald-900/20">
            <tr>

              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket ID</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rating</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/20 bg-white dark:bg-[#020B06]/40">
            {filteredTickets.map((ticket) => (
              <tr 
                key={ticket.id} 
                className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/tickets/${ticket.ticketId}`)}
              >
                <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-100">
                  {ticket.userId?.name || 'Customer'}
                </td>
                <td className="px-4 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {ticket.ticketId}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase border ${getPriorityProps(ticket.priority).className}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getPriorityProps(ticket.priority).badge}`}></span>
                    {ticket.priority} ({Math.round((ticket.aiAnalysis?.priorityScore || 0) * 100)})
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${getStatusProps(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {ticket.feedback?.rating ? (
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className={`w-3 h-3 ${i < ticket.feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400 italic">Not Rated</span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 capitalize">
                  {ticket.category}
                </td>
                <td className="px-4 py-4 text-right">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }} 
                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all"
                  >
                     <AlertCircle className="w-5 h-5" title="General Info" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick View Sidebar / Detail Panel (Mobile Screenshot Optimized) */}
      <AnimatePresence>
        {selectedTicket && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#020B06] shadow-2xl z-[70] border-l border-slate-200 dark:border-emerald-900/30 p-6 sm:p-8 overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-0.5 tracking-tight flex items-center gap-2">
                    Ticket {selectedTicket.id}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">Last updated: {new Date(selectedTicket.updatedAt || selectedTicket.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Field Grid */}
                {[
                  { label: 'CUSTOMER', value: selectedTicket.userId?.name || 'Customer' },
                  { label: 'EMAIL', value: selectedTicket.userId?.email || 'customer@support.local' },
                  { label: 'CATEGORY', value: selectedTicket.category },
                  { label: 'PRIORITY', value: selectedTicket.priority === 'high' ? 'High (10)' : selectedTicket.priority === 'medium' ? 'Medium (8)' : 'Low (5)' },
                  { label: 'STATUS', value: selectedTicket.status },
                  { label: 'SENTIMENT', value: selectedTicket.sentiment || 'Neutral' },
                  { label: 'USER RATING', value: selectedTicket.feedback?.rating ? `${selectedTicket.feedback.rating}/5 Stars` : 'Not Rated' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400/90 tracking-wide">{item.label}</p>
                    <p className="text-[15px] font-medium text-slate-800 dark:text-slate-100 capitalize">{String(item.value).replace('_', ' ')}</p>
                  </div>
                ))}

                {selectedTicket.feedback?.comment && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Customer Review</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">"{selectedTicket.feedback.comment}"</p>
                  </div>
                )}

                {/* Subjet/Desc Textareas */}
                <div className="pt-2 space-y-5">
                   <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400/90 tracking-wide uppercase">Subject</p>
                      <div className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-sm font-medium text-slate-700 dark:text-slate-300">
                         {selectedTicket.subject || 'No subject provided'}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400/90 tracking-wide uppercase">Description</p>
                      <div className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-sm font-medium text-slate-700 dark:text-slate-300">
                         {selectedTicket.messages[0]?.text || 'No description provided'}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400/90 tracking-wide uppercase">Assignment / Escalation</p>
                      <div className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-sm font-medium text-slate-700 dark:text-slate-300 italic">
                         {selectedTicket.activityLog?.find(l => l.actionType === 'ESCALATION')?.message || 
                          (selectedTicket.assignedTeam && selectedTicket.assignedTeam !== 'unassigned' 
                            ? `Assigned: ${selectedTicket.assignedTeam.replace('_', ' ')}` 
                            : 'Unassigned')}
                      </div>
                   </div>
                </div>

                {/* Attached Artifacts Section */}
                <section className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400/90 tracking-wide uppercase mb-3 text-center">ATTACHED ARTIFACTS</p>
                  <div className="space-y-4">
                    {/* Primary Ticket Photo */}
                    {selectedTicket.photoUrl && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400/90 tracking-wide uppercase px-1">Primary Proof</p>
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                          <img 
                            src={`${import.meta.env.VITE_API_URL}${selectedTicket.photoUrl}`} 
                            alt="Primary Proof" 
                            className="w-full h-auto max-h-64 object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between px-1">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate max-w-[150px]">
                             {selectedTicket.photoUrl.split('/').pop()}
                           </span>
                           {analysisResults[selectedTicket.photoUrl] ? (
                             <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                               analysisResults[selectedTicket.photoUrl].includes('AI Generated') 
                                 ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                                 : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                             }`}>
                               {analysisResults[selectedTicket.photoUrl]}
                             </span>
                           ) : (
                             <button 
                               onClick={() => verifyFile(selectedTicket.photoUrl)}
                               className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-500"
                             >
                               {verifying === selectedTicket.photoUrl ? 'Analyzing...' : 'Verify Authenticity'}
                             </button>
                           )}
                        </div>
                      </div>
                    )}

                    {/* Message Attachments */}
                    {selectedTicket.messages.map((m, msgIdx) => (
                      <React.Fragment key={msgIdx}>
                        {m.attachmentUrl && (
                          <div className="space-y-2">
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                              <img 
                                src={`${import.meta.env.VITE_API_URL}${m.attachmentUrl}`} 
                                alt="Attachment" 
                                className="w-full h-auto max-h-48 object-cover"
                              />
                            </div>
                            <div className="flex items-center justify-between px-1">
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate max-w-[150px]">
                                 {m.attachmentUrl.split('/').pop()}
                               </span>
                            {analysisResults[m.attachmentUrl] ? (
                               <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                 analysisResults[m.attachmentUrl].includes('AI Generated') 
                                   ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                                   : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                               }`}>
                                 {analysisResults[m.attachmentUrl]}
                               </span>
                             ) : (
                               <button 
                                 onClick={() => verifyFile(m.attachmentUrl)}
                                 className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-500"
                               >
                                 {verifying === m.attachmentUrl ? 'Analyzing...' : 'Verify Authenticity'}
                               </button>
                             )}
                            </div>
                          </div>
                        )}
                        {(m.files || []).map((file, i) => (
                          <div key={`${msgIdx}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{file.name}</span>
                            <button onClick={() => verifyFile(file.name)} className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-500">{verifying === file.name ? 'Analyzing...' : 'Verify Authenticity'}</button>
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                    {!selectedTicket.photoUrl && !selectedTicket.messages.some(m => m.attachmentUrl || (m.files && m.files.length > 0)) && (
                      <p className="text-center text-xs text-slate-500 italic py-4">No attachments found</p>
                    )}
                  </div>
                </section>

                {/* Footer Actions */}
                <div className="pt-6">
                   <button 
                     onClick={() => setSelectedTicket(null)} 
                     className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98]"
                   >
                     Close Overview
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketTable;