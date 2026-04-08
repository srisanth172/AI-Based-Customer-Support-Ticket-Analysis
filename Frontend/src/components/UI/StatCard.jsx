import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'bg-blue-500', change }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && <p className="text-xs text-gray-500 mt-1">{change} vs last week</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} text-white flex items-center justify-center`}>
          {Icon ? <Icon className="w-5 h-5" /> : null}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
