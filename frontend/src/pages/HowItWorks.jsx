import React, { useState } from 'react';
import { 
  Cpu, 
  Database, 
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const steps = [
  {
    title: 'Code Normalization',
    description: 'Our backend strips all comments, docstrings, and redundant whitespace from your files. This ensures that the generated hash represents your pure logic, not just your formatting style.',
    icon: ShieldCheck,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    docPath: '/docs/code-normalization'
  },
  {
    title: 'Cryptographic Hashing',
    description: 'The normalized code is processed through SHA-256 to create a unique fingerprint that changes if even a single character of logic is altered.',
    icon: Cpu,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    docPath: '/docs/cryptographic-hashing'
  },
  {
    title: 'Immutable Ledger',
    description: 'Every submission is permanently appended to a Google Sheets ledger with your name, filename, hash, and timestamp. Records can never be deleted or modified.',
    icon: Database,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    docPath: '/docs/immutable-ledger'
  }
];

const SCAN_STEPS = [
  { label: "INITIALIZING VOUCH PROTOCOL", icon: "▶️", duration: 600 },
  { label: "STRIPPING COMMENTS & WHITESPACE", icon: "✂", duration: 800 },
  { label: "VERIFYING SOURCE INTEGRITY", icon: "⬡", duration: 1000 },
  { label: "STABILIZING CONTENT STRUCTURE", icon: "⟳", duration: 900 },
  { label: "GENERATING UNIQUE FINGERPRINT", icon: "◈", duration: 700 },
  { label: "COMPUTING SECURE HASH (SHA-256)", icon: "⬛", duration: 500 },
  { label: "CONNECTING TO PUBLIC LEDGER", icon: "✓", duration: 400 },
];

const faqs = [
  {
    question: "What happens if I change a comment?",
    answer: "Nothing! Our backend normalizes your code by removing all comments and docstrings before hashing it. This means you can add, remove, or edit comments without changing the file's cryptographically secure fingerprint."
  },
  {
    question: "Can I submit the same file twice?",
    answer: "No. If a file (or a file with identical logic but different comments) has already been hashed and submitted to the ledger, the backend will automatically reject it as a hash collision and display the name of the original owner."
  },
  {
    question: "How do I get my certificate?",
    answer: "Upon successful verified upload to the ledger, a 'Download Certificate' button will immediately appear giving you a watermarked PDF. You can also re-download it anytime by using the Verify tab with your original file."
  },
  {
    question: "How does Vouch integrate with VS Code?",
    answer: "You can install our native VS Code Extension to 'Notarize Current File' with a single keyboard shortcut right from your editor. It uses an encrypted API key linked to your account, skipping the web dashboard completely."
  },
  {
    question: "Is my source code stored on your servers?",
    answer: "No. Your raw source code is stored only in temporary memory during the hash generation phase. Once the SHA3-256 hash is computed, the code is immediately discarded. Only the structural fingerprint and your name are recorded on the public ledger."
  },
  {
    question: "How does V-Score work?",
    answer: "Your V-Score builds your reputation. You earn 100 points for every unique file notarized, plus a 25-point 'Aging Bonus' for files on the ledger longer than 30 days. Higher V-Scores signify higher trust and long-term ownership of robust code logic."
  }
];

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4 pt-6">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">The Vouch Engine</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
          Understand the multi-layer security architecture that makes Vouch the definitive standard for code notarization.
        </p>
      </div>

      {/* Steps Visual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        <div className="hidden md:block absolute top-[45%] left-10 right-10 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 dark:from-blue-900/50 dark:via-indigo-900/50 dark:to-purple-900/50 -translate-y-1/2 z-0"></div>
        {steps.map((step, idx) => (
          <div key={idx} className="relative z-10 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-xl shadow-blue-900/5 transition-transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/10 duration-300">
            <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
              <step.icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 font-medium">{step.description}</p>
            <button 
              onClick={() => navigate(step.docPath)}
              className="flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group transition-colors"
            >
              Read Technical Docs <ChevronRight size={16} className="ml-1 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Feature Callout */}
      <div 
        className="bg-gray-900 rounded-[2.5rem] p-10 md:p-14 overflow-hidden relative shadow-2xl"
        style={{
          backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(37, 99, 235, 0.15) 0%, transparent 40%)'
        }}
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
              <ShieldCheck size={16} className="mr-2" /> Server-Side Authority
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">Trust, but re-verify.</h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              Vouch never trusts hashes sent from the client. Every upload is re-hashed server-side in an isolated Python environment to prevent spoofing of pre-computed hashes.
            </p>
            <ul className="space-y-4 pt-4">
              <li className="flex items-center text-gray-300 font-medium">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-4 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div> 
                Code is sanitised to remove comments and whitespace for logic comparison
              </li>
              <li className="flex items-center text-gray-300 font-medium">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-4 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div> 
                Duplicate submissions automatically rejected
              </li>
              <li className="flex items-center text-gray-300 font-medium">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-4 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div> 
                PDF certificate issued on every verified submission
              </li>
            </ul>
          </div>
          <div className="relative h-64 lg:h-full bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700/50 flex items-center justify-center p-8 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-purple-600/5"></div>
            <div className="text-center space-y-5 relative z-10 w-full max-w-xs">
               <div className="inline-block p-5 bg-gray-700/50 rounded-2xl mb-2 backdrop-blur-md border border-gray-600/50 shadow-xl group-hover:scale-110 transition-transform duration-500">
                 <Database size={48} className="text-blue-400" />
               </div>
               <p className="text-xs font-mono text-gray-400 tracking-wider">vouch_ledger.gsheet</p>
               <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                 <div className="h-full bg-blue-500 w-2/3 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="max-w-3xl mx-auto pt-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-200"
            >
              <button 
                onClick={() => toggleFaq(idx)}
                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
              >
                <span className="font-bold text-gray-900 dark:text-white">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-50 dark:border-gray-700/30 pt-4">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link 
            to="/know-about-vouch"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:scale-105 transition shadow-xl"
          >
            Explore Complete Knowledge Base <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Have more questions? Visit our <strong>Know About Vouch</strong> portal.
          </p>
        </div>
      </div>

    </div>
  );
}
