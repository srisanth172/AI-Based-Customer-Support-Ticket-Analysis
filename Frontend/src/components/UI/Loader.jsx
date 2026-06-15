import React from 'react';

const Loader = ({ label = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center gap-3 py-6 text-gray-600">
      <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-primary-600 animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

export default Loader;
