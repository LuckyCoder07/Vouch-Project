import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const storageKey = user?.email ? `vouch_notifications_${user.email.replace(/[@.]/g, '_')}` : null;

  const [notifications, setNotifications] = useState([]);

  // Load notifications when user changes
  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      setNotifications(stored ? JSON.parse(stored) : []);
    } else {
      setNotifications([]);
    }
  }, [storageKey]);

  // Save notifications when they change
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    }
  }, [notifications, storageKey]);

  const addNotification = (type, title, message, path = null) => {
    setNotifications((prev) => {
      const newNotification = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        type,
        title,
        message,
        path,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      const updated = [newNotification, ...prev].slice(0, 50); // Keep max 50 entries
      return updated;
    });
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map(notif => ({ ...notif, read: true })));
  };

  const markRead = (id) => {
    setNotifications((prev) => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(notif => !notif.read).length;
  }, [notifications]);

  const value = {
    notifications,
    addNotification,
    markAllRead,
    markRead,
    unreadCount,
    clearAll: () => setNotifications([])
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
