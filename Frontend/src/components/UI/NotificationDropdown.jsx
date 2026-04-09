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
        className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-200 focus:outline-none"
      >
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {hasUnread && (
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 mt-2 w-[340px] origin-top-right rounded-2xl bg-white z-50 p-1.5 border border-black/[0.06]"
            style={{ boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.12)' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100/80 mb-1">
              <div>
                <h3 className="text-[14px] font-semibold text-slate-800">Notifications</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{notifications.filter(n => !n.read).length} unread</p>
              </div>
              <button className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Mark all read
              </button>
            </div>
            
            {/* Notifications list */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`px-4 py-3 cursor-pointer rounded-xl transition-all duration-200 hover:bg-slate-50 ${
                    !notif.read ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!notif.read ? getNotificationDot(notif.type) : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-tight ${notif.read ? 'text-slate-600 font-medium' : 'text-slate-800 font-semibold'}`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{notif.description}</p>
                      <p className="text-[10px] text-slate-300 mt-1.5 font-medium">{notif.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="pt-1.5 text-center border-t border-slate-100/80 mt-1">
              <a 
                href="#" 
                className="text-[12px] text-indigo-600 hover:text-indigo-800 font-semibold py-2.5 inline-block transition-colors"
              >
                View all notifications →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
