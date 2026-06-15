import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif._id);
    setIsOpen(false);
    if (notif.ticketId) {
      // Check if admin or customer to route correctly
      const isAdmin = window.location.pathname.startsWith('/admin');
      navigate(isAdmin ? `/admin/tickets/${notif.ticketId}` : `/customer/tickets/${notif.ticketId}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
      case 'error': return <XCircleIcon className="h-5 w-5 text-rose-500" />;
      default: return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all focus:outline-none"
      >
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-[#020B06]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-[380px] origin-top-right rounded-3xl bg-[#0a1f10] z-50 p-2 border border-white/5 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 mb-1 bg-white/[0.02]">
              <div>
                <h3 className="text-[15px] font-bold text-white tracking-tight">System Alerts</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">{unreadCount} new notifications</p>
              </div>
              <button 
                onClick={clearAll}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all flex items-center gap-2 uppercase tracking-widest"
              >
                Clear all
              </button>
            </div>
            
            {/* Notifications list */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-white/[0.03]">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif._id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-5 py-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.04] ${
                      !notif.read ? 'bg-emerald-500/[0.03]' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="mt-1 shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-[14px] leading-snug tracking-tight ${notif.read ? 'text-slate-400 font-medium' : 'text-slate-100 font-bold'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                        </div>
                        <p className="text-[12px] text-slate-500 mt-1 font-medium leading-relaxed">{notif.description}</p>
                        <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-wider">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <BellIcon className="h-10 w-10 text-slate-700 mx-auto mb-3 opacity-20" />
                  <p className="text-slate-500 text-sm font-medium">All caught up!</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-2 border-t border-white/5 mt-1">
              <button className="w-full text-center py-2.5 text-[13px] font-bold text-slate-400 hover:text-white transition-all bg-white/[0.02] rounded-2xl">
                Close Notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
