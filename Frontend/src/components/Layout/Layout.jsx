import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#020B06] text-slate-900 dark:text-slate-50 transition-colors duration-200 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1 pt-16">
        {isAdmin && <Sidebar />}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`flex-1 p-8 ${isAdmin ? 'ml-64' : ''} max-w-7xl mx-auto w-full`}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;
