import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusIcon, 
  InboxIcon,
  TicketIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';

const MyTickets = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Initialize filter from URL query param if it exists
  const [filter, setFilter] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('status') || 'all';
  });

  // Sync filter with URL query param changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status) {
      setFilter(status);
    } else {
      setFilter('all');
    }
  }, [location.search]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get('/tickets?myTickets=true');
        setTickets(response.data.tickets || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      (ticket.messages?.[0]?.text || '').toLowerCase().includes(search.toLowerCase());

    let matchesFilter = filter === 'all';
    const status = ticket.status?.toLowerCase();

    if (filter === 'open') {
      matchesFilter = ['open', 'reopened', 'escalated', 'waiting_for_customer'].includes(status);
    } else if (filter === 'in_progress') {
      matchesFilter = status === 'in_progress';
    } else if (filter === 'resolved') {
      matchesFilter = ['resolved', 'closed'].includes(status);
    }

    return matchesSearch && matchesFilter;
  });

  const getStatusConfig = (status) => {
    switch(status) {
      case 'open': return { classes: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' };
      case 'in_progress': return { classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-green-500' };
      case 'resolved': 
      case 'closed': return { classes: 'bg-emerald-500/10 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500/100' };
      default: return { classes: 'bg-white/5 text-slate-300 ring-slate-200', dot: 'bg-white/50' };
    }
  };

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter(t => ['open', 'reopened', 'escalated', 'waiting_for_customer'].includes(t.status?.toLowerCase())).length,
    in_progress: tickets.filter(t => t.status?.toLowerCase() === 'in_progress').length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status?.toLowerCase())).length,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }
  };

  return (
    <div className="max-w-[1000px] mx-auto flex flex-col h-full">
      {/* Header & Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 shadow-2xl p-6 sm:p-8 mb-6"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6">
          <div>
            <h1 className="text-[24px] sm:text-[28px] font-bold text-white tracking-tight">Support Archive</h1>
            <p className="text-slate-400 font-medium text-[13px] mt-1">Manage and track your active support requests.</p>
          </div>

        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { key: 'all', label: 'All' },
            { key: 'open', label: 'Open' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'resolved', label: 'Resolved' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key);
                navigate(`/customer/tickets?status=${tab.key}`, { replace: true });
              }}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 ${
                filter === tab.key
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-white/5 text-slate-400 hover:bg-slate-100 hover:text-slate-300'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${filter === tab.key ? 'text-emerald-200' : 'text-slate-400'}`}>
                {statusCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <MagnifyingGlassIcon className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by ID or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border-0 py-3 pl-11 pr-4 text-white ring-1 ring-inset ring-white/10 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 text-[13px] bg-white/5 text-white transition-all font-medium"
          />
        </div>
      </motion.div>

      {/* Tickets List */}
      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500/20 border-t-emerald-600" />
            </div>
            <p className="text-slate-400 text-[13px] font-medium">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          /* ─── Empty State ─── */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 shadow-2xl flex flex-col items-center justify-center py-20 px-6 text-center"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
          >
            <div className="h-20 w-20 rounded-2xl empty-state-bg flex items-center justify-center mb-5">
              <InboxIcon className="h-9 w-9 text-slate-300" />
            </div>
            <h3 className="text-[16px] font-semibold text-white mb-1.5">No tickets found</h3>
            <p className="text-slate-400 text-[13px] max-w-sm leading-relaxed">
              {search || filter !== 'all' 
                ? "Adjust your search or filters to find what you're looking for."
                : "You don't have any tickets yet. Create one to get started!"}
            </p>
            {!search && filter === 'all' && (
              <Link
                to="/customer/tickets/new"
                className="mt-6 btn-primary inline-flex px-6 py-3"
              >
                <PlusIcon className="h-[18px] w-[18px]" />
                Create Your First Ticket
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
            {filteredTickets.map((ticket) => {
              const statusConfig = getStatusConfig(ticket.status);
              return (
                  <Link to={`/customer/tickets/${ticket.ticketId}`} variants={itemVariants} className="block group">
                    <div
                      className="bg-[#041209]/60 backdrop-blur-xl rounded-[24px] border border-white/5 shadow-2xl p-5 hover:border-emerald-500/30 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:bg-white/[0.03] transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                            <TicketIcon className="h-[18px] w-[18px] text-slate-400 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[13px] font-bold text-white">#{ticket.ticketId}</span>
                              <span className="text-[11px] text-slate-600">·</span>
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                                Updated {new Date(ticket.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-[12px] text-slate-400 truncate font-medium">
                              {ticket.category && (
                                <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest mr-2.5 border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                  {ticket.category}
                                </span>
                              )}
                              {ticket.description || ticket.subject || (ticket.messages && ticket.messages[0]?.text) || "Documentation pending."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${statusConfig.classes}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <ArrowRightIcon className="h-4 w-4 text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
