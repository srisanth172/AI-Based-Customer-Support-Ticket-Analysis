import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TicketIcon, Users, Settings, Filter, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const links = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/tickets', icon: Activity, label: 'Workflows' },
    { to: '/admin/customers', icon: Users, label: 'Customers' },
    { to: '/admin/analytics', icon: Activity, label: 'Analytics' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-indigo-50 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl transition-colors duration-200 p-4 z-20 hidden lg:flex flex-col">
      
      <div className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-700 bg-clip-text text-transparent px-3 mb-8 mt-2 uppercase tracking-tight">
        Support Admin
      </div>
      
      <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-3 mt-4">Main Menu</div>
      
      <nav className="space-y-1.5 flex-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                {link.label}
                {isActive && (
                  <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-6 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></motion.div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-800 dark:to-slate-800 border border-indigo-100 dark:border-slate-700/50 rounded-2xl">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-inner font-bold text-lg">
              {user?.name ? user.name.substring(0, 1).toUpperCase() : 'S'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate w-32">{user?.name || 'Shiva'}</p>
            </div>
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;
