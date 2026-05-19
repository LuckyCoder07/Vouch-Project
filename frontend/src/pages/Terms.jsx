import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
        
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <ShieldCheck size={28} />
            </div>
            <span className="text-3xl font-black tracking-tighter">Vouch</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3">Terms of Service</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide">
            Last updated: May 2025
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-slate-800/50 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          
          <section className="space-y-2">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">Acceptance of Terms</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              By using Vouch, you agree to these terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">Permitted Use</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              Vouch is for legitimate authorship verification. Submitting code you did not write to fraudulently claim authorship is prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">Immutability</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              Submissions to the Vouch ledger are permanent and cannot be deleted. Do not submit sensitive or confidential code.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">Subscription and Billing</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              Paid plans are billed monthly via Stripe. Cancellations take effect at the end of the billing period. No refunds for partial months.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">Limitation of Liability</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              Vouch provides authorship timestamps as evidence, not legal proof. We are not responsible for institutional or legal decisions made based on Vouch certificates.
            </p>
          </section>

          <section className="space-y-2 border-t border-slate-100 dark:border-slate-700/80 pt-6">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">Contact</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              For legal questions: <a href="mailto:legal@getvouch.dev" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">legal@getvouch.dev</a>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-bold"
          >
            <ArrowLeft size={16} />
            <span>Back to Vouch</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
