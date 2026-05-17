import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              layout
              className={`relative overflow-hidden flex items-start gap-3 min-w-[320px] max-w-md p-4 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto border
                ${toast.type === 'success' ? 'bg-green-50/90 border-green-200 dark:bg-green-900/30 dark:border-green-800/50 text-green-800 dark:text-green-300' : ''}
                ${toast.type === 'error' ? 'bg-red-50/90 border-red-200 dark:bg-red-900/30 dark:border-red-800/50 text-red-800 dark:text-red-300' : ''}
                ${toast.type === 'warning' ? 'bg-orange-50/90 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800/50 text-orange-800 dark:text-orange-300' : ''}
                ${toast.type === 'info' ? 'bg-blue-50/90 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50 text-blue-800 dark:text-blue-300' : ''}
              `}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle size={22} className="text-green-500 dark:text-green-400" />}
                {toast.type === 'error' && <XCircle size={22} className="text-red-500 dark:text-red-400" />}
                {toast.type === 'warning' && <AlertTriangle size={22} className="text-orange-500 dark:text-orange-400" />}
                {toast.type === 'info' && <Info size={22} className="text-blue-500 dark:text-blue-400" />}
              </div>
              
              <p className="text-sm font-semibold flex-1 leading-snug">{toast.message}</p>
              
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 -mt-1 -mr-1"
              >
                <X size={16} className="opacity-70" />
              </button>

              {/* Progress Bar Indicator */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-1 
                  ${toast.type === 'success' ? 'bg-green-500/50' : ''}
                  ${toast.type === 'error' ? 'bg-red-500/50' : ''}
                  ${toast.type === 'warning' ? 'bg-orange-500/50' : ''}
                  ${toast.type === 'info' ? 'bg-blue-500/50' : ''}
                `}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
