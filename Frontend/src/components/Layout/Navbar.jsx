import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Moon, Sun, UserCircle, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import AdminCopilot from '../Dashboard/AdminCopilot';

const Navbar = () => {
  const { user, theme, toggleTheme, globalSearch, setGlobalSearch } = useAuth();
  const [showCopilot, setShowCopilot] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  
  return (
    <header className="fixed top-0 w-full z-30 border-b border-indigo-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-4 flex-1">
          <div className="text-xl font-extrabold bg-gradient-to-r from-indigo-500 to-indigo-700 bg-clip-text text-transparent mr-8 uppercase tracking-tighter">
            Clarity Support
          </div>
          {isAdmin && (
            <form 
              onSubmit={(e) => { e.preventDefault(); /* Search is already live via globalSearch */ }}
              className="hidden md:flex relative w-96 group"
            >
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 p-0 border-none bg-transparent">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </button>
              <input
                type="text"
                placeholder="Search globally..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 rounded-full pl-10 pr-4 py-2 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-300 dark:focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </form>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
           <span className="hidden lg:inline-block rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            {isAdmin ? 'Panel Admin' : 'Customer View'}
          </span>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
             {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {isAdmin && (
             <div className="relative">
                <button 
                  onClick={() => setShowCopilot(!showCopilot)} 
                  className={`p-2 rounded-full transition-colors relative ${showCopilot ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400' : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Bot className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </button>
                {showCopilot && (
                   <div className="absolute right-0 top-full mt-4 w-[380px] z-50 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                      <AdminCopilot onClose={() => setShowCopilot(false)} />
                   </div>
                )}
             </div>
          )}

          <button className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <UserCircle className="w-7 h-7 text-slate-600 dark:text-slate-300" />
            <div className="hidden sm:block text-left mr-2">
               <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight truncate w-24">{user?.name || 'Shiva'}</p>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold text-ellipsis overflow-hidden">{user?.role === 'admin' ? 'Admin' : 'Customer'}</p>
            </div>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
