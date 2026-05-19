import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // If supabase doesn't automatically handle the session from the URL hash,
    // we can still verify if there is an active session or a hash present.
    // Usually Supabase handles the `#access_token=` in the URL automatically.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !window.location.hash.includes('access_token')) {
        toast.error("Invalid or expired reset link.");
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success('Password updated successfully!');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-vouch-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Set New Password</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 text-center">
            Please enter your new password below.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex gap-3 text-red-600 dark:text-red-400 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="password" required placeholder="New Password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-vouch-500 outline-none transition-all"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="password" required placeholder="Confirm New Password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-vouch-500 outline-none transition-all"
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-3.5 mt-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-black text-sm flex items-center justify-center transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
