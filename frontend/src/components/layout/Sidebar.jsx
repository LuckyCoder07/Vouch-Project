import React from 'react';
import { NavLink } from 'react-router-dom';

import {
  LayoutDashboard,
  ShieldCheck,
  HelpCircle,
  User,
  LogOut,
  X,
  Award,
  Info,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Verification', icon: ShieldCheck, path: '/verification' },
  { name: 'History', icon: Clock, path: '/history' },
  { name: 'Certificates', icon: Award, path: '/certificates' },
  { name: 'How It Works', icon: HelpCircle, path: '/how-it-works' },
  { name: 'Know About Vouch', icon: Info, path: '/know-about-vouch' },
  { name: 'Profile', icon: User, path: '/profile' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 ease-out' : 'opacity-0 pointer-events-none ease-in'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-vouch-light dark:bg-vouch-dark border-r border-gray-200/50 dark:border-gray-800 transition-all duration-500 transform lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <img
              src="/assets/vouch-logo.png"
              alt="Logo"
              className="w-14 h-14 object-contain scale-110"
            />
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Vouch</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${isActive
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={logout}
            className="flex items-center w-full gap-3 px-4 py-3 text-red-600 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
