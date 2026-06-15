import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Palette, Settings as SettingsIcon, Shield, Save, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user, updateProfile, theme, toggleTheme } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // State for all forms
  const [profile, setProfile] = useState({ name: '', email: '', password: '' });
  const [settings, setSettings] = useState({
    notifications: { email: true, inApp: true, urgentAlerts: true },
    appearance: { theme: 'light' },
    system: { defaultCategory: 'general', slaHours: 24 },
    security: { twoFactorEnabled: false }
  });

  useEffect(() => {
    if (user && !loading) { // Correctly sync when context user changes
      setProfile(prev => ({ ...prev, name: user.name || '', email: user.email || '' }));
      if (user.settings) {
         setSettings(prev => ({
          notifications: { ...prev.notifications, ...user.settings.notifications },
          appearance: { ...prev.appearance, ...user.settings.appearance },
          system: { ...prev.system, ...user.settings.system },
          security: { ...prev.security, ...user.settings.security }
        }));
      }
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        name: profile.name,
        email: profile.email,
        settings
      };
      if (profile.password) payload.password = profile.password;

      await updateProfile(payload);
    } catch (error) {
      // toast is already called in updateProfile
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your account preferences and system configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 p-2 rounded-2xl shadow-sm space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  activeTab === tab.id 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-emerald-500' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 capitalize">{activeTab} Settings</h2>
            
            <div className="space-y-6">
              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="relative group">
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/10">
                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-[18px] font-semibold text-slate-900 dark:text-white">{profile.name || 'Administrator'}</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-[13px] mt-0.5">{profile.email || 'admin@swift.com'}</p>
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/20">
                        <Shield className="h-3.5 w-3.5" />
                        System Administrator
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                      <input type="text" value={profile.name} disabled className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                      <input type="email" value={profile.email} disabled className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-500 cursor-not-allowed" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
                  <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700/60 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">Email Notifications</p>
                      <p className="text-sm text-slate-500">Receive daily summaries and alerts to your email.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.notifications.email} onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, email: e.target.checked}})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700/60 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">In-App Alerts</p>
                      <p className="text-sm text-slate-500">Enable real-time push notifications in dashboard.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.notifications.inApp} onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, inApp: e.target.checked}})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-rose-100 dark:border-rose-900/30 rounded-xl bg-rose-50/50 dark:bg-rose-500/5">
                    <div>
                      <p className="font-semibold text-rose-800 dark:text-rose-400">High-Priority Ticket Alerts</p>
                      <p className="text-sm text-rose-500 dark:text-rose-500/70">Always notify when an AI marks a ticket as High Priority.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.notifications.urgentAlerts} onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, urgentAlerts: e.target.checked}})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-rose-200 peer-focus:outline-none rounded-full peer dark:bg-rose-900 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                </motion.div>
              )}
            </div>
            
            {activeTab === 'notifications' && (
              <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                 <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-70"
                 >
                   {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4" />}
                   {loading ? 'Saving...' : 'Save Changes'}
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
