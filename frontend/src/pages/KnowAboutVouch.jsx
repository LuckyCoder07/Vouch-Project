import API_URL from '../lib/apiUrl.js';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  HelpCircle, 
  Send, 
  Mail, 
  MessageSquare, 
  Info,
  Globe,
  Cpu,
  Lock,
  Search,
  ChevronDown,
  Github
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

const ALL_FAQS = [
  {
    question: "How does Vouch ensure my code is original?",
    answer: "Vouch uses a 'First-to-Claim' protocol. When you notarize a file, its logic-based SHA-256 hash is permanently recorded. If anyone tries to submit the same logic later—even with different variable names or comments—the system will detect the collision and show that you were the original owner."
  },
  {
    question: "What exactly is an 'Immutable Ledger'?",
    answer: "Our ledger is backed by Google Sheets and cryptographically secured using 'Chained Hashing'. Each new entry contains a hash of the previous entry. This means if a single character in a past row is modified, the entire chain breaks, making tampering instantly detectable."
  },
  {
    question: "Does Vouch store my actual source code?",
    answer: "No. Vouch believes in privacy-first. Hence we use Zero Knowledge Proof(ZKP) algorithm i.e., we only store the SHA-256 fingerprint (hash) of your code. Your actual source code never leaves our temporary server memory during the hashing process and is never saved to a database."
  },
  {
    question: "What is V-Score and how is it calculated?",
    answer: "V-Score is your reputation metric. It's calculated with a base score of 100 points per unique file hash, plus a 25-point time bonus for records older than 30 days. Additionally, a multiplier is applied based on your total unique contributions (x1.5 for 3+, x2.0 for 6+, and x3.0 for 11+ contributions)."
  },
  {
    question: "Can I use Vouch for non-Python files?",
    answer: "Yes! Vouch currently supports Python (.py), Java (.java), C/C++ (.c, .cpp), JavaScript (.js), React (.jsx), JSON (.json), and standard Text (.txt) files. Each language is processed securely using its own specific normalization and hashing engine."
  },
  {
    question: "Is the PDF Certificate legally binding?",
    answer: "Vouch certificates serve as 'Digital Notarization'. While legal standing varies by jurisdiction, the certificate provides mathematical proof of existence and possession at a specific point in time, which is a powerful form of evidence in ownership disputes."
  },
  {
    question: "What happens if I lose my original file?",
    answer: "If you lose the original file, you cannot re-verify it because the hash depends on the exact code logic. However, your record remains on the ledger, and your certificate remains accessible in your Certificates tab."
  },
  {
    question: "How do I verify someone else's certificate?",
    answer: "Every certificate contains a file hash and a timestamp. You can go to the 'Verification' tab, upload the file they gave you, and the system will check if it matches an existing entry in the global ledger."
  },
  {
    question: "Is Vouch open source?",
    answer: "The core Vouch Protocol and this platform are built with transparency in mind. You can view the technical documentation and repository directly from the Settings or About sections."
  }
];

export default function KnowAboutVouch() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFaqs = ALL_FAQS.filter(f => 
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!query.trim() || !user?.email) {
      if (!user?.email) toast.error("Please login to ask a question.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: user.email, query })
      });
      
      if (response.ok) {
        toast.success("Your question has been sent to the Vouch team!");
        setQuery("");
      } else {
        toast.error("Failed to send your question. Please try again later.");
      }
    } catch (err) {
      toast.error("Failed to send your question. Check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-20 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <div className="relative pt-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
          <Info size={14} /> The Vouch Manifesto
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter">
          Universal Trust for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Digital Assets.</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Vouch is more than a tool—it's a cryptographic standard for proving code ownership and integrity in an era of rapid AI generation and digital duplication.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/how-it-works"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition active:scale-[0.98] w-full sm:w-auto"
          >
            See How it Works
          </Link>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl font-bold text-sm shadow-sm transition w-full sm:w-auto"
          >
            Read FAQs
          </a>
        </div>
      </div>

      {/* Philosophy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Integrity First</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            We believe logic is sacred. Our normalization engine ensures that style changes don't dilute the proof of your original algorithm.
          </p>
        </div>

        <div className="card p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
            <Cpu size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Math Over Trust</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            By using SHA-256 chaining, we remove the need to 'trust' a centralized database. The math itself proves if a record has been altered.
          </p>
        </div>

        <div className="card p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5">
          <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
            <Globe size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Public Audit</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            Every notarization is part of a global ledger that can be verified by anyone, anywhere, at any time, using the Vouch protocol.
          </p>
        </div>
      </div>

      {/* Searchable FAQ Section */}
      <div id="faq-section" className="space-y-10 pt-10">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Knowledge Base</h2>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search all FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-blue-900/5 outline-none focus:ring-2 focus:ring-blue-600 dark:text-white transition"
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 gap-4">
          {filteredFaqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-200"
            >
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left px-8 py-6 flex items-center justify-between focus:outline-none"
              >
                <span className="font-bold text-gray-900 dark:text-white text-lg">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="px-8 pb-8 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-700/30 pt-6">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
          {filteredFaqs.length === 0 && (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No matching questions found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Ask a Question Section */}
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-blue-950 rounded-[3rem] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <MessageSquare size={200} />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-tight">Have a specific question?</h2>
            <p className="text-blue-100/70 leading-relaxed">
              If you couldn't find what you were looking for, send us a query directly. Our technical team usually responds within 24 hours.
            </p>
            <div className="flex items-center gap-3 text-sm text-blue-200/60 bg-white/5 p-4 rounded-2xl border border-white/10">
              <Mail size={18} />
              <span>Response will be sent to: <strong className="text-white">{user?.email}</strong></span>
            </div>
          </div>

          <form onSubmit={handleAskQuestion} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-blue-300 ml-1">Your Query</label>
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Explain what you'd like to know about Vouch..."
                className="w-full h-40 px-5 py-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/30 transition resize-none"
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
            >
              <Send size={18} className={isSubmitting ? "animate-pulse" : ""} />
              {isSubmitting ? "Submitting..." : "Submit Question"}
            </button>
          </form>
        </div>
      </div>

      {/* Developers of Vouch Section */}
      <div className="max-w-4xl mx-auto pt-10">
        <div className="bg-white dark:bg-gray-900 p-8 md:p-12 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-blue-900/10 hover:shadow-blue-500/10 transition-all duration-500 group/container relative overflow-hidden">
          {/* Cool hover gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-transparent dark:from-blue-900/20 dark:via-transparent dark:to-transparent opacity-0 group-hover/container:opacity-100 transition-opacity duration-700"></div>
          
          <div className="relative z-10 text-center space-y-3 mb-10">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Developers of Vouch</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">The engineering team behind the protocol.</p>
          </div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "Lakshit Singh", github: "https://github.com/LuckyCoder07", initials: "LS" },
              { name: "Mitesh Agrawal", github: "https://github.com/Mitesh-70", initials: "MA" },
              { name: "Saurabh Rakhonde", github: "https://github.com/rakhondesaurabh-cyber", initials: "SR" },
              { name: "Ayush Karmore", github: "https://github.com/galaxy-hivemind", initials: "AK" }
            ].map((dev, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-3xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900/50 flex items-center justify-between group transition-all duration-300"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-lg shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {dev.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{dev.name}</h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">Core Developer</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(dev.github, '_blank')}
                  className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-sm group-hover:scale-110"
                  title={`${dev.name}'s GitHub`}
                >
                  <Github size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
