import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getSession, getProfile, updateProfile, signIn, signUp, signOut, signInWithGoogle, signInWithMagicLink } from '../lib/supabase';
import Loader from '../components/ui/Loader';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [logoutInProgress, setLogoutInProgress] = useState(false);

  const fetchProfile = async (userId, authUser = null) => {
    try {
      let prof = await getProfile(userId);
      
      // Auto-create profile for Google/OAuth users who don't have one yet
      if (!prof && authUser) {
        const meta = authUser.user_metadata || {};
        const displayName = meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Vouch Member';
        const newProfile = {
          id: userId,
          name: displayName,
          institution: meta.organization || 'Vouch Global',
          role: 'Student',
          avatar_url: meta.avatar_url || meta.picture || null,
        };
        await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
        prof = newProfile;
      }
      
      setProfile(prof);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety fallback: if auth initialization takes too long, force it to finish
    // so the user isn't stuck on the loading screen forever.
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        console.warn("Auth initialization fallback triggered.");
        setLoading(false);
      }
    }, 5000);

    async function initializeAuth() {
      if (logoutInProgress) return;
      try {
        // Manually intercept the OAuth hash to guarantee session creation on slow or buggy clients
        if (window.location.hash.includes('access_token')) {
          console.log("Intercepting OAuth hash directly...");
          const hashStr = window.location.hash.substring(1);
          // Supabase uses & to separate hash params
          const params = new URLSearchParams(hashStr);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log("Manually setting session from hash tokens");
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (error) console.error("Manual setSession error:", error);
            
            // Clear the hash so we don't parse it again, but keep the path
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }

        const currentSession = await getSession();
        if (mounted) {
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            await fetchProfile(currentSession.user.id, currentSession.user);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) setAuthError(error.message);
      } finally {
        if (mounted) {
          // If URL has an access token, wait for onAuthStateChange to finish parsing it
          // before we turn off the loading screen and allow React Router to redirect.
          if (!window.location.hash.includes('access_token')) {
            setLoading(false);
          }
        }
      }
    }

    initializeAuth();

    const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id, currentSession.user);
        if (mounted) setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        if (mounted) setLoading(false);
      }
    });

    const subscription = data?.subscription;

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    const { user, session, error } = await signIn(email, password);
    if (error) throw error;
    
    setSession(session);
    setUser(user);
    if (user) {
      await fetchProfile(user.id, user);
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) throw error;
  };

  const loginWithMagicLink = async (email) => {
    const { error } = await signInWithMagicLink(email);
    if (error) throw error;
  };

  const register = async (email, password, name, institution) => {
    const { error } = await signUp(email, password, name, institution);
    if (error) throw error;
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("vouch_dark");
    if (saved !== null) return saved === "true";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("vouch_dark", isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const logout = async () => {
    console.log("Logout sequence initiated...");
    setLogoutInProgress(true);
    setLoading(true);
    
    try {
      // 1. Sign out from Supabase server with a 1.5s timeout safety
      const signOutPromise = supabase.auth.signOut({ scope: 'global' });
      const timeoutPromise = new Promise(res => setTimeout(() => res({ error: 'timeout' }), 1500));
      
      await Promise.race([signOutPromise, timeoutPromise]);
      console.log("Supabase signOut completed or timed out.");
    } catch (err) {
      console.warn('Supabase signOut error (continuing):', err);
    }

    // 2. Clear all React states immediately
    setSession(null);
    setUser(null);
    setProfile(null);
    console.log("Local state cleared.");

    // 3. Purge all storage
    try {
      const themePref = localStorage.getItem('vouch_dark');
      localStorage.clear();
      sessionStorage.clear();
      if (themePref) localStorage.setItem('vouch_dark', themePref);
      console.log("Storage cleared.");
    } catch (e) {
      console.error("Storage clear failed:", e);
    }

    // 4. Force a hard redirect
    console.log("Redirecting to login...");
    window.location.replace('/login');
    
    // Fallback redirect
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    authError,
    isAuthenticated: !!user,
    isDarkMode,
    toggleTheme,
    login,
    loginWithGoogle,
    loginWithMagicLink,
    register,
    logout,
    refreshProfile,
    setProfile
  };

  if (loading) {
    return <Loader />;
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-2xl border border-red-100 dark:border-red-900/30 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Auth Connection Error</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">{authError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-gray-900 dark:bg-gray-700 text-white font-black rounded-2xl hover:bg-black transition shadow-xl"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
