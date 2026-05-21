import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Link2, Clock, Mail, Lock, User, 
  Building, AlertCircle, ArrowLeft, CheckCircle, Loader2, Github
} from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState('signin'); // 'signin', 'signup', 'forgot'
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Status States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200 dark:bg-gray-800' };
    if (pwd.length < 6 || /^[a-zA-Z]+$/.test(pwd)) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (pwd.length >= 8 && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) return { score: 3, label: 'Strong', color: 'bg-green-500' };
    return { score: 2, label: 'Fair', color: 'bg-orange-500' };
  };
  const strength = getPasswordStrength(password);

  // Reset messages on mode switch
  useEffect(() => {
    setError('');
    setSuccessMsg('');
  }, [authMode]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (!agreedToTerms) return setError('You must agree to the Terms of Service');
    
    setIsLoading(true);
    try {
      await register(email, password, name, institution);
      setSuccessMsg('Check your email to confirm your account');
      // Clear form
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email) return setError('Please enter your email address');
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccessMsg('Check your email for a reset link');
    } catch (err) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Google Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'GitHub Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen flex overflow-hidden font-sans bg-white dark:bg-gray-950">
      
      {/* LEFT HALF (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col relative w-1/2 bg-gray-950 overflow-hidden shrink-0">
        
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600 blur-3xl opacity-20 rounded-full mix-blend-screen"
            style={{ animation: 'orb-float 15s ease-in-out infinite alternate' }}
          />
          <div 
            className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-purple-600 blur-3xl opacity-20 rounded-full mix-blend-screen"
            style={{ animation: 'orb-float 20s ease-in-out infinite alternate-reverse' }}
          />
        </div>
        
        {/* CSS for custom animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes orb-float {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(10%, 10%) scale(1.1); }
          }
        `}} />

        <div className="relative z-10 p-12 h-full flex flex-col">
          {/* Top */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">Vouch</span>
          </div>

          {/* Middle */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tighter mb-6">
              Your code.<br/>
              Your proof.<br/>
              Forever.
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-10 font-medium">
              The immutable notary system for students and developers. Prove authorship. Prevent plagiarism.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-gray-200">Cryptographically signed</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Link2 className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-gray-200">Blockchain anchored</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-gray-200">Timestamped forever</span>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-auto pt-12">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Trusted by students at</p>
            <div className="flex gap-4 opacity-50">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 w-24 rounded-lg bg-gray-800" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT HALF (Forms) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white dark:bg-gray-900 relative">
        <div className="w-full max-w-sm mx-auto">
          
          <AnimatePresence mode="wait">
            
            {/* --- SIGN IN & SIGN UP --- */}
            {authMode !== 'forgot' && (
              <motion.div
                key="main-auth"
                initial="initial" animate="animate" exit="exit"
                variants={slideVariants}
                transition={{ duration: 0.3 }}
              >
                {/* Mobile Logo */}
                <div className="lg:hidden flex justify-center mb-8">
                  <div className="w-12 h-12 rounded-xl bg-vouch-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    {authMode === 'signin' ? 'Welcome back' : 'Create an account'}
                  </h2>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {authMode === 'signin' 
                      ? 'Enter your details to access your workspace.' 
                      : 'Join the decentralized ledger network today.'}
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex relative mb-8 border-b border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setAuthMode('signin')}
                    className={`flex-1 pb-3 text-sm font-bold transition-colors ${authMode === 'signin' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 pb-3 text-sm font-bold transition-colors ${authMode === 'signup' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
                  >
                    Create Account
                  </button>
                  
                  {/* Animated Underline */}
                  <div 
                    className="absolute bottom-0 h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ease-out"
                    style={{ 
                      width: '50%', 
                      left: authMode === 'signin' ? '0%' : '50%' 
                    }}
                  />
                </div>

                {/* Alerts */}
                {error && (
                  <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex gap-3 text-red-600 dark:text-red-400 items-start">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-6 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 flex gap-3 text-green-600 dark:text-green-400 items-start">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{successMsg}</p>
                      {authMode === 'signup' && (
                        <button className="mt-2 text-xs font-black uppercase tracking-wider hover:underline opacity-80">
                          Resend Email
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Sign In Form */}
                {authMode === 'signin' && (
                  <>
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="email" required placeholder="Email address"
                          value={email} onChange={e => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-vouch-500 outline-none transition-all"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input 
                            type="password" required placeholder="Password"
                            value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-vouch-500 outline-none transition-all"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button type="button" onClick={() => setAuthMode('forgot')} className="text-xs font-bold text-vouch-600 dark:text-vouch-400 hover:underline">
                            Forgot password?
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit" disabled={isLoading}
                        className="w-full py-3.5 mt-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-black text-sm flex items-center justify-center transition-all disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                      </button>
                    </form>

                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800" /></div>
                      <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-900 px-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider">Or continue with</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button" onClick={handleGoogleLogin} disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-xs font-black text-gray-700 dark:text-gray-300 transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.78-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.5z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.08 1.16-3.15 0-5.81-2.13-6.76-4.99H1.26v3.12C3.24 22.28 7.37 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.24 14.24a7.15 7.15 0 0 1 0-4.48V6.64H1.26a11.97 11.97 0 0 0 0 10.72l3.98-3.12z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.37 0 3.24 1.72 1.26 4.64l3.98 3.12c.95-2.86 3.61-4.99 6.76-4.99z"/>
                        </svg>
                        Google
                      </button>
                      <button 
                        type="button" onClick={handleGithubLogin} disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-xs font-black text-gray-700 dark:text-gray-300 transition-all shadow-sm"
                      >
                        <Github className="w-4 h-4 text-gray-900 dark:text-white" />
                        GitHub
                      </button>
                    </div>
                  </>
                )}

                {/* Sign Up Form */}
                {authMode === 'signup' && (
                  <>
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" required placeholder="Full Name"
                          value={name} onChange={e => setName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-vouch-500 outline-none transition-all"
                        />
                      </div>
                      
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" required placeholder="Institution"
                          value={institution} onChange={e => setInstitution(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-vouch-500 outline-none transition-all"
                        />
                      </div>
                      
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="email" required placeholder="Email address"
                          value={email} onChange={e => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-vouch-500 outline-none transition-all"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input 
                            type="password" required placeholder="Password"
                            value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-vouch-500 outline-none transition-all"
                          />
                        </div>
                        
                        {/* Strength Indicator */}
                        {password.length > 0 && (
                          <div className="px-1 flex items-center justify-between gap-3">
                            <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                              {[1, 2, 3].map(i => (
                                <div 
                                  key={i} 
                                  className={`h-full flex-1 transition-colors duration-300 ${strength.score >= i ? strength.color : 'bg-transparent'}`} 
                                />
                              ))}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                              strength.score === 1 ? 'text-red-500' : strength.score === 2 ? 'text-orange-500' : 'text-green-500'
                            }`}>{strength.label}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="password" required placeholder="Confirm Password"
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-vouch-500 outline-none transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input 
                          type="checkbox" id="terms"
                          checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <label htmlFor="terms" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          I agree to the <a href="#" className="text-gray-900 dark:text-white hover:underline">Terms of Service</a> and <a href="#" className="text-gray-900 dark:text-white hover:underline">Privacy Policy</a>
                        </label>
                      </div>

                      <button 
                        type="submit" disabled={isLoading}
                        className="w-full py-3.5 mt-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-black text-sm flex items-center justify-center transition-all disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                      </button>
                    </form>

                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800" /></div>
                      <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-900 px-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider">Or continue with</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button" onClick={handleGoogleLogin} disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-xs font-black text-gray-700 dark:text-gray-300 transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.78-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.5z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.08 1.16-3.15 0-5.81-2.13-6.76-4.99H1.26v3.12C3.24 22.28 7.37 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.24 14.24a7.15 7.15 0 0 1 0-4.48V6.64H1.26a11.97 11.97 0 0 0 0 10.72l3.98-3.12z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.37 0 3.24 1.72 1.26 4.64l3.98 3.12c.95-2.86 3.61-4.99 6.76-4.99z"/>
                        </svg>
                        Google
                      </button>
                      <button 
                        type="button" onClick={handleGithubLogin} disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-xs font-black text-gray-700 dark:text-gray-300 transition-all shadow-sm"
                      >
                        <Github className="w-4 h-4 text-gray-900 dark:text-white" />
                        GitHub
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* --- FORGOT PASSWORD --- */}
            {authMode === 'forgot' && (
              <motion.div
                key="forgot-auth"
                initial="initial" animate="animate" exit="exit"
                variants={slideVariants}
                transition={{ duration: 0.3 }}
              >
                <button 
                  onClick={() => setAuthMode('signin')}
                  className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="mb-8">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Reset Password</h2>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Enter your email and we'll send you a secure link to reset your password.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex gap-3 text-red-600 dark:text-red-400 items-start">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 flex flex-col items-center justify-center text-center">
                    <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">{successMsg}</p>
                  </div>
                )}

                {!successMsg && (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="email" required placeholder="Email address"
                        value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-vouch-500 outline-none transition-all"
                      />
                    </div>
                    
                    <button 
                      type="submit" disabled={isLoading}
                      className="w-full py-3.5 mt-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-black text-sm flex items-center justify-center transition-all disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
