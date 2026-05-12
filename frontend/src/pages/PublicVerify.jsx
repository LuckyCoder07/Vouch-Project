import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Download, 
  ExternalLink,
  ChevronRight,
  Code,
  Calendar,
  User,
  FileText,
  Globe,
  Star,
  Link2,
  Clock,
  Shield,
  Activity
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';


export default function PublicVerify() {
  const { code } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [inputCode, setInputCode] = useState(code || '');
  const [result, setResult] = useState(null);
  const [anchorInfo, setAnchorInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchAnchorInfo();
    if (code) {
      handleVerify(code);
    }
  }, [code]);

  async function fetchAnchorInfo() {
    try {
      const res = await fetch(`/api/anchor/latest`);
      if (res.ok) {
        const data = await res.json();
        setAnchorInfo(data);
      }
    } catch (err) {
      console.error("Failed to fetch anchor info", err);
    }
  }

  async function handleVerify(verifyCode = inputCode) {
    const targetCode = verifyCode?.trim();
    if (!targetCode) return;

    setIsLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    try {
      const res = await fetch(`/api/verify/${targetCode}`);
      
      if (res.status === 404) {
        setError('No certificate found with this code.');
      } else if (!res.ok) {
        throw new Error('Server error');
      } else {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      setError('Could not connect to verification server.');
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const downloadCertificate = async () => {
    if (!result) return;
    try {
      const res = await fetch(`/api/certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: result.student_name,
          file_name: result.file_name,
          structural_hash: result.structural_hash,
          submitted_at: result.submitted_at || result.created_at,
          verification_code: result.verification_code
        }),
      });

      if (!res.ok) throw new Error("Failed to generate certificate.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${result.verification_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download certificate.");
    }
  };

  const getTrustSignals = () => {
    if (!result) return { stars: 0, label: '', color: '' };
    let stars = 1; // Record exists
    if (result.signature) stars++;
    if (anchorInfo?.anchored) stars++;

    if (stars === 1) return { stars, label: 'Basic', color: 'text-gray-400 bg-gray-100 dark:bg-gray-800' };
    if (stars === 2) return { stars, label: 'Signed', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' };
    return { stars, label: 'Fully Verified', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' };
  };

  const trust = getTrustSignals();

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
          <h1 className="text-3xl font-black tracking-tight mb-3">Public Certificate Verification</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide">
            Cryptographically signed · Polygon Amoy anchored · Always free to verify
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white dark:bg-slate-800/50 p-2 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="Enter Verification Code (e.g. VCH-A7X9-K2M1)"
                className="w-full pl-14 pr-6 py-5 bg-transparent rounded-3xl outline-none text-lg font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={isLoading}
              className="px-10 py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black rounded-3xl transition-all shadow-xl shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Querying Ledger...</p>
            </div>
          ) : result ? (
            <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <CheckCircle className="text-emerald-500 w-10 h-10" />
                <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">Certificate Verified</h2>
              </div>

              {/* Main Result Card */}
              <div className="bg-white dark:bg-slate-800/80 border-2 border-emerald-500/30 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-emerald-500/5 relative overflow-hidden">
                {/* Trust Badge */}
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${trust.color}`}>
                    <div className="flex">
                      {[...Array(3)].map((_, i) => (
                        <Star key={i} size={10} fill={i < trust.stars ? "currentColor" : "none"} className={i < trust.stars ? "" : "opacity-20"} />
                      ))}
                    </div>
                    {trust.label}
                  </div>
                </div>

                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -ml-16 -mt-16"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 pt-4">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <User size={12} /> Submitted By
                      </p>
                      <p className="text-xl font-black">{result.student_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <FileText size={12} /> File Name
                      </p>
                      <p className="text-lg font-bold truncate">{result.file_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Globe size={12} /> Language
                      </p>
                      <p className="text-lg font-bold capitalize">{result.language}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Calendar size={12} /> Recorded On (UTC)
                      </p>
                      <p className="text-lg font-bold">{new Date(result.submitted_at || result.created_at).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Code size={12} /> Structural Hash
                      </p>
                      <p className="text-xs font-mono bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl break-all line-clamp-2">
                        {result.structural_hash}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <ShieldCheck size={12} /> Verification Code
                      </p>
                      <p className="text-xl font-mono font-black text-blue-600 dark:text-blue-400">{result.verification_code}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    onClick={downloadCertificate}
                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/5"
                  >
                    <Download size={20} /> Download Official Certificate
                  </button>
                </div>
              </div>

              {/* Trust Signal Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Signature Panel */}
                <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/20 dark:shadow-none">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <ShieldCheck size={20} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-wider">Cryptographic Signature</h3>
                  </div>
                  
                  {result.signature ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                        <ShieldCheck size={16} /> Digitally Signed by Vouch
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Payload Hash</p>
                        <p className="text-xs font-mono break-all">{result.payload_hash?.substring(0, 24)}...</p>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Algorithm: RSA-PSS-SHA256</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed italic">
                        Verify independently using vouch_public.pem from <a href="https://github.com/Mitesh-70/Vouch_Project" target="_blank" rel="noreferrer" className="underline hover:text-blue-500">github.com/Mitesh-70/Vouch_Project</a>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-400 py-4">
                      <Shield size={20} className="opacity-40" />
                      <p className="text-sm font-bold italic">Signature not available for this submission</p>
                    </div>
                  )}
                </div>

                {/* Blockchain Anchor Panel */}
                <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/20 dark:shadow-none">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Activity size={20} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-wider">Blockchain Anchor Status</h3>
                  </div>

                  {anchorInfo?.anchored ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-bold">
                        <Link2 size={16} /> Anchored to Polygon Amoy
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400">Block Number</span>
                          <span className="text-slate-600 dark:text-slate-300">#{anchorInfo.block_number}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400">Records in Anchor</span>
                          <span className="text-slate-600 dark:text-slate-300">{anchorInfo.record_count}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400">Anchored At</span>
                          <span className="text-slate-600 dark:text-slate-300">{new Date(anchorInfo.anchored_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <a 
                        href={anchorInfo.explorer_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline pt-2"
                      >
                        View on Amoy PolygonScan <ExternalLink size={12} />
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <Clock className="text-orange-500 w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm font-bold text-slate-500">Pending next anchor</p>
                      <p className="text-[10px] text-slate-400 font-medium">Automatic anchoring occurs every 24 hours</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : searched && error ? (
            <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/10">
                <XCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">This certificate code was not found.</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                If you believe this is an error, please contact the submitter or verify the code format.
              </p>
            </div>
          ) : (
            <div className="text-center py-20 opacity-30">
              <div className="w-16 h-16 border-2 border-dashed border-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Fingerprint size={32} className="text-slate-400" />
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Awaiting Search Query</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-800 text-center space-y-6">
          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Powered by Vouch — Immutable Code Notary</p>
          <div className="flex items-center justify-center gap-4">
            <Link 
              to="/login" 
              className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl text-sm border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors flex items-center gap-2"
            >
              Create your account <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fingerprint icon for the empty state
function Fingerprint({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12" />
      <path d="M5 12C5 8.13401 8.13401 5 12 5C15.866 5 19 8.13401 19 12" />
      <path d="M8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12" />
      <path d="M12 12H12.01" />
      <path d="M12 15C10.3431 15 9 13.6569 9 12" />
      <path d="M15 12C15 13.6569 13.6569 15 12 15" />
      <path d="M12 18C8.68629 18 6 15.3137 6 12" />
      <path d="M18 12C18 15.3137 15.3137 18 12 18" />
    </svg>
  );
}
