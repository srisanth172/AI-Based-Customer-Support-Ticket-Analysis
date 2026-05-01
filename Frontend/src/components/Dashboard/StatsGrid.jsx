// src/components/Dashboard/StatsGrid.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  TicketIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import StatCard from '../UI/StatCard';

const StatsGrid = ({ stats }) => {
  const statsData = [
    {
      title: 'Total Tickets',
      value: stats.totalTickets || 0,
      icon: TicketIcon,
      color: 'bg-blue-500',
      change: stats.totalChange
    },
    {
      title: 'Open Tickets',
      value: stats.openTickets || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500',
      change: stats.openChange
    },
    {
      title: 'Resolved',
      value: stats.resolvedTickets || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      change: stats.resolvedChange
    },
    {
      title: 'Negative Sentiment',
      value: stats.negativeTickets || 0,
      icon: ChartBarIcon,
      color: 'bg-red-500',
      change: stats.negativeChange
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {statsData.map((stat, index) => (
        <motion.div key={stat.title} variants={itemVariants}>
          <StatCard
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            change={stat.change}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StatsGrid;