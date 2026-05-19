import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Avatar, useToast } from '../ui';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import NotificationCenter from '../ui/NotificationCenter';
import { 
  Bell, 
  Search, 
  Command, 
  X, 
  Sun, 
  Moon, 
  Menu, 
  ChevronRight, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  LogOut, 
  User, 
  Building2, 
  Clock, 
  UploadCloud, 
  FolderPlus, 
  Key, 
  FilePlus, 
  FileSearch,
  LayoutDashboard
} from 'lucide-react';

const pathMap = {
  '/dashboard': 'Dashboard',
  '/org': 'Organization',
  '/batch': 'Batch Vouch',
  '/history': 'History',
  '/verification': 'Verification',
  '/how-it-works': 'How It Works',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/certificates': 'Certificates',
  '/know-about-vouch': 'Know About Vouch',
  '/vscore': 'V-Score',
};

const PALETTE_ITEMS = [
  // Navigation
  { label: 'Dashboard', path: '/dashboard', category: 'Navigation', icon: LayoutDashboard },
  { label: 'Verification', path: '/verification', category: 'Navigation', icon: ShieldCheck },
  { label: 'Batch Vouch', path: '/batch', category: 'Navigation', icon: UploadCloud },
  { label: 'Organization', path: '/org', category: 'Navigation', icon: Building2 },
  { label: 'History', path: '/history', category: 'Navigation', icon: Clock },
  { label: 'Profile', path: '/profile', category: 'Navigation', icon: User },
  // Actions
  { label: 'Vouch a file', path: '/dashboard', category: 'Actions', icon: FilePlus },
  { label: 'Verify a file', path: '/verification', category: 'Actions', icon: FileSearch },
  { label: 'Create assignment', path: '/org', category: 'Actions', icon: FolderPlus },
  { label: 'Join org with code', path: '/org', category: 'Actions', icon: Key }
];

export default function Navbar({ toggleSidebar, isDarkMode, toggleTheme }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Refs for click outside detection
  const userMenuRef = useRef(null);

  // Fetch notifications and subscribe to updates
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    };

    fetchNotifications();

    const channel = supabase.channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.success(payload.new.title || 'New Notification');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener for Command Palette (⌘K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard navigation inside Command Palette
  const filteredItems = PALETTE_ITEMS.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleItemClick(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, filteredItems, selectedIndex]);

  const handleItemClick = (item) => {
    navigate(item.path);
    setSearchOpen(false);
    setSearchQuery('');
  };



  // Dynamic Breadcrumbs
  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.map((part, index) => {
      const route = '/' + parts.slice(0, index + 1).join('/');
      const name = pathMap[route] || part.charAt(0).toUpperCase() + part.slice(1);
      return { name, path: route };
    });
  };

  const breadcrumbs = getBreadcrumbs();  return (
    <>
      <header className="sticky top-0 z-30 w-full glass backdrop-blur-xl bg-white/90 dark:bg-gray-950/90 border-b border-gray-100 dark:border-gray-800/50 px-4 md:px-6 h-16 flex items-center justify-between transition-colors duration-300">
        
        {/* Left Side: Logo (mobile) or Breadcrumb (desktop) */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu & logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-vouch-600 dark:text-vouch-400" />
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-vouch-600 to-vouch-400 bg-clip-text text-transparent">
                Vouch
              </span>
            </Link>
          </div>

          {/* Desktop Breadcrumbs */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 select-none">
            <span className="font-medium hover:text-gray-700 dark:hover:text-gray-200 transition">Vouch</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            {breadcrumbs.length > 0 ? (
              breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.path}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                  <span className={idx === breadcrumbs.length - 1 ? "font-bold text-gray-900 dark:text-white text-sm" : ""}>
                    {crumb.name}
                  </span>
                </React.Fragment>
              ))
            ) : (
              <span className="font-bold text-gray-900 dark:text-white text-sm">Dashboard</span>
            )}
          </div>
        </div>

        {/* Center: Command Palette Trigger (desktop only) */}
        <div className="hidden lg:block relative">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-between bg-gray-100/70 hover:bg-gray-200/50 dark:bg-gray-800/40 dark:hover:bg-gray-800/80 rounded-xl px-4 py-2 text-sm text-gray-400 w-64 text-left border border-transparent dark:border-gray-800 transition cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="font-medium text-xs">Search or jump to...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[10px] text-gray-400 font-mono shadow-sm">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Side: Theme Toggle, Notifications, User Menu */}
        <div className="flex items-center gap-2.5">
          {/* Mobile search icon trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1.5"
            aria-label="Open search command palette"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:flex badge-gray text-[10px] scale-90">⌘K</span>
          </button>

          {/* Theme Toggle */}
          <Tooltip.Provider>
            <Tooltip.Root delayDuration={100}>
              <Tooltip.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="w-9 h-9 p-0 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="bottom"
                  sideOffset={8}
                  className="z-50 px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-md animate-in fade-in zoom-in-95 duration-100"
                >
                  Toggle theme
                  <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          {/* Notifications Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotifCenterOpen(true)}
            className="relative w-9 h-9 p-0 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Toggle notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
            )}
          </Button>

          {/* User Menu Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center focus:outline-none"
              aria-label="User menu"
            >
              <Avatar
                name={profile?.name || user?.email || 'User'}
                src={profile?.avatar_url}
                size="sm"
                className="hover:opacity-90 active:scale-95 transition"
              />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 glass p-1.5 z-50"
                >
                  <div className="px-3 py-2 text-xs">
                    <p className="font-bold text-gray-900 dark:text-white truncate">
                      {profile?.name || user?.email?.split('@')[0] || "User"}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="my-1 border-t border-gray-100 dark:border-gray-850" />
                  
                  <button
                    onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 transition"
                  >
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => { navigate('/org'); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 transition"
                  >
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    Organization
                  </button>
                  <button
                    onClick={() => { navigate('/history'); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 transition"
                  >
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    History
                  </button>

                  <div className="my-1 border-t border-gray-100 dark:border-gray-850" />
                  
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
            />

            {/* Palette Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-10"
            >
              {/* Input section */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                  placeholder="Type a command or search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button 
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleItemClick(item)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-vouch-600 text-white shadow-md shadow-vouch-600/10'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300'
                        }`}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                        <span className="text-xs font-semibold flex-1 truncate">{item.label}</span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                          isSelected ? 'text-vouch-100' : 'text-gray-450 dark:text-gray-500'
                        }`}>
                          {item.category}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-gray-400 dark:text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <NotificationCenter open={notifCenterOpen} onClose={() => setNotifCenterOpen(false)} />
    </>
  );
}
