// src/pages/CustomerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TicketIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  PlusIcon, 
  ArrowRightIcon,
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
    <div className="relative min-h-screen">
      {/* ── PROFESSIONAL CLEAN BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0a0f1c]">
        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-[1100px] mx-auto space-y-8 py-8 px-4"
      >
        {/* ─── Header Section ─── */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-indigo-400/80 mb-2 uppercase tracking-widest">{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</p>
            <h1 className="text-[32px] sm:text-[40px] font-black text-white tracking-tight leading-tight">
              Dashboard
            </h1>
            <p className="text-slate-400 mt-2 text-[15px] font-medium max-w-lg">
              Monitor your tickets and AI insights in real-time.
            </p>
          </div>
        </motion.div>

        {/* ─── Stats Grid ─── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative overflow-hidden p-7 rounded-[24px] border border-white/5 bg-[#161b26]/40 backdrop-blur-xl group cursor-default"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <stat.icon className="h-20 w-20 -mr-6 -mt-6" />
                </div>
                
                <div className="relative z-10">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-5 ${stat.iconBg} ring-1 ring-white/10`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.name}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-[32px] font-black text-white tabular-nums tracking-tighter">
                      {stat.value}
                    </h3>
                  </div>
                  <p className="text-[12px] font-medium text-slate-500 mt-2">{stat.description}</p>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* ─── Quick Actions ─── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <button
            onClick={() => navigate('/customer/tickets')}
            className="group flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: 'rgba(10,14,26,0.6)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
          >
            <div className="h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <TicketIcon className="h-5 w-5 text-indigo-400 transition-colors" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-[14px] text-white">View All Tickets</p>
              <p className="text-slate-400 text-[12px]">Browse your complete ticket history</p>
            </div>
            <ArrowRightIcon className="h-4 w-4 ml-auto text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </button>
        </motion.div>

        {/* ─── Recent Activity Section ─── */}
        <motion.div 
          variants={itemVariants}
          className="rounded-[24px] border border-white/5 bg-[#161b26]/40 backdrop-blur-xl overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div>
              <h2 className="text-[18px] font-bold text-white tracking-tight">Recent Activity</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">Your latest support interactions</p>
            </div>
            <Link 
              to="/customer/tickets" 
              className="py-2 px-4 text-[13px] font-bold text-indigo-400 hover:bg-indigo-500/10 rounded-xl flex items-center gap-2 transition-all"
            >
              View All
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-white/5">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : recentTickets.length > 0 ? (
              recentTickets.map((ticket) => {
                const statusConfig = getStatusConfig(ticket.status);
                return (
                  <Link
                    key={ticket.ticketId}
                    to={`/customer/tickets/${ticket.ticketId}`}
                    className="flex items-center justify-between px-8 py-5 hover:bg-white/[0.02] group transition-all"
                  >
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                      <div className="h-11 w-11 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/10 transition-colors ring-1 ring-white/5">
                        <TicketIcon className="h-5 w-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-bold text-slate-200">#{ticket.ticketId}</span>
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ${statusConfig.classes}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-500 mt-1 font-medium italic">
                          Updated {new Date(ticket.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset ${statusConfig.classes}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot} animate-pulse`} />
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <ArrowRightIcon className="h-4 w-4 text-slate-700 group-hover:text-indigo-400 transition-all group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="py-24 px-6 text-center">
                <div className="mx-auto h-20 w-20 rounded-[28px] bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10">
                  <InboxIcon className="h-10 w-10 text-slate-600" />
                </div>
                <h3 className="text-[18px] font-bold text-white mb-2">No tickets yet</h3>
                <p className="text-slate-500 text-[14px] max-w-xs mx-auto leading-relaxed">
                  Need help? Create your first ticket and our AI or support team will jump right in!
                </p>
                <Link
                  to="/customer/tickets/new"
                  className="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-2xl inline-flex items-center gap-3 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <PlusIcon className="h-5 w-5" />
                  Open New Ticket
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CustomerDashboard;
