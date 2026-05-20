import API_URL from '../../lib/apiUrl.js';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import {
  Bell,
  X,
  FileCode2,
  AlertTriangle,
  Building2,
  BookOpen,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';



const TYPE_CONFIG = {
  submission: {
    icon: FileCode2,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500',
  },
  plagiarism: {
    icon: AlertTriangle,
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-l-red-500',
  },
  org_invite: {
    icon: Building2,
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-l-purple-500',
  },
  assignment: {
    icon: BookOpen,
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-l-orange-500',
  },
  verified: {
    icon: ShieldCheck,
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-l-green-500',
  },
};

function groupByDate(notifications) {
  const groups = { today: [], yesterday: [], thisWeek: [], older: [] };
  notifications.forEach((n) => {
    const d = new Date(n.created_at);
    if (isToday(d)) groups.today.push(n);
    else if (isYesterday(d)) groups.yesterday.push(n);
    else if (isThisWeek(d)) groups.thisWeek.push(n);
    else groups.older.push(n);
  });
  return [
    { label: 'Today', items: groups.today },
    { label: 'Yesterday', items: groups.yesterday },
    { label: 'This Week', items: groups.thisWeek },
    { label: 'Older', items: groups.older },
  ].filter((g) => g.items.length > 0);
}

export default function NotificationCenter({ open, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Fetch notifications
  useEffect(() => {
    if (!open || !user?.id) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/notifications?user_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [open, user?.id]);

  // Subscribe to real-time inserts
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-notifications-center-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  // Click a notification
  const handleClick = async (notif) => {
    // Mark single as read via local state (backend marks on read-all)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );

    // Mark single as read in DB
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notif.id);
    } catch (e) {
      // non-fatal
    }

    if (notif.action_url) {
      navigate(notif.action_url);
      onClose();
    }
  };

  // Filter logic
  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'submission', label: 'Submissions' },
    { id: 'plagiarism', label: 'Plagiarism' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-[18px] h-[18px] text-vouch-600 dark:text-vouch-400" />
                  <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-vouch-600 text-white text-[9px] font-black">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-[10px] font-bold text-vouch-600 dark:text-vouch-400 hover:underline"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    <X className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 overflow-x-auto">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
                      filter === f.id
                        ? 'bg-vouch-50 text-vouch-600 dark:bg-vouch-950 dark:text-vouch-400'
                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-vouch-600" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Bell className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                    You're all caught up!
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    No notifications to show right now.
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {grouped.map((group) => (
                    <div key={group.label}>
                      <div className="px-5 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                          {group.label}
                        </p>
                      </div>
                      {group.items.map((notif) => {
                        const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.submission;
                        const Icon = config.icon;

                        return (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`mx-3 mb-1.5 rounded-xl border-l-[3px] cursor-pointer transition-all duration-150 hover:shadow-sm ${
                              notif.read
                                ? 'bg-gray-50/50 dark:bg-gray-900/40 border-l-transparent'
                                : `bg-white dark:bg-gray-800/80 ${config.border}`
                            }`}
                            onClick={() => handleClick(notif)}
                          >
                            <div className="flex gap-3 p-3.5">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-xs leading-tight ${
                                    notif.read
                                      ? 'font-semibold text-gray-600 dark:text-gray-400'
                                      : 'font-bold text-gray-900 dark:text-white'
                                  }`}
                                >
                                  {notif.title}
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-[9px] text-gray-350 dark:text-gray-600 mt-1 font-semibold">
                                  {getRelativeTime(notif.created_at)}
                                </p>
                              </div>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-vouch-500 shrink-0 mt-1.5" />
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}
