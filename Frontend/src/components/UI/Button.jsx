import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 hover:shadow-md hover:shadow-indigo-600/25',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-inset ring-slate-200/80',
    outline: 'border border-indigo-200 text-indigo-600 hover:bg-indigo-50 bg-white',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-4 py-2.5 text-[13px]',
    lg: 'px-6 py-3 text-[14px]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-xl font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
