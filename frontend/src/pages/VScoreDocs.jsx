import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Award, Zap, Shield, GitBranch, BookOpen, Star, Clock, FileCode, AlertTriangle, CheckCircle, Hash, Cpu, BarChart2, ChevronRight } from 'lucide-react';

export default function VScoreDocs() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "What is the V-Score?",
      icon: BookOpen,
      content: [
        { type: 'paragraph', text: "The V-Score is Vouch's proprietary cryptographic reputation metric. It is a single number that quantifies the originality, diversity, and consistency of a programmer's verified code output over their entire history on the Vouch platform. Unlike arbitrary gamification points, every V-Score is mathematically derived from real ledger records — tamper-evident entries that cannot be fabricated, edited, or backdated without breaking the cryptographic hash chain that links them together." },
        { type: 'paragraph', text: "The V-Score serves a dual purpose. First, it functions as a reputation system — a verifiable signal that tells collaborators, instructors, and employers how long a programmer has been producing original, independently verified code. Second, it functions as a plagiarism deterrent — because the V-Score rewards structural uniqueness, and because Vouch's AST normalization engine catches variable-rename plagiarism, the only way to earn a high V-Score is to genuinely produce original logical structures." },
        { type: 'callout', variant: 'info', text: "A V-Score of zero does not mean a programmer has no skill. It means they have not yet notarized any code through Vouch. The score measures verified, ledger-registered originality — not general coding ability." }
      ]
    },
    {
      title: "How Points Are Calculated",
      icon: Zap,
      content: [
        { type: 'paragraph', text: "Each unique code submission earns a base of 100 points, which is then modified by two independent multipliers before being added to the running total. Duplicate submissions — files whose structural hash already exists in the ledger — earn zero points, regardless of who submits them. This prevents score inflation through repeated uploads of the same logic." },
        { type: 'subheading', text: "Freshness Multiplier (Time-Based)" },
        { type: 'paragraph', text: "The freshness multiplier rewards code that has aged in the ledger. A submission made in the last 7 days earns a 0.8× modifier — it is new and its uniqueness has not yet been proven over time. Submissions between 8 and 30 days old earn the standard 1.0× rate. Code submitted 31 to 90 days ago earns a 1.3× bonus, reflecting that the structural fingerprint has been stable and unchanged for over a month. Submissions aged 91 to 365 days earn 1.6×, and any submission older than one year earns the maximum freshness bonus of 2.0×. This system means that a consistent programmer who has been notarizing code for a year earns significantly more than someone who bulk-uploaded the same number of files yesterday." },
        { type: 'subheading', text: "File Type Multiplier (Complexity-Based)" },
        { type: 'paragraph', text: "Not all programming languages carry equal structural complexity. Vouch applies a language multiplier based on the file extension of the submitted code. Python files (.py) receive the baseline 1.0× multiplier — Python is the most common language on the platform and serves as the reference point. Java files (.java) receive a 1.2× multiplier, reflecting the additional structural complexity of class hierarchies, typed declarations, and interface implementations. C++ files (.cpp) receive the highest multiplier of 1.4×, acknowledging the complexity of systems-level programming, manual memory management, and template structures. Plain text files (.txt) receive a reduced 0.6× multiplier since they do not contain compilable logical structures." },
        { type: 'code', language: "text", code: "Points per entry = 100 × freshnessMultiplier × fileTypeMultiplier\n\nExamples:\n  .py  submitted today      → 100 × 0.8 × 1.0 = 80 pts\n  .py  submitted 6mo ago    → 100 × 1.6 × 1.0 = 160 pts\n  .cpp submitted 6mo ago    → 100 × 1.6 × 1.4 = 224 pts\n  .java submitted 2yr ago   → 100 × 2.0 × 1.2 = 240 pts" }
      ]
    },
    {
      title: "Volume Multiplier & Consistency Bonus",
      icon: BarChart2,
      content: [
        { type: 'paragraph', text: "After all individual entry points are summed into a rawScore, Vouch applies a volume multiplier that rewards programmers who demonstrate sustained, high-volume output of unique verified code. A single submission earns no volume bonus (×1.0). Two to three unique submissions earn a 1.2× boost. Four to six earn 1.5×. Seven to ten earn 2.0×. Eleven to twenty unique submissions earn a 2.8× multiplier, and any programmer with 21 or more unique verified submissions earns the maximum 4.0× volume multiplier." },
        { type: 'paragraph', text: "Additionally, Vouch rewards consistency across calendar time through a separate consistency bonus. If a programmer has submissions spread across 3 or more distinct calendar months, 150 bonus points are added to their final score after the volume multiplier is applied. If submissions span 6 or more distinct calendar months, the bonus increases to 400 points. These bonuses are not cumulative — only the higher applicable bonus is awarded. This mechanism is specifically designed to distinguish programmers who genuinely build code across months from those who bulk-submit in a single session." },
        { type: 'code', language: "text", code: "Final V-Score = round((rawScore × volumeMultiplier) + consistencyBonus)\n\nvolumeTiers:\n  1 submission  → ×1.0\n  2-3           → ×1.2\n  4-6           → ×1.5\n  7-10          → ×2.0\n  11-20         → ×2.8\n  21+           → ×4.0\n\nconsistencyBonus:\n  3+ months active → +150 pts\n  6+ months active → +400 pts (replaces, not added)" }
      ]
    },
    {
      title: "Rank System",
      icon: Award,
      content: [
        { type: 'paragraph', text: "The V-Score maps to one of eight named ranks that reflect the programmer's verified contribution tier on the Vouch platform. Ranks are not arbitrary labels — each threshold was calibrated so that reaching the next rank requires a meaningful increase in verified original output, not just a few extra uploads." },
        { type: 'list', items: [
          "0–99: Unranked — No verified submissions or score below threshold",
          "100–299: Code Notary Rookie — First verified submissions registered",
          "300–599: Code Notary Apprentice — Consistent early-stage output",
          "600–1199: Code Notary Analyst — Demonstrated structural diversity",
          "1200–2499: Code Notary Pro — Sustained verified track record",
          "2500–4999: Code Notary Expert — High-volume, multi-language output",
          "5000–9999: Code Notary Elite — Long-term, time-weighted contributions",
          "10000+: Code Notary Master — Exceptional verified programming legacy"
        ]},
        { type: 'callout', variant: 'success', text: "Reaching Code Notary Master requires a minimum of 21 unique submissions spread across at least 6 calendar months, with a mix of high-complexity languages aged over 90 days. It cannot be achieved through bulk uploads." }
      ]
    },
    {
      title: "V-Score and Creative Originality",
      icon: Star,
      content: [
        { type: 'paragraph', text: "The V-Score is designed to identify not just prolific programmers, but original ones. The Abstract Behavior Tree normalization engine that powers Vouch's hashing system means that two programs with identical logical structure — regardless of how variables, functions, or arguments are named — produce the same structural fingerprint. A high V-Score therefore implies that the programmer has produced many structurally distinct programs: different control flows, different data processing approaches, different algorithmic strategies." },
        { type: 'paragraph', text: "This is why the V-Score is a meaningful signal of creative programming ability. A student who copies a sorting algorithm and renames the variables will not earn a new V-Score entry — the structural fingerprint will match the original. A student who implements the same problem with a genuinely different approach — perhaps using a different data structure or a novel iteration strategy — will produce a different ABT fingerprint and earn a new entry. Over time, a high V-Score becomes evidence that the programmer consistently approaches problems with fresh, independently conceived solutions." },
        { type: 'paragraph', text: "Employers and instructors who see a Code Notary Expert or Master rank can interpret it as a cryptographically verified signal that this programmer has a proven track record of producing original, diverse, independently registered code over an extended period of time — not a self-reported claim, but a tamper-evident ledger entry." },
        { type: 'callout', variant: 'info', text: "The V-Score does not measure code quality, performance, or correctness. It measures structural originality and verified submission history. A perfectly working but structurally identical program earns zero points." }
      ]
    },
    {
      title: "Tamper-Evidence and Trust",
      icon: Shield,
      content: [
        { type: 'paragraph', text: "Every V-Score is derived from ledger records that are protected by blockchain-style hash chaining. Each record's Chain_Hash is computed from the SHA3-256 of the current row's content combined with the Chain_Hash of the previous record. Editing any field in any historical record — including the timestamp, the file name, or the student name — changes the row's Row_Hash, which then changes its Chain_Hash, which then invalidates every subsequent Chain_Hash in the ledger." },
        { type: 'paragraph', text: "This means that a V-Score displayed on a Vouch profile cannot be inflated by editing historical ledger records. The /vouch/verify-ledger endpoint allows any authorized auditor to run a full chain verification pass over the entire ledger at any time, receiving an integrity_score from 0 to 100. A score of 100 means every record is intact. Any deviation is immediately localized to a specific row number." },
        { type: 'callout', variant: 'success', text: "Vouch V-Scores are not self-reported reputation points. They are computed in real-time from a cryptographically chained ledger. The only way to earn more is to submit more original code." }
      ]
    }
  ];

  const renderBlock = (block, blockIdx) => {
    switch(block.type) {
      case 'paragraph':
        return (
          <p key={blockIdx} className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-4">
            {block.text}
          </p>
        );
      case 'subheading':
        return (
          <h4 key={blockIdx} className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-3">
            {block.text}
          </h4>
        );
      case 'callout':
        const calloutStyles = {
          info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-800 dark:text-blue-300',
          warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-800 dark:text-amber-300',
          success: 'bg-green-50 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-300',
        };
        const CalloutIcon = block.variant === 'warning' ? AlertTriangle : block.variant === 'success' ? CheckCircle : BookOpen;
        return (
          <div key={blockIdx} className={`flex gap-3 p-4 rounded-xl border-l-4 mb-4 ${calloutStyles[block.variant]}`}>
            <CalloutIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed font-medium">{block.text}</p>
          </div>
        );
      case 'code':
        return (
          <div key={blockIdx} className="mb-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">{block.language}</span>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
            </div>
            <pre className="bg-gray-950 dark:bg-gray-900 p-5 overflow-x-auto">
              <code className="text-green-400 dark:text-green-300 text-sm font-mono leading-relaxed whitespace-pre">
                {block.code}
              </code>
            </pre>
          </div>
        );
      case 'list':
        return (
          <ul key={blockIdx} className="space-y-2 mb-4 ml-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8 mt-2 group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </button>

      {/* Doc header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">V-Score System</h1>
              <span className="text-xs font-mono font-bold px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">v2.1.0</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Cryptographic Reputation Engine for Code Originality</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Last updated: April 2025</span>
          <span className="mx-2">·</span>
          <span>Vouch Technical Documentation</span>
        </div>
        <div className="mt-4 h-0.5 w-16 rounded-full bg-indigo-500" />
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {sections.map((section, sIdx) => {
          const SectionIcon = section.icon;
          return (
            <div key={sIdx} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-3">
                <SectionIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{section.title}</h2>
              </div>
              <div className="px-8 py-6">
                {section.content.map((block, bIdx) => renderBlock(block, bIdx))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom nav bar */}
      <div className="mt-12 flex justify-between items-center pt-8 border-t border-gray-100 dark:border-gray-700">
        <button 
          onClick={() => navigate('/profile')} 
          className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Profile
        </button>
      </div>
    </div>
  );
}
