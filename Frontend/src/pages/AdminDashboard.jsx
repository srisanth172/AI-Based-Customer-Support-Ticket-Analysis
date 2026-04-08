// src/pages/AdminDashboard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  TicketIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import { useTickets } from '../hooks/useTickets';
import StatCard from '../components/UI/StatCard';
import AttentionPanel from '../components/Dashboard/AttentionPanel';
import TicketTable from '../components/Dashboard/TicketTable';
import ChartsSection from '../components/Dashboard/ChartsSection';

const AdminDashboard = () => {
  const { tickets, stats, loading } = useTickets();
  
  const statCards = [
    { title: 'Total Tickets', value: stats.totalTickets, icon: TicketIcon, color: 'bg-blue-500', change: '+12%' },
    { title: 'Open Tickets', value: stats.openTickets, icon: ExclamationTriangleIcon, color: 'bg-yellow-500', change: '+5%' },
    { title: 'Resolved', value: stats.resolvedTickets, icon: CheckCircleIcon, color: 'bg-green-500', change: '+18%' },
    { title: 'Negative Sentiment', value: stats.negativeTickets, icon: ChartBarIcon, color: 'bg-red-500', change: '-3%' },
  ];
  
  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, Admin</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttentionPanel tickets={tickets} />
        </div>
        <div>
          <ChartsSection tickets={tickets} />
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Tickets</h2>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All →
          </button>
        </div>
        <TicketTable tickets={tickets.slice(0, 5)} />
      </div>
    </div>
  );
};

export default AdminDashboard;