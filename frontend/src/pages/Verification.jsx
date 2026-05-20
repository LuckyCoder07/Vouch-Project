import API_URL from '../lib/apiUrl.js';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, Upload, CheckCircle, AlertTriangle, X, ShieldCheck, Link2, 
  Clock, FileCode2, Code2, ChevronDown, ChevronUp, Copy, Share2, 
  ExternalLink, Download, Star, AlertCircle, XCircle, CheckCircle2, Loader2, UploadCloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { formatDistanceToNow } from 'date-fns';
import { Button, Avatar, Input } from '../components/ui';
import AnchorBadge from '../components/ui/AnchorBadge';



const SCAN_STEPS = [
  { label: "INITIALIZING VOUCH PROTOCOL", duration: 400 },
  { label: "STRIPPING COMMENTS & WHITESPACE", duration: 400 },
  { label: "GENERATING UNIQUE FINGERPRINT", duration: 400 },
  { label: "COMPUTING SECURE HASH (SHA3-256)", duration: 400 },
  { label: "QUERYING IMMUTABLE LEDGER", duration: 400 },
];

export default function Verification() {
  const { session } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [mode, setMode] = useState('file'); // 'file' | 'code'
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [verifyState, setVerifyState] = useState('idle'); // 'idle' | 'loading' | 'verified' | 'not_found' | 'error'
  const [result, setResult] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [recentVerifications, setRecentVerifications] = useState([]);
  
  const [showHash, setShowHash] = useState(false);
  const [showNotFoundReasons, setShowNotFoundReasons] = useState(false);

  // Load recents on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('vouch_recent_verifications')) || [];
      setRecentVerifications(stored);
    } catch (e) {
      setRecentVerifications([]);
    }
  }, []);

  const saveRecent = (data, status) => {
    const newItem = {
      id: Date.now(),
      code: data.verification_code || verificationCode,
      name: data.file_name || selectedFile?.name || 'Manual Code',
      status, // 'verified' | 'not_found'
      timestamp: new Date().toISOString()
    };
    
    setRecentVerifications(prev => {
      const updated = [newItem, ...prev.filter(item => item.code !== newItem.code)].slice(0, 5);
      localStorage.setItem('vouch_recent_verifications', JSON.stringify(updated));
      return updated;
    });
  };

  const formatCodeInput = (val) => {
    // Keep only alphanumeric
    let clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Auto insert VCH if user types something else
    if (clean.length > 0 && !clean.startsWith('VCH')) {
      clean = 'VCH' + clean;
    }

    // Insert hyphens: VCH-XXXX-XXXX
    let formatted = '';
    for (let i = 0; i < clean.length; i++) {
      if (i === 3 || i === 7) formatted += '-';
      formatted += clean[i];
    }
    return formatted.slice(0, 13);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const runVerification = async (fetchPromise, isFile = false) => {
    setVerifyState('loading');
    setResult(null);
    setErrorMessage('');

    // Fake loading delay for aesthetics based on steps
    const minLoadTime = SCAN_STEPS.reduce((a, b) => a + b.duration, 0);
    const start = Date.now();

    try {
      const response = await fetchPromise;
      const data = await response.json();
      
      const elapsed = Date.now() - start;
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      await new Promise(r => setTimeout(r, remainingTime));

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Verification failed");
      }

      setResult(data);
      if (data.status === 'verified') {
        setVerifyState('verified');
        saveRecent(data, 'verified');
      } else if (data.status === 'not_found') {
        setVerifyState('not_found');
        saveRecent(data, 'not_found');
      } else {
        throw new Error("Unknown status received.");
      }

    } catch (err) {
      setErrorMessage(err.message || "Network error");
      setVerifyState('error');
    }
  };

  const handleVerifyFile = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    const headers = {};
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    const req = fetch(`${API_URL}/api/verify`, {
      method: 'POST',
      headers,
      body: formData
    });
    runVerification(req, true);
  };

  const handleVerifyCode = (codeToVerify = verificationCode) => {
    if (!codeToVerify) return;
    const cleanCode = codeToVerify.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    const req = fetch(`${API_URL}/api/verify/${cleanCode}`, {
      method: 'GET',
      headers
    });
    runVerification(req, false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleShare = () => {
    const url = `${window.location.origin}/verify/${result?.verification_code}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied to clipboard!");
  };

  const handleDownloadCert = async () => {
    if (!result) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`${API_URL}/api/certificate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          student_name: result.student_name || 'Verified User',
          file_name: result.file_name || 'Code_Snippet',
          structural_hash: result.structural_hash,
          submitted_at: result.submitted_at,
          verification_code: result.verification_code
        })
      });

      if (!res.ok) throw new Error("Failed to generate certificate.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Vouch_Certificate_${result.verification_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Download failed: " + e.message);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN — Verification Panel */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Page header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verify Code Authenticity
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Check if a file or verification code exists in the Vouch ledger.
            </p>
          </div>

          {/* Verification Card */}
          <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft">
            
            {/* Mode toggle */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setMode('file')}
                className={`flex-1 py-2 px-4 text-sm font-semibold transition-all ${
                  mode === 'file'
                    ? 'bg-vouch-600 text-white rounded-xl'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl hover:text-gray-950 dark:hover:text-gray-100'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setMode('code')}
                className={`flex-1 py-2 px-4 text-sm font-semibold transition-all ${
                  mode === 'code'
                    ? 'bg-vouch-600 text-white rounded-xl'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl hover:text-gray-950 dark:hover:text-gray-100'
                }`}
              >
                Enter Code
              </button>
            </div>

            {/* File mode drop zone */}
            {mode === 'file' && (
              <div className="space-y-4">
                {!selectedFile ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center transition-all cursor-pointer ${
                      dragActive
                        ? 'border-vouch-400 bg-vouch-50 dark:bg-vouch-950/20'
                        : 'hover:border-vouch-300 dark:hover:border-vouch-700'
                    }`}
                  >
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => setSelectedFile(e.target.files?.[0])}
                    />
                    <UploadCloud className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-gray-750 dark:text-gray-350 mb-1">
                      Drop your file here
                    </p>
                    <p className="text-xs text-gray-400">
                      or click to browse
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="badge-green inline-flex items-center gap-1.5 px-3 py-1 font-semibold text-xs rounded-full">
                        <FileCode2 className="w-4 h-4" />
                        {selectedFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Code mode input */}
            {mode === 'code' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-350">
                  Enter Verification Code
                </label>
                <Input
                  placeholder="VCH-XXXX-XXXX"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(formatCodeInput(e.target.value))}
                />
                <p className="text-xs text-gray-400">
                  Format: VCH-XXXX-XXXX
                </p>
              </div>
            )}

            {/* Verify button */}
            <button
              onClick={mode === 'file' ? handleVerifyFile : () => handleVerifyCode()}
              disabled={
                verifyState === 'loading' ||
                (mode === 'file' ? !selectedFile : !verificationCode || verificationCode.length < 13)
              }
              className="w-full btn-primary flex items-center justify-center gap-2 mt-6 py-3"
            >
              {verifyState === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
              <span>Verify</span>
            </button>

            {/* Result states with AnimatePresence */}
            <AnimatePresence mode="wait">
              
              {/* VERIFIED RESULT CARD */}
              {verifyState === 'verified' && result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 rounded-2xl p-6 space-y-6 mt-6 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-100 dark:bg-green-950 rounded-xl text-green-600 shrink-0">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-bold text-lg text-green-800 dark:text-green-300 truncate">
                        {result.student_name || 'Verified User'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-green-700/80 dark:text-green-400/80">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                          {result.file_name}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(result.submitted_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span>•</span>
                        <span className="badge-blue font-mono text-[10px] py-0.5 px-2 font-semibold">
                          {result.language || 'text'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-green-200/50 dark:border-green-800/40">
                    <AnchorBadge anchored={result.anchored} compact={false} />
                    <button
                      onClick={handleDownloadCert}
                      className="btn-primary py-2 px-4 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Certificate
                    </button>
                  </div>

                  <div className="bg-white dark:bg-gray-950/80 border border-green-200/60 dark:border-green-900/30 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Verification Code
                      </p>
                      <p className="font-mono text-base font-bold text-gray-900 dark:text-white tracking-wide">
                        {result.verification_code}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(result.verification_code)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-650 dark:text-gray-450 hover:text-gray-950 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                      title="Copy Code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* NOT FOUND RESULT CARD */}
              {verifyState === 'not_found' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-orange-50 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-900/30 rounded-2xl p-6 mt-6 space-y-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-950 text-orange-650 rounded-xl shrink-0">
                      <XCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h3 className="font-bold text-lg text-orange-850 dark:text-orange-300">
                        Not Found in Ledger
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-400 leading-relaxed">
                        This file has not been vouched or has been modified.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-orange-200/50 dark:border-orange-900/30 pt-4">
                    <button
                      onClick={() => setShowNotFoundReasons(!showNotFoundReasons)}
                      className="flex items-center justify-between w-full text-xs font-bold text-orange-800 dark:text-orange-300 hover:underline"
                    >
                      <span>Why did this happen?</span>
                      {showNotFoundReasons ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {showNotFoundReasons && (
                      <div className="mt-3 p-4 bg-white dark:bg-gray-950 rounded-xl border border-orange-200/40 dark:border-orange-950/80 space-y-2">
                        <p className="text-xs text-gray-500 flex gap-2">
                          <span className="text-orange-500">•</span>
                          The file may have been modified since it was originally submitted.
                        </p>
                        <p className="text-xs text-gray-500 flex gap-2">
                          <span className="text-orange-500">•</span>
                          This file was never registered with Vouch.
                        </p>
                        <p className="text-xs text-gray-500 flex gap-2">
                          <span className="text-orange-500">•</span>
                          The verification code entered is incorrect.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ERROR RESULT CARD */}
              {verifyState === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 mt-6 flex items-start gap-4 shadow-sm"
                >
                  <div className="p-2 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-bold text-lg text-red-850 dark:text-red-300">
                      Verification Error
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </div>
        </div>

        {/* RIGHT COLUMN — Recent Verifications */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Recent Verifications
          </h2>

          {recentVerifications.length === 0 ? (
            <div className="card p-8 flex flex-col items-center justify-center text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft">
              <p className="text-xs text-gray-400">
                No verifications yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVerifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setMode('code');
                    setVerificationCode(item.code);
                    handleVerifyCode(item.code);
                  }}
                  className="w-full text-left card p-4 hover:border-vouch-500/50 hover:shadow-sm transition-all duration-300 flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft"
                >
                  <div className="space-y-1 min-w-0 pr-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs font-mono text-gray-450">
                      {item.code}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={
                        item.status === 'verified'
                          ? 'badge-green text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider'
                          : 'badge-red text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider'
                      }
                    >
                      {item.status === 'verified' ? 'Verified' : 'Not Found'}
                    </span>
                    <span className="text-[10px] text-gray-450">
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
