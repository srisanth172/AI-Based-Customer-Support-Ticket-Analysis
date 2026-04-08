// src/components/Dashboard/AttentionPanel.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, FaceFrownIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const AttentionPanel = ({ tickets }) => {
  const highPriorityTickets = tickets.filter(t => t.priority === 'high' && t.status !== 'resolved');
  const negativeTickets = tickets.filter(t => t.sentiment === 'negative' && t.status !== 'resolved');
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
        Attention Required
      </h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">High Priority Tickets</h4>
          {highPriorityTickets.length === 0 ? (
            <p className="text-sm text-gray-500">No high priority tickets</p>
          ) : (
            <div className="space-y-2">
              {highPriorityTickets.map(ticket => (
                <Link key={ticket.id} to={`/admin/tickets/${ticket.id}`}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer"
                  >
                    <p className="font-medium text-red-800">{ticket.id}</p>
                    <p className="text-sm text-red-600">{ticket.subject}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Negative Sentiment</h4>
          {negativeTickets.length === 0 ? (
            <p className="text-sm text-gray-500">No negative sentiment tickets</p>
          ) : (
            <div className="space-y-2">
              {negativeTickets.map(ticket => (
                <Link key={ticket.id} to={`/admin/tickets/${ticket.id}`}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer"
                  >
                    <p className="font-medium text-orange-800">{ticket.id}</p>
                    <p className="text-sm text-orange-600">{ticket.subject}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttentionPanel;