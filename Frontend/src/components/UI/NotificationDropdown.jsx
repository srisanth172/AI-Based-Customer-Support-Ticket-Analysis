import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// Simple mock for non-socket integrated display for now. We will just hook up a static list.
const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'Your ticket was resolved', description: 'Ticket #TKT-2847 has been closed', time: '2m ago', read: false, type: 'success' },
    { id: 2, title: 'New reply from Admin', description: 'Support team responded to your query', time: '1h ago', read: true, type: 'info' },
  ];

  const getNotificationDot = (type) => {
    switch(type) {
      case 'success': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-rose-500';
      default: return 'bg-indigo-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          setHasUnread(false);
        }}
        className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all focus:outline-none"
      >
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {hasUnread && (
          <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#0d111c]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-[360px] origin-top-right rounded-3xl bg-[#161b26] z-50 p-2 border border-white/5 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 mb-1 bg-white/[0.02]">
              <div>
                <h3 className="text-[15px] font-bold text-white tracking-tight">Notifications</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">{notifications.filter(n => !n.read).length} new alerts</p>
              </div>
              <button className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all flex items-center gap-2 uppercase tracking-widest">
                Clear all
              </button>
            </div>
            
            {/* Notifications list */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.03]">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`px-5 py-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.02] ${
                    !notif.read ? 'bg-indigo-500/[0.03]' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${!notif.read ? getNotificationDot(notif.type) : 'bg-slate-700'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] leading-snug tracking-tight ${notif.read ? 'text-slate-400 font-medium' : 'text-slate-100 font-bold'}`}>
                        {notif.title}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-1 font-medium">{notif.description}</p>
                      <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-wider">{notif.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="p-2 border-t border-white/5 mt-1">
              <button className="w-full text-center py-2.5 text-[13px] font-bold text-slate-400 hover:text-white transition-all bg-white/[0.02] rounded-2xl">
                View All Activity
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
