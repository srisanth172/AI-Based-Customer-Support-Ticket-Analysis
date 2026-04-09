import React, { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { Socket } from 'socket.io-client';

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
    { id: 1, title: 'Your ticket was resolved', time: '2m ago', read: false },
    { id: 2, title: 'New reply from Admin', time: '1h ago', read: true },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          setHasUnread(false);
        }}
        className="relative p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
      >
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {hasUnread && (
          <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 p-2 border border-slate-100"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-50">
              <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
              <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Mark all as read</button>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notif) => (
                <div key={notif.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors">
                  <div className="flex justify-between">
                    <p className={`text-sm ${notif.read ? 'text-slate-600 font-medium' : 'text-slate-900 font-semibold'}`}>
                      {notif.title}
                    </p>
                    {notif.read || <span className="h-2 w-2 bg-indigo-500 rounded-full mt-1.5 ml-2"></span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                </div>
              ))}
            </div>
            
            <div className="pt-2 text-center border-t border-slate-50 mt-1">
              <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium py-1 inline-block">
                View all notifications
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
