import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  UserCircleIcon, 
  PhotoIcon, 
  CheckIcon, 
  EnvelopeIcon,
  ShieldCheckIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const CustomerProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', role: user?.role || 'Customer' });
  
  const handleSave = () => {
    // In a real app, dispatch API call here
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-slate-400 mt-1 text-[14px]">Manage your personal information and preferences.</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
      >
        {/* Avatar + Name Section */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-xl shadow-md text-slate-500 hover:text-indigo-600 transition-colors border border-slate-100 opacity-0 group-hover:opacity-100">
                <PhotoIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-semibold text-slate-900">{user?.name || 'Customer User'}</h2>
              <p className="text-slate-400 text-[13px] mt-0.5">{user?.email || 'customer@example.com'}</p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Verified Account
              </div>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                isEditing
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
              }`}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-x-6">
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <UserCircleIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-[13px] text-slate-900 ring-1 ring-inset ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50/60 disabled:text-slate-500 transition-all font-medium"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-[13px] text-slate-900 ring-1 ring-inset ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50/60 disabled:text-slate-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Account Role</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <KeyIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  disabled
                  value={formData.role}
                  className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-[13px] text-slate-500 ring-1 ring-inset ring-slate-200/80 bg-slate-50/60 cursor-not-allowed capitalize font-medium"
                />
              </div>
            </div>
          </div>
          
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-6 flex justify-end"
            >
              <button
                onClick={handleSave}
                className="btn-primary px-5 py-2.5"
              >
                <CheckIcon className="h-4 w-4" />
                Save Changes
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
      >
        <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Security</h3>
        <p className="text-[12px] text-slate-400 mb-5">Manage your account security settings.</p>
        
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/60 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <KeyIcon className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-700">Password</p>
              <p className="text-[11px] text-slate-400">Last changed 30 days ago</p>
            </div>
          </div>
          <button className="px-3.5 py-2 text-[12px] font-semibold text-slate-600 bg-white rounded-lg ring-1 ring-inset ring-slate-200/80 hover:bg-slate-50 transition-colors">
            Change
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomerProfile;
