import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Award, Zap, Clock, FileCode, Hash, ChevronRight, Info, Star, GitCommit, GitBranch, ArrowUpRight, BookOpen, Shield } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';

const getFileExt = (fileName) => {
  if (!fileName) return '.py';
  const parts = fileName.split('.');
  return parts.length > 1 ? '.' + parts[parts.length - 1].toLowerCase() : '.py';
};

const getExtColor = (ext) => {
  switch(ext) {
    case '.py':   return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'Python' };
    case '.java': return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', label: 'Java' };
    case '.cpp':  return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', label: 'C++' };
    case '.txt':  return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', label: 'Text' };
    default:      return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', label: ext.replace('.','').toUpperCase() };
  }
};

const formatTimestamp = (ts) => {
  if (!ts) return 'Unknown date';
  const d = new Date(ts);
  if (isNaN(d)) return ts;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getRelativeTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d)) return '';
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

const computeEntryPoints = (record) => {
  const ext = getFileExt(record.File_Name);
  const d = new Date(record.submitted_at);
  const now = new Date();
  const ageInDays = isNaN(d) ? 0 : Math.floor((now - d) / 86400000);

  let freshness = 1.0;
  if (ageInDays <= 7) freshness = 0.8;
  else if (ageInDays <= 30) freshness = 1.0;
  else if (ageInDays <= 90) freshness = 1.3;
  else if (ageInDays <= 365) freshness = 1.6;
  else freshness = 2.0;

  let fileMultiplier = 1.0;
  if (ext === '.java') fileMultiplier = 1.2;
  else if (ext === '.cpp') fileMultiplier = 1.4;
  else if (ext === '.txt') fileMultiplier = 0.6;

  const base = 100;
  const raw = Math.round(base * freshness * fileMultiplier);

  const freshnessLabel =
    ageInDays <= 7   ? 'New (×0.8)' :
    ageInDays <= 30  ? 'Standard (×1.0)' :
    ageInDays <= 90  ? 'Aged (×1.3)' :
    ageInDays <= 365 ? 'Veteran (×1.6)' : 'Archive (×2.0)';

  const fileLabel =
    ext === '.cpp'  ? 'C++ Bonus (×1.4)' :
    ext === '.java' ? 'Java Bonus (×1.2)' :
    ext === '.txt'  ? 'Text (×0.6)' : 'Standard (×1.0)';

  return { points: raw, freshnessLabel, fileLabel, ageInDays };
};

const getRankThresholds = () => [
  { rank: 'Unranked', min: 0, max: 99, color: 'text-gray-500 dark:text-gray-400' },
  { rank: 'Code Notary Rookie', min: 100, max: 299, color: 'text-slate-600 dark:text-slate-300' },
  { rank: 'Code Notary Apprentice', min: 300, max: 599, color: 'text-blue-600 dark:text-blue-400' },
  { rank: 'Code Notary Analyst', min: 600, max: 1199, color: 'text-indigo-600 dark:text-indigo-400' },
  { rank: 'Code Notary Pro', min: 1200, max: 2499, color: 'text-purple-600 dark:text-purple-400' },
  { rank: 'Code Notary Expert', min: 2500, max: 4999, color: 'text-amber-600 dark:text-amber-400' },
  { rank: 'Code Notary Elite', min: 5000, max: 9999, color: 'text-orange-600 dark:text-orange-400' },
  { rank: 'Code Notary Master', min: 10000, max: Infinity, color: 'text-yellow-500 dark:text-yellow-400' },
];

export default function VScoreHistory({ userRecords, vScore, rank, isLoading, limit }) {
  const navigate = useNavigate();

  const sortedRecords = useMemo(() => {
    return [...(userRecords || [])].sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
  }, [userRecords]);

  const cumulativeHistory = useMemo(() => {
    const chronological = [...(userRecords || [])].sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
    let running = 0;
    const seenHashes = new Set();
    const history = chronological.map((record, idx) => {
      const isUnique = !seenHashes.has(record.structural_hash);
      seenHashes.add(record.structural_hash);
      const { points, freshnessLabel, fileLabel, ageInDays } = computeEntryPoints(record);
      const pointsAdded = isUnique ? points : 0;
      running += pointsAdded;
      return { ...record, pointsAdded, runningTotal: running, isUnique, freshnessLabel, fileLabel, idx: idx + 1 };
    }).reverse();

    return limit ? history.slice(0, limit) : history;
  }, [userRecords, limit]);

  const thresholds = getRankThresholds();
  const currentThreshold = thresholds.find(t => t.min <= vScore && vScore <= t.max) || thresholds[0];
  const nextThreshold = thresholds[thresholds.indexOf(currentThreshold) + 1];

  const totalEntries = userRecords?.length || 0;
  const uniqueEntries = new Set(userRecords?.map(r => r.structural_hash)).size;
  const avgPoints = uniqueEntries > 0 ? Math.round(vScore / uniqueEntries) : 0;
  const extCounts = (userRecords || []).reduce((acc, r) => {
    const ext = getFileExt(r.File_Name);
    acc[ext] = (acc[ext] || 0) + 1;
    return acc;
  }, {});
  const topExt = Object.entries(extCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || '.py';

  return (
    <div className="space-y-8 pt-4">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">V-Score History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Real-time audit log from the Vouch ledger</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {limit && (
            <button
              onClick={() => navigate('/vscore')}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center transition group mr-2"
            >
              View All <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          <button
            onClick={() => navigate('/docs/vscore')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-bold border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
          >
            <BookOpen className="w-4 h-4" />
            About V-Score
            {!limit && <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
          </button>
        </div>
      </div>

      {/* Stats summary row - only in full view */}
      {!limit && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Current V-Score', value: isLoading ? null : vScore.toLocaleString(), icon: Award, color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Unique Submissions', value: isLoading ? null : uniqueEntries, icon: GitBranch, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Avg pts / Entry', value: isLoading ? null : avgPoints, icon: Zap, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Top Language', value: isLoading ? null : getExtColor(topExt).label, icon: FileCode, color: 'text-green-600 dark:text-green-400' },
          ].map((stat, i) => {
            const StatIcon = stat.icon;
            return (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <StatIcon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</span>
                </div>
                {isLoading ? (
                  <Skeleton width="5rem" height="1.75rem" />
                ) : (
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Git-style timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-gray-900 dark:text-white text-sm">Commit History</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold">{totalEntries}</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">Sorted by latest first</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} width="100%" height="4rem" />)}
          </div>
        ) : cumulativeHistory.length === 0 ? (
          <div className="py-16 text-center">
            <GitBranch className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No submissions yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Go to Dashboard to vouch your first file.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {cumulativeHistory.map((entry, i) => {
              const ext = getFileExt(entry.File_Name);
              const extStyle = getExtColor(ext);
              const isFirst = i === cumulativeHistory.length - 1;
              return (
                <div key={i} className="px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                  <div className="flex items-start gap-4">

                    {/* Timeline dot */}
                    <div className="flex flex-col items-center mt-1 shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${entry.isUnique ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        {entry.isUnique
                          ? <GitCommit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          : <Hash className="w-4 h-4 text-gray-400" />
                        }
                      </div>
                      {i < cumulativeHistory.length - 1 && (
                        <div className="w-px flex-1 min-h-[1.5rem] bg-gray-200 dark:bg-gray-700 mt-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${extStyle.bg} ${extStyle.text}`}>{extStyle.label}</span>
                        {isFirst && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">GENESIS</span>
                        )}
                        {!entry.isUnique && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">Duplicate — No Points</span>
                        )}
                      </div>

                      <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{entry.File_Name || 'Unknown file'}</p>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{entry.structural_hash ? entry.structural_hash.slice(0,16) + '...' : 'No hash'}</span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {getRelativeTime(entry.submitted_at)}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{formatTimestamp(entry.submitted_at)}</span>
                      </div>

                      {/* Point breakdown */}
                      {entry.isUnique && (
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-gray-400 dark:text-gray-500">{entry.freshnessLabel}</span>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{entry.fileLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Points badge + running total */}
                    <div className="shrink-0 text-right">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-sm font-black ${entry.isUnique ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'bg-gray-50 dark:bg-gray-700 text-gray-400'}`}>
                        {entry.isUnique ? '+' : ''}{entry.pointsAdded}
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                        Total: {entry.runningTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Why Vouch calculates V-Score — bottom section - only in full view */}
      {!limit && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(99,102,241,0.15) 0%, transparent 50%)' }}
        >
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Star className="w-3.5 h-3.5" /> Why V-Score Matters
              </div>
              <h3 className="text-2xl font-black tracking-tight">Your code uniqueness, quantified.</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                The V-Score is not just a number — it is a cryptographic reputation score that reflects how original, diverse, and consistent your programming output is over time. Every file you notarize through Vouch is analyzed for structural uniqueness using Abstract Behavior Tree normalization. The more distinct logical approaches you demonstrate, the higher your score climbs.
              </p>
              <p className="text-gray-400 leading-relaxed text-sm">
                Older submissions earn bonus points through a time-based freshness multiplier, rewarding programmers who have been building verified track records over months and years. File type weights reflect the relative complexity of languages — a verified C++ submission carries more weight than a plain text file because the structural diversity of systems-level code is harder to achieve.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { icon: Shield, label: 'Tamper-proof', desc: 'Every score is derived directly from ledger records that cannot be edited without breaking the hash chain.' },
                { icon: TrendingUp, label: 'Time-weighted', desc: 'Submissions age like wine — older verified code earns progressively more points through freshness multipliers.' },
                { icon: Zap, label: 'Language-aware', desc: 'C++ and Java submissions are weighted higher to reflect the structural complexity of systems-level programming.' },
                { icon: GitBranch, label: 'Diversity-rewarded', desc: 'Volume multipliers reward programmers who demonstrate consistent, diverse logical output over time.' },
              ].map((item, i) => {
                const ItemIcon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <ItemIcon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.label}</p>
                      <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => navigate('/docs/vscore')}
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-lg shadow-indigo-500/30 group"
              >
                <BookOpen className="w-4 h-4" />
                Read Full V-Score Documentation
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
