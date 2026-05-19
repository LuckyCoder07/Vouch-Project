import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Privacy() {
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
          <h1 className="text-3xl font-black tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide">
            Last updated: May 2025
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-slate-800/50 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          
          <section className="space-y-2">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">Information We Collect</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              We collect your email address, name, and institution when you register. We collect the structural hash (not the source code itself) of files you submit. We do not store your original source code on our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">How We Use Your Information</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              Your email is used to send submission confirmations and certificate PDFs. Your name appears on certificates you generate. Structural hashes are stored permanently in our immutable ledger.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">Data Storage</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              Your account data is stored in Supabase (PostgreSQL). Submission records are stored permanently as they form the immutable ledger. Blockchain anchor data is stored publicly on the Polygon Amoy network.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">Third-Party Services</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              We use Supabase for authentication and database, Resend for email delivery, Stripe for payment processing, and Alchemy for blockchain RPC access. Each has their own privacy policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">Your Rights</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              You can request deletion of your account and profile data at any time by emailing privacy@getvouch.dev. Note: submission records in the immutable ledger cannot be deleted by design.
            </p>
          </section>

          <section className="space-y-2 border-t border-slate-100 dark:border-slate-700/80 pt-6">
            <h2 className="text-xl font-black text-slate-850 dark:text-white">Contact</h2>
            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed">
              For privacy concerns: <a href="mailto:privacy@getvouch.dev" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">privacy@getvouch.dev</a>
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
