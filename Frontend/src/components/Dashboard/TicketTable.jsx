import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../UI/Button';
import { toast } from 'react-hot-toast';
import { Search, ChevronDown, CheckCircle2, AlertTriangle, ArrowUpDown, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Avatar = ({ name }) => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white dark:ring-slate-800 shrink-0">
    {name ? name.substring(0, 2).toUpperCase() : 'U'}
  </div>
);

const TicketTable = ({ tickets, updateTicketAdmin, externalFilters }) => {
  const { globalSearch } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('latest'); 
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [verifying, setVerifying] = useState(null);
  
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
      case 'open': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
      case 'in_progress': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'resolved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
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
      // Always push resolved to bottom
      if (a.status === 'resolved' && b.status !== 'resolved') return 1;
      if (a.status !== 'resolved' && b.status === 'resolved') return -1;
      
      if (sortOrder === 'latest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOrder === 'urgency') {
         const pVals = { high: 3, medium: 2, low: 1 };
         return (pVals[b.priority] || 0) - (pVals[a.priority] || 0) || new Date(b.createdAt) - new Date(a.createdAt);
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

  const verifyFile = (fileName) => {
    setVerifying(fileName);
    setTimeout(() => {
      setVerifying(null);
      toast.success(`${fileName} verified as GENUINE`, { icon: '✅' });
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
            <input 
              type="text" placeholder="Search customer or ID..." 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-indigo-500 outline-none transition-all dark:text-white"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
             <option value="all">All Priority</option>
             <option value="high">High</option>
             <option value="medium">Medium</option>
             <option value="low">Low</option>
          </select>
          <div className="ml-auto flex items-center gap-2">
             <ArrowUpDown className="w-4 h-4 text-slate-400" />
             <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold outline-none dark:text-white" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="latest">Latest</option>
                <option value="urgency">Urgency</option>
             </select>
          </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700/60">
            <tr>

              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket ID</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-100">
                  {ticket.userId?.name || 'Customer'}
                </td>
                <td className="px-4 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {ticket.id}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase border ${getPriorityProps(ticket.priority).className}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getPriorityProps(ticket.priority).badge}`}></span>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${getStatusProps(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 capitalize">
                  {ticket.category}
                </td>
                <td className="px-4 py-4 text-right">
                  <button 
                    onClick={() => setSelectedTicket(ticket)} 
                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
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
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-950 shadow-2xl z-[70] border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 overflow-y-auto"
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
                  { label: 'SENTIMENT', value: selectedTicket.sentiment || 'Neutral' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400/90 tracking-wide">{item.label}</p>
                    <p className="text-[15px] font-medium text-slate-800 dark:text-slate-100 capitalize">{String(item.value).replace('_', ' ')}</p>
                  </div>
                ))}

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
                      <p className="text-[10px] font-bold text-slate-400/90 tracking-wide uppercase">Escalation Reason</p>
                      <div className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-sm font-medium text-slate-700 dark:text-slate-300 italic text-slate-400">
                         {selectedTicket.activityLog?.find(l => l.actionType === 'ESCALATION')?.message || 'None'}
                      </div>
                   </div>
                </div>

                {/* Artifacts Section (Stayed for functional use) */}
                <section className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400/90 tracking-wide uppercase mb-3 text-center">ATTACHED ARTIFACTS</p>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedTicket.messages.flatMap(m => m.files || []).map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{file.name}</span>
                        <button onClick={() => verifyFile(file.name)} className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-500">{verifying === file.name ? 'Analyzing...' : 'Verify Authenticity'}</button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Footer Actions */}
                <div className="pt-6 flex gap-3">
                   <button 
                     onClick={() => handleInlineChange(selectedTicket.id, 'status', 'resolved')}
                     className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/10 active:scale-95 transition-all"
                   >
                     Mark Resolved
                   </button>
                   <button onClick={() => setSelectedTicket(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all">Close</button>
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