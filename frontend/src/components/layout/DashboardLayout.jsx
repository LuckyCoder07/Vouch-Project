import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('vouch_sidebar_collapsed') === 'true';
  });
  
  const { isDarkMode, toggleTheme, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('vouch_sidebar_collapsed', next);
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-vouch-light dark:bg-vouch-dark transition-colors duration-500">
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={logout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => {
          const next = !sidebarCollapsed
          setSidebarCollapsed(next)
          localStorage.setItem(
            'vouch_sidebar_collapsed', 
            String(next)
          )
        }}
      />

      {/* Main Content Area */}
      <div 
        className={`relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ml-0 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
      >
        <Navbar 
          toggleSidebar={toggleSidebar} 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
        />

        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 md:p-6 2xl:p-10 flex-1 flex flex-col"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
