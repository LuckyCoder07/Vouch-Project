import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  Sun, 
  Bell, 
  User, 
  Trash2, 
  LogOut, 
  Github, 
  Info,
  ShieldCheck,
  Check,
  Smartphone,
  Globe,
  ChevronRight,
  Cpu,
  FileBadge
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../components/ui/Toast';

const Toggle = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-4">
    <div className="flex-1">
      <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  </div>
);

export default function Settings() {
  const { isDarkMode, toggleTheme, logout, user } = useAuth();
  const navigate = useNavigate();
  const { clearAll } = useNotifications();
  const toast = useToast();

  const [notifSettings, setNotifSettings] = useState({
    enabled: localStorage.getItem('vouch_notifs_enabled') !== 'false',
    upload: localStorage.getItem('vouch_notif_upload') !== 'false',
    profile: localStorage.getItem('vouch_notif_profile') !== 'false',
    vscore: localStorage.getItem('vouch_notif_vscore') !== 'false',
  });

  const updateNotifSetting = (key, value) => {
    setNotifSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(`vouch_notif${key === 'enabled' ? 's_enabled' : '_' + key}`, value);
    toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} preference updated`);
  };

  const handleClearCache = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('vouch_')) {
        localStorage.removeItem(key);
      }
    });
    toast.success("Local cache cleared successfully");
    // Reload to reset states
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage your application preferences and account security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appearance Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Moon className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Appearance</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-gray-700">
            <Toggle 
              label="Dark Mode" 
              description="Switch between light and dark themes"
              enabled={isDarkMode} 
              onChange={toggleTheme} 
            />
            
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-3">Theme Preview</p>
              <div className="flex gap-4">
                <div className="flex-1 h-20 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col p-2 gap-1">
                  <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
                  <div className="w-full h-1 bg-gray-100 rounded-full"></div>
                  <div className="w-2/3 h-1 bg-gray-100 rounded-full"></div>
                </div>
                <div className="flex-1 h-20 rounded-xl bg-gray-800 border border-gray-700 shadow-sm flex flex-col p-2 gap-1">
                  <div className="w-8 h-2 bg-blue-500 rounded-full"></div>
                  <div className="w-full h-1 bg-gray-700 rounded-full"></div>
                  <div className="w-2/3 h-1 bg-gray-700 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Bell className="w-5 h-5 text-orange-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Notifications</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-gray-700 space-y-1">
            <Toggle 
              label="In-app Notifications" 
              description="Enable the notification bell dropdown"
              enabled={notifSettings.enabled} 
              onChange={(v) => updateNotifSetting('enabled', v)} 
            />
            <div className={`space-y-1 transition-opacity ${notifSettings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <Toggle 
                label="File Upload Alerts" 
                enabled={notifSettings.upload} 
                onChange={(v) => updateNotifSetting('upload', v)} 
              />
              <Toggle 
                label="Profile Change Alerts" 
                enabled={notifSettings.profile} 
                onChange={(v) => updateNotifSetting('profile', v)} 
              />
              <Toggle 
                label="V-Score Updates" 
                enabled={notifSettings.vscore} 
                onChange={(v) => updateNotifSetting('vscore', v)} 
              />
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 px-2">
            <User className="w-5 h-5 text-purple-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Account & Data</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white font-bold">{user?.email}</span>
                    </div>
                    <button 
                      onClick={() => navigate('/profile?edit=true')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>

                <button 
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition group"
                >
                  <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  Sign Out of Vouch
                </button>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => { clearAll(); toast.success("Notification history cleared"); }}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Clear All Notifications</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>

                <button 
                  onClick={handleClearCache}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Clear Local Cache</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 px-2">
            <Info className="w-5 h-5 text-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">About Vouch</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Vouch Protocol</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0 (Stability Patch)</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate('/know-about-vouch')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 rounded-xl border border-blue-600 text-sm font-bold text-white hover:bg-blue-700 hover:border-blue-700 shadow-lg shadow-blue-500/30 transition group"
                >
                  <Info className="w-4 h-4" />
                  Know More
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
