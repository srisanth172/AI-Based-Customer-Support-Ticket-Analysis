import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, TicketIcon } from '@heroicons/react/24/outline';

const linkBase = 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium';

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white p-4">
      <div className="space-y-2">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `${linkBase} ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <HomeIcon className="w-5 h-5" />
          Dashboard
        </NavLink>
        <NavLink
          to="/admin"
          className={({ isActive }) => `${linkBase} ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <TicketIcon className="w-5 h-5" />
          Tickets
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
