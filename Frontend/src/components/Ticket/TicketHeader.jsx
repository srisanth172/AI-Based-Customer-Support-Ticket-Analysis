// src/components/Ticket/TicketHeader.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  ClockIcon, 
  UserIcon, 
  CalendarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import Button from '../UI/Button';

const TicketHeader = ({ ticket, onBack, onStatusChange, onEdit }) => {
  const getPriorityStyles = (priority) => {
    const styles = {
      high: { bg: 'bg-red-100', text: 'text-red-800', icon: ExclamationCircleIcon, border: 'border-red-200' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ExclamationCircleIcon, border: 'border-yellow-200' },
      low: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon, border: 'border-green-200' }
    };
    return styles[priority] || styles.medium;
  };

  const getStatusStyles = (status) => {
    const styles = {
      open: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
      in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
      pending: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
      resolved: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' }
    };
    return styles[status] || styles.open;
  };

  const priorityStyle = getPriorityStyles(ticket.priority);
  const PriorityIcon = priorityStyle.icon;
  const statusStyle = getStatusStyles(ticket.status);

  const statusOptions = ['open', 'in_progress', 'pending', 'resolved'];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header top bar with back button */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-gray-700 transition-colors group"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <PencilSquareIcon className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Main ticket info */}
      <div className="p-6">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">Ticket {ticket.id}</h1>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${priorityStyle.bg} ${priorityStyle.text} border ${priorityStyle.border}`}>
                <PriorityIcon className="w-3.5 h-3.5 mr-1" />
                {ticket.priority.toUpperCase()} PRIORITY
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} mr-1.5`}></span>
                {ticket.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <p className="text-gray-600 text-sm">{ticket.subject}</p>
          </div>

          {/* Status changer (admin only) */}
          {onStatusChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Change status:</span>
              <select
                value={ticket.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <UserIcon className="w-4 h-4 text-gray-400" />
            <span>Customer: <span className="font-medium text-gray-900">{ticket.customerName || 'John Doe'}</span></span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span>Created: <span className="font-medium text-gray-900">{new Date(ticket.createdAt).toLocaleDateString()}</span></span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span>Last updated: <span className="font-medium text-gray-900">{new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}</span></span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
            <span>Status: <span className="font-medium text-gray-900 capitalize">{ticket.status.replace('_', ' ')}</span></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TicketHeader;