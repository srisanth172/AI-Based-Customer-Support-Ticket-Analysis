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
import FloatingChatWidget from '../UI/FloatingChatWidget';

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
    { name: 'AI Help', href: '/customer/tickets/new', icon: SparklesIcon },
    { name: 'Profile', href: '/customer/profile', icon: UserCircleIcon },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen mesh-gradient-bg flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Sidebar ─── */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 md:z-30 
        w-[272px] h-screen bg-slate-950 flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-[72px] flex items-center justify-between px-7 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <SparklesIcon className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight">
              ClarityHelp
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pt-8 pb-4">
          <p className="px-4 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Menu
          </p>
          <div className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/customer' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-item group flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'active bg-white/[0.08] text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <div className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-white/[0.04] text-slate-500 group-hover:bg-white/[0.06] group-hover:text-slate-300'
                  }`}>
                    <item.icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom user section */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold text-sm ring-1 ring-white/10">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email || 'user@email.com'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-slate-500 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
          >
            <ArrowRightOnRectangleIcon className="h-[18px] w-[18px] text-slate-600 group-hover:text-rose-400 transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content Wrapper ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-black/[0.04] flex items-center justify-between px-5 sm:px-8 shrink-0 z-20 sticky top-0">
          {/* Left: hamburger + search */}
          <div className="flex-1 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            <div className="max-w-md w-full hidden sm:block">
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <MagnifyingGlassIcon className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="search"
                  className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-4 ring-1 ring-inset ring-slate-200/80 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-[13px] bg-slate-50/80 transition-all placeholder:text-slate-400 font-medium"
                  placeholder="Search tickets, help articles..."
                />
              </div>
            </div>
          </div>

          {/* Right: notification + profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationDropdown />

            <div className="h-6 w-px bg-slate-200/80 mx-1 hidden sm:block" />

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-50 transition-all group"
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-indigo-600/20">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-[13px] font-semibold text-slate-800 truncate max-w-[120px] leading-tight">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-slate-400 leading-tight">Customer</p>
                </div>
                <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400 hidden lg:block transition-transform group-hover:text-slate-600" />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white shadow-xl ring-1 ring-black/5 z-50 p-1.5 border border-slate-100/50"
                  >
                    <div className="px-3 py-2.5 border-b border-slate-100 mb-1.5">
                      <p className="text-[13px] font-semibold text-slate-800">{user?.name || 'User'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@email.com'}</p>
                    </div>
                    <Link
                      to="/customer/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <UserCircleIcon className="h-4 w-4 text-slate-400" />
                      View Profile
                    </Link>
                    <Link
                      to="/customer/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <Cog6ToothIcon className="h-4 w-4 text-slate-400" />
                      Settings
                    </Link>
                    <div className="border-t border-slate-100 mt-1.5 pt-1.5">
                      <button
                        onClick={() => { setProfileDropdownOpen(false); logout(); }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-transparent relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
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
