import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get('/tickets');
        setTickets(response.data.tickets || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.ticketId.toLowerCase().includes(search.toLowerCase()) || 
                          (t.messages[0]?.text || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusConfig = (status) => {
    switch(status) {
      case 'open': return { classes: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' };
      case 'in_progress': return { classes: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' };
      case 'resolved': return { classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' };
      default: return { classes: 'bg-slate-50 text-slate-700 ring-slate-200', dot: 'bg-slate-500' };
    }
  };

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
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
        className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8 mb-6"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6">
          <div>
            <h1 className="text-[24px] sm:text-[28px] font-bold text-slate-900 tracking-tight">Support Archive</h1>
            <p className="text-slate-400 font-medium text-[13px] mt-1">Manage and track your active support requests.</p>
          </div>
          <Link 
            to="/customer/tickets/new" 
            className="btn-primary px-5 py-2.5 w-full sm:w-auto"
          >
            <PlusIcon className="w-[18px] h-[18px]" />
            New Ticket
          </Link>
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
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${filter === tab.key ? 'text-indigo-200' : 'text-slate-400'}`}>
                {statusCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <MagnifyingGlassIcon className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by ID or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border-0 py-3 pl-11 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200/80 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 text-[13px] bg-slate-50/60 transition-all font-medium"
          />
        </div>
      </motion.div>

      {/* Tickets List */}
      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-100 border-t-indigo-600" />
            </div>
            <p className="text-slate-400 text-[13px] font-medium">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          /* ─── Empty State ─── */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-black/[0.06] flex flex-col items-center justify-center py-20 px-6 text-center"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
          >
            <div className="h-20 w-20 rounded-2xl empty-state-bg flex items-center justify-center mb-5">
              <InboxIcon className="h-9 w-9 text-slate-300" />
            </div>
            <h3 className="text-[16px] font-semibold text-slate-800 mb-1.5">No tickets found</h3>
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
                <motion.div key={ticket._id} variants={itemVariants}>
                  <Link
                    to={`/customer/tickets/${ticket.ticketId}`}
                    className="block bg-white rounded-2xl border border-black/[0.06] p-5 hover:border-indigo-200/60 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                          <TicketIcon className="h-[18px] w-[18px] text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[13px] font-semibold text-slate-800">#{ticket.ticketId}</span>
                            <span className="text-[11px] text-slate-300">·</span>
                            <span className="text-[11px] font-medium text-slate-400">
                              Updated {new Date(ticket.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-[12px] text-slate-500 truncate">
                            {ticket.category && (
                              <span className="text-[10px] font-semibold uppercase text-indigo-600 tracking-wider mr-2.5 border border-indigo-100 bg-indigo-50 px-2 py-0.5 rounded-md">
                                {ticket.category}
                              </span>
                            )}
                            {ticket.messages[0]?.text || "Documentation pending."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset capitalize ${statusConfig.classes}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                          <ArrowRightIcon className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
