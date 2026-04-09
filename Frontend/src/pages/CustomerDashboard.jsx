import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TicketIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  PlusIcon, 
  ArrowRightIcon,
  SparklesIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get('/tickets');
        const fetchedTickets = response.data.tickets || [];
        setTickets(fetchedTickets);
        const open = fetchedTickets.filter(t => t.status !== 'resolved').length;
        const resolved = fetchedTickets.filter(t => t.status === 'resolved').length;
        setStats({ total: fetchedTickets.length, open, resolved });
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const statCards = [
    { 
      name: 'Total Tickets', 
      value: stats.total, 
      icon: TicketIcon, 
      iconColor: 'text-indigo-600', 
      iconBg: 'bg-indigo-50',
      accentClass: 'stat-card--indigo',
      description: 'All time tickets',
    },
    { 
      name: 'Open Issues', 
      value: stats.open, 
      icon: ClockIcon, 
      iconColor: 'text-amber-600', 
      iconBg: 'bg-amber-50',
      accentClass: 'stat-card--amber',
      description: 'Awaiting resolution',
    },
    { 
      name: 'Resolved', 
      value: stats.resolved, 
      icon: CheckCircleIcon, 
      iconColor: 'text-emerald-600', 
      iconBg: 'bg-emerald-50',
      accentClass: 'stat-card--emerald',
      description: 'Successfully closed',
    },
  ];

  const recentTickets = tickets.slice(0, 5);

  const getStatusConfig = (status) => {
    switch(status) {
      case 'open': return { classes: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' };
      case 'in_progress': return { classes: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' };
      case 'resolved': return { classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' };
      default: return { classes: 'bg-slate-50 text-slate-700 ring-slate-200', dot: 'bg-slate-500' };
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const SkeletonCard = () => (
    <div className="stat-card stat-card--indigo p-7 flex items-center justify-between animate-pulse">
      <div className="space-y-3 flex-1">
        <div className="h-2.5 w-24 bg-slate-100 rounded-full" />
        <div className="h-9 w-14 bg-slate-100 rounded-lg" />
        <div className="h-2 w-20 bg-slate-50 rounded-full" />
      </div>
      <div className="h-12 w-12 bg-slate-50 rounded-xl" />
    </div>
  );

  const SkeletonRow = () => (
    <div className="flex items-center justify-between p-5 animate-pulse">
      <div className="flex items-center gap-4 flex-1">
        <div className="h-10 w-10 bg-slate-100 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 w-28 bg-slate-100 rounded-full" />
          <div className="h-2.5 w-40 bg-slate-50 rounded-full" />
        </div>
      </div>
      <div className="h-6 w-16 bg-slate-100 rounded-lg" />
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1100px] mx-auto space-y-8"
    >
      {/* ─── Header Section ─── */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</p>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 mt-1.5 text-[14px] leading-relaxed">
            Monitor and manage your active support requests.
          </p>
        </div>
        <button 
          onClick={() => navigate('/customer/tickets/new')}
          className="btn-primary px-6 py-3 w-full sm:w-auto"
        >
          <PlusIcon className="w-[18px] h-[18px]" />
          Create New Ticket
        </button>
      </motion.div>

      {/* ─── Stats Grid ─── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          statCards.map((stat, idx) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1, ease: [0.4, 0, 0.2, 1] }}
              className={`stat-card ${stat.accentClass} p-7 flex items-center justify-between group cursor-default`}
            >
              <div>
                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{stat.name}</p>
                <h3 className="text-[36px] font-bold text-slate-900 tabular-nums tracking-tight leading-none mb-1">
                  {stat.value}
                </h3>
                <p className="text-[11px] font-medium text-slate-400">{stat.description}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${stat.iconBg}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* ─── Quick Actions ─── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/customer/tickets/new')}
          className="group flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-[14px]">Get AI Help</p>
            <p className="text-white/70 text-[12px]">Chat with our AI for instant support</p>
          </div>
          <ArrowRightIcon className="h-4 w-4 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => navigate('/customer/tickets')}
          className="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-black/[0.06] hover:border-indigo-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
            <TicketIcon className="h-5 w-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-[14px] text-slate-800">View All Tickets</p>
            <p className="text-slate-400 text-[12px]">Browse your complete ticket history</p>
          </div>
          <ArrowRightIcon className="h-4 w-4 ml-auto text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </button>
      </motion.div>

      {/* ─── Recent Activity Section ─── */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
      >
        <div className="px-7 py-5 border-b border-slate-100/80 flex justify-between items-center">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900">Recent Activity</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Your latest support interactions</p>
          </div>
          <Link 
            to="/customer/tickets" 
            className="py-2 px-4 text-[13px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center gap-1.5 transition-all"
          >
            View All
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
        
        <div>
          {loading ? (
            <div className="divide-y divide-slate-50">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : recentTickets.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {recentTickets.map((ticket, idx) => {
                const statusConfig = getStatusConfig(ticket.status);
                return (
                  <Link
                    key={ticket.ticketId}
                    to={`/customer/tickets/${ticket.ticketId}`}
                    className="flex items-center justify-between px-7 py-4 table-row-hover group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                        <TicketIcon className="h-[18px] w-[18px] text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[13px] font-semibold text-slate-800">#{ticket.ticketId}</span>
                          <span className="text-[11px] text-slate-400">·</span>
                          <span className="text-[11px] font-medium text-slate-400 capitalize">{ticket.priority}</span>
                        </div>
                        <p className="text-[12px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {new Date(ticket.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusConfig.classes}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* ─── Empty State ─── */
            <div className="py-20 px-6 text-center">
              <div className="mx-auto h-20 w-20 rounded-2xl empty-state-bg flex items-center justify-center mb-5">
                <InboxIcon className="h-9 w-9 text-slate-300" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-800 mb-1.5">No tickets yet</h3>
              <p className="text-slate-400 text-[13px] max-w-sm mx-auto leading-relaxed">
                Create your first ticket to get assistance from our expert support team. We're here to help!
              </p>
              <Link
                to="/customer/tickets/new"
                className="mt-6 btn-primary inline-flex px-6 py-3"
              >
                <PlusIcon className="h-[18px] w-[18px]" />
                Open New Ticket
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomerDashboard;
