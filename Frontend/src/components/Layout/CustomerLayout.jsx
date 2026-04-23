import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  TicketIcon,
  UserCircleIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../UI/NotificationDropdown';
import CustomerChat from '../../pages/CustomerChat';

const CustomerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const navigation = [
    { name: 'Dashboard', href: '/customer', icon: HomeIcon },
    { name: 'My Tickets', href: '/customer/tickets', icon: TicketIcon },
    { name: 'AI Support Chat', href: '/customer/chat', icon: SparklesIcon },
    { name: 'Profile', href: '/customer/profile', icon: UserCircleIcon },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen flex bg-[#0d111c] text-slate-200">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full" />
      </div>
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Sidebar ─── */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 md:z-30 
        w-[280px] h-screen bg-[#0a0e17]/80 backdrop-blur-2xl flex flex-col
        border-r border-white/5 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-[76px] flex items-center justify-between px-7 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6M9 8h6M9 16h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              SupportIQ
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pt-8 pb-4">
          <p className="px-4 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] opacity-60">
            Navigation
          </p>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/customer' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom user section */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-semibold text-sm ring-1 ring-white/10 shadow-inner">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-slate-100 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500 truncate font-medium">{user?.email || 'user@email.com'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-slate-500 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-slate-600 group-hover:text-rose-400 transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content Wrapper ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top bar */}
        <header className="h-[76px] flex items-center justify-between px-6 sm:px-8 shrink-0 z-20 sticky top-0 border-b border-white/5 bg-[#0d111c]/60 backdrop-blur-xl">
          {/* Left: hamburger + search */}
          <div className="flex-1 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="max-w-md w-full hidden sm:block">
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="search"
                  className="block w-full rounded-2xl border border-white/5 py-2.5 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500/50 sm:text-[14px] bg-white/[0.03] transition-all placeholder:text-slate-500 text-slate-200 outline-none"
                  placeholder="Search tickets..."
                />
              </div>
            </div>
          </div>

          {/* Right: notification + profile */}
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            <div className="h-6 w-px bg-white/5 mx-1 hidden sm:block" />
            
            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 p-1 rounded-2xl hover:bg-white/5 transition-all group"
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-600/10 ring-1 ring-white/10">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left hidden lg:block pr-2">
                  <p className="text-[13px] font-bold text-slate-200 leading-none">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Account</p>
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-slate-600 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-56 bg-[#161b26] border border-white/5 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-white/5 mb-1">
                      <p className="text-sm font-bold text-white">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <Link to="/customer/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                      <UserCircleIcon className="h-5 w-5" /> Profile Settings
                    </Link>
                    <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <ArrowRightOnRectangleIcon className="h-5 w-5" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 sm:p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
          <CustomerChat />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
