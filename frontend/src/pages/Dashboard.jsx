import API_URL from '../lib/apiUrl.js';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldCheck,
  X,
  Download,
  RefreshCcw,
  Copy,
  Check,
  User,
  FileCode2,
  FolderArchive,
  Clock,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import ProtocolLog from '../components/ui/ProtocolLog';
import AnchorBadge from '../components/ui/AnchorBadge';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardBody, 
  EmptyState, 
  SkeletonText, 
  SkeletonTable,
  StatCard,
  Input
} from '../components/ui';
import { formatDistanceToNow } from 'date-fns';



const ACCEPT_MAP = {
  'auto': '.py,.java,.cpp,.txt',
  '.py': '.py',
  '.java': '.java',
  '.cpp': '.cpp,.c,.h',
  '.txt': '.txt'
};

const STEPPER_STEPS = [
  { number: '1', label: 'Drop File', desc: 'Select or drag your source code file into the notary workspace area.' },
  { number: '2', label: 'Compute Hash', desc: 'Our protocol maps AST nodes and generates a unique structural fingerprint.' },
  { number: '3', label: 'Anchor Record', desc: 'Vouch anchors your fingerprint and metadata permanently on the ledger.' }
];

function DashboardTooltip({ children, content }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root delayDuration={100}>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={8}
            className="z-50 max-w-xs px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-gray-800 rounded-xl shadow-lg border border-gray-800 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            {content}
            <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export default function Dashboard() {
  const toast = useToast();
  const { user, profile, session } = useAuth();
  const { addNotification } = useNotifications();

  // Basic States
  const [limitCheck, setLimitCheck] = useState(null);
  const [activeTab, setActiveTab] = useState('vouch');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('auto');
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error, not_found
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);

  // Result States
  const [hashResult, setHashResult] = useState(null);
  const [storeResult, setStoreResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [assignmentResult, setAssignmentResult] = useState(null);

  // Org States
  const [userOrgs, setUserOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [orgAssignments, setOrgAssignments] = useState([]);

  // Stats / Submissions / Classroom Activity States
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, verified: 0 });
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  // Form input & Confetti states
  const [nameFocused, setNameFocused] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fileInputRef = useRef(null);

  // Pre-fill studentName from profile or email
  const authorName = profile?.name || user?.email?.split('@')[0] || 'Vouch User';
  useEffect(() => {
    if (authorName) {
      setStudentName(authorName);
    }
  }, [authorName]);

  // Fetch limit checks
  const fetchLimitCheck = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/payments/limit-check?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setLimitCheck(data);
      }
    } catch (err) {
      console.error("Failed to check limit", err);
    }
  };

  useEffect(() => {
    fetchLimitCheck();
  }, [user]);

  // Load organizations for user
  useEffect(() => {
    if (user?.id) {
      fetch(`${API_URL}/api/orgs?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => setUserOrgs(data.orgs || []))
        .catch(console.error);
    }
  }, [user]);

  // Load assignments when selectedOrgId changes
  useEffect(() => {
    if (selectedOrgId) {
      fetch(`${API_URL}/api/assignments?org_id=${selectedOrgId}`)
        .then(res => res.json())
        .then(data => setOrgAssignments(data.assignments || []))
        .catch(console.error);
    } else {
      setOrgAssignments([]);
      setSelectedAssignmentId('');
    }
  }, [selectedOrgId]);

  // Fetch Stats and Recent Submissions
  const fetchStatsAndRecords = async () => {
    if (!user?.id) return;
    setRecordsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/records?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.records || [];
        setRecords(list);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeekCount = list.filter(r => new Date(r.submitted_at) >= oneWeekAgo).length;

        setStats({
          total: list.length,
          thisWeek: thisWeekCount,
          verified: 2 // placeholder default
        });
      }
    } catch (err) {
      console.error("Failed to fetch records stats", err);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndRecords();
  }, [user]);

  // Fetch and Subscribe to Classroom Activity Feed
  useEffect(() => {
    if (userOrgs.length === 0) return;
    const orgIds = userOrgs.map(o => o.organizations?.id).filter(Boolean);
    if (orgIds.length === 0) return;

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activity_feed')
          .select('*')
          .in('org_id', orgIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && data) {
          setActivities(data);
        }
      } catch (err) {
        console.error("Failed to fetch classroom activity feed", err);
      }
    };

    fetchActivities();

    const channel = supabase.channel('activity_feed_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed',
      }, (payload) => {
        if (orgIds.includes(payload.new.org_id)) {
          setActivities(prev => [payload.new, ...prev].slice(0, 5));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userOrgs]);

  // Manage Confetti timer
  useEffect(() => {
    if (uploadState === 'success' && activeTab === 'vouch') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadState, activeTab]);

  // Drag and Drop Zone Handlers
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
    setAssignmentResult(null);
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // Fetches a URL with a timeout — prevents the browser from hanging forever
  const fetchWithTimeout = (url, options = {}, timeoutMs = 90000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(id));
  };

  // Wakes up the Render free-tier server before sending real data.
  // Returns true once awake, throws after maxWaitMs.
  const wakeUpBackend = async (maxWaitMs = 70000) => {
    const pingUrl = `${API_URL}/api/ping`;
    const started = Date.now();
    while (Date.now() - started < maxWaitMs) {
      try {
        const res = await fetchWithTimeout(pingUrl, { method: 'GET' }, 10000);
        if (res.ok) return true;
      } catch (_) {
        // server still sleeping — keep trying
      }
      await delay(3000);
    }
    throw new Error('Server took too long to start. Please try again in a moment.');
  };

  async function triggerUpload() {
    if (!selectedFile) return;

    setUploadState('uploading');
    setProgress(5);
    setActiveStep(0);
    setErrorMessage(null);

    const token = session?.access_token;

    try {
      // --- Step 0: Wake up the Render server if it is sleeping ---
      setErrorMessage('🟡 Connecting to server... (first request may take ~30s)');
      await wakeUpBackend();
      setErrorMessage(null);
      // ----------------------------------------------------------

      await delay(600);
      setActiveStep(1);
      setProgress(20);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', user?.id || '');

      const hashRes = await fetchWithTimeout(`${API_URL}/api/hash`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      }, 90000);

      if (!hashRes.ok) {
        let errMsg = 'Hashing failed';
        try { const e = await hashRes.json(); errMsg = e.detail || e.message || errMsg; }
        catch { errMsg = (await hashRes.text().catch(() => errMsg)) || errMsg; }
        throw new Error(errMsg);
      }

      const hashData = await hashRes.json();
      setHashResult(hashData);

      await delay(500);
      setActiveStep(2);
      setProgress(50);
      await delay(600);

      if (activeTab === 'vouch') {
        setActiveStep(3);
        setProgress(75);

        const storeRes = await fetchWithTimeout(`${API_URL}/api/store`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            student_name: studentName,
            file_name: selectedFile.name,
            structural_hash: hashData.structural_hash,
            raw_hash: hashData.raw_hash,
            canonical_string: hashData.canonical_string,
            language: hashData.language,
            user_id: user?.id || null,
            user_email: user?.email || null,
            org_id: selectedOrgId || null,
            assignment_id: selectedAssignmentId || null
          })
        });

        const storeData = await storeRes.json();
        if (!storeRes.ok) {
          let errMsg = 'Storage failed';
          try { errMsg = storeData.detail || storeData.message || errMsg; } catch {}
          throw new Error(errMsg);
        }

        setStoreResult(storeData);

        if (selectedAssignmentId) {
          try {
            const submitRes = await fetch(`${API_URL}/api/assignments/${selectedAssignmentId}/submit`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ submission_id: storeData.id, user_id: user.id })
            });
            if (submitRes.ok) {
              const submitData = await submitRes.json();
              setAssignmentResult(submitData);
            } else {
              const errData = await submitRes.json();
              throw new Error(errData.detail || "Failed to link to assignment");
            }
          } catch (e) {
            console.error("Failed to link assignment", e);
            throw e;
          }
        }

        await delay(400);
        setProgress(100);
        setUploadState('success');
        addNotification('vscore', 'V-Score Milestone', `Successfully notarized ${selectedFile.name}.`, '/profile');
        fetchLimitCheck();
        fetchStatsAndRecords();

      } else {
        // Verify tab
        setActiveStep(3);
        setProgress(75);

        const verifyForm = new FormData();
        verifyForm.append('file', selectedFile);
        const verifyRes = await fetchWithTimeout(`${API_URL}/api/verify`, {
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
        fetchStatsAndRecords();
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
      const res = await fetch(`${API_URL}/api/certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          student_name: storeResult?.student_name || studentName,
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
      a.download = `Certificate_${(storeResult?.student_name || studentName).replace(/\s+/g, '_')}.pdf`;
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
    setAssignmentResult(null);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Verification ID copied');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getLanguageColor = (lang) => {
    const normalized = (lang || '').toLowerCase();
    if (normalized === 'python' || normalized === 'py') return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30';
    if (normalized === 'java') return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30';
    if (normalized === 'cpp' || normalized === 'c++') return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30';
    return 'text-gray-550 bg-gray-50 dark:bg-gray-800 border-gray-150 dark:border-gray-700';
  };

  const getFileExtensionInfo = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'py':
        return { label: 'Python', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' };
      case 'java':
        return { label: 'Java', color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' };
      case 'cpp':
      case 'c':
      case 'h':
        return { label: 'C++', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30' };
      default:
        return { label: 'Text', color: 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-150 dark:border-gray-700' };
    }
  };

  const getRelativeTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'some time ago';
    }
  };

  const isUploading = uploadState === 'uploading';
  const isLimitReached = limitCheck?.remaining === 0 && limitCheck?.plan === 'free' && activeTab === 'vouch';
  const fileInfo = selectedFile ? getFileExtensionInfo(selectedFile.name) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Confetti Trigger */}
      {showConfetti && (
        <Confetti 
          width={window.innerWidth} 
          height={window.innerHeight} 
          recycle={true} 
          numberOfPieces={150} 
        />
      )}

      {/* ROW 1 — Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Vouched"
          value={stats.total}
          icon={<ShieldCheck className="w-5 h-5" />}
          color="blue"
          loading={recordsLoading}
        />
        <StatCard
          label="This Week"
          value={stats.thisWeek}
          icon={<Clock className="w-5 h-5" />}
          color="green"
          loading={recordsLoading}
        />
        <StatCard
          label="Remaining Today"
          value={limitCheck?.remaining ?? '—'}
          icon={<Info className="w-5 h-5" />}
          color={limitCheck?.remaining === 0 ? 'red' : 'orange'}
          loading={recordsLoading}
        />
        <StatCard
          label="Plan"
          value={limitCheck?.plan ? limitCheck.plan.charAt(0).toUpperCase() + limitCheck.plan.slice(1) : 'Free'}
          icon={<User className="w-5 h-5" />}
          color="purple"
          loading={recordsLoading}
        />
      </div>

      {/* ROW 2 — Two Columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN — Upload Zone Card */}
        <div className="lg:col-span-3">
          <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft space-y-6">
            
            {/* Card Header */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Vouch a File
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-semibold">
                Record your code in the immutable ledger
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setActiveTab('vouch'); resetState(); }}
                className={`flex-1 py-2 px-4 text-sm font-semibold transition-all rounded-xl ${
                  activeTab === 'vouch'
                    ? 'bg-vouch-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:text-gray-950 dark:hover:text-gray-100'
                }`}
              >
                Single File
              </button>
              <Link
                to="/batch"
                className="flex-1 py-2 px-4 text-sm font-semibold transition-all rounded-xl text-center bg-gray-100 dark:bg-gray-800 text-gray-600 hover:text-gray-950 dark:hover:text-gray-100"
              >
                Batch Upload
              </Link>
            </div>

            {/* Upload Zone Contents */}
            {uploadState === 'idle' && (
              <div className="space-y-6">
                
                {/* Author input */}
                <Input 
                  label="Author Name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />

                {/* File Spec Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    File Type Spec
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['auto', '.py', '.java', '.cpp', '.txt'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFileType(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          fileType === type
                            ? 'bg-vouch-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-205 dark:hover:bg-gray-750'
                        }`}
                      >
                        {type === 'auto' ? 'Auto Detect' : type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Org dropdowns */}
                {userOrgs.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-500">Select Organization</label>
                      <select
                        value={selectedOrgId}
                        onChange={(e) => { setSelectedOrgId(e.target.value); setSelectedAssignmentId(''); }}
                        className="input w-full"
                      >
                        <option value="">Personal submission (no org)</option>
                        {userOrgs.map(org => (
                          <option key={org.organizations.id} value={org.organizations.id}>
                            {org.organizations.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-500">Select Assignment</label>
                      <select
                        value={selectedAssignmentId}
                        onChange={(e) => setSelectedAssignmentId(e.target.value)}
                        disabled={!selectedOrgId || orgAssignments.length === 0}
                        className="input w-full"
                      >
                        <option value="">No specific assignment</option>
                        {orgAssignments.map(a => {
                          const isOverdue = a.is_overdue;
                          const disableLate = isOverdue && !a.allow_late;
                          return (
                            <option key={a.id} value={a.id} disabled={disableLate}>
                              {a.title} {a.deadline ? `— due ${new Date(a.deadline).toLocaleDateString()}` : ''} {isOverdue ? '(Overdue)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                )}

                {/* Dashed Drop Zone */}
                <div className="space-y-4">
                  {!selectedFile ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center transition-all cursor-pointer ${
                        dragActive
                          ? 'border-vouch-400 bg-vouch-50 dark:bg-vouch-950/20'
                          : 'hover:border-vouch-300 dark:hover:border-vouch-700'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPT_MAP[fileType]}
                        className="hidden"
                        onChange={handleChange}
                      />
                      <UploadCloud className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Drop file to notarize
                      </p>
                      <p className="text-xs text-gray-400">
                        or click to browse
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-950 border border-gray-105 dark:border-gray-800 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="badge-green inline-flex items-center gap-1.5 px-3 py-1 font-semibold text-xs rounded-full">
                          <FileCode2 className="w-4 h-4 text-green-600" />
                          {selectedFile.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => resetState()}
                        className="p-1 text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Vouch Action Button */}
                <button
                  onClick={triggerUpload}
                  disabled={!selectedFile || uploadState === 'uploading'}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  <UploadCloud className="w-5 h-5" />
                  <span>Vouch File</span>
                </button>

              </div>
            )}

            {/* While uploading progress bar details */}
            {uploadState === 'uploading' && (
              <div className="w-full flex flex-col items-center py-6">
                <div className="w-full space-y-4">
                  <div className="relative w-full h-2 bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-vouch-500 to-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-500">
                    <span>{progress}% Completed</span>
                    <span>
                      {progress <= 20 
                        ? "Reading file..." 
                        : progress <= 50 
                          ? "Computing structural hash..." 
                          : progress <= 80 
                            ? "Recording in ledger..." 
                            : "Complete!"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Non-idle results display links (Vouch another file redirect) */}
            {uploadState !== 'idle' && uploadState !== 'uploading' && (
              <button
                onClick={resetState}
                className="w-full btn-secondary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center border border-gray-200 dark:border-gray-800"
              >
                Vouch another file
              </button>
            )}

            {/* Red alert card on limit reached */}
            {limitCheck?.remaining === 0 && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-xl p-4 flex items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="text-xs font-bold text-red-900 dark:text-red-300">
                    Monthly limit reached. Upgrade for unlimited.
                  </span>
                </div>
                <Link 
                  to="/pricing"
                  className="text-xs font-bold text-red-650 dark:text-red-400 hover:underline shrink-0"
                >
                  Upgrade &rarr;
                </Link>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN — Protocol Log + Result */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Vouch Engine
          </h3>

          <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft space-y-6">
            
            {/* Protocol Log mapping */}
            {uploadState === 'idle' && (
              <ProtocolLog
                activeStep={-1}
                isComplete={false}
                isError={false}
              />
            )}

            {uploadState === 'uploading' && (
              <ProtocolLog
                activeStep={activeStep}
                isComplete={false}
                isError={false}
              />
            )}

            {uploadState === 'success' && (
              <ProtocolLog
                activeStep={4}
                isComplete={true}
                isError={false}
              />
            )}

            {uploadState === 'error' && (
              <ProtocolLog
                activeStep={activeStep}
                isComplete={false}
                isError={true}
              />
            )}

            {/* Result states with AnimatePresence */}
            <AnimatePresence mode="wait">
              
              {/* SUCCESS RESULT CARD */}
              {uploadState === 'success' && storeResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800/80 animate-in fade-in"
                >
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-sm">Vouched Successfully</span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-150 dark:border-gray-850 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Verification Code
                      </p>
                      <p className="font-mono text-base font-bold text-gray-900 dark:text-white">
                        {storeResult.verification_code}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(storeResult.verification_code)}
                      className="p-2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-850 text-gray-500 hover:text-gray-950 rounded-lg transition-colors shadow-sm"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {storeResult.submitted_at ? new Date(storeResult.submitted_at).toLocaleDateString() : new Date().toLocaleDateString()}
                    </span>
                    <AnchorBadge anchored={false} compact={true} />
                  </div>

                  {storeResult.plagiarism_detected && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-left text-xs font-semibold text-amber-700 dark:text-amber-400 flex gap-2">
                      <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <span>Plagiarism flag raised — check your org dashboard</span>
                    </div>
                  )}

                  <button
                    onClick={downloadCertificate}
                    className="w-full btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Certificate
                  </button>
                </motion.div>
              )}

              {/* WAKING UP STATUS CARD */}
              {uploadState === 'uploading' && errorMessage && errorMessage.includes('Connecting to server') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/40 rounded-xl text-left text-xs font-semibold text-yellow-700 dark:text-yellow-400 flex gap-2 animate-in fade-in"
                >
                  <span className="shrink-0 mt-0.5 animate-spin">⏳</span>
                  <p className="font-mono">{errorMessage}</p>
                </motion.div>
              )}

              {/* ERROR STATE CARD */}
              {uploadState === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-red-550/5 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-left text-xs font-semibold text-red-700 dark:text-red-400 flex gap-2 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-mono">{errorMessage}</p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* ROW 3 — Recent Activity */}
      <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Recent Submissions
          </h2>
          <Link 
            to="/history" 
            className="text-xs font-bold text-vouch-600 dark:text-vouch-400 hover:underline"
          >
            View All &rarr;
          </Link>
        </div>

        {recordsLoading ? (
          <SkeletonTable rows={3} cols={5} />
        ) : records.length === 0 ? (
          <EmptyState 
            icon={<FileCode2 className="w-10 h-10 text-gray-300 dark:text-gray-750 mx-auto" />}
            title="No submissions yet"
            description="Your vouched files will appear here."
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Language</th>
                  <th>Submitted</th>
                  <th>Verification Code</th>
                  <th>Anchored</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 5).map((record) => (
                  <tr key={record.id}>
                    <td className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                      <Link 
                        to={`/verify/${record.verification_code}`}
                        className="text-vouch-600 dark:text-vouch-400 hover:underline"
                      >
                        {record.file_name}
                      </Link>
                    </td>
                    <td>
                      <span className="badge-blue font-mono text-[9px] py-0.5 px-2 font-semibold">
                        {record.language || 'Code'}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500 dark:text-gray-400">
                      {getRelativeTime(record.submitted_at)}
                    </td>
                    <td className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {record.verification_code}
                    </td>
                    <td>
                      <AnchorBadge anchored={record.anchored} compact={true} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
