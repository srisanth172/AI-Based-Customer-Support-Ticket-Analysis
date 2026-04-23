// src/pages/AdminDashboard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Sparkles, AlertTriangle, Download, PieChart as PieChartIcon, Bot } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTickets } from '../hooks/useTickets';
import TicketTable from '../components/Dashboard/TicketTable';

const PremiumStatCard = ({ title, value, icon: Icon, trend, trendUp, glowColor, onClick }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer ${onClick ? 'active:scale-95' : ''}`}
  >
    <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${glowColor}`}></div>
    <div className="flex justify-between items-start mb-2 relative z-10">
      <div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 capitalize">{title}</h3>
        <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-700`}>
        <Icon className={`w-5 h-5 ${trendUp ? 'text-emerald-500' : 'text-indigo-500'}`} />
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
  const [tableFilters, setTableFilters] = useState({ priority: 'all', status: 'all', sentiment: 'all' });

  // Real trend data from backend
  const lineData = stats.trends?.map(t => ({
    name: new Date(t._id).toLocaleDateString('en-US', { weekday: 'short' }),
    tickets: t.count
  })) || [];

  const handleStatClick = (statusFilter) => {
    setTableFilters({ priority: 'all', status: statusFilter, sentiment: 'all' });
    const section = document.getElementById('ticket-table-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="text-sm font-semibold text-slate-500 animate-pulse">Loading Analytics Data...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* ── PROFESSIONAL CLEAN BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0a0f1c]">
        <div className="absolute -top-32 right-1/4 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-sky-600/5 rounded-full blur-[100px] mix-blend-screen" />
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
                  const csvData = await window.fetch('http://localhost:5000/api/tickets/export', { 
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
                  }).then(r => r.text());
                  const blob = new Blob([csvData], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'tickets_export.csv';
                  a.click();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
          </div>
        </div>

        {/* Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-5">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
               <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Agent Nexa is Active</h2>
              <p className="text-indigo-100/80 text-sm font-medium mt-1">Analyzing all incoming tickets for sentiment and priority in real-time.</p>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-extrabold hover:bg-slate-50 transition-all shadow-xl shadow-black/10">
            View AI Insights
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PremiumStatCard 
            title="Total Tickets" 
            value={stats.totalTickets || 0} 
            icon={Ticket} 
            trend="+12%" 
            trendUp={true}
            glowColor="bg-indigo-500"
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
            title="Resolved" 
            value={stats.resolvedTickets || 0} 
            icon={CheckCircle2} 
            trend="+24%" 
            trendUp={true}
            glowColor="bg-emerald-500"
            onClick={() => handleStatClick('resolved')}
          />
          <PremiumStatCard 
            title="Urgent" 
            value={stats.highPriorityTickets || 0} 
            icon={AlertTriangle} 
            trend="-2%" 
            trendUp={true}
            glowColor="bg-rose-500"
            onClick={() => setTableFilters(prev => ({ ...prev, priority: 'high', status: 'all' }))}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* AI Operations Radar */}
           <div className="lg:col-span-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                 <Bot className="w-5 h-5 text-indigo-500" /> Operational Insights
              </h3>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="w-2h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Sentiment Score</span>
                   </div>
                   <span className="text-sm font-black text-slate-900 dark:text-white">{stats.operationalInsights?.sentimentAlpha || "0.82"}</span>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">Recommendation</p>
                  <div className="bg-indigo-50/50 dark:bg-indigo-500/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20">
                     <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                        {stats.operationalInsights?.aiRecommendation || "Operations are currently within optimal thresholds. No immediate reallocations needed."}
                     </p>
                  </div>
                </div>
              </div>
           </div>

           {/* Volume Trend Chart */}
           <div className="lg:col-span-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-indigo-500" /> Ticket Volume Trend
              </h3>
              <div className="h-[250px]">
                 {lineData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={lineData}>
                       <defs>
                         <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                           <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                       <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                       <Area type="monotone" dataKey="tickets" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
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

        {/* Ticket Table */}
        <div id="ticket-table-section" className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-slate-200/60 dark:border-slate-700/60">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Recent Tickets</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and resolve open issues directly.</p>
          </div>
          <div className="p-6">
            <TicketTable 
              tickets={tickets} 
              onBulkUpdate={bulkUpdate} 
              externalFilters={tableFilters} 
              updateTicketAdmin={updateTicketAdmin} 
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;