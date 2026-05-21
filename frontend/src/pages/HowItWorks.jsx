import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FileCode2, Hash, Database, Link2, ShieldCheck, FileCheck, 
  ChevronRight, ChevronDown, Eye, CheckCircle, UploadCloud, Code2, Key
} from 'lucide-react';
import { Button } from '../components/ui';

// ─── REUSABLE FADE-IN SECTION COMPONENT ───
const FadeInSection = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── TYPEWRITER CODE DEMO ───
const TypewriterCode = () => {
  const code = `def calculate_grade(score):
    # Calculate final letter grade
    if score >= 90:
        return 'A'
    return 'B'`;
  const [text, setText] = useState('');
  const [trigger, setTrigger] = useState(0);
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(code.slice(0, i + 1));
      i++;
      if (i >= code.length) {
        clearInterval(interval);
        setTimeout(() => {
          setText('');
          setTrigger(prev => prev + 1);
        }, 5000);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [trigger]);

  return (
    <pre className="bg-gray-900 text-blue-400 font-mono text-xs p-6 rounded-2xl overflow-x-auto h-40 leading-relaxed border border-gray-800 shadow-inner">
      <code>{text}</code>
      <span className="w-1.5 h-3 bg-blue-400 ml-0.5 inline-block animate-pulse" />
    </pre>
  );
};

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: "What if I change a comment in my code?",
      a: "Comments are stripped before hashing. Adding or changing comments does not affect your structural hash. Only changes to the actual logic will."
    },
    {
      q: "Can two students submit the same code?",
      a: "If two students submit code with identical logical structure, both are recorded but a plagiarism flag is raised for your instructor to review."
    },
    {
      q: "How do I prove ownership to someone else?",
      a: "Share your verification code (VCH-XXXX-XXXX). They can verify it at getvouch.dev/verify with no account needed."
    },
    {
      q: "Is my code stored on the blockchain?",
      a: "No. Only a cryptographic Merkle root of all submission hashes is stored on-chain. Your actual code never leaves our servers."
    },
    {
      q: "What languages are supported?",
      a: "Python (.py) with full AST normalization. Java (.java) and C++ (.cpp) with regex-based structural normalization. Plain text (.txt) with comment stripping."
    },
    {
      q: "How is this different from Git timestamps?",
      a: "Git timestamps can be manipulated. Vouch's ledger is append-only and blockchain-anchored, making the timestamp independently verifiable and tamper-evident."
    }
  ];

  return (
    <div className="font-sans bg-white dark:bg-gray-950 min-h-screen pb-20 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-20">
        
        {/* SECTION 1 — Hero */}
        <FadeInSection className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            How Vouch Works
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
            From source code to blockchain — the complete technical picture.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="badge-blue text-xs font-bold py-1 px-3 rounded-full">
              SHA3-256 Hashing
            </span>
            <span className="badge-green text-xs font-bold py-1 px-3 rounded-full">
              Polygon Amoy Anchoring
            </span>
          </div>
        </FadeInSection>

        {/* SECTION 2 — The 4-Step Pipeline (visual stepper) */}
        <FadeInSection className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              The 4-Step Pipeline
            </h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              How your code is normalized, structured, and certified.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-3">
            {/* Step 1 — Upload */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 text-center space-y-4 shadow-sm">
              <span className="text-xs font-black text-vouch-600 dark:text-vouch-400 block">01</span>
              <div className="w-12 h-12 rounded-2xl bg-vouch-50 dark:bg-vouch-950/20 text-vouch-600 dark:text-vouch-400 flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Upload</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Submit your .py, .java, .cpp, or .txt file via the dashboard or VS Code extension.
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-gray-300 dark:text-gray-700 shrink-0">
              <ChevronRight className="w-6 h-6" />
            </div>

            {/* Step 2 — Normalize */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 text-center space-y-4 shadow-sm">
              <span className="text-xs font-black text-vouch-600 dark:text-vouch-400 block">02</span>
              <div className="w-12 h-12 rounded-2xl bg-vouch-50 dark:bg-vouch-950/20 text-vouch-600 dark:text-vouch-400 flex items-center justify-center mx-auto">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Normalize</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Python files are parsed via Python's ast module into an Abstract Behavior Tree. Comments and variable names are normalized.
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-gray-300 dark:text-gray-700 shrink-0">
              <ChevronRight className="w-6 h-6" />
            </div>

            {/* Step 3 — Hash */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 text-center space-y-4 shadow-sm">
              <span className="text-xs font-black text-vouch-600 dark:text-vouch-400 block">03</span>
              <div className="w-12 h-12 rounded-2xl bg-vouch-50 dark:bg-vouch-950/20 text-vouch-600 dark:text-vouch-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Hash</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                The canonical representation is hashed with SHA3-256, producing a deterministic structural fingerprint.
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-gray-300 dark:text-gray-700 shrink-0">
              <ChevronRight className="w-6 h-6" />
            </div>

            {/* Step 4 — Anchor */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 text-center space-y-4 shadow-sm">
              <span className="text-xs font-black text-vouch-600 dark:text-vouch-400 block">04</span>
              <div className="w-12 h-12 rounded-2xl bg-vouch-50 dark:bg-vouch-950/20 text-vouch-600 dark:text-vouch-400 flex items-center justify-center mx-auto">
                <Link2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Anchor</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Every 24 hours, unanchored hashes are collected into a Merkle tree and the root is written to Polygon Amoy.
              </p>
            </div>
          </div>
        </FadeInSection>

        {/* SECTION 3 — Live Code Demo */}
        <FadeInSection className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AST Normalization Demo
            </h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              See how source code logic is converted to abstract syntax mappings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Original Code
              </h3>
              <TypewriterCode />
            </div>

            <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                After ABT Normalization
              </h3>
              <pre className="bg-gray-900 text-green-400 font-mono text-xs p-6 rounded-2xl overflow-x-auto h-40 leading-relaxed border border-gray-800 shadow-inner">
{`Module(body=[
  Assign(targets=[Name(id='var_0')],
    value=Constant(value=10)),
  Assign(targets=[Name(id='var_1')],
    value=Constant(value=10))
])`}
              </pre>
            </div>
          </div>

          <div className="card p-4 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="badge-green text-xs font-semibold px-3 py-1">
              Same Structural Hash
            </span>
            <code className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
              sha3_256: 7f83b162...89ae21d9
            </code>
          </div>
        </FadeInSection>

        {/* SECTION 4 — Trust & Security */}
        <FadeInSection className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Trust & Security Architecture
            </h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              Vouch runs on secure open infrastructure and military-grade cryptography.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 dark:text-white">RSA Signing</h3>
                <p className="text-xs uppercase font-bold text-gray-400 tracking-wider">RSA-PSS-SHA256</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Every certificate is signed with Vouch's private key. Public key on GitHub for independent verification.
              </p>
            </div>

            <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                <Link2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 dark:text-white">Blockchain Proof</h3>
                <p className="text-xs uppercase font-bold text-gray-400 tracking-wider">Polygon Amoy</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Merkle root anchored on-chain. Any submission can be proven to be part of the root without exposing others.
              </p>
            </div>

            <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 dark:text-white">Immutable Ledger</h3>
                <p className="text-xs uppercase font-bold text-gray-400 tracking-wider">Supabase PostgreSQL</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Submissions are write-once. No edits, no deletes. Raw and structural hashes stored separately.
              </p>
            </div>
          </div>
        </FadeInSection>

        {/* SECTION 5 — FAQ Accordion */}
        <FadeInSection className="space-y-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  className="card mb-3 cursor-pointer bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden shadow-soft transition-all duration-300"
                >
                  <div className="flex justify-between items-center p-5">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {faq.q}
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                        isOpen ? 'transform rotate-180 text-vouch-600' : ''
                      }`} 
                    />
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-5 pb-5 text-xs font-semibold text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-950 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </FadeInSection>

        {/* SECTION 6 — CTA */}
        <FadeInSection className="max-w-5xl mx-auto gradient-blue text-white p-10 rounded-3xl text-center space-y-6 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <h2 className="text-3xl font-black">Ready to vouch your code?</h2>
            <p className="text-sm text-vouch-100 font-medium max-w-md mx-auto">
              Get instant cryptographic notarizations and build your public, verified verification ledger today.
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-vouch-600 hover:bg-gray-50 transition-colors rounded-xl font-bold text-sm shadow-md w-full sm:w-auto"
            >
              Go to Dashboard
            </Link>
            <Link 
              to="/know-about-vouch" 
              className="inline-flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors rounded-xl font-bold text-sm shadow-md w-full sm:w-auto"
            >
              Know About Vouch
            </Link>
          </div>
        </FadeInSection>

      </div>
    </div>
  );
}
