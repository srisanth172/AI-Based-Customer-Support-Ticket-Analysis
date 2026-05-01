import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Moon, Sun, UserCircle, Bot, ChevronDown, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminCopilot from '../Dashboard/AdminCopilot';
import NotificationDropdown from '../UI/NotificationDropdown';

const Navbar = () => {
  const { user, logout, theme, toggleTheme, globalSearch, setGlobalSearch, isAdmin } = useAuth();
  const [showCopilot, setShowCopilot] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = React.useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <header className="fixed top-0 w-full z-30 border-b border-emerald-100 dark:border-emerald-900/20 bg-white/70 dark:bg-[#020B06]/80 backdrop-blur-xl transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 p-1.5 transition-all">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
            Swift Support
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="hidden md:flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.1em]">
                System Administrator
              </span>
            )}
            <NotificationDropdown />
          </div>



          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group"
            >
              <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20 ring-1 ring-white/10">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="hidden sm:block text-left pr-2">
                 <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-none">{user?.name}</p>
                 <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold">
                    {isAdmin ? 'System Administrator' : 'Account'}
                  </p>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-600 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#0a1f10] border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 mb-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <Link to={isAdmin ? "/admin/settings" : "/customer/profile"} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <Settings className="h-5 w-5" /> Settings
                  </Link>
                  <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors">
                    <LogOut className="h-5 w-5" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
