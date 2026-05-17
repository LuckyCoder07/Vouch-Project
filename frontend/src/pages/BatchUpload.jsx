import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderArchive, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  File, 
  Download, 
  Copy, 
  ExternalLink,
  Loader2,
  ArrowRight,
  RefreshCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

const API_URL = ''; // Using relative paths as seen in other components

export default function BatchUpload() {
  const { user, profile } = useAuth();
  const toast = useToast();
  
  const [studentName, setStudentName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error
  const [progress, setProgress] = useState(0);
  const [batchResult, setBatchResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [dragWarning, setDragWarning] = useState(null);

  const fileInputRef = useRef(null);

  // Initialize student name from profile
  useEffect(() => {
    if (profile?.name) {
      setStudentName(profile.name);
    } else if (user?.email) {
      setStudentName(user.email.split('@')[0]);
    }
  }, [profile, user]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setDragWarning(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        setSelectedFile(file);
      } else {
        setDragWarning("Only ZIP files are accepted");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        setSelectedFile(file);
        setDragWarning(null);
      } else {
        toast.error("Only ZIP files are accepted");
      }
    }
  };

  const handleBatchUpload = async () => {
    if (!selectedFile || !studentName.trim()) return;

    setUploadState('uploading');
    setProgress(0);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('student_name', studentName.trim());
      formData.append('user_id', user?.id || '');
      formData.append('user_email', user?.email || '');

      // Simulate progress
      setProgress(30);
      const timer = setTimeout(() => setProgress(70), 1000);

      const res = await fetch(`${API_URL}/api/batch`, {
        method: 'POST',
        body: formData,
      });

      clearTimeout(timer);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Batch upload failed');
      }

      setBatchResult(data);
      setProgress(100);
      setUploadState('success');
      toast.success("Batch processed successfully!");
    } catch (err) {
      console.error('Batch upload error:', err);
      setErrorMessage(err.message);
      setUploadState('error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const resetState = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setProgress(0);
    setBatchResult(null);
    setErrorMessage(null);
    setDragWarning(null);
  };

  const downloadCertificate = async (fileResult) => {
    try {
      const res = await fetch(`${API_URL}/api/certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          file_name: fileResult.file_name,
          structural_hash: fileResult.structural_hash,
          submitted_at: fileResult.submitted_at,
          verification_code: fileResult.verification_code
        }),
      });

      if (!res.ok) throw new Error('Failed to generate certificate');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${fileResult.file_name.replace(/\.[^/.]+$/, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (uploadState === 'success' && batchResult) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-green-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Batch Processed</h1>
          <p className="text-gray-500 dark:text-gray-400">All supported files have been analyzed and anchored to the ledger.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Files</p>
            <p className="text-4xl font-black text-gray-900 dark:text-white">{batchResult.total_files}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Successfully Vouched</p>
            <p className="text-4xl font-black text-green-600 dark:text-green-400">{batchResult.successful}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Failed/Skipped</p>
            <p className="text-4xl font-black text-red-500 dark:text-red-400">{batchResult.failed}</p>
          </div>
        </div>

        {/* Batch Code */}
        <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-600/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Batch Reference Code</p>
              <h2 className="text-3xl font-mono font-black tracking-tight">{batchResult.batch_code}</h2>
            </div>
            <button 
              onClick={() => copyToClipboard(batchResult.batch_code)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl font-bold transition-all"
            >
              <Copy size={18} /> Copy Code
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest">File Name</th>
                  <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest">Verification Code</th>
                  <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {batchResult.results.map((file, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-8 py-5 font-bold text-gray-900 dark:text-white">{file.file_name}</td>
                    <td className="px-8 py-5">
                      {file.status === 'success' && <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-black rounded-full uppercase">Vouched</span>}
                      {file.status === 'duplicate' && <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded-full uppercase">Already Exists</span>}
                      {file.status === 'skipped' && <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs font-black rounded-full uppercase">Skipped</span>}
                      {file.status === 'error' && (
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black rounded-full uppercase cursor-help" title={file.reason}>
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 font-mono text-sm text-gray-500 dark:text-gray-400">
                      {file.verification_code || '—'}
                    </td>
                    <td className="px-8 py-5">
                      {file.status === 'success' && (
                        <button onClick={() => downloadCertificate(file)} className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1">
                          <Download size={14} /> Cert
                        </button>
                      )}
                      {file.status === 'duplicate' && (
                        <a href={`/verify/${file.verification_code}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1">
                          <ExternalLink size={14} /> View
                        </a>
                      )}
                      {file.status !== 'success' && file.status !== 'duplicate' && <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-center pt-6">
          <button 
            onClick={resetState}
            className="px-10 py-4 bg-gray-900 dark:bg-gray-700 text-white font-black rounded-2xl hover:bg-black transition shadow-xl flex items-center gap-2"
          >
            Vouch Another Batch <RefreshCcw size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Batch Vouch</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Upload a ZIP file to vouch multiple code files at once.</p>
        </div>
        
        {/* Author badge */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 text-sm font-black">
            {studentName.charAt(0).toUpperCase() || 'V'}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Signing As</p>
            <input 
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="text-sm font-black text-gray-900 dark:text-white leading-tight bg-transparent border-none p-0 focus:ring-0 w-32"
              placeholder="Your Name"
            />
          </div>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-vouch-dark/40 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-blue-900/5 border border-white dark:border-gray-800 relative overflow-hidden transition-all duration-500">
        
        {uploadState === 'error' && (
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-4 duration-300">
            <AlertCircle className="text-red-600 mt-1 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h4 className="font-bold text-red-900 dark:text-red-400">Upload Failed</h4>
              <p className="text-sm text-red-700 dark:text-red-500 mb-4">{errorMessage}</p>
              <button 
                onClick={() => setUploadState('idle')}
                className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {uploadState === 'uploading' ? (
          <div className="p-12 text-center space-y-8 animate-in fade-in duration-500">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-100 dark:border-gray-800 rounded-full" />
              <div 
                className="absolute inset-0 border-4 border-blue-600 rounded-full transition-all duration-700 ease-out"
                style={{ 
                  clipPath: `inset(${100 - progress}% 0 0 0)`,
                  transform: 'rotate(-90deg)' 
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Analyzing Batch...</h3>
              <p className="text-gray-500 dark:text-gray-400">Processing individual files and calculating fingerprints.</p>
            </div>
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-3 text-xs font-black text-gray-400 uppercase tracking-widest">{progress}% Complete</p>
            </div>
          </div>
        ) : !selectedFile ? (
          <div
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`relative border-3 border-dashed rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center transition-all duration-500 cursor-pointer group
              ${dragActive ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50/10 dark:hover:bg-gray-700/20'}`}
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".zip" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={handleFileChange} 
            />
            <div className="p-8 rounded-3xl mb-8 bg-blue-600 text-white shadow-xl shadow-blue-600/20">
              <FolderArchive size={56} />
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Drop your ZIP file here</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">Supports .py .java .cpp .txt files inside the ZIP. Max 50MB.</p>
            {dragWarning && (
              <p className="mt-4 text-sm font-bold text-red-500 flex items-center gap-2">
                <AlertCircle size={16} /> {dragWarning}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-12 text-center animate-in zoom-in-95 duration-300">
            <button onClick={resetState} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 dark:hover:white transition bg-white dark:bg-gray-800 p-2.5 rounded-full shadow-lg border border-gray-100 dark:border-gray-600 z-10"><X size={20} /></button>
            
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <File size={40} />
            </div>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{selectedFile.name}</h4>
            <div className="flex items-center justify-center gap-2 mb-10">
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs font-black text-gray-500 uppercase tracking-widest">{(selectedFile.size / 1024).toFixed(1)} KB</span>
              <span className="text-gray-400">·</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold text-sm uppercase tracking-wider">Ready to batch vouch</span>
            </div>

            <button
              onClick={handleBatchUpload}
              disabled={!studentName.trim()}
              className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Batch Vouch <ArrowRight className="inline-block ml-2" size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
