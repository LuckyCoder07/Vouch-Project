import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  LayoutDashboard,
  FolderArchive,
  ShieldCheck,
  Clock,
  Building2,
  User,
  HelpCircle,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  FileBadge,
  Settings,
  Info
} from 'lucide-react';

const GROUPS = [
  {
    title: 'Workspace',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Batch Vouch', icon: FolderArchive, path: '/batch' }
    ]
  },
  {
    title: 'Verify',
    items: [
      { name: 'Verification', icon: ShieldCheck, path: '/verification' },
      { name: 'History', icon: Clock, path: '/history' },
      { name: 'Certificates', icon: FileBadge, path: '/certificates' }
    ]
  },
  {
    title: 'Collaborate',
    items: [
      { name: 'Organization', icon: Building2, path: '/org' }
    ]
  },
  {
    title: 'Account',
    items: [
      { name: 'Profile', icon: User, path: '/profile' },
      { name: 'Settings', icon: Settings, path: '/settings' },
      { name: 'How It Works', icon: HelpCircle, path: '/how-it-works' },
      { name: 'Know About Vouch', icon: Info, path: '/know-about-vouch' }
    ]
  }
];

function SidebarTooltip({ children, content, enabled }) {
  if (!enabled) return children;

  return (
    <Tooltip.Provider>
      <Tooltip.Root delayDuration={100}>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={12}
            className="z-50 px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-md animate-in fade-in zoom-in-95 duration-100"
          >
            {content}
            <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export default function Sidebar({ isOpen, onClose, onLogout, collapsed = false, onToggleCollapse }) {
  const { user, profile } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Monitor screen size to toggle layout mode
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderNavGroup = (group, isCollapsedSidebar) => {
    return (
      <div key={group.title} className={`space-y-1 w-full ${isCollapsedSidebar ? 'flex flex-col items-center' : ''}`}>
        {!isCollapsedSidebar && (
          <h4 className="px-5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            {group.title}
          </h4>
        )}
        <div className={`space-y-0.5 w-full ${isCollapsedSidebar ? 'flex flex-col items-center' : ''}`}>
          {group.items.map((item) => (
            <SidebarTooltip
              key={item.name}
              content={item.name}
              enabled={isCollapsedSidebar}
            >
              <NavLink
                to={item.path}
                onClick={isMobile ? onClose : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl transition-all duration-200 relative group ${
                    isCollapsedSidebar 
                      ? 'w-10 h-10 justify-center' 
                      : 'w-[calc(100%-16px)] gap-3 px-3 py-2 mx-2 justify-start'
                  } ${
                    isActive
                      ? 'bg-vouch-50 dark:bg-vouch-955 text-vouch-600 dark:text-vouch-400 font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/60 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => {
                  const Icon = item.icon;
                  return (
                    <>
                      <Icon className="w-5 h-5 shrink-0" />
                      {!isCollapsedSidebar && (
                        <span className="text-xs font-semibold">{item.name}</span>
                      )}
                      {isActive && (
                        <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-vouch-600 dark:bg-vouch-400 rounded-r ${
                          isCollapsedSidebar ? 'hidden' : ''
                        }`} />
                      )}
                    </>
                  );
                }}
              </NavLink>
            </SidebarTooltip>
          ))}
        </div>
      </div>
    );
  };

  const renderFooter = (isCollapsedSidebar) => {
    return (
      <div className={`mt-auto border-t border-gray-100 dark:border-gray-900 p-2 space-y-1 shrink-0 flex flex-col ${isCollapsedSidebar ? 'items-center w-full' : ''}`}>
        {/* User Profile Card */}
        {!isCollapsedSidebar && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100/80 dark:border-gray-800/80 flex items-center gap-2.5 mb-2 mx-1 select-none">
            <Avatar name={profile?.name || user?.email || 'User'} src={profile?.avatar_url} size="xs" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate">
                {profile?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                {profile?.role || 'Member'}
              </p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <SidebarTooltip content="Sign Out" enabled={isCollapsedSidebar}>
          <button
            onClick={onLogout}
            className={`flex items-center rounded-xl text-gray-500 hover:text-red-650 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 ${
              isCollapsedSidebar ? 'w-10 h-10 justify-center' : 'w-[calc(100%-8px)] gap-3 px-3 py-2 mx-1 justify-start'
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsedSidebar && <span className="text-xs font-semibold">Sign Out</span>}
          </button>
        </SidebarTooltip>

        {/* Collapse Toggle Button (desktop only) */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className={`flex items-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200 ${
              isCollapsedSidebar ? 'w-10 h-10 justify-center' : 'w-[calc(100%-8px)] gap-3 px-3 py-2 mx-1 justify-start'
            }`}
          >
            {isCollapsedSidebar ? <ChevronRight className="w-5 h-5 shrink-0" /> : <ChevronLeft className="w-5 h-5 shrink-0" />}
            {!isCollapsedSidebar && <span className="text-xs font-semibold">Collapse sidebar</span>}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={onClose}
            />

            {/* Sidebar Panel */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
              className="relative flex flex-col w-64 h-full bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-900"
            >
              {/* Header */}
              <div className="flex items-center justify-between h-[72px] px-6 border-b border-gray-100 dark:border-gray-900 shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-vouch-600 dark:text-vouch-400" />
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-vouch-600 to-vouch-400 bg-clip-text text-transparent">
                    Vouch
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation list */}
              <nav className="flex-1 py-6 space-y-6 overflow-y-auto scrollbar-thin">
                {GROUPS.map((group) => renderNavGroup(group, false))}
              </nav>

              {/* Footer */}
              {renderFooter(false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={`flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-900 transition-all duration-300 ease-in-out shrink-0 select-none ${
            collapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center h-[72px] border-b border-gray-100 dark:border-gray-900 shrink-0 ${
            collapsed ? 'justify-center' : 'justify-between px-6'
          }`}>
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-vouch-600 dark:text-vouch-400" />
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-vouch-600 to-vouch-400 bg-clip-text text-transparent">
                  Vouch
                </span>
                <span className="badge-blue text-[9px] px-1.5 py-0.2 ml-1">v1.0</span>
              </div>
            ) : (
              <ShieldCheck className="w-6 h-6 text-vouch-600 dark:text-vouch-400" />
            )}
          </div>

          {/* Navigation list */}
          <nav className="flex-1 py-6 space-y-6 overflow-y-auto scrollbar-thin">
            {GROUPS.map((group) => renderNavGroup(group, collapsed))}
          </nav>

          {/* Footer */}
          {renderFooter(collapsed)}
        </aside>
      )}
    </>
  );
}
