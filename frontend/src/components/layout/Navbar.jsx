import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  User, 
  Moon, 
  Sun,
  ShieldCheck,
  X,
  FileUp,
  Fingerprint,
  TrendingUp,
  CheckCircle,
  Clock,
  LayoutDashboard,
  BookOpen,
  Activity,
  FileBadge,
  Award,
  Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Avatar from '../ui/Avatar';

const SEARCH_ITEMS = [
  { label: 'Dashboard', description: 'Notary workspace', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Verification', description: 'Verify file integrity', path: '/verification', icon: 'ShieldCheck' },
  { label: 'History', description: 'Immutable ledger records', path: '/history', icon: 'Clock' },
  { label: 'How It Works', description: 'Learn the engine', path: '/how-it-works', icon: 'BookOpen' },
  { label: 'Profile', description: 'Your OG Vouch profile', path: '/profile', icon: 'User' },
  { label: 'Settings', description: 'App preferences', path: '/settings', icon: 'Settings' },
  { label: 'Lifetime Entries', description: 'All your hashed files', path: '/history', icon: 'FileBadge' },
  { label: 'Certificates', description: 'Download your certificates', path: '/history', icon: 'Award' },
  { label: 'V-Score', description: 'Your reputation score', path: '/profile', icon: 'TrendingUp' },
];

const ICON_MAP = {
  LayoutDashboard,
  ShieldCheck,
  BookOpen,
  User,
  Clock,
  Settings,
  FileBadge,
  Award,
  TrendingUp
};

export default function Navbar({ toggleSidebar, isDarkMode, toggleTheme }) {
  const { user, profile } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() === "") {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const filtered = SEARCH_ITEMS.filter(item => 
      item.label.toLowerCase().includes(value.toLowerCase()) ||
      item.description.toLowerCase().includes(value.toLowerCase())
    );

    setSearchResults(filtered.slice(0, 6));
    setShowDropdown(filtered.length > 0);
  };

  const handleResultClick = (path) => {
    navigate(path);
    setSearchTerm("");
    setShowDropdown(false);
    setShowMobileSearch(false);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/verification?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowMobileSearch(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'upload': return <Upload className="w-4 h-4 text-blue-500" />;
      case 'hash': return <Fingerprint className="w-4 h-4 text-purple-500" />;
      case 'profile': return <User className="w-4 h-4 text-orange-500" />;
      case 'vscore': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'verify': return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col w-full bg-vouch-light/80 dark:bg-vouch-dark/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 transition-all duration-500">
      <div className="flex flex-grow items-center justify-between py-4 px-4 shadow-2 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          {/* Hamburger Menu - Mobile only */}
          <button
            onClick={toggleSidebar}
            className="z-40 block rounded-sm border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-500" />
          </button>
          
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="z-40 block rounded-sm border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:hidden"
          >
            {showMobileSearch ? <X className="h-5 w-5 text-gray-500" /> : <Search className="h-5 w-5 text-gray-500" />}
          </button>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-blue-600 hidden sm:block" />
          </div>
        </div>

        {/* Desktop Search */}
        <div className="hidden lg:flex flex-1 max-w-lg xl:max-w-2xl mx-8">
          <div className="relative w-full" ref={searchContainerRef}>
            <div className="relative flex items-center w-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60 border border-gray-200 dark:border-gray-600/50 hover:border-blue-300 dark:hover:border-blue-500/50 focus-within:!border-blue-500 focus-within:!ring-4 focus-within:!ring-blue-500/20 dark:focus-within:!bg-gray-800 rounded-2xl py-2.5 px-4 transition-all duration-300 shadow-sm group cursor-text" onClick={() => searchInputRef.current?.focus()}>
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search anything... (⌘K)"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearch}
                className="w-full bg-transparent pl-3 pr-4 text-sm font-bold focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
              <div className="hidden sm:flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-[10px] font-black text-gray-400 shrink-0 shadow-sm">
                ⌘K
              </div>
            </div>

            {/* Search Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-3 w-full min-w-[320px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="py-2">
                  {searchResults.map((item, index) => {
                    const Icon = ICON_MAP[item.icon];
                    return (
                      <button
                        key={index}
                        onClick={() => handleResultClick(item.path)}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-gray-100 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-colors">
                          <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 2x:gap-7">
          <ul className="flex items-center gap-2 2x:gap-4">
            {/* Dark Mode Toggle */}
            <li>
              <button
                onClick={toggleTheme}
                className="relative flex h-8.5 w-8.5 p-2 items-center justify-center rounded-full border border-gray-200 bg-gray-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </li>

            {/* Notification */}
            <li className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-8.5 w-8.5 p-2 items-center justify-center rounded-full border border-gray-200 bg-gray-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 z-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-gray-800 animate-in zoom-in">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                    <button 
                      onClick={markAllRead}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                    >
                      Mark all as read
                    </button>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {notifications.slice(0, 10).map((notification) => (
                          <div 
                            key={notification.id} 
                            onClick={() => {
                              markRead(notification.id);
                              if (notification.path) {
                                navigate(notification.path);
                                setShowNotifications(false);
                              }
                            }}
                            className={`p-4 flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition cursor-pointer relative ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                          >
                            {!notification.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                            )}
                            <div className="shrink-0 mt-1">
                              <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                                {getIcon(notification.type)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 font-medium">
                                <Clock className="w-3 h-3" />
                                {formatTime(notification.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                          <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-900 dark:text-white font-bold">No notifications yet</p>
                        <p className="text-xs text-gray-500 mt-1">We'll notify you when your code is hashed or verified.</p>
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center bg-gray-50/30 dark:bg-gray-800/30">
                      <button 
                        onClick={() => {
                          navigate('/history');
                          setShowNotifications(false);
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                      >
                        View All Activity
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          </ul>

          <div className="flex items-center gap-4">
            {/* User Profile Button */}
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-4 hover:opacity-80 transition text-left"
            >
              <span className="hidden lg:block">
                <span className="block text-sm font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[150px]">
                  {profile?.name || user?.email?.split('@')[0] || "User"}
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 mt-0.5">
                  Pro Node
                </span>
              </span>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-800 overflow-hidden shadow-sm">
                <Avatar seed={user?.email} />
              </div>
            </button>
            
            {/* Settings Button */}
            <button 
              onClick={() => navigate('/settings')}
              className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-blue-600 transition"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Search Bar Expansion */}
      {showMobileSearch && (
        <div className="lg:hidden px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 animate-in slide-in-from-top-2">
          <div className="relative group cursor-text" ref={searchContainerRef} onClick={() => searchInputRef.current?.focus()}>
            <div className="relative flex items-center w-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/60 border border-gray-200 dark:border-gray-600/50 hover:border-blue-300 dark:hover:border-blue-500/50 focus-within:!border-blue-500 focus-within:!ring-4 focus-within:!ring-blue-500/20 dark:focus-within:!bg-gray-800 rounded-2xl py-3 px-4 transition-all duration-300 shadow-sm">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search anything... (⌘K)"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearch}
                autoFocus
                className="w-full bg-transparent pl-3 pr-4 text-sm font-bold focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Mobile Search Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="py-2">
                  {searchResults.map((item, index) => {
                    const Icon = ICON_MAP[item.icon];
                    return (
                      <button
                        key={index}
                        onClick={() => handleResultClick(item.path)}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-gray-100 dark:border-gray-700">
                          <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {item.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
