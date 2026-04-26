import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Moon, Sun, UserCircle, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import AdminCopilot from '../Dashboard/AdminCopilot';
import NotificationDropdown from '../UI/NotificationDropdown';

const Navbar = () => {
  const { user, theme, toggleTheme, globalSearch, setGlobalSearch } = useAuth();
  const [showCopilot, setShowCopilot] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  
  return (
    <header className="fixed top-0 w-full z-30 border-b border-emerald-100 dark:border-emerald-900/20 bg-white/70 dark:bg-[#020B06]/80 backdrop-blur-xl transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-3 flex-1">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <div className="text-xl font-extrabold bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent mr-8 uppercase tracking-tighter">
            Swift Support
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
           <span className="hidden lg:inline-block rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            {isAdmin ? 'Panel Admin' : 'Customer View'}
          </span>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          
          <NotificationDropdown />



          <button className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <UserCircle className="w-7 h-7 text-slate-600 dark:text-slate-300" />
            <div className="hidden sm:block text-left mr-2">
               <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight truncate w-24">{user?.name || 'Admin'}</p>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold text-ellipsis overflow-hidden">{user?.role === 'admin' ? 'Admin' : 'Customer'}</p>
            </div>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
