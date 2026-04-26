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
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', password: '', role: user?.role || 'Customer' });
  
  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { name: formData.name, email: formData.email };
      if (formData.password) payload.password = formData.password;
      await updateProfile(payload);
      setIsEditing(false);
      setFormData({ ...formData, password: '' });
    } catch (error) {
      // Error handled by AuthContext toast
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-[28px] font-bold text-white tracking-tight">My Profile</h1>
        <p className="text-slate-400 mt-1 text-[14px]">Manage your personal information and preferences.</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden backdrop-blur-xl"
      >
        {/* Avatar + Name Section */}
        <div className="p-6 sm:p-8 border-b border-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/20 ring-1 ring-white/10">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-semibold text-white">{user?.name || 'Customer User'}</h2>
              <p className="text-slate-400 text-[13px] mt-0.5">{user?.email || 'customer@example.com'}</p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Verified Account
              </div>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                isEditing
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
              }`}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="p-6 sm:p-8 bg-black/20">
          <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-x-6">
            <div>
              <label className="block text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <UserCircleIcon className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="block w-full rounded-xl border border-white/5 bg-white/[0.03] py-2.5 pl-10 pr-3 text-[13px] text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all font-medium outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <EnvelopeIcon className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="block w-full rounded-xl border border-white/5 bg-white/[0.03] py-2.5 pl-10 pr-3 text-[13px] text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all font-medium outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Role</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <KeyIcon className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  disabled
                  value={formData.role}
                  className="block w-full rounded-xl border border-white/5 bg-white/[0.02] py-2.5 pl-10 pr-3 text-[13px] text-slate-500 cursor-not-allowed capitalize font-medium outline-none"
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
                disabled={loading}
                className="btn-primary px-5 py-2.5 flex items-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <CheckIcon className="h-4 w-4" />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 sm:p-8 backdrop-blur-xl"
      >
        <h3 className="text-[15px] font-semibold text-white mb-1">Security</h3>
        <p className="text-[12px] text-slate-400 mb-5">Manage your account security settings.</p>
        
        <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
          <div className="flex w-full items-center gap-4">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
              <KeyIcon className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-slate-200">Password</p>
              {isEditing ? (
                <input
                  type="password"
                  placeholder="Enter new password to change"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="mt-2 block w-full max-w-sm rounded-xl border border-white/5 bg-white/[0.03] py-2 px-3 text-[13px] text-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium outline-none placeholder:text-slate-600"
                />
              ) : (
                <p className="text-[11px] text-slate-500">••••••••</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomerProfile;
