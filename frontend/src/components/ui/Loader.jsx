import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Loader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-vouch-light dark:bg-vouch-dark transition-colors duration-700 overflow-hidden">
      <div className="relative flex items-center justify-center">
        
        {/* Animated Outer Ring */}
        <div className="absolute w-48 h-48 md:w-64 md:h-64">
          <svg className="w-full h-full rotate-[-90deg]">
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="10 20"
              className="text-gray-200 dark:text-gray-800"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="url(#loaderGradient)"
              strokeWidth="2.5"
              strokeDasharray="100 300"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 400 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
            <defs>
              <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Pulse Ring */}
        <div className="absolute w-32 h-32 md:w-44 md:h-44 rounded-full border border-blue-500/10 dark:border-blue-400/10 animate-ping"></div>
        
        {/* Central Logo */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-40 h-40 md:w-52 md:h-52 flex items-center justify-center p-6"
        >
          <img 
            src="/assets/vouch-logo.png" 
            alt="Vouch Logo" 
            className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(37,99,235,0.2)] dark:invert-0"
          />
        </motion.div>

        {/* Bottom Label */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
           <span className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 dark:text-gray-500">Initializing Ledger</span>
           <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div 
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1 h-1 bg-blue-600 dark:bg-blue-500 rounded-full"
                ></motion.div>
              ))}
           </div>
        </motion.div>
      </div>
    </div>
  );
}
