import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Clock, Search, FileCode2, Download, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnchorBadge from '../components/ui/AnchorBadge';


const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);

  if (diffInMins < 60) {
    return diffInMins === 0 ? "Just now" : `${diffInMins} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const getLanguageColor = (lang) => {
  const normalized = (lang || '').toLowerCase();
  if (normalized === 'python' || normalized === 'py') return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
  if (normalized === 'java') return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30';
  if (normalized === 'cpp' || normalized === 'c++') return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
  return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
        copied 
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800' 
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
      }`}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? 'Copied!' : 'Copy Code'}
    </button>
  );
};

export default function History() {
  const { user } = useAuth();
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/records?user_id=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch records");
        const data = await res.json();
        setRecords(data.records || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user?.id]);

  const downloadCertificate = async (record) => {
    try {
      const res = await fetch(`/api/certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: record.student_name,
          file_name: record.file_name,
          structural_hash: record.structural_hash,
          submitted_at: record.submitted_at,
          verification_code: record.verification_code
        }),
      });

      if (!res.ok) throw new Error("Failed to generate certificate.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${record.student_name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download certificate: " + err.message);
    }
  };

  const filteredRecords = records
    .filter((record) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        (record.file_name || '').toLowerCase().includes(q) || 
        (record.student_name || '').toLowerCase().includes(q);
      const matchLang = filterLanguage === 'all' || (record.language || '').toLowerCase() === filterLanguage;
      return matchSearch && matchLang;
    })
    .sort((a, b) => {
      const dateA = new Date(a.submitted_at).getTime();
      const dateB = new Date(b.submitted_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Submission History</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
              Your permanent ledger records
            </p>
          </div>
        </div>
        {!isLoading && !error && (
          <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-bold text-sm border border-gray-200 dark:border-gray-700">
            {records.length} {records.length === 1 ? 'Record' : 'Records'}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by file or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white cursor-pointer"
          >
            <option value="all">All Languages</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse flex flex-col sm:flex-row items-start sm:items-center p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0"></div>
              <div className="flex-1 w-full space-y-3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
              <div className="w-full sm:w-auto flex gap-2">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-800/50 text-center font-medium">
          {error}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center rounded-full mb-4">
            <FileCode2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No submissions found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {records.length === 0 
              ? "You haven't vouched any files yet." 
              : "No records match your search criteria."}
          </p>
          {records.length === 0 && (
            <Link to="/dashboard" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition">
              Go to Dashboard
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const langStyle = getLanguageColor(record.language);
            return (
              <div key={record.id} className="flex flex-col sm:flex-row sm:items-center p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition gap-5">
                
                {/* File Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${langStyle}`}>
                  <FileCode2 size={24} />
                </div>
                
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{record.file_name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${langStyle}`}>
                      {record.language || 'Unknown'}
                    </span>
                    <AnchorBadge anchored={record.anchored} compact={true} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span>Submitted {getRelativeTime(record.submitted_at)}</span>
                    <span className="hidden sm:block w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                      VCH: <span className="text-gray-700 dark:text-gray-300">{record.verification_code}</span>
                    </span>
                    <span className="hidden sm:block w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                    <span className="font-mono truncate">
                      Hash: {record.structural_hash?.substring(0, 12)}...
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col lg:flex-row items-center gap-2 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => downloadCertificate(record)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-semibold rounded-lg border border-blue-200 dark:border-blue-800/50 transition text-sm shadow-sm"
                  >
                    <Download size={16} />
                    Download Cert
                  </button>
                  <CopyButton text={record.verification_code} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
