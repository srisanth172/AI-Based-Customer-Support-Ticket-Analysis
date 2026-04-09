import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  TicketIcon,
  UserCircleIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../UI/NotificationDropdown';
import FloatingChatWidget from '../UI/FloatingChatWidget';

const CustomerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/customer', icon: HomeIcon },
    { name: 'My Tickets', href: '/customer/tickets', icon: TicketIcon },
    { name: 'AI Help', href: '/customer/tickets/new', icon: SparklesIcon },
    { name: 'Profile', href: '/customer/profile', icon: UserCircleIcon },
  ];

  return (
    <div className="min-h-screen mesh-gradient-bg flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 glass border-r border-slate-200/50 hidden md:flex flex-col z-30">
        <div className="h-16 flex items-center px-6 border-b border-slate-100/50">
          <SparklesIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            ClarityHelp
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/customer' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-700'
                    : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                }`}
              >
                <item.icon
                  className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100/50">
          <button
            onClick={logout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-slate-400 group-hover:text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 glass border-b border-slate-200/50 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-20">
          <div className="flex-1 flex items-center">
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center mr-4">
              <SparklesIcon className="h-6 w-6 text-indigo-600" />
            </div>
            {/* Search */}
            <div className="max-w-md w-full hidden sm:block">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  type="search"
                  className="block w-full rounded-full border-0 py-1.5 pl-10 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white/50"
                  placeholder="Search tickets..."
                />
              </div>
            </div>
          </div>
          
          {/* Top Right Items */}
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-indigo-500 transition-all">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-transparent relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full p-4 sm:p-6 lg:p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <FloatingChatWidget />
    </div>
  );
};

export default CustomerLayout;
