import React from 'react';
import { Activity, TrendingUp, BarChart3, Clock, PieChart as PieChartIcon, Heart, ShieldAlert, Sparkles, Star } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useTickets } from '../hooks/useTickets';

const Analytics = () => {
  const { stats, loading } = useTickets();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <div className="text-sm font-semibold text-slate-500 animate-pulse">Processing Analytical Intelligence...</div>
      </div>
    );
  }

  // Formatting rating trend data
  const ratingTrendData = stats.ratingTrends?.map(t => ({
    name: new Date(t._id).toLocaleDateString('en-US', { weekday: 'short' }),
    rating: parseFloat(t.avgRating.toFixed(1))
  })) || [];

  // Formatting sentiment data
  const sentimentData = stats.sentimentDistribution?.map(s => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count
  })) || [];

  // Formatting category data
  const categoryData = stats.categoryDistribution?.map(c => ({
    name: c._id,
    tickets: c.count
  })) || [];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
               <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                 <Activity className="w-7 h-7 text-white" />
               </div>
               Intelligence Hub
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Real-time operational metrics and AI-driven insights.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Volume Trend */}
         <div className="bg-white/70 dark:bg-[#041209]/70 backdrop-blur-xl border border-slate-200/60 dark:border-emerald-900/20 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  <Star className="w-5 h-5 text-amber-500" /> Customer Satisfaction Trend
               </h3>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Stars</span>
            </div>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ratingTrendData}>
                    <defs>
                      <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[0, 5]} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backgroundColor: '#020B06', color: '#fff' }} />
                    <Area type="monotone" dataKey="rating" stroke="#f59e0b" fill="url(#colorRating)" strokeWidth={4} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Sentiment Distribution */}
         <div className="bg-white/70 dark:bg-[#041209]/70 backdrop-blur-xl border border-slate-200/60 dark:border-emerald-900/20 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  <Heart className="w-5 h-5 text-rose-500" /> Emotional Landscape
               </h3>
               <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="h-[300px] flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
               </ResponsiveContainer>
               <div className="flex flex-col gap-3 pr-8">
                  {sentimentData.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                       <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{s.name} ({s.value})</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Category Breakdown */}
         <div className="lg:col-span-2 bg-white/70 dark:bg-[#041209]/70 backdrop-blur-xl border border-slate-200/60 dark:border-emerald-900/20 rounded-3xl p-8 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
               <ShieldAlert className="w-5 h-5 text-amber-500" /> Categorical Heatmap
            </h3>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeights: 'bold', fill: '#94a3b8' }} width={120} />
                    <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="tickets" fill="#10b981" radius={[0, 10, 10, 0]} barSize={32} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Analytics;
