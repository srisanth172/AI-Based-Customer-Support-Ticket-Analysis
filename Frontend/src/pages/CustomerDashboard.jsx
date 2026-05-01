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
        const open = fetchedTickets.filter(t => t.status === 'open').length;
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
      iconColor: 'text-emerald-600', 
      iconBg: 'bg-emerald-50',
      accentClass: 'stat-card--emerald',
      description: 'All time tickets',
      to: '/customer/tickets?status=all',
    },
    { 
      name: 'Open Issues', 
      value: stats.open, 
      icon: ClockIcon, 
      iconColor: 'text-amber-600', 
      iconBg: 'bg-amber-50',
      accentClass: 'stat-card--amber',
      description: 'Awaiting resolution',
      to: '/customer/tickets?status=open',
    },
    { 
      name: 'Resolved', 
      value: stats.resolved, 
      icon: CheckCircleIcon, 
      iconColor: 'text-emerald-600', 
      iconBg: 'bg-emerald-50',
      accentClass: 'stat-card--emerald',
      description: 'Successfully closed',
      to: '/customer/tickets?status=resolved',
    },
  ];

  const recentTickets = tickets.slice(0, 5);

  const getStatusConfig = (status) => {
    switch(status) {
      case 'open': return { classes: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' };
      case 'in_progress': return { classes: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-green-500' };
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
    <div className="stat-card stat-card--emerald p-7 flex items-center justify-between animate-pulse">
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
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#020B06]">
        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen" />
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
            <p className="text-sm font-bold text-emerald-400/80 mb-2 uppercase tracking-widest">{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</p>
            <h1 className="text-[32px] sm:text-[40px] font-black text-white tracking-tight leading-tight">
              Dashboard
            </h1>
            <p className="text-slate-400 mt-2 text-[15px] font-medium max-w-lg">
              Monitor your tickets and AI insights in real-time.
            </p>
          </div>
          <Link
            to="/customer/tickets/new"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0"
          >
            <PlusIcon className="h-5 w-5" />
            Create New Ticket
          </Link>
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
              <Link
                key={stat.name}
                to={stat.to}
                className="block"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="relative overflow-hidden p-7 rounded-[24px] border border-white/5 bg-[#0a1f10]/40 backdrop-blur-xl group cursor-pointer hover:border-emerald-500/30 hover:bg-white/[0.03] transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <stat.icon className="h-20 w-20 -mr-6 -mt-6" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-5 ${stat.iconBg} ring-1 ring-white/10 group-hover:scale-110 transition-transform`}>
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
              </Link>
            ))
          )}
        </motion.div>


      </motion.div>
    </div>
  );
};

export default CustomerDashboard;
