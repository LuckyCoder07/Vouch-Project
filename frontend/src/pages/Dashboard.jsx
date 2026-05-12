import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldCheck,
  File,
  X,
  Download,
  RefreshCcw,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ProtocolLog from '../components/ui/ProtocolLog';
import AnchorBadge from '../components/ui/AnchorBadge';

const ACCEPT_MAP = {
  'auto': '.py,.java,.cpp,.txt',
  '.py': '.py',
  '.java': '.java',
  '.cpp': '.cpp,.c,.h',
  '.txt': '.txt'
};

export default function Dashboard() {
  const toast = useToast();
  const { user, profile, session } = useAuth();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState('vouch');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('auto');

  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error, not_found
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);

  const [hashResult, setHashResult] = useState(null);
  const [storeResult, setStoreResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);

  // Derive author name from profile (auto-filled, no manual input)
  const authorName = profile?.name || user?.email?.split('@')[0] || 'Vouch User';

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const processFile = (file) => {
    setSelectedFile(file);
    setProgress(0);
    setActiveStep(-1);
    setUploadState('idle');
    setHashResult(null);
    setStoreResult(null);
    setErrorMessage(null);
  };

  // Helper: delay to make the terminal animation visible
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  async function triggerUpload() {
    if (!selectedFile) return;

    setUploadState('uploading');
    setProgress(5);
    setActiveStep(0); // Step 1: Detecting logic type
    setErrorMessage(null);

    const token = session?.access_token;

    try {
      // --- Step 1: HASH (detect + hash) ---
      await delay(600);
      setActiveStep(1); // Step 2: Generating structural map
      setProgress(20);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', user?.id || '');

      const hashRes = await fetch(`/api/hash`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!hashRes.ok) {
        let errMsg = 'Hashing failed';
        try { const e = await hashRes.json(); errMsg = e.detail || e.message || errMsg; }
        catch { errMsg = (await hashRes.text().catch(() => errMsg)) || errMsg; }
        throw new Error(errMsg);
      }

      const hashData = await hashRes.json();
      setHashResult(hashData);

      await delay(500);
      setActiveStep(2); // Step 3: Calculating SHA3 fingerprint
      setProgress(50);
      await delay(600);

      if (activeTab === 'vouch') {
        setActiveStep(3); // Step 4: Chaining to ledger
        setProgress(75);

        const storeRes = await fetch(`/api/store`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            student_name: authorName,
            file_name: selectedFile.name,
            structural_hash: hashData.structural_hash,
            raw_hash: hashData.raw_hash,
            canonical_string: hashData.canonical_string,
            language: hashData.language,
            user_id: user?.id || null,
            user_email: user?.email || null
          })
        });

        const storeData = await storeRes.json();
        if (!storeRes.ok) {
          let errMsg = 'Storage failed';
          try { errMsg = storeData.detail || storeData.message || errMsg; } catch {}
          throw new Error(errMsg);
        }

        setStoreResult(storeData);
        await delay(400);
        setProgress(100);
        setUploadState('success');
        addNotification('vscore', 'V-Score Milestone', `Successfully notarized ${selectedFile.name}.`, '/profile');

      } else {
        // Verify tab
        setActiveStep(3);
        setProgress(75);

        const verifyForm = new FormData();
        verifyForm.append('file', selectedFile);
        const verifyRes = await fetch(`/api/verify`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: verifyForm
        });

        let verifyData;
        try { verifyData = await verifyRes.json(); }
        catch { throw new Error(await verifyRes.text().catch(() => 'Verification failed')); }
        if (!verifyRes.ok) throw new Error(verifyData.detail || verifyData.message || 'Verification failed');

        setStoreResult(verifyData);
        await delay(400);
        setProgress(100);
        setUploadState(verifyData.status === 'verified' ? 'success' : 'not_found');
      }

    } catch (err) {
      console.error('Upload error:', err);
      setErrorMessage(err.message);
      setUploadState('error');
    }
  }

  const downloadCertificate = async () => {
    if (!hashResult && !storeResult) return;
    const token = session?.access_token;
    try {
      const res = await fetch(`/api/certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          student_name: storeResult?.student_name || authorName,
          file_name: selectedFile.name,
          structural_hash: hashResult?.structural_hash || storeResult?.structural_hash,
          submitted_at: storeResult?.submitted_at,
          verification_code: storeResult?.verification_code
        }),
      });

      if (!res.ok) throw new Error('Failed to generate certificate.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${(storeResult?.student_name || authorName).replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download certificate: ' + err.message);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setProgress(0);
    setActiveStep(-1);
    setErrorMessage(null);
    setHashResult(null);
    setStoreResult(null);
  };

  const isUploading = uploadState === 'uploading';

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Notary Workspace</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Secure, timestamp, and verify your digital assets on the ledger.</p>
        </div>
        {/* Author badge */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 text-sm font-black">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Signing As</p>
            <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{authorName}</p>
          </div>
        </div>
      </div>

      <div className={`bg-white/70 dark:bg-vouch-dark/40 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-blue-900/5 border border-white dark:border-gray-800 relative overflow-hidden transition-all duration-500
              ${isUploading ? 'pointer-events-none' : ''}`}>

        <div className="flex border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => { setActiveTab('vouch'); resetState(); }}
            className={`flex-1 py-5 text-center font-bold text-sm transition-colors duration-200 uppercase tracking-wider flex items-center justify-center gap-2
              ${activeTab === 'vouch' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
          >
            <UploadCloud size={18} /> Upload & Vouch
          </button>
          <button
            onClick={() => { setActiveTab('verify'); resetState(); }}
            className={`flex-1 py-5 text-center font-bold text-sm transition-colors duration-200 uppercase tracking-wider flex items-center justify-center gap-2
              ${activeTab === 'verify' ? 'text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
          >
            <ShieldCheck size={18} /> Verify Authenticity
          </button>
        </div>

        <div className="p-8 md:p-12">
          {uploadState === 'idle' && !selectedFile ? (
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              className={`relative border-3 border-dashed rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center transition-all duration-500 cursor-pointer group
                ${dragActive ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50/10 dark:hover:bg-gray-700/20'}`}
            >
              <input ref={fileInputRef} type="file" accept={ACCEPT_MAP[fileType]} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleChange} />
              <div className={`p-8 rounded-3xl mb-8 shadow-xl ${activeTab === 'vouch' ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-green-600 text-white shadow-green-600/20'}`}>
                {activeTab === 'vouch' ? <UploadCloud size={56} /> : <Search size={56} />}
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Drop code to {activeTab === 'vouch' ? 'notarize' : 'verify'}</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">Anchored to the immutable axiom ledger.</p>
              <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Supports .py · .java · .cpp · .txt</p>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden transition-all duration-500">
              {!isUploading && (
                <button onClick={resetState} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 dark:hover:text-white transition bg-white dark:bg-gray-800 p-2.5 rounded-full shadow-lg border border-gray-100 dark:border-gray-600 z-10"><X size={20} /></button>
              )}

              <div className="flex flex-col items-center max-w-2xl mx-auto">
                <div className="mb-8 text-center">
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2 truncate w-full px-4">{selectedFile?.name}</h4>
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest">{(selectedFile?.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                {uploadState === 'idle' && (
                  <button
                    onClick={triggerUpload}
                    className={`px-12 py-5 text-white font-black rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto uppercase tracking-widest text-sm
                      ${activeTab === 'vouch' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' : 'bg-green-600 hover:bg-green-700 shadow-green-600/30'}`}
                  >
                    Commence {activeTab === 'vouch' ? 'Notarization' : 'Verification'}
                  </button>
                )}

                {/* ── TERMINAL ANIMATION DURING UPLOAD ── */}
                {isUploading && (
                  <div className="w-full space-y-6 animate-in fade-in duration-300">
                    <ProtocolLog
                      activeStep={activeStep}
                      isComplete={false}
                      isError={false}
                    />
                    <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-center text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      {progress}% · Processing Axiom Protocol...
                    </p>
                  </div>
                )}

                {uploadState === 'success' && (
                  <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 text-center">
                    {/* Show completed terminal log first */}
                    <div className="mb-8 text-left">
                      <ProtocolLog activeStep={4} isComplete={true} isError={false} />
                    </div>

                    <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20"><CheckCircle2 size={40} /></div>

                    {activeTab === 'vouch' ? (
                      <>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Successfully Notarized</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">Submission permanently anchored to the ledger.</p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Integrity Verified</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">Originally submitted by <span className="font-bold text-gray-900 dark:text-white">{storeResult?.student_name}</span> on <span className="font-bold text-gray-900 dark:text-white">{new Date(storeResult?.submitted_at).toLocaleDateString()}</span></p>
                      </>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-10 text-left">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Verification ID</p>
                        <p className="text-xl font-mono font-black text-blue-600 dark:text-blue-400 tracking-tighter truncate">{storeResult?.verification_code}</p>
                        <div className="mt-3">
                          <AnchorBadge anchored={false} compact={false} />
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Structural Hash</p>
                        <p className="text-xl font-mono font-black text-gray-600 dark:text-gray-300 tracking-tighter truncate">{hashResult?.structural_hash?.substring(0, 20)}...</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                      <button onClick={downloadCertificate} className="flex-1 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/30 hover:-translate-y-1 active:translate-y-0"><Download size={20} /> Download Certificate</button>
                      <button onClick={resetState} className="flex-1 flex items-center justify-center gap-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-black py-5 rounded-2xl transition-all border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700">New Operation</button>
                    </div>
                  </div>
                )}

                {uploadState === 'not_found' && (
                  <div className="w-full text-center animate-in fade-in zoom-in duration-300">
                    <div className="mb-6">
                      <ProtocolLog activeStep={-1} isComplete={false} isError={true} />
                    </div>
                    <div className="w-20 h-20 bg-orange-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/20"><AlertCircle size={40} /></div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Not Recorded</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">This file has not been recorded in the Vouch ledger. Use the <span className="font-bold text-blue-600">Upload & Vouch</span> tab to register it.</p>
                    <button onClick={resetState} className="px-12 py-5 bg-gray-900 dark:bg-gray-700 text-white font-black rounded-2xl hover:bg-black transition shadow-xl flex items-center justify-center gap-2 mx-auto uppercase tracking-widest text-sm">
                      Try Another File <RefreshCcw size={18} />
                    </button>
                  </div>
                )}

                {uploadState === 'error' && (
                  <div className="w-full text-center">
                    <div className="mb-6">
                      <ProtocolLog activeStep={-1} isComplete={false} isError={true} />
                    </div>
                    <div className="w-20 h-20 bg-red-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/20"><AlertCircle size={40} /></div>
                    <h3 className="text-2xl font-black text-red-600 mb-4">Process Interrupted</h3>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-left mb-8 overflow-x-auto">
                      <p className="text-xs font-mono text-red-800 dark:text-red-400 whitespace-pre-wrap">{errorMessage}</p>
                    </div>
                    <button onClick={resetState} className="px-10 py-4 bg-gray-900 dark:bg-gray-700 text-white font-black rounded-2xl hover:bg-black dark:hover:bg-gray-600 transition shadow-xl hover:-translate-y-1 active:translate-y-0">Try Again</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
