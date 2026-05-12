import { useState, useEffect } from "react";
import { LogIn, ShieldCheck, Sun, Moon, Loader2, AlertCircle, UserPlus, ArrowRight, Code, Lock, Globe, Building, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const toggleTheme = () => {
    const isDark = !isDarkMode;
    setIsDarkMode(isDark);
    localStorage.setItem("vouch_dark", isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setError("");
    setSuccess(false);
  }, [authMode]);

  const validateEmail = (e) => {
    return String(e).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateEmail(email)) return setError("Invalid email format.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Sign in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || "Google sign in failed.");
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim()) return setError("Please enter your full name.");
    if (!validateEmail(email)) return setError("Invalid email format.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (!institution.trim()) return setError("Please enter your institution.");

    setIsLoading(true);
    try {
      await register(email, password, name, institution);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-vouch-light dark:bg-vouch-dark transition-all duration-700 font-sans">
      {/* Theme Toggle Button - Floating */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white/50 dark:bg-vouch-dark/50 backdrop-blur-xl border border-white dark:border-gray-800 hover:scale-110 transition-all duration-500 text-gray-600 dark:text-gray-300 shadow-xl"
        >
          {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-600" />}
        </button>
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 flex-col justify-center px-16 xl:px-24 relative overflow-hidden text-white">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 blur-[120px] rounded-full"></div>
        </div>

        <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="mb-12 text-center lg:text-left">
            <div className="w-32 h-32 rounded-full bg-gray-800/40 backdrop-blur-sm flex items-center justify-center mb-10 group hover:bg-purple-600/20 transition-all duration-700 border border-gray-700/50 hover:border-purple-500/50 shadow-2xl hover:shadow-purple-500/40 mx-auto lg:mx-0">
              <img
                src="/assets/vouch-logo.png"
                alt="Vouch Logo"
                className="w-24 h-24 object-contain invert opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500"
              />
            </div>

            <h1 className="text-6xl font-black tracking-tighter text-white mb-5">Vouch</h1>
            <h2 className="text-3xl xl:text-4xl font-black tracking-tight mb-6 text-white leading-tight">
              Blockchain powered<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Digital Notary</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-md leading-relaxed">
              Secure your intellectual property using military-grade SHA-256 hashing and immutable distributed ledgers.
            </p>
          </div>

          <div className="space-y-6 mt-12 hidden xl:block">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-gray-800 rounded-xl text-blue-400 shrink-0"><Code size={20} /></div>
              <div>
                <h3 className="font-bold text-gray-200">Code Verification</h3>
                <p className="text-sm text-gray-500 mt-1">Authenticity checks across codebases</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-gray-800 rounded-xl text-indigo-400 shrink-0"><ShieldCheck size={20} /></div>
              <div>
                <h3 className="font-bold text-gray-200">IP Protection</h3>
                <p className="text-sm text-gray-500 mt-1">Defend your digital assets proactively</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Authentication */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-transparent lg:bg-white/70 lg:dark:bg-vouch-dark/40 lg:backdrop-blur-2xl lg:rounded-[2.5rem] lg:shadow-3xl lg:p-10 lg:border lg:border-white lg:dark:border-gray-800 transition-all duration-700 animate-in fade-in slide-in-from-bottom-6">
          
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="mb-4 lg:hidden flex items-center justify-center -ml-2">
              <img src="/assets/vouch-logo.png" alt="Vouch Logo" className="w-16 h-16 object-contain dark:invert" />
              <span className="text-3xl font-black tracking-tighter leading-none text-gray-900 dark:text-white -ml-2 mt-2">Vouch</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex mb-8 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setAuthMode("signin")}
              className={`flex-1 pb-3 text-center text-sm font-black uppercase tracking-widest transition-colors ${
                authMode === "signin" 
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode("signup")}
              className={`flex-1 pb-3 text-center text-sm font-black uppercase tracking-widest transition-colors ${
                authMode === "signup" 
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 p-4 bg-red-50 dark:bg-red-900/15 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl animate-in zoom-in duration-200">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2.5 p-4 bg-green-50 dark:bg-green-900/15 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30 rounded-2xl animate-in zoom-in duration-200">
              <CheckCircle size={18} className="shrink-0" />
              <p className="text-xs font-bold leading-tight">Check your email to confirm your account!</p>
            </div>
          )}

          {authMode === "signin" && (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-300 group shadow-sm mb-6 active:scale-[0.98]"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Sign in with Google</span>
            </button>
          )}

          <form onSubmit={authMode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
            
            {authMode === "signup" && (
              <>
                <div className="space-y-1.5 animate-in fade-in zoom-in duration-300">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700/40 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all dark:text-white text-sm font-bold"
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1.5 animate-in fade-in zoom-in duration-300">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Institution/Company</label>
                  <div className="relative">
                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      required
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full pl-12 pr-5 py-3.5 bg-gray-50 dark:bg-gray-700/40 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all dark:text-white text-sm font-bold"
                      placeholder="University / Organization"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700/40 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all dark:text-white text-sm font-bold"
                placeholder="name@vouch.app"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700/40 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all dark:text-white text-sm font-bold"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            {authMode === "signup" && (
              <div className="space-y-1.5 animate-in fade-in zoom-in duration-300">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700/40 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all dark:text-white text-sm font-bold"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-3 text-white py-4 rounded-2xl font-black text-sm transition-all duration-300 shadow-xl mt-6
                ${authMode === "signin" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25"} 
                disabled:opacity-70 disabled:cursor-wait group active:scale-[0.98]`}
            >
              {isLoading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  {authMode === "signin" ? <LogIn size={18} /> : <UserPlus size={18} />}
                  <span>{authMode === "signin" ? "Sign In to Vouch" : "Register Account"}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Secured by Vouch Ledger</p>
            <div className="flex justify-center gap-6 text-gray-300 dark:text-gray-600">
              <ShieldCheck size={20} />
              <Lock size={20} />
              <Globe size={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
