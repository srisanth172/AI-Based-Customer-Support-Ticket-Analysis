// src/pages/AdminDashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Sparkles, AlertTriangle, Download, PieChart as PieChartIcon, Bot } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTickets } from '../hooks/useTickets';
import TicketTable from '../components/Dashboard/TicketTable';

const PremiumStatCard = ({ title, value, icon: Icon, trend, trendUp, glowColor, onClick }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl bg-white/70 dark:bg-[#041209]/70 backdrop-blur-xl border border-slate-200/60 dark:border-emerald-900/20 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer ${onClick ? 'active:scale-95' : ''}`}
  >
    <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${glowColor}`}></div>
    <div className="flex justify-between items-start mb-2 relative z-10">
      <div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 capitalize">{title}</h3>
        <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-white dark:bg-[#020B06] shadow-sm border border-slate-100 dark:border-emerald-900/30`}>
        <Icon className={`w-5 h-5 ${trendUp ? 'text-emerald-500' : 'text-emerald-500'}`} />
      </div>
    </div>

    <div className="flex items-center gap-1.5 mt-4 relative z-10">
      {trendUp ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
      <span className={`text-sm font-semibold ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>{trend}</span>
      <span className="text-sm font-medium text-slate-400">this week</span>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const { tickets, stats, loading, bulkUpdate, updateTicketAdmin } = useTickets();
  const navigate = useNavigate();

  // Real trend data from backend
  const lineData = stats.trends?.map(t => ({
    name: new Date(t._id).toLocaleDateString('en-US', { weekday: 'short' }),
    tickets: t.count
  })) || [];

  const handleStatClick = (statusFilter) => {
    navigate('/admin/tickets', { state: { status: statusFilter } });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <div className="text-sm font-semibold text-slate-500 animate-pulse">Loading Analytics Data...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* ── PROFESSIONAL CLEAN BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#020B06]">
        <div className="absolute -top-32 right-1/4 w-[800px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 space-y-8 animate-in fade-in duration-500 pb-16">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Your support ecosystem health at a glance.</p>
          </div>
          <div className="flex gap-2">
              <button 
                onClick={async () => {
                  const csvData = await window.fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5003'}/api/tickets/export`, { 
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
                  }).then(r => r.text());
                  const blob = new Blob([csvData], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'tickets_export.csv';
                  a.click();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#041209] border border-slate-200 dark:border-emerald-900/30 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#020B06] transition-all shadow-sm"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
          </div>
        </div>



        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PremiumStatCard 
            title="Total Tickets" 
            value={stats.totalTickets || 0} 
            icon={Ticket} 
            trend="+12%" 
            trendUp={true}
            glowColor="bg-emerald-500"
            onClick={() => handleStatClick('all')}
          />
          <PremiumStatCard 
            title="Open Tickets" 
            value={stats.openTickets || 0} 
            icon={AlertCircle} 
            trend="+5%" 
            trendUp={false}
            glowColor="bg-amber-500"
            onClick={() => handleStatClick('open')}
          />
          <PremiumStatCard 
            title="Closed Tickets" 
            value={stats.closedTickets || 0} 
            icon={CheckCircle2} 
            trend="+24%" 
            trendUp={true}
            glowColor="bg-emerald-500"
            onClick={() => handleStatClick('closed')}
          />
          <PremiumStatCard 
            title="Urgent" 
            value={stats.highPriorityTickets || 0} 
            icon={AlertTriangle} 
            trend="-2%" 
            trendUp={true}
            glowColor="bg-rose-500"
            onClick={() => navigate('/admin/tickets', { state: { priority: 'high' } })}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* AI Operations Radar */}
           <div className="lg:col-span-1 bg-white/70 dark:bg-[#041209]/70 backdrop-blur-xl border border-slate-200/60 dark:border-emerald-900/20 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                   <Bot className="w-5 h-5 text-emerald-500" /> AI Operational Report
                </h3>
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full uppercase">Today</span>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-emerald-900/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">New Tickets</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{stats.ticketsToday || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-emerald-900/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Top Issue</p>
                    <p className="text-xl font-black text-emerald-500 capitalize">{stats.topCategory || "None"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Sentiment</span>
                    <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  </div>
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100/50 dark:border-emerald-500/10 italic text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    "{stats.sentimentReport || "Operational sentiment is stable. Customer satisfaction metrics are within projected bounds."}"
                  </div>
                </div>

                <div className="pt-2">
                  <button onClick={() => navigate('/admin/tickets')} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20">
                    Review All Activity
                  </button>
                </div>
              </div>
           </div>

           {/* Volume Trend Chart */}
           <div className="lg:col-span-2 bg-white/70 dark:bg-[#041209]/70 backdrop-blur-xl border border-slate-200/60 dark:border-emerald-900/20 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-emerald-500" /> Ticket Volume Trend
              </h3>
              <div className="h-[250px]">
                 {lineData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={lineData}>
                       <defs>
                         <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                           <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                       <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                       <Area type="monotone" dataKey="tickets" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                     Not enough trend data yet.
                   </div>
                 )}
              </div>
           </div>
        </div>



      </div>
    </div>
  );
};

export default AdminDashboard;