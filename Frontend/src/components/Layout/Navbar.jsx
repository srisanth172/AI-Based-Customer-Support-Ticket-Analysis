import React from 'react';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
          {isAdmin ? 'Admin View' : 'Customer View'}
        </span>
      </div>
    </header>
  );
};

export default Navbar;
