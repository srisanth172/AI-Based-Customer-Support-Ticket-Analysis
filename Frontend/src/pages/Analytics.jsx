import React from 'react';
import { Activity, TrendingUp, BarChart3, Clock, PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const Analytics = () => {
  const data = [
    { name: 'Mon', solve: 24, volume: 40 },
    { name: 'Tue', solve: 18, volume: 30 },
    { name: 'Wed', solve: 32, volume: 45 },
    { name: 'Thu', solve: 26, volume: 50 },
    { name: 'Fri', solve: 22, volume: 35 },
    { name: 'Sat', solve: 15, volume: 20 },
    { name: 'Sun', solve: 12, volume: 15 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <Activity className="w-8 h-8 text-indigo-500" /> Analytics
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Deep dive into your support performance.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
         <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
               <Clock className="w-5 h-5 text-indigo-500" /> Resolution Time (Hours)
            </h3>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="solve" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={3} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-emerald-500" /> Ticket Growth Volume
            </h3>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="volume" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={3} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Analytics;
