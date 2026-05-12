import React, { useState, useEffect, useRef } from 'react';
import {
  FileSearch,
  Upload,
  CheckCircle,
  AlertTriangle,
  Fingerprint,
  ExternalLink,
  X,
  Loader2,
  AlertCircle,
  Download
} from 'lucide-react';

import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';


const SCAN_STEPS = [
  { label: "INITIALIZING VOUCH PROTOCOL", icon: "▶️", duration: 150 },
  { label: "STRIPPING COMMENTS & WHITESPACE", icon: "✂", duration: 150 },
  { label: "VERIFYING SOURCE INTEGRITY", icon: "⬡", duration: 200 },
  { label: "STABILIZING CONTENT STRUCTURE", icon: "⟳", duration: 150 },
  { label: "GENERATING UNIQUE FINGERPRINT", icon: "◈", duration: 150 },
  { label: "COMPUTING SECURE HASH (SHA3-256)", icon: "⬛", duration: 100 },
  { label: "CONNECTING TO PUBLIC LEDGER", icon: "✓", duration: 100 },
];

const ScanningAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let isMounted = true;
    const runSteps = async () => {
      for (let i = 0; i < SCAN_STEPS.length; i++) {
        if (!isMounted) break;
        setCurrentStep(i);
        const label = SCAN_STEPS[i].label;
        for (let j = 0; j <= label.length; j++) {
          if (!isMounted) break;
          setDisplayText(label.substring(0, j));
          await new Promise(r => setTimeout(r, 6));
        }
        await new Promise(r => setTimeout(r, SCAN_STEPS[i].duration));
      }
    };
    runSteps();
    return () => { isMounted = false; };
  }, []);

  const progress = Math.round(((currentStep + 1) / SCAN_STEPS.length) * 100);

  return (
    <div className="flex flex-col items-center gap-4 py-4 w-full">
      <div className="flex items-center gap-3 font-bold text-gray-900 dark:text-white transition-all duration-300">
        <span className="text-blue-500 animate-pulse text-xl">{SCAN_STEPS[currentStep]?.icon}</span>
        <span className="tracking-widest uppercase text-sm">{displayText}</span>
        <span className="animate-pulse inline-block w-1.5 h-4 bg-blue-500 ml-1"></span>
      </div>
      <div className="flex items-center gap-4 w-full">
        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative border border-gray-200/30 dark:border-gray-700/30">
          <div
            className="h-full bg-blue-600 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 w-8">{progress}%</span>
      </div>
    </div>
  );
};

export default function Verification() {
  const toast = useToast();
  const { user, session } = useAuth();
  const { addNotification } = useNotifications();
  const [selectedFile, setSelectedFile] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('idle'); // 'idle' / 'loading' / 'verified' / 'not_found' / 'error'
  const [result, setResult] = useState(null);
  const [fileHash, setFileHash] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndVerifyFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processAndVerifyFile(e.target.files[0]);
    }
  };

  const processAndVerifyFile = async (file) => {
    setSelectedFile(file);
    setVerifyStatus('loading');
    setResult(null);
    setFileHash('');

    const formData = new FormData();
    formData.append('file', file);

    const token = session?.access_token;

    try {
      const response = await fetch(`/api/verify`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();

      setFileHash(data.structural_hash || '');
      setResult(data);

      const totalAnimTime = SCAN_STEPS.reduce((acc, step) => acc + step.duration + (step.label.length * 15), 0);

      setTimeout(() => {
        if (data.status === 'verified') {
          setVerifyStatus('verified');
          addNotification('verify', 'Verification Successful', `${file.name} matches the official record by ${data.student_name}.`, '/history');
        } else if (data.status === 'not_found') {
          setVerifyStatus('not_found');
        } else {
          setVerifyStatus('error');
        }
      }, totalAnimTime);
    } catch (error) {
      setVerifyStatus('error');
      setResult({ message: "Network error or backend is offline." });
      toast.error("Network error or backend is offline.");
    }
  };

  const downloadCertificate = async () => {
    if (!result || !selectedFile) return;
    const token = session?.access_token;
    try {
      const res = await fetch(`/api/certificate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          student_name: result.student_name,
          file_name: result.file_name || selectedFile.name,
          structural_hash: result.structural_hash,
          submitted_at: result.submitted_at,
          verification_code: result.verification_code
        }),
      });

      if (!res.ok) throw new Error("Failed to generate certificate.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${result.student_name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download certificate: " + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Verify Code Integrity</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Upload a file to check its authenticity against the immutable Vouch ledger.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Verification Form */}
        <div className="xl:col-span-2 space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            className={`bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-sm border-3 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center group relative overflow-hidden
              ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'}
              ${verifyStatus === 'loading' ? 'pointer-events-none opacity-60 blur-[1px] grayscale-[0.5]' : 'cursor-pointer'}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className={`w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500
              ${verifyStatus === 'loading' ? 'animate-pulse' : ''}`}>
              <Upload className={`w-10 h-10 ${dragActive ? 'text-blue-500' : 'text-blue-600'}`} />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedFile ? selectedFile.name : 'Drop your source file here'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
              Supports .py, .java, .cpp, .txt up to 10MB. Verification happens in real-time.
            </p>

            <button
              disabled={verifyStatus === 'loading'}
              className={`mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/30
                ${verifyStatus === 'loading' ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'hover:bg-blue-700'}`}
            >
              {verifyStatus === 'loading' ? 'Processing...' : 'Select File'}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Real-time Analysis</h2>
              {verifyStatus === 'loading' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
            </div>

            <div className="space-y-6">
              {/* SHA-256 Panel */}
              <div className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <Fingerprint className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SHA-256 Fingerprint</p>
                  <p className={`text-sm font-mono mt-1 break-all uppercase tracking-tight ${fileHash ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400 italic'}`}>
                    {fileHash || 'Waiting for active file upload...'}
                  </p>
                </div>
              </div>

              {/* Ledger Status Row */}
              <div className={`flex items-start gap-4 p-5 rounded-2xl border transition-colors duration-300
                ${verifyStatus === 'verified' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30' :
                  verifyStatus === 'not_found' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30' :
                    verifyStatus === 'error' ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/30' :
                      'bg-gray-50 dark:bg-gray-700/30 border-transparent opacity-60'}`}>

                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  {verifyStatus === 'verified' ? <CheckCircle className="w-6 h-6 text-green-500" /> :
                    verifyStatus === 'not_found' ? <X className="w-6 h-6 text-red-500" /> :
                      verifyStatus === 'error' ? <AlertTriangle className="w-6 h-6 text-orange-500" /> :
                        <FileSearch className="w-6 h-6 text-gray-300" />}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ledger Confirmation</p>
                  <div className="mt-1">
                    {verifyStatus === 'loading' ? (
                      <div className="w-full">
                        <ScanningAnimation />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 animate-pulse">Scanning immutable data-vessel...</p>
                      </div>
                    ) : verifyStatus === 'verified' ? (
                      <div>
                        <p className="text-sm font-bold text-green-700 dark:text-green-400">Verified Authenticity</p>
                        <p className="text-xs text-green-600/80 dark:text-green-500/60 mt-0.5">
                          Submitted by <span className="font-bold">{result?.student_name}</span> on {result?.submitted_at ? new Date(result.submitted_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    ) : verifyStatus === 'not_found' ? (
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">Not found in public ledger</p>
                    ) : verifyStatus === 'error' ? (
                      <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{result?.message || "Verification failed"}</p>
                    ) : (
                      <p className="text-sm text-gray-400">Upload code to initiate audit</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {verifyStatus === 'verified' && (
                <button
                  onClick={downloadCertificate}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-xl hover:scale-[1.02]"
                >
                  <Download size={20} />
                  Download Authenticated Certificate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-500/20">
            <h2 className="text-2xl font-bold mb-4 tracking-tight">Why verify?</h2>
            <p className="text-sm text-blue-100 leading-relaxed mb-6 opacity-90">
              Vouch uses cryptographic hash chaining to ensure that once a code version is recorded, it cannot be tampered with or reassigned.
            </p>
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-200" />
                </div>
                <span className="text-sm font-medium">Verify structural logic (AST)</span>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-200" />
                </div>
                <span className="text-sm font-medium">Identify the original author</span>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-200" />
                </div>
                <span className="text-sm font-medium">Check timestamp accuracy</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/10 p-7 rounded-3xl border border-orange-100 dark:border-orange-800/20">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h4 className="font-bold text-orange-900 dark:text-orange-400">Notice</h4>
            </div>
            <p className="text-xs font-medium text-orange-800/80 dark:text-orange-300/60 leading-relaxed">
              Files uploaded here are processed in RAM and destroyed after hashing. Submissions only enter the public ledger through the Vouching gateway.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
