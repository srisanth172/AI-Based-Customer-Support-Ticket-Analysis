import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="flex">
        {isAdmin && <Sidebar />}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`flex-1 p-6 ${isAdmin ? 'ml-64' : ''}`}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;
