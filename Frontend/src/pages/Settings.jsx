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
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'system', label: 'System', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield }
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
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-slate-400'}`} />
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
                  {/* Profile Picture Placeholder */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {profile.name ? profile.name.substring(0,2).toUpperCase() : 'U'}
                    </div>
                    <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
                      Change Avatar
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                      <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                      <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none dark:text-white" />
                    </div>
                    <hr className="border-slate-100 dark:border-slate-700/60 my-4" />
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                      <input type="password" placeholder="Leave blank to keep current password" value={profile.password} onChange={(e) => setProfile({...profile, password: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none dark:text-white" />
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
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700/60 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">In-App Alerts</p>
                      <p className="text-sm text-slate-500">Enable real-time push notifications in dashboard.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.notifications.inApp} onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, inApp: e.target.checked}})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
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

              {activeTab === 'appearance' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
                  <div>
                    <label className="block font-semibold text-slate-800 dark:text-slate-100 mb-3">Dashboard Theme</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['light', 'dark'].map(t => (
                        <button 
                          key={t}
                          onClick={() => {
                            setSettings({...settings, appearance: { theme: t }});
                            // Preview the theme locally
                            const root = window.document.documentElement;
                            if (t === 'dark') root.classList.add('dark');
                            else root.classList.remove('dark');
                          }}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${settings.appearance.theme === t ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                        >
                          <div className={`w-10 h-10 rounded-full mb-2 border ${t === 'light' ? 'bg-white' : 'bg-slate-900 border-slate-700'}`}></div>
                          <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">{t}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'system' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Ticket Category</label>
                    <select 
                      value={settings.system.defaultCategory} 
                      onChange={(e) => setSettings({...settings, system: {...settings.system, defaultCategory: e.target.value}})}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none dark:text-white form-select"
                    >
                      <option value="general">General Queries</option>
                      <option value="billing">Billing / Payments</option>
                      <option value="technical">Technical Support</option>
                      <option value="account">Account Access</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Standard SLA Resolution Limit (Hours)</label>
                    <input 
                      type="number" 
                      value={settings.system.slaHours} 
                      onChange={(e) => setSettings({...settings, system: {...settings.system, slaHours: parseInt(e.target.value)}})}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none dark:text-white"
                      min="1" max="168"
                    />
                    <p className="text-xs text-slate-500 mt-1">Tickets older than this limit will automatically escalate.</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
                  <div className="flex items-center justify-between p-4 border border-emerald-100 dark:border-emerald-900/30 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5">
                    <div>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-400">Two-Factor Authentication</p>
                      <p className="text-sm text-emerald-600/70 dark:text-emerald-500/70">Add an extra layer of security to your admin account.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.security.twoFactorEnabled} onChange={(e) => setSettings({...settings, security: {...settings.security, twoFactorEnabled: e.target.checked}})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-emerald-200 peer-focus:outline-none rounded-full peer dark:bg-emerald-900/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Active Sessions</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">💻</div>
                         <div>
                           <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Windows • Chrome</p>
                           <p className="text-xs text-slate-500">Seattle, USA • Current Session</p>
                         </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">Active</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
               <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-70"
               >
                 {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4" />}
                 {loading ? 'Saving...' : 'Save Changes'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
