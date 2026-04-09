import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TicketIcon, CheckCircleIcon, ClockIcon, PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

const CustomerDashboard = () => {
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
    { name: 'Total Tickets', value: stats.total, icon: TicketIcon, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
    { name: 'Open Issues', value: stats.open, icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50/50' },
    { name: 'Resolved', value: stats.resolved, icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
  ];

  const recentTickets = tickets.slice(0, 3);

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      case 'in_progress': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      default: return 'bg-slate-50 text-slate-700 ring-slate-600/20';
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white/50 glass rounded-xl p-6 border border-slate-200/50 shadow-sm flex items-center justify-between animate-pulse">
      <div className="space-y-3 flex-1">
        <div className="h-2 w-20 bg-slate-200 rounded"></div>
        <div className="h-8 w-12 bg-slate-200 rounded"></div>
      </div>
      <div className="h-14 w-14 bg-slate-100 rounded-xl"></div>
    </div>
  );

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
      <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-lg"></div></td>
      <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-lg"></div></td>
      <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
      <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-slate-100 rounded ml-auto"></div></td>
    </tr>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Monitor and manage your active support requests.</p>
        </div>
        <Link 
          to="/customer/tickets/new" 
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 hover:shadow-md transition-all sm:w-auto w-full"
        >
          <PlusIcon className="w-4 h-4" />
          Create New Ticket
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="bg-white/50 glass rounded-xl p-6 border border-slate-200/50 shadow-sm flex items-center justify-between group hover:shadow-md transition-all cursor-default"
            >
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`p-4 rounded-xl transition-transform group-hover:scale-110 duration-300 ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Recent Activity Table */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white/50 glass rounded-xl border border-slate-200/50 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-200/50 flex justify-between items-center bg-white/30 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <Link to="/customer/tickets" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View All <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/30 border-b border-slate-200/50 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : recentTickets.length > 0 ? (
                recentTickets.map(ticket => (
                  <tr key={ticket.ticketId} className="hover:bg-white/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-900">{ticket.ticketId}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${
                        ticket.priority === 'high' ? 'bg-red-50 text-red-600' : 
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium font-mono text-xs">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/customer/tickets/${ticket.ticketId}`} className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                        Details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                    No recent activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerDashboard;
