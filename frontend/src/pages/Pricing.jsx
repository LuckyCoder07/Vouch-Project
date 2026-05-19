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
  CreditCard,
  CheckCircle2,
  Info
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
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans flex flex-col justify-between overflow-x-hidden transition-colors duration-300 select-text">
      
      <div className="max-w-5xl mx-auto w-full px-4 py-16 space-y-16">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between select-none">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-vouch-600" />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Vouch</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to home</span>
          </Link>
        </div>

        {/* SECTION 3 — Success/Cancel Banners */}
        {successMessage && (
          <div className="card p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-sm flex items-center gap-3 shadow-xs rounded-2xl select-none">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {cancelMessage && (
          <div className="card p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 text-sm flex items-center gap-3 shadow-xs rounded-2xl select-none">
            <Info className="h-5 w-5 shrink-0 text-amber-500" />
            <span className="font-semibold">{cancelMessage}</span>
          </div>
        )}

        {/* SECTION 1 — Header (text-center) */}
        <div className="text-center space-y-4">
          {isAuthenticated && subscription?.plan && subscription?.plan !== 'free' && (
            <div className="flex justify-center select-none">
              <span className="badge-green capitalize font-semibold px-3 py-1 rounded-full text-xs">
                You're on {subscription.plan} plan
              </span>
            </div>
          )}

          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Simple, honest pricing
          </h1>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            Start free. Pay when you need more.
          </p>

          {/* Submissions Limit usage card */}
          {limitInfo && (
            <div className="max-w-md mx-auto card p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-3 mt-6">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                <span>Monthly Usage</span>
                <span>{limitInfo.count ?? limitInfo.used} / {limitInfo.limit} submissions</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-vouch-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (((limitInfo.count ?? limitInfo.used) || 0) / limitInfo.limit) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 text-left">
                {isUnlimited 
                  ? "Unlimited high-speed structural notarizations active."
                  : `${remainingSubmissions()} free submissions left this cycle.`
                }
              </p>
            </div>
          )}
        </div>

        {/* SECTION 2 — Pricing Cards (3 cards in grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Card 1: Free */}
          <div className="card p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-full transition-all">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Free</h3>
              <p className="text-xs text-gray-400 mb-6">Forever free plan</p>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₹0</span>
                <span className="text-gray-500 text-xs font-medium ml-1">/month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-gray-655 dark:text-gray-400 mb-8 border-t border-gray-100 dark:border-gray-800/80 pt-6">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>25 submissions/month</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>1 organization</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>Public verification portal</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>PDF certificates</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>SHA3-256 + ABT hashing</span>
                </li>
              </ul>
            </div>
            
            {(!isAuthenticated) ? (
              <Link to="/login" className="btn-secondary w-full text-center py-3 text-xs font-bold">
                Get Started Free
              </Link>
            ) : (subscription?.plan === 'free' || limitInfo?.plan === 'free' || !subscription?.plan) ? (
              <button disabled className="btn-secondary w-full cursor-not-allowed opacity-60 flex items-center justify-center gap-2 py-3 text-xs font-bold">
                Current Plan
              </button>
            ) : (
              <button disabled className="btn-secondary w-full cursor-not-allowed opacity-60 py-3 text-xs font-bold">
                Free Tier
              </button>
            )}
          </div>

          {/* Card 2: Student Pro (Highlighted) */}
          <div className="card p-8 bg-white dark:bg-gray-900 border-2 border-vouch-600 ring-2 ring-vouch-600/20 shadow-md flex flex-col justify-between h-full relative z-10">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 badge-blue text-[10px] font-extrabold uppercase px-4 py-1.5 rounded-full tracking-wider shadow-sm select-none">
              Most Popular
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Student Pro</h3>
              <p className="text-xs text-gray-400 mb-6">For advanced software students</p>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₹199</span>
                <span className="text-gray-500 text-xs font-medium ml-1">/month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-gray-655 dark:text-gray-400 mb-8 border-t border-gray-100 dark:border-gray-800/80 pt-6">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-vouch-500 shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-white">Unlimited submissions</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-vouch-500 shrink-0" />
                  <span>5 organizations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-vouch-500 shrink-0" />
                  <span>Batch ZIP upload</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-vouch-500 shrink-0" />
                  <span>Priority email support</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-vouch-500 shrink-0" />
                  <span className="font-semibold text-vouch-600 dark:text-vouch-400">Everything in Free</span>
                </li>
              </ul>
            </div>
            
            {(subscription?.plan === 'student' || limitInfo?.plan === 'student') ? (
              <div className="space-y-3 w-full">
                <button disabled className="btn-primary w-full cursor-not-allowed flex items-center justify-center gap-2 py-3 text-xs font-bold select-none">
                  <Check className="w-4 h-4" />
                  <span>Current Plan</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={cancellingSub}
                  className="w-full text-center text-red-500 hover:text-red-650 transition text-xs font-semibold block"
                >
                  {cancellingSub ? "Cancelling..." : "Cancel subscription"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSubscribe('student')}
                disabled={isLoading.student || isLoading.classroom}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-xs font-bold"
              >
                {isLoading.student ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Upgrade to Pro</span>
                )}
              </button>
            )}
          </div>

          {/* Card 3: Classroom */}
          <div className="card p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-full transition-all">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Classroom</h3>
                <span className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 text-purple-650 dark:text-purple-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
                  For Educators
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-6">For institutions and cohorts</p>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₹2,999</span>
                <span className="text-gray-500 text-xs font-medium ml-1">/month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-gray-655 dark:text-gray-400 mb-8 border-t border-gray-100 dark:border-gray-800/80 pt-6">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-white">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                  <span>20 organizations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                  <span>Plagiarism detection</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                  <span>Assignment deadlines</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                  <span>Institution API access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                  <span>Leaderboard</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                  <span>Real-time activity feed</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                  <span>Signed export reports</span>
                </li>
              </ul>
            </div>

            {(subscription?.plan === 'classroom' || limitInfo?.plan === 'classroom') ? (
              <button disabled className="btn-primary w-full cursor-not-allowed flex items-center justify-center gap-2 py-3 text-xs font-bold select-none">
                <Check className="w-4 h-4" />
                <span>Current Plan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubscribe('classroom')}
                disabled={isLoading.student || isLoading.classroom}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-xs font-bold"
              >
                {isLoading.classroom ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Upgrade to Classroom</span>
                )}
              </button>
            )}
          </div>

        </div>

        {/* SECTION 4 — FAQ Accordion */}
        <div className="space-y-8 select-none">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
          
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                q: "What payment methods do you accept?",
                a: "All major credit and debit cards via Stripe. UPI, NetBanking coming soon."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel from your Profile page or direct pricing banner anytime. You keep access to the paid features until the end of your active billing period."
              },
              {
                q: "Is there a free trial for paid plans?",
                a: "The free plan lets you explore all core features with 25 submissions per month. No trial or credit card needed to explore."
              },
              {
                q: "Do you offer educational discounts?",
                a: "Yes — institutions getting 10+ Classroom seats get 30% off. Email us at hello@getvouch.dev to request institutional billing."
              }
            ].map((faq, index) => {
              const isOpen = openFaq[index];
              return (
                <div key={index} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
                  <button 
                    type="button"
                    onClick={() => toggleFaq(index)} 
                    className="w-full p-5 text-left font-bold text-gray-900 dark:text-white flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="text-sm text-gray-500 px-5 pb-5 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 5 — Bottom CTA */}
        <div className="text-center space-y-2 py-8 border-t border-gray-100 dark:border-gray-800/80">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Still have questions?</h3>
          <p className="text-sm text-gray-500">
            Email us at{' '}
            <a href="mailto:lakshit0507@gmail.com" className="text-vouch-600 font-bold hover:underline">
              lakshit0507@gmail.com
            </a>
          </p>
        </div>

      </div>

      <footer className="text-center text-xs text-gray-450 dark:text-gray-500 py-8 border-t border-gray-150 dark:border-gray-850 bg-white dark:bg-gray-900/50">
        © 2026 Vouch · Built with ♥ in India
      </footer>

    </div>
  );
}
