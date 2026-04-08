// src/components/Dashboard/TicketTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const TicketTable = ({ tickets }) => {
  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusClass = (status) => {
    switch(status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tickets.map((ticket, idx) => (
            <motion.tr
              key={ticket.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => window.location.href = `/admin/tickets/${ticket.id}`}
            >
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{ticket.id}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{ticket.subject}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityClass(ticket.priority)}`}>
                  {ticket.priority.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(ticket.status)}`}>
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketTable;