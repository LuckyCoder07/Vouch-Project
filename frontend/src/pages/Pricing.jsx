import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Check, 
  X, 
  Loader, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Settings,
  CreditCard
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Pricing() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // State variables
  const [isLoading, setIsLoading] = useState({ student: false, classroom: false });
  const [successMessage, setSuccessMessage] = useState(null);
  const [cancelMessage, setCancelMessage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [limitInfo, setLimitInfo] = useState(null);
  const [fetchingSub, setFetchingSub] = useState(false);
  const [cancellingSub, setCancellingSub] = useState(false);

  // Accordion state
  const [openFaq, setOpenFaq] = useState({
    0: false,
    1: false,
    2: false,
    3: false
  });

  const toggleFaq = (index) => {
    setOpenFaq(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // URL Params Check and subscription fetch on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setSuccessMessage("🎉 Subscription activated! Welcome to Vouch Pro.");
    }
    if (params.get("cancelled") === "true") {
      setCancelMessage("Checkout was cancelled. No charges were made.");
    }

    if (isAuthenticated && user?.id) {
      fetchUserSubscription();
    }
  }, [isAuthenticated, user]);

  const fetchUserSubscription = async () => {
    setFetchingSub(true);
    try {
      // 1. Fetch Subscription details
      const subRes = await fetch(`${API_URL}/api/payments/subscription?user_id=${user.id}`);
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }

      // 2. Fetch limit details
      const limitRes = await fetch(`${API_URL}/api/payments/limit-check?user_id=${user.id}`);
      if (limitRes.ok) {
        const limitData = await limitRes.json();
        setLimitInfo(limitData);
      }
    } catch (err) {
      console.error("Error fetching user pricing stats:", err);
    } finally {
      setFetchingSub(false);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/pricing`);
      return;
    }

    setIsLoading(prev => ({ ...prev, [plan]: true }));
    try {
      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email || "",
          name: user.user_metadata?.name || user.email?.split("@")[0] || "Vouch User",
          plan: plan
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Checkout creation failed");
      }

      const { checkout_url } = await response.json();
      if (checkout_url) {
        window.location.href = checkout_url;
      }
    } catch (err) {
      console.error("Checkout creation error:", err);
      toast.error(err.message || "Failed to create subscription session.");
    } finally {
      setIsLoading(prev => ({ ...prev, [plan]: false }));
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your Vouch subscription?")) {
      return;
    }

    setCancellingSub(true);
    try {
      const response = await fetch(`${API_URL}/api/payments/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to cancel subscription");
      }

      toast.success("Subscription successfully cancelled.");
      fetchUserSubscription(); // Refresh subscription state
    } catch (err) {
      console.error("Cancellation error:", err);
      toast.error(err.message || "Could not cancel subscription.");
    } finally {
      setCancellingSub(false);
    }
  };

  const remainingSubmissions = () => {
    if (!limitInfo) return 0;
    const rem = limitInfo.limit - limitInfo.count;
    return rem < 0 ? 0 : rem;
  };

  const isUnlimited = limitInfo?.limit > 9000;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-between overflow-x-hidden">
      
      <div className="max-w-5xl mx-auto w-full px-4 py-16">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-16">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-blue-500" />
            <span className="text-xl font-bold tracking-tight text-white">Vouch</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to home</span>
          </Link>
        </div>

        {/* URL Banners */}
        {successMessage && (
          <div className="mb-8 p-4 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <Check className="h-5 w-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {cancelMessage && (
          <div className="mb-8 p-4 bg-amber-950/60 border border-amber-500/30 text-amber-400 rounded-xl text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{cancelMessage}</span>
          </div>
        )}

        {/* Current Plan Banner */}
        {isAuthenticated && (subscription || limitInfo) && (
          <div className="mb-12 p-5 bg-blue-950/40 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-900/30 flex items-center justify-center text-blue-400 shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Your Subscription</p>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  You are currently on the <span className="text-blue-400 capitalize">{limitInfo?.plan || subscription?.plan || "Free"}</span> plan.
                  <span className="text-slate-300 font-normal block sm:inline sm:ml-2">
                    {isUnlimited 
                      ? `(${limitInfo?.count} submissions used this month)`
                      : `${remainingSubmissions()} submissions remaining this month.`
                    }
                  </span>
                </h4>
              </div>
            </div>
            
            {/* Manage Subscription Actions */}
            {(subscription?.plan === "student" || subscription?.plan === "classroom") && (
              <div>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancellingSub}
                  className="bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all flex items-center gap-2"
                >
                  {cancellingSub ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Cancel subscription</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Header Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Simple pricing
          </h1>
          <p className="text-slate-400 text-lg">
            Start free. No credit card required.
          </p>
        </div>

        {/* Billing Toggle (monthly only) */}
        <div className="flex flex-col items-center gap-2 mb-16">
          <div className="bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-300 tracking-wide">
            Monthly billing
          </div>
          <span className="text-[11px] text-slate-500">Annual plans coming soon — save 20%</span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-24">
          
          {/* Card 1: Free */}
          <div className="bg-slate-900/40 backdrop-blur border border-slate-850 hover:border-slate-800 rounded-3xl p-8 flex flex-col justify-between h-full transition-all">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Free</h3>
              <p className="text-xs text-slate-500 mb-6">Forever free</p>
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-extrabold text-white">₹0</span>
                <span className="text-slate-500 text-xs font-medium ml-1">/ month</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-400 mb-8 border-t border-slate-900 pt-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>25 submissions per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>SHA3-256 + ABT hashing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>PDF certificates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Public verification portal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>1 organization</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600 line-through">
                  <X className="h-4 w-4 shrink-0" />
                  <span>Batch ZIP upload</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600 line-through">
                  <X className="h-4 w-4 shrink-0" />
                  <span>API access</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600 line-through">
                  <X className="h-4 w-4 shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
            </div>
            <Link 
              to="/login?tab=signup" 
              className="block text-center w-full bg-slate-800 hover:bg-slate-750 text-white font-semibold py-3 rounded-xl border border-slate-700 transition-all"
            >
              Get started free
            </Link>
          </div>

          {/* Card 2: Student Pro (Highlighted) */}
          <div className="bg-slate-900 border-2 border-blue-500 rounded-3xl p-8 flex flex-col justify-between h-full relative shadow-[0_15px_40px_rgba(59,130,246,0.15)] md:scale-[1.03] z-10">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-4 py-1 rounded-full tracking-wider shadow-md">
              Most Popular
            </span>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Student Pro</h3>
              <p className="text-xs text-slate-400 mb-6">For serious students</p>
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-extrabold text-white">₹199</span>
                <span className="text-slate-500 text-xs font-medium ml-1">/ month</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-355 mb-8 border-t border-slate-800 pt-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Unlimited submissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>SHA3-256 + ABT hashing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>PDF certificates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Public verification portal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>5 organizations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Batch ZIP upload</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Email notifications</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>VS Code extension</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>GitHub integration</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600 line-through">
                  <X className="h-4 w-4 shrink-0" />
                  <span>API access</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600 line-through">
                  <X className="h-4 w-4 shrink-0" />
                  <span>Admin dashboard</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleSubscribe("student")}
              disabled={isLoading.student || isLoading.classroom}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              {isLoading.student ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Upgrade to Student Pro</span>
              )}
            </button>
          </div>

          {/* Card 3: Classroom */}
          <div className="bg-slate-900/40 backdrop-blur border border-slate-850 hover:border-slate-800 rounded-3xl p-8 flex flex-col justify-between h-full transition-all">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-bold text-white">Classroom</h3>
                <span className="bg-purple-950 border border-purple-500/30 text-purple-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  For Educators
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-6">For professors and teams</p>
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-extrabold text-white">₹2,999</span>
                <span className="text-slate-500 text-xs font-medium ml-1">/ month</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-400 mb-8 border-t border-slate-900 pt-6">
                <li className="flex items-center gap-2 font-medium text-slate-200">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Everything in Student Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>20 organizations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Up to 200 members per org</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Real-time classroom dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Plagiarism detection alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Assignment deadline management</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Leaderboard & gamification</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>API access (LMS integrations)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Signed export reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Priority email support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Blockchain anchor proof</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleSubscribe("classroom")}
              disabled={isLoading.student || isLoading.classroom}
              className="w-full bg-purple-650 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-600/10 flex items-center justify-center gap-2"
            >
              {isLoading.classroom ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Start Classroom Plan</span>
              )}
            </button>
          </div>

        </div>

        {/* Feature Comparison Table */}
        <div className="mb-24">
          <h2 className="text-2xl font-bold text-center text-white mb-10">Compare all features</h2>
          
          <div className="border border-slate-900 rounded-2xl overflow-hidden bg-slate-900/20 backdrop-blur">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-900">
                  <th className="p-4 font-semibold text-slate-400">Feature</th>
                  <th className="p-4 font-semibold text-slate-450">Free</th>
                  <th className="p-4 font-semibold text-slate-450">Student Pro</th>
                  <th className="p-4 font-semibold text-white bg-blue-950/20 border-x border-slate-900">Classroom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                <tr>
                  <td className="p-4 text-slate-300 font-medium">Monthly submissions</td>
                  <td className="p-4 text-slate-400">25</td>
                  <td className="p-4 text-slate-400">Unlimited</td>
                  <td className="p-4 text-slate-200 bg-blue-950/20 border-x border-slate-900">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">Organizations</td>
                  <td className="p-4 text-slate-400">1</td>
                  <td className="p-4 text-slate-400">5</td>
                  <td className="p-4 text-slate-200 bg-blue-950/20 border-x border-slate-900">20</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">PDF Certificates</td>
                  <td className="p-4"><Check className="h-4 w-4 text-emerald-500" /></td>
                  <td className="p-4"><Check className="h-4 w-4 text-emerald-500" /></td>
                  <td className="p-4 bg-blue-950/20 border-x border-slate-900"><Check className="h-4 w-4 text-emerald-500" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">ABT Hashing</td>
                  <td className="p-4"><Check className="h-4 w-4 text-emerald-500" /></td>
                  <td className="p-4"><Check className="h-4 w-4 text-emerald-500" /></td>
                  <td className="p-4 bg-blue-950/20 border-x border-slate-900"><Check className="h-4 w-4 text-emerald-500" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">Batch ZIP Upload</td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4"><Check className="h-4 w-4 text-emerald-500" /></td>
                  <td className="p-4 bg-blue-950/20 border-x border-slate-900"><Check className="h-4 w-4 text-emerald-500" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">VS Code Extension</td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4"><Check className="h-4 w-4 text-emerald-500" /></td>
                  <td className="p-4 bg-blue-950/20 border-x border-slate-900"><Check className="h-4 w-4 text-emerald-500" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">GitHub Integration</td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4"><Check className="h-4 w-4 text-emerald-500" /></td>
                  <td className="p-4 bg-blue-950/20 border-x border-slate-900"><Check className="h-4 w-4 text-emerald-500" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">API Access</td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4 bg-blue-950/20 border-x border-slate-900"><Check className="h-4 w-4 text-emerald-500" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">Plagiarism Detection</td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4 bg-blue-950/20 border-x border-slate-900"><Check className="h-4 w-4 text-emerald-500" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">Assignment Deadlines</td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4 bg-blue-950/20 border-x border-slate-900"><Check className="h-4 w-4 text-emerald-500" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">Real-time Dashboard</td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4 bg-blue-950/20 border-x border-slate-900"><Check className="h-4 w-4 text-emerald-500" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">Blockchain Anchoring</td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4"><Check className="h-4 w-4 text-emerald-500" /></td>
                  <td className="p-4 bg-blue-950/20 border-x border-slate-900"><Check className="h-4 w-4 text-emerald-500" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300 font-medium">Priority Support</td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4"><X className="h-4 w-4 text-slate-600" /></td>
                  <td className="p-4 bg-blue-950/20 border-x border-slate-900"><Check className="h-4 w-4 text-emerald-500" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-2xl font-bold text-center text-white mb-10">Frequently asked questions</h2>
          
          <div className="space-y-4 max-w-3xl mx-auto">
            
            {/* FAQ 1 */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleFaq(0)} 
                className="w-full p-5 text-left font-semibold text-white flex items-center justify-between gap-4"
              >
                <span>What payment methods do you accept?</span>
                {openFaq[0] ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>
              {openFaq[0] && (
                <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-slate-950 pt-3">
                  All major credit and debit cards via Stripe. UPI, NetBanking coming soon.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleFaq(1)} 
                className="w-full p-5 text-left font-semibold text-white flex items-center justify-between gap-4"
              >
                <span>Can I cancel anytime?</span>
                {openFaq[1] ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>
              {openFaq[1] && (
                <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-slate-950 pt-3">
                  Yes. Cancel from your Profile page or direct pricing banner anytime. You keep access to the paid features until the end of your active billing period.
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleFaq(2)} 
                className="w-full p-5 text-left font-semibold text-white flex items-center justify-between gap-4"
              >
                <span>Is there a free trial for paid plans?</span>
                {openFaq[2] ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>
              {openFaq[2] && (
                <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-slate-950 pt-3">
                  The free plan lets you explore all core features with 25 submissions per month. No trial or credit card needed to explore.
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleFaq(3)} 
                className="w-full p-5 text-left font-semibold text-white flex items-center justify-between gap-4"
              >
                <span>Do you offer educational discounts?</span>
                {openFaq[3] ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>
              {openFaq[3] && (
                <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-slate-950 pt-3">
                  Yes — institutions getting 10+ Classroom seats get 30% off. Email us at hello@getvouch.dev to request institutional billing.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      <footer className="text-center text-xs text-slate-600 py-8 border-t border-slate-900">
        © 2025 Vouch · Built with ♥ in India
      </footer>

    </div>
  );
}
