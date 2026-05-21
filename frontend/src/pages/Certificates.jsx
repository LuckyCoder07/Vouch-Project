import React, { useState, useEffect } from 'react';
import API_URL from '../lib/apiUrl.js';
import {
  FileText,
  Download,
  Info,
  X,
  Search,
  Award,
  ShieldCheck,
  Calendar,
  Fingerprint,
  ExternalLink,
  FileCode,
  FileType,
  FileJson,
  File as FileIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import Skeleton from '../components/ui/Skeleton';


export default function Certificates() {
  const { user } = useAuth();
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/records?user_id=${user.id}`);
        if (!response.ok) throw new Error("Failed to fetch ledger records");
        const data = await response.json();
        
        // The API returns { records: [], count: n }
        const allRecords = data.records || [];
        
        // Sort by submitted_at
        const sortedRecords = [...allRecords].sort((a, b) => 
          new Date(b.submitted_at) - new Date(a.submitted_at)
        );

        setRecords(sortedRecords);
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load certificates: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, [user?.id]);

  const downloadCertificate = async (record) => {
    try {
      const res = await fetch(`${API_URL}/api/certificate`, {
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
      document.body.removeChild(a);
    } catch (err) {
      toast.error("Download failed: " + err.message);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFileDetails = (filename) => {
    if (!filename) return { label: 'FILE', color: 'text-gray-500 bg-gray-50 dark:bg-gray-700/20', border: 'border-gray-100 dark:border-gray-700', logo: null };
    const ext = filename.split('.').pop().toLowerCase();
    const details = {
      py: { 
        label: 'Python', 
        color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', 
        border: 'border-blue-100 dark:border-blue-800',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg'
      },
      java: { 
        label: 'Java', 
        color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20', 
        border: 'border-orange-100 dark:border-orange-800',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg'
      },
      cpp: { 
        label: 'C++', 
        color: 'text-red-500 bg-red-50 dark:bg-red-900/20', 
        border: 'border-red-100 dark:border-red-800',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg'
      },
      c: { 
        label: 'C', 
        color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20', 
        border: 'border-rose-100 dark:border-rose-800',
        logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg'
      },
      txt: { 
        label: 'Text', 
        color: 'text-gray-500 bg-gray-50 dark:bg-gray-700/20', 
        border: 'border-gray-100 dark:border-gray-700',
        logo: null
      },
    };
    return details[ext] || { label: ext.toUpperCase(), color: 'text-gray-500 bg-gray-50 dark:bg-gray-700/20', border: 'border-gray-100 dark:border-gray-700', logo: null };
  };

  const filteredRecords = records.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    const fileNameMatch = (r.file_name || '').toLowerCase().includes(searchLower);
    const dateMatch = formatDate(r.submitted_at).toLowerCase().includes(searchLower);
    return fileNameMatch || dateMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Lifetime Certificates</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Your official proofs of code notarization and ownership.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-600 dark:text-white transition"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-150 dark:border-gray-800 space-y-4">
              <Skeleton height="12rem" className="rounded-2xl" />
              <Skeleton width="60%" height="1.5rem" />
              <Skeleton width="40%" height="1rem" />
            </div>
          ))}
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredRecords.map((record, idx) => {
            const fileInfo = getFileDetails(record.file_name);
            return (
              <div
                key={idx}
                className="group bg-white dark:bg-gray-900 p-4 md:p-5 rounded-[2rem] border border-gray-150 dark:border-gray-800 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-500/15 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden"
              >
                {/* Card Header/Preview Area */}
                <div className={`aspect-video mb-4 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed transition-all duration-500 group-hover:border-solid ${fileInfo.color} ${fileInfo.border}`}>
                  <div className="relative">
                    {fileInfo.logo ? (
                      <img
                        src={fileInfo.logo}
                        alt={fileInfo.label}
                        className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <FileIcon className="w-16 h-16 opacity-80 group-hover:scale-110 transition-transform duration-500" />
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate text-base">{record.file_name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" /> {formatDate(record.submitted_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="p-2 bg-gray-50 dark:bg-gray-950 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg border border-gray-150 dark:border-gray-800 transition shadow-sm hover:scale-105 active:scale-95"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => downloadCertificate(record)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl text-sm hover:bg-blue-600 dark:hover:bg-blue-50 hover:text-white dark:hover:text-blue-600 transition-all shadow-lg active:scale-[0.98] group/btn"
                    >
                      <Download className="w-4 h-4 group-hover/btn:animate-bounce" />
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none transition-transform duration-500 group-hover:scale-150">
                  <div className="absolute top-[-24px] right-[-24px] w-20 h-20 bg-blue-600/5 dark:bg-blue-600/10 rotate-45 transition-colors group-hover:bg-blue-600/20"></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-150 dark:border-gray-800 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-950 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-gray-200 dark:text-gray-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No certificates yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
            Once you notarize your first code file in the dashboard, your official certificate will appear here.
          </p>
        </div>
      )}

      {/* Certification Info Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
        <div className="relative z-10 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
            The Power of Vouch Certification
          </h2>
          <p className="text-blue-50 text-lg leading-relaxed mb-8 opacity-90">
            Every certificate generated here represents an immutable cryptographic bond between your identity and your intellectual property. By notarizing your files, you establish a permanent timestamped record on our secure ledger, ensuring your work remains uniquely yours and verifiable globally.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition duration-300">
              <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center mb-3">
                <Fingerprint className="w-5 h-5 text-blue-100" />
              </div>
              <h4 className="font-bold text-sm mb-1">Authenticity</h4>
              <p className="text-xs text-blue-100/80 leading-snug">Tamper-proof SHA3-256 fingerprinting ensures code integrity.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition duration-300">
              <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5 text-blue-100" />
              </div>
              <h4 className="font-bold text-sm mb-1">Ownership</h4>
              <p className="text-xs text-blue-100/80 leading-snug">Permanent proof of creation rights linked to your OG ID.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition duration-300">
              <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center mb-3">
                <ExternalLink className="w-5 h-5 text-blue-100" />
              </div>
              <h4 className="font-bold text-sm mb-1">Trust</h4>
              <p className="text-xs text-blue-100/80 leading-snug">Instant verification by any node on the Vouch network.</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl group-hover:bg-indigo-300/30 transition-all duration-700"></div>
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}></div>
          <div className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-150 dark:border-gray-800">
            <div className="p-6 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 px-8">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">Certificate Audit</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-850 rounded-full transition text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="bg-gray-50/50 dark:bg-gray-950/40 p-5 rounded-2xl border border-gray-150 dark:border-gray-800">
                  <p className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-2">Authenticated Owner</p>
                  <p className="text-gray-900 dark:text-white font-bold text-lg flex items-center gap-2">
                    {selectedRecord.student_name} <ShieldCheck className="w-4 h-4 text-green-500" />
                  </p>
                </div>

                <div className="bg-gray-50/50 dark:bg-gray-950/40 p-5 rounded-2xl border border-gray-150 dark:border-gray-800">
                  <p className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-2 font-mono">Immutable Hash (SHA3-256)</p>
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-5 h-5 text-blue-500 shrink-0" />
                    <p className="text-xs font-mono text-blue-600 dark:text-blue-400 break-all select-all">
                      {selectedRecord.structural_hash}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50/50 dark:bg-gray-950/40 p-5 rounded-2xl border border-gray-150 dark:border-gray-800">
                    <p className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-1">Timestamp</p>
                    <p className="text-gray-900 dark:text-white font-bold text-xs truncate">
                      {formatDate(selectedRecord.submitted_at)}
                    </p>
                  </div>
                  <div className="bg-gray-50/50 dark:bg-gray-950/40 p-5 rounded-2xl border border-gray-150 dark:border-gray-800">
                    <p className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-1">Verification Code</p>
                    <p className="text-gray-900 dark:text-white font-bold text-xs truncate">
                      {selectedRecord.verification_code}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  onClick={() => downloadCertificate(selectedRecord)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 transition hover:-translate-y-0.5"
                >
                  <Download size={20} />
                  Download Certificate PDF
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="w-full py-3 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-700 dark:hover:text-gray-200 transition text-sm"
                >
                  Close Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
