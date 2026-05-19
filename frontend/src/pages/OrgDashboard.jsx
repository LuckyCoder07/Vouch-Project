import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { 
  Building2, 
  Users, 
  FileCode2, 
  BookOpen, 
  AlertTriangle, 
  Search, 
  Download, 
  Copy, 
  Trash2, 
  X, 
  MoreVertical, 
  Plus, 
  Trophy, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  UserPlus,
  Lock,
  BarChart2,
  Key
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardBody, 
  EmptyState, 
  StatCard,
  SkeletonText, 
  SkeletonTable,
  Avatar
} from '../components/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DashboardTooltip = ({ children, content }) => {
  return (
    <span title={content} className="cursor-help hover:underline">
      {children}
    </span>
  );
};

const getRelativeTime = (dateStr) => {
  if (!dateStr) return 'unknown';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch (e) {
    return 'unknown';
  }
};

export default function OrgDashboard() {
  const { user, profile } = useAuth();
  const toast = useToast();
  
  // Lists
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [plagiarismFlags, setPlagiarismFlags] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [activities, setActivities] = useState([]);

  // States
  const [orgStats, setOrgStats] = useState({}); // key: orgId, value: { members, submissions }
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Forms
  const [inviteEmail, setInviteEmail] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState('classroom');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  // New Assignment Form State
  const [newAssignment, setNewAssignment] = useState({
    title: '', description: '', deadline: '', allowLate: false
  });

  // API Key Form State
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [generatedKeyData, setGeneratedKeyData] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLang, setFilterLang] = useState('all');
  const [filterAssignment, setFilterAssignment] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  // Real-time toast list banner states
  const [newSubsList, setNewSubsList] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchOrgs();
    }
  }, [user]);

  // Fetch all user organizations
  const fetchOrgs = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const res = await fetch(`${API_URL}/api/orgs?user_id=${user.id}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      
      setOrgs(data.orgs || []);
      if (data.orgs && data.orgs.length > 0) {
        if (!selectedOrg) {
          const firstOrg = data.orgs[0].organizations;
          firstOrg.user_role = data.orgs[0].role;
          setSelectedOrg(firstOrg);
          loadOrgData(firstOrg);
        }
      }
    } catch (err) {
      console.error("fetchOrgs error:", err);
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Member & Submission counts for Left Panel org cards
  useEffect(() => {
    if (orgs.length > 0) {
      orgs.forEach(async (o) => {
        try {
          const orgId = o.organizations.id;
          const [memRes, subRes] = await Promise.all([
            fetch(`${API_URL}/api/orgs/${orgId}/members`),
            fetch(`${API_URL}/api/orgs/${orgId}/submissions`)
          ]);
          const mem = memRes.ok ? await memRes.json() : { members: [] };
          const sub = subRes.ok ? await subRes.json() : { submissions: [] };
          setOrgStats(prev => ({
            ...prev,
            [orgId]: {
              members: mem.members?.length || 0,
              submissions: sub.submissions?.length || 0
            }
          }));
        } catch (err) {
          console.error(err);
        }
      });
    }
  }, [orgs]);

  // Load organization-specific data
  const loadOrgData = async (org) => {
    try {
      const [memRes, subRes, assgnRes, plagRes, keysRes] = await Promise.all([
        fetch(`${API_URL}/api/orgs/${org.id}/members`),
        fetch(`${API_URL}/api/orgs/${org.id}/submissions`),
        fetch(`${API_URL}/api/assignments?org_id=${org.id}`),
        fetch(`${API_URL}/api/plagiarism?org_id=${org.id}`),
        org.user_role === 'admin' ? fetch(`${API_URL}/api/orgs/${org.id}/api-keys`) : Promise.resolve({ ok: true, json: () => [] })
      ]);
      
      const memData = memRes.ok ? await memRes.json() : { members: [] };
      const subData = subRes.ok ? await subRes.json() : { submissions: [] };
      const assgnData = assgnRes.ok ? await assgnRes.json() : { assignments: [] };
      const plagData = plagRes.ok ? await plagRes.json() : { flags: [] };
      const keysData = keysRes.ok ? await keysRes.json() : [];

      setMembers(memData.members || []);
      setSubmissions(subData.submissions || []);
      setAssignments(assgnData.assignments || []);
      setPlagiarismFlags(plagData.flags || []);
      setApiKeys(keysData || []);

      // Load initial activities
      const { data: actFeed, error: actErr } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('org_id', org.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!actErr && actFeed) {
        setActivities(actFeed);
      }
    } catch (err) {
      console.error("Error loading org data:", err);
    }
  };

  // Real-time Subscriptions setup
  useEffect(() => {
    if (!selectedOrg?.id) return;

    // 1. Submissions listener
    const subChannel = supabase.channel(`org-submissions-${selectedOrg.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'submissions',
        filter: `org_id=eq.${selectedOrg.id}`
      }, (payload) => {
        const newSub = payload.new;
        toast.success(`📄 ${newSub.student_name} submitted ${newSub.file_name}`);
        
        // Show "↑ New submission" banner if currently viewing the Submissions tab
        if (activeTab === 'submissions') {
          setNewSubsList(prev => [newSub, ...prev]);
        } else {
          setSubmissions(prev => [newSub, ...prev]);
        }

        // Add to activities list
        const newAct = {
          id: newSub.id,
          org_id: selectedOrg.id,
          user_name: newSub.student_name,
          action: `submitted ${newSub.file_name}`,
          created_at: newSub.submitted_at || new Date().toISOString(),
          type: 'submission'
        };
        setActivities(prev => [newAct, ...prev].slice(0, 30));

        // Increment member submission count locally
        setMembers(prev => prev.map(m => {
          if (m.profiles?.name === newSub.student_name) {
            return { ...m, submission_count: (m.submission_count || 0) + 1 };
          }
          return m;
        }));

        // Increment Left Panel Stats
        setOrgStats(prev => {
          const current = prev[selectedOrg.id] || { members: 0, submissions: 0 };
          return {
            ...prev,
            [selectedOrg.id]: { ...current, submissions: current.submissions + 1 }
          };
        });
      })
      .subscribe();

    // 2. Plagiarism flags listener
    const flagChannel = supabase.channel(`org-flags-${selectedOrg.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'plagiarism_flags',
        filter: `org_id=eq.${selectedOrg.id}`
      }, (payload) => {
        toast.error("⚠️ Potential plagiarism detected");
        
        // Fetch plagiarism flags again to get hydrated comparison student names
        fetch(`${API_URL}/api/plagiarism?org_id=${selectedOrg.id}`)
          .then(res => res.json())
          .then(data => setPlagiarismFlags(data.flags || []))
          .catch(console.error);
      })
      .subscribe();

    // 3. Activity feed listener
    const activityChannel = supabase.channel(`org-activities-${selectedOrg.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed',
        filter: `org_id=eq.${selectedOrg.id}`
      }, (payload) => {
        setActivities(prev => [payload.new, ...prev].slice(0, 30));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subChannel);
      supabase.removeChannel(flagChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [selectedOrg, activeTab]);

  const handleSelectOrg = (orgRoleWrapper) => {
    const org = orgRoleWrapper.organizations;
    org.user_role = orgRoleWrapper.role;
    setSelectedOrg(org);
    setActiveTab('overview');
    setInviteOpen(false);
    setShowCreateAssignment(false);
    setNewSubsList([]);
    loadOrgData(org);
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/orgs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOrgName,
          description: newOrgDesc,
          org_type: newOrgType,
          owner_id: user.id
        })
      });
      if (!res.ok) throw new Error('Failed to create organization');
      setShowCreateModal(false);
      fetchOrgs();
      setNewOrgName('');
      setNewOrgDesc('');
      toast.success("Organization created successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleJoinOrg = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/orgs/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: joinCode.toUpperCase(),
          user_id: user.id
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to join organization');
      }
      setShowJoinModal(false);
      setJoinCode('');
      fetchOrgs();
      toast.success("Successfully joined organization");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/orgs/${selectedOrg.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, invited_by_name: user.name })
      });
      if (!res.ok) throw new Error('Failed to send invite');
      setInviteSent(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await fetch(`${API_URL}/api/orgs/${selectedOrg.id}/members/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Member removed successfully");
        loadOrgData(selectedOrg);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: selectedOrg.id,
          created_by: user.id,
          title: newAssignment.title,
          description: newAssignment.description,
          deadline: newAssignment.deadline ? new Date(newAssignment.deadline).toISOString() : null,
          allow_late: newAssignment.allowLate
        })
      });
      if (!res.ok) throw new Error('Failed to create assignment');
      setShowCreateAssignment(false);
      setNewAssignment({ title: '', description: '', deadline: '', allowLate: false });
      loadOrgData(selectedOrg);
      toast.success("Assignment created successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      const res = await fetch(`${API_URL}/api/assignments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Assignment deleted");
        loadOrgData(selectedOrg);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveFlag = async (flagId, status) => {
    try {
      const res = await fetch(`${API_URL}/api/plagiarism/${flagId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_id: user.id, status })
      });
      if (res.ok) {
        toast.success(`Flag successfully ${status === 'confirmed' ? 'confirmed' : 'cleared'}`);
        loadOrgData(selectedOrg);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/orgs/${selectedOrg.id}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newKeyLabel, created_by: user.id })
      });
      if (!res.ok) throw new Error('Failed to create API key');
      const data = await res.json();
      setGeneratedKeyData(data);
      setNewKeyLabel('');
      
      const keysRes = await fetch(`${API_URL}/api/orgs/${selectedOrg.id}/api-keys`);
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData || []);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenInvite = () => {
    setInviteOpen(true);
    setInviteSent(false);
    setInviteEmail('');
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRevokeApiKey = async (keyId) => {
    if (!window.confirm('Revoke this API Key? Any integrations using it will break.')) return;
    try {
      const res = await fetch(`${API_URL}/api/orgs/${selectedOrg.id}/api-keys/${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("API key revoked");
        loadOrgData(selectedOrg);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrg = async () => {
    const confirmation = window.confirm(`CRITICAL: Are you sure you want to delete "${selectedOrg.name}"? This will delete all members, assignments, and associated data permanently.`);
    if (!confirmation) return;

    try {
      const res = await fetch(`${API_URL}/api/orgs/${selectedOrg.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete organization');
      
      toast.success('Organization deleted successfully');
      setSelectedOrg(null);
      fetchOrgs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLeaveOrg = async () => {
    if (!window.confirm('Are you sure you want to leave this organization?')) return;
    try {
      const res = await fetch(`${API_URL}/api/orgs/${selectedOrg.id}/members/${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Successfully left organization");
        setSelectedOrg(null);
        fetchOrgs();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    } catch (err) {
      toast.error("Failed to download certificate: " + err.message);
    }
  };

  const handleExportCSV = () => {
    if (finalFilteredSubmissions.length === 0) {
      toast.error("No submissions to export");
      return;
    }
    const headers = ['Student', 'File', 'Language', 'Submitted At', 'Verification Code', 'Structural Hash'];
    const rows = finalFilteredSubmissions.map(sub => [
      sub.student_name,
      sub.file_name,
      sub.language,
      sub.submitted_at,
      sub.verification_code,
      sub.structural_hash
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `submissions_report_${selectedOrg.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report exported successfully");
  };

  const handleDownloadFlagCert = (sub, structuralHash) => {
    downloadCertificate({
      student_name: sub.student_name,
      file_name: sub.file_name,
      submitted_at: sub.submitted_at,
      verification_code: sub.verification_code,
      structural_hash: structuralHash
    });
  };

  // Helper getters
  const getOrgAvatar = (name) => {
    const words = name.split(' ');
    const initials = words.map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const colors = [
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return { initials, colorClass: colors[Math.abs(hash) % colors.length] };
  };

  const getDeadlineInfo = (deadlineStr) => {
    if (!deadlineStr) return { text: 'No deadline', color: 'text-gray-500 bg-gray-50 dark:bg-gray-800' };
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline - now;
    if (diffMs < 0) return { text: 'Closed', color: 'text-gray-550 bg-gray-50 dark:bg-gray-800', isClosed: true };
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffHours / 24);
    if (diffHours < 24) return { text: `${diffHours} hour${diffHours > 1 ? 's' : ''} left`, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 animate-pulse', pulse: true };
    return { text: `${diffDays} day${diffDays > 1 ? 's' : ''} left`, color: 'text-green-600 bg-green-50 dark:bg-green-950/20' };
  };

  const getSubmissionLateStatus = (submittedAtStr, deadlineStr) => {
    if (!deadlineStr) return { label: 'On Time', color: 'text-green-650 bg-green-50 dark:bg-green-950/20' };
    const subTime = new Date(submittedAtStr);
    const deadline = new Date(deadlineStr);
    if (subTime > deadline) return { label: 'Late', color: 'text-red-600 bg-red-50 dark:bg-red-950/20' };
    return { label: 'On Time', color: 'text-green-650 bg-green-50 dark:bg-green-950/20' };
  };

  const getActivityIconInfo = (type) => {
    switch (type) {
      case 'submission':
        return { icon: <FileCode2 className="w-4 h-4" />, bg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' };
      case 'join':
        return { icon: <UserPlus className="w-4 h-4" />, bg: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' };
      case 'flag':
        return { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 animate-pulse' };
      case 'assignment':
        return { icon: <BookOpen className="w-4 h-4" />, bg: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' };
      default:
        return { icon: <FileCode2 className="w-4 h-4" />, bg: 'bg-gray-50 dark:bg-gray-800 text-gray-500' };
    }
  };

  // Compute Dynamic Leaderboard
  const getLeaderboard = () => {
    const statsMap = {};
    members.forEach(m => {
      const name = m.profiles?.name || 'Unknown';
      statsMap[name] = { name, submissions: 0, onTime: 0, avatar: name.charAt(0) };
    });
    submissions.forEach(sub => {
      const name = sub.student_name;
      if (!statsMap[name]) statsMap[name] = { name, submissions: 0, onTime: 0, avatar: name.charAt(0) };
      statsMap[name].submissions += 1;
      // Default all assignment submissions to on-time if no explicit late match is present
      statsMap[name].onTime += 1;
    });
    return Object.values(statsMap)
      .map(s => ({ ...s, score: (s.submissions * 10) + (s.onTime * 5) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  // Filter Submissions
  const finalFilteredSubmissions = submissions.filter(sub => {
    const matchSearch = sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        sub.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLang = filterLang === 'all' || (sub.language || '').toLowerCase() === filterLang.toLowerCase();
    const matchAssignment = filterAssignment === 'all' || sub.assignment_id === filterAssignment;
    
    let matchDate = true;
    if (filterDate !== 'all') {
      const subDate = new Date(sub.submitted_at);
      const now = new Date();
      const diffTime = Math.abs(now - subDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (filterDate === 'today' && diffDays > 1) matchDate = false;
      else if (filterDate === 'week' && diffDays > 7) matchDate = false;
      else if (filterDate === 'month' && diffDays > 30) matchDate = false;
    }
    return matchSearch && matchLang && matchAssignment && matchDate;
  });

  const isAdmin = selectedOrg?.user_role === 'admin';
  const pendingFlags = plagiarismFlags.filter(f => f.status === 'pending');
  const leaderboard = getLeaderboard();
  const maxScore = leaderboard[0]?.score || 1;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 select-none">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-vouch-600 mb-4" />
        <p className="text-xs font-semibold text-gray-500 animate-pulse">Loading secure workrooms...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center select-none">
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl mb-4 border border-red-200 dark:border-red-900/30">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Failed to Load Dashboard</h2>
        <p className="text-xs text-gray-450 dark:text-gray-400 mb-6 max-w-sm">{fetchError}</p>
        <Button onClick={fetchOrgs} variant="primary">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-950 select-none">
      
      {/* LEFT PANEL: Org list + controls */}
      <div className="w-72 border-r border-gray-150 dark:border-gray-850 flex flex-col bg-white dark:bg-gray-900 shrink-0">
        
        {/* Left Panel Header */}
        <div className="p-5 border-b border-gray-150 dark:border-gray-850 flex items-center justify-between">
          <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Organizations</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1.5 border border-gray-250/20 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Org List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {orgs.map((o) => {
            const avatar = getOrgAvatar(o.organizations.name);
            const stats = orgStats[o.organizations.id] || { members: 0, submissions: 0 };
            const isSelected = selectedOrg?.id === o.organizations.id;
            
            return (
              <div
                key={o.organizations.id}
                onClick={() => handleSelectOrg(o)}
                className={`flex gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'border-vouch-300 bg-vouch-50/40 dark:border-vouch-800 dark:bg-vouch-950/25 border-l-3 border-l-vouch-500'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${avatar.colorClass}`}>
                  {avatar.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-vouch-600 dark:text-vouch-400' : 'text-gray-900 dark:text-white'}`}>
                      {o.organizations.name}
                    </p>
                    <span className="text-[8px] font-black uppercase bg-gray-100 dark:bg-gray-850 text-gray-500 dark:text-gray-400 px-1 rounded-sm">
                      {o.organizations.org_type === 'classroom' ? 'Class' : 'Team'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    {stats.members} {stats.members === 1 ? 'member' : 'members'} &bull; {stats.submissions} sub{stats.submissions === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Join Org Button at bottom */}
        <div className="p-4 border-t border-gray-150 dark:border-gray-850">
          <Button 
            variant="ghost" 
            className="w-full justify-center text-xs font-bold border border-gray-250/20"
            onClick={() => setShowJoinModal(true)}
          >
            Join with Code
          </Button>
        </div>
      </div>

      {/* RIGHT PANEL: Workspace Details */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
        
        {!selectedOrg ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center select-none">
            <div className="max-w-sm space-y-6">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded-2xl mx-auto shadow-sm">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Workspace Desk</h3>
                <p className="text-xs text-gray-400 font-semibold max-w-xs mx-auto leading-relaxed">
                  Select an organization from the left panel or register a new one to initialize the dashboard.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                  Create Classroom
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowJoinModal(true)}>
                  Join with Code
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Topbar */}
            <div className="px-6 py-4 border-b border-gray-150 dark:border-gray-850 flex items-center justify-between bg-white dark:bg-gray-900 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{selectedOrg.name}</h2>
                <span className="text-[8px] font-black uppercase tracking-widest bg-vouch-50 dark:bg-vouch-950/20 text-vouch-650 dark:text-vouch-400 border border-vouch-100 dark:border-vouch-800 px-2 py-0.5 rounded-full">
                  {selectedOrg.org_type}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-850 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {members.length} {members.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-950/20 rounded-lg text-green-600 mr-2 border border-green-100 dark:border-green-900/30">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Live</span>
                </div>
                {isAdmin && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleOpenInvite}>
                      Invite Member
                    </Button>
                    <Link to={`/org/${selectedOrg.id}/report`}>
                      <Button variant="primary" size="sm">
                        Export Report
                      </Button>
                    </Link>
                  </>
                )}
                
                {/* Actions Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <MoreVertical className="w-4.5 h-4.5" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        {isAdmin ? (
                          <button
                            onClick={() => { setMenuOpen(false); handleDeleteOrg(); }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                          >
                            Delete Workspace
                          </button>
                        ) : (
                          <button
                            onClick={() => { setMenuOpen(false); handleLeaveOrg(); }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                          >
                            Leave Workspace
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
                       {/* ORG SELECTOR (shown above tabs when orgs.length > 0) */}
            {orgs.length > 0 && (
              <div className="px-6 pt-4 flex items-center gap-2 overflow-x-auto bg-white dark:bg-gray-900 shrink-0 scrollbar-none border-b border-gray-100 dark:border-gray-800 pb-3">
                {orgs.map((o) => {
                  const isSelected = selectedOrg?.id === o.organizations.id;
                  return (
                    <button
                      key={o.organizations.id}
                      onClick={() => handleSelectOrg(o)}
                      className={`shrink-0 transition-all ${
                        isSelected
                          ? 'bg-vouch-600 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-sm'
                          : 'card-hover px-4 py-2 text-sm text-gray-650 dark:text-gray-300'
                      }`}
                    >
                      {o.organizations.name}
                    </button>
                  );
                })}
                
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="btn-secondary shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm"
                >
                  <Plus className="w-4 h-4 text-gray-500" />
                  <span>New Org</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowJoinModal(true)}
                  className="btn-ghost shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-950 dark:hover:text-white"
                >
                  <Key className="w-4 h-4 text-gray-500" />
                  <span>Join with Code</span>
                </button>
              </div>
            )}

            {/* Segmented iOS Tabs */}
            <div className="flex px-6 mt-4 gap-2 overflow-x-auto border-b border-gray-150 dark:border-gray-850 pb-2 shrink-0 bg-white dark:bg-gray-900 scrollbar-none">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'members', label: 'Members' },
                { id: 'submissions', label: 'Submissions' },
                { id: 'assignments', label: 'Assignments' },
                ...(isAdmin ? [
                  { id: 'plagiarism', label: 'Plagiarism' },
                  { id: 'api-keys', label: 'API Keys' }
                ] : [])
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-vouch-600 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Main Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 1. OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* 1. Org Header Card */}
                  <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedOrg?.name}
                          </h1>
                          <span className={selectedOrg?.org_type === 'classroom' ? 'badge-blue' : 'badge-purple'}>
                            {selectedOrg?.org_type === 'classroom' ? 'Classroom' : 'Institution'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {selectedOrg?.description || 'No description provided for this organization.'}
                        </p>
                      </div>

                      {/* Invite Code monospace + copy */}
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 px-4 py-2.5 rounded-xl border border-gray-150 dark:border-gray-850">
                        <span className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400">
                          Invite Code: {selectedOrg?.invite_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedOrg?.invite_code || '');
                            toast.success("Invite code copied");
                          }}
                          className="p-1 text-gray-450 hover:text-gray-950 dark:hover:text-white transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Stats Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="Members"
                      value={members.length}
                      icon={<Users className="w-5 h-5" />}
                      color="blue"
                    />
                    <StatCard
                      label="Submissions"
                      value={submissions.length}
                      icon={<FileCode2 className="w-5 h-5" />}
                      color="green"
                    />
                    <StatCard
                      label="Assignments"
                      value={assignments.length}
                      icon={<BookOpen className="w-5 h-5" />}
                      color="orange"
                    />
                    <StatCard
                      label="Plagiarism Flags"
                      value={plagiarismFlags.filter(f => f.status === 'pending').length}
                      icon={<AlertTriangle className="w-5 h-5" />}
                      color="red"
                    />
                  </div>

                  {/* 3. Recent Activity Feed */}
                  <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800/80">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        Live Activity
                      </h3>
                      <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-green-500" />
                    </div>

                    <div className="space-y-3">
                      {activities.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-8 font-semibold">
                          No activity yet. Members haven't submitted files to this org.
                        </p>
                      ) : (
                        activities.slice(0, 10).map((act) => {
                          const isNewSub = newSubsList.some(ns => ns.id === act.id);
                          return (
                            <div
                              key={act.id}
                              className={`flex gap-3 p-3 items-center transition-all ${
                                isNewSub
                                  ? 'bg-vouch-50 dark:bg-vouch-950 border-l-2 border-vouch-400 rounded-xl animate-in fade-in'
                                  : 'bg-gray-50/50 dark:bg-gray-900/40 border border-gray-105 dark:border-gray-800/80 rounded-xl'
                              }`}
                            >
                              <Avatar 
                                name={act.user_name || 'Member'}
                                size="xs"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium font-semibold">
                                  <span className="font-bold text-gray-900 dark:text-white">
                                    {act.user_name || 'Member'}
                                  </span>{' '}
                                  {act.action}
                                </p>
                                <span className="text-[10px] text-gray-400 mt-0.5 block">
                                  {getRelativeTime(act.created_at)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* 4. Quick Actions Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => setInviteOpen(true)}
                      className="btn-secondary flex items-center justify-center gap-2 py-3 text-xs font-bold"
                    >
                      <UserPlus className="w-4 h-4 text-gray-500" />
                      <span>Invite Member</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowCreateAssignment(true)}
                      className="btn-secondary flex items-center justify-center gap-2 py-3 text-xs font-bold"
                    >
                      <Plus className="w-4 h-4 text-gray-500" />
                      <span>Create Assignment</span>
                    </button>
                    
                    <Link
                      to={`/org/${selectedOrg?.id}/report`}
                      className="btn-secondary flex items-center justify-center gap-2 py-3 text-xs font-bold text-center"
                    >
                      <BarChart2 className="w-4 h-4 text-gray-500" />
                      <span>View Report</span>
                    </Link>

                    {profile?.plan === 'classroom' && (
                      <button
                        type="button"
                        onClick={() => setShowApiKeyModal(true)}
                        className="btn-secondary flex items-center justify-center gap-2 py-3 text-xs font-bold"
                      >
                        <Key className="w-4 h-4 text-gray-500" />
                        <span>Generate API Key</span>
                      </button>
                    )}
                  </div>

                </div>
              )}

              {/* 2. MEMBERS TAB */}
              {activeTab === 'members' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Inline Panel for Invite */}
                  <AnimatePresence>
                    {inviteOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-5 rounded-2xl shadow-sm overflow-hidden"
                      >
                        {inviteSent ? (
                          <div className="flex flex-col items-center justify-center py-4 text-center">
                            <svg className="w-12 h-12 text-green-500 mb-2" viewBox="0 0 52 52">
                              <motion.circle
                                cx="26"
                                cy="26"
                                r="25"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                              />
                              <motion.path
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                d="M14 27l7.5 7.5L38 18"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.3 }}
                              />
                            </svg>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">Invite sent successfully!</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setInviteSent(false); setInviteEmail(''); }} 
                              className="mt-2 text-[10px] font-bold border border-gray-200 dark:border-gray-800"
                            >
                              Invite another
                            </Button>
                          </div>
                        ) : (
                          <form onSubmit={handleInvite} className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white">Send Membership Invitation</h4>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="Student or colleague email address"
                                required
                                className="flex-1 px-4 py-2.5 bg-gray-50/50 dark:bg-gray-950 border border-gray-205 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 text-gray-900 dark:text-white"
                              />
                              <div className="flex gap-2 shrink-0">
                                <Button variant="primary" type="submit" size="md">
                                  Send Invite
                                </Button>
                                <Button variant="ghost" size="md" onClick={() => setInviteOpen(false)} className="border border-gray-200 dark:border-gray-850">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </form>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full max-w-sm">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Filter members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 text-gray-900 dark:text-white"
                      />
                    </div>
                    {isAdmin && (
                      <Button variant="primary" size="md" onClick={() => setInviteOpen(true)}>
                        <UserPlus className="w-4 h-4" /> Invite Member
                      </Button>
                    )}
                  </div>

                  {/* Grid list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members
                      .filter(m => (m.profiles?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (m.profiles?.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(m => {
                        const isOwner = m.profiles?.id === selectedOrg.owner_id;
                        return (
                          <div 
                            key={m.profiles?.id}
                            className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-3xl p-5 text-center flex flex-col items-center justify-between space-y-4 hover:shadow-md hover:-translate-y-0.5 transition duration-200"
                          >
                            <div className="flex flex-col items-center space-y-2">
                              <div className="w-12 h-12 rounded-full bg-vouch-50 dark:bg-vouch-950 flex items-center justify-center text-vouch-650 dark:text-vouch-400 text-sm font-black uppercase">
                                {(m.profiles?.name || 'C').charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center justify-center gap-1.5">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white">{m.profiles?.name || 'Classmate'}</p>
                                  <span className={`px-1.5 py-0.2 rounded-[4px] text-[8px] font-black uppercase tracking-wider ${
                                    m.role === 'admin' 
                                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' 
                                      : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                  }`}>
                                    {m.role}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate max-w-xs">{m.profiles?.email}</p>
                                <p className="text-[9px] text-gray-450 dark:text-gray-500 font-semibold mt-1">Joined {format(new Date(m.joined_at), 'PP')}</p>
                              </div>
                            </div>

                            <div className="w-full pt-3.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                              <div className="text-left">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Submissions</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{m.submission_count || 0}</p>
                              </div>
                              {isAdmin && !isOwner && m.profiles?.id !== user.id && (
                                <button
                                  onClick={() => handleRemoveMember(m.profiles?.id)}
                                  className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 3. ASSIGNMENTS TAB */}
              {activeTab === 'assignments' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Inline Panel for Create Assignment */}
                  <AnimatePresence>
                    {showCreateAssignment && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-5 rounded-3xl shadow-sm overflow-hidden"
                      >
                        <form onSubmit={handleCreateAssignment} className="space-y-4">
                          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Create New Assignment</h3>
                          
                          <div className="space-y-3">
                            <input
                              type="text"
                              required
                              placeholder="Assignment title *"
                              value={newAssignment.title}
                              onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                              className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 text-gray-900 dark:text-white"
                            />
                            
                            <textarea
                              placeholder="Describe assignment instructions..."
                              value={newAssignment.description}
                              onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                              rows="3"
                              className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 text-gray-900 dark:text-white"
                            />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Deadline date & time *</label>
                                <input
                                  type="datetime-local"
                                  required
                                  value={newAssignment.deadline}
                                  onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                                  className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 text-gray-900 dark:text-white"
                                />
                              </div>
                              
                              <div className="flex items-center justify-start pt-6">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setNewAssignment({ ...newAssignment, allowLate: !newAssignment.allowLate })}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      newAssignment.allowLate ? 'bg-vouch-600' : 'bg-gray-250 dark:bg-gray-700'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                        newAssignment.allowLate ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Allow late submissions</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button variant="primary" type="submit" size="md">
                              Create Assignment
                            </Button>
                            <Button variant="ghost" size="md" onClick={() => setShowCreateAssignment(false)} className="border border-gray-200 dark:border-gray-800">
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Header row */}
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Class Assignments</h4>
                    {isAdmin && (
                      <Button variant="primary" size="md" onClick={() => setShowCreateAssignment(true)}>
                        Create Assignment
                      </Button>
                    )}
                  </div>

                  {/* List of assignments */}
                  <div className="space-y-4">
                    {assignments.map(a => {
                      const isExpanded = expandedAssignmentId === a.id;
                      const status = getDeadlineInfo(a.deadline);
                      const subCount = submissions.filter(s => s.assignment_id === a.id).length;
                      const pct = members.length > 0 ? (subCount / members.length) * 100 : 0;
                      const assignmentSubs = submissions.filter(sub => sub.assignment_id === a.id);

                      return (
                        <div 
                          key={a.id}
                          className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-3xl p-5 space-y-4"
                        >
                          {/* Collapsed Header */}
                          <div 
                            className="flex items-center justify-between gap-4 cursor-pointer select-none"
                            onClick={() => setExpandedAssignmentId(isExpanded ? null : a.id)}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h5 className="text-sm font-bold text-gray-900 dark:text-white truncate">{a.title}</h5>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${status.color}`}>
                                  {status.text}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                                Deadline: {a.deadline ? format(new Date(a.deadline), 'PP p') : 'None'} &bull; Progress: {subCount}/{members.length} submissions
                              </p>
                              
                              <div className="w-full max-w-sm mt-3 h-1 bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden">
                                <div className="h-full bg-vouch-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              {isAdmin && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(a.id); }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-450" /> : <ChevronDown className="w-4 h-4 text-gray-450" />}
                            </div>
                          </div>

                          {/* Expanded content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden pt-4 border-t border-gray-100 dark:border-gray-800/80 space-y-4"
                              >
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Description</p>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
                                    {a.description || 'No description provided.'}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Submissions</p>
                                  {assignmentSubs.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-gray-450 font-semibold border border-dashed border-gray-150 dark:border-gray-800 rounded-2xl bg-gray-50/20">
                                      No submissions recorded for this assignment
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto rounded-2xl border border-gray-150 dark:border-gray-800">
                                      <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50 dark:bg-gray-950 text-gray-450 uppercase font-black">
                                          <tr>
                                            <th className="px-4 py-3">Student</th>
                                            <th className="px-4 py-3">Submitted At</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Certificate</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                          {assignmentSubs.map(sub => {
                                            const lateInfo = getSubmissionLateStatus(sub.submitted_at, a.deadline);
                                            return (
                                              <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                                                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{sub.student_name}</td>
                                                <td className="px-4 py-3 text-gray-500">{format(new Date(sub.submitted_at), 'PP p')}</td>
                                                <td className="px-4 py-3">
                                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lateInfo.color}`}>
                                                    {lateInfo.label}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                  <button
                                                    onClick={() => downloadCertificate(sub)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-650 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 font-bold transition text-[10px]"
                                                  >
                                                    <Download className="w-3.5 h-3.5" /> Download Cert
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                    {assignments.length === 0 && (
                      <EmptyState 
                        title="No Assignments" 
                        description="There are no assignments configured in this workspace."
                        className="py-12"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 4. SUBMISSIONS TAB */}
              {activeTab === 'submissions' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  
                  {/* Real-time Submissions count banner toast */}
                  {newSubsList.length > 0 && (
                    <button
                      onClick={() => {
                        setSubmissions(prev => [...newSubsList, ...prev]);
                        setNewSubsList([]);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-2.5 bg-vouch-600 hover:bg-vouch-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 mb-4 animate-bounce"
                    >
                      &uarr; {newSubsList.length} new submission{newSubsList.length > 1 ? 's' : ''} available. Click to load.
                    </button>
                  )}

                  {/* Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-2xl shadow-xs">
                    
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search submissions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-205 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Filters dropdowns */}
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <select
                        value={filterLang}
                        onChange={(e) => setFilterLang(e.target.value)}
                        className="px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        <option value="all">All Languages</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>

                      <select
                        value={filterAssignment}
                        onChange={(e) => setFilterAssignment(e.target.value)}
                        className="px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        <option value="all">All Assignments</option>
                        {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                      </select>

                      <select
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                      </select>

                      <Button variant="outline" size="md" onClick={handleExportCSV}>
                        Export CSV
                      </Button>
                    </div>
                  </div>

                  {/* Submissions Table card */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-3xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs select-text">
                        <thead className="bg-gray-50 dark:bg-gray-950 text-gray-450 uppercase font-black select-none">
                          <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">File</th>
                            <th className="px-6 py-4">Submitted</th>
                            <th className="px-6 py-4">Assignment</th>
                            <th className="px-6 py-4">Plagiarism</th>
                            <th className="px-6 py-4">Hash</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {finalFilteredSubmissions.map(sub => {
                            const relatedAssign = assignments.find(a => a.id === sub.assignment_id);
                            // Detect if flagged in plagiarism flags
                            const isFlagged = plagiarismFlags.some(f => (f.submission_id_1?.id === sub.id || f.submission_id_2?.id === sub.id) && f.status === 'confirmed');
                            const isPending = plagiarismFlags.some(f => (f.submission_id_1?.id === sub.id || f.submission_id_2?.id === sub.id) && f.status === 'pending');

                            return (
                              <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[10px] text-gray-655 dark:text-gray-400 uppercase select-none">
                                      {sub.student_name.charAt(0)}
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white">{sub.student_name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <FileCode2 className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold">{sub.file_name}</span>
                                    <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 text-[8px] font-black uppercase">
                                      {sub.language || 'unknown'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                  <DashboardTooltip content={sub.submitted_at ? format(new Date(sub.submitted_at), 'PP p') : ''}>
                                    <span className="cursor-help hover:underline">{getRelativeTime(sub.submitted_at)}</span>
                                  </DashboardTooltip>
                                </td>
                                <td className="px-6 py-4">
                                  {relatedAssign ? (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-650 dark:bg-blue-900/20 dark:text-blue-400 font-bold text-[9px] uppercase tracking-wide">
                                      {relatedAssign.title}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 font-semibold text-[10px]">Personal</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {isFlagged ? (
                                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 font-bold text-[9px]">
                                      Flagged
                                    </span>
                                  ) : isPending ? (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 font-bold text-[9px] animate-pulse">
                                      Pending
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">&mdash;</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 font-mono text-[10px] text-gray-400 select-all">
                                  {sub.structural_hash?.substring(0, 8)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => downloadCertificate(sub)}
                                      className="p-1.5 rounded-lg text-gray-450 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(sub.verification_code);
                                        toast.success("Verification ID copied");
                                      }}
                                      className="p-1.5 rounded-lg text-gray-450 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {finalFilteredSubmissions.length === 0 && (
                            <tr>
                              <td colSpan="7" className="py-12">
                                <EmptyState 
                                  title="No Submissions"
                                  description="No submission match details match filters configured."
                                />
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. PLAGIARISM TAB */}
              {activeTab === 'plagiarism' && isAdmin && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {plagiarismFlags.length === 0 ? (
                    <EmptyState
                      title="All Clear"
                      description="No plagiarism has been detected in this classroom workspace."
                      className="py-16"
                    />
                  ) : (
                    <>
                      {/* Warning box summary banner */}
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-left text-xs font-semibold text-red-800 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                        <span>{pendingFlags.length} potential plagiarism cases require your review</span>
                      </div>

                      {/* Flag cards */}
                      <div className="space-y-4 select-text">
                        {plagiarismFlags.map(flag => {
                          const relatedAssign = assignments.find(a => a.id === flag.assignment_id);
                          const isResolved = flag.status !== 'pending';

                          return (
                            <div
                              key={flag.id}
                              className={`bg-white dark:bg-gray-900 border-l-4 rounded-r-3xl rounded-l-lg p-5 border border-gray-150 dark:border-gray-850 shadow-xs flex flex-col space-y-4 transition ${
                                flag.status === 'confirmed' 
                                  ? 'border-l-red-500 opacity-60 bg-red-50/10' 
                                  : flag.status === 'cleared'
                                    ? 'border-l-green-500 opacity-60 bg-green-50/10'
                                    : 'border-l-amber-500 border-l-4'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4 select-none">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    flag.status === 'pending'
                                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse'
                                      : flag.status === 'confirmed'
                                        ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                                        : 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                                  }`}>
                                    {flag.status === 'pending' ? 'Review Required' : flag.status}
                                  </span>
                                  {relatedAssign && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-650 dark:bg-blue-900/20 dark:text-blue-400 font-bold text-[9px] uppercase tracking-wide">
                                      {relatedAssign.title}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400 font-semibold">{format(new Date(flag.flagged_at), 'PP p')}</span>
                              </div>

                              {/* Two Column Comparison */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Student 1 */}
                                <div className="p-4 bg-gray-50/50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                  <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Student 1</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white mt-1 truncate">{flag.submission_id_1?.student_name || 'Removed User'}</p>
                                    <p className="text-[10px] text-gray-450 mt-0.5 truncate">{flag.submission_id_1?.file_name}</p>
                                    <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Submitted {flag.submission_id_1?.submitted_at ? format(new Date(flag.submission_id_1.submitted_at), 'PP p') : ''}</p>
                                  </div>
                                  {flag.submission_id_1 && (
                                    <button
                                      onClick={() => handleDownloadFlagCert(flag.submission_id_1, flag.structural_hash)}
                                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 text-gray-500 hover:text-gray-750 transition shadow-xs"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>

                                {/* Student 2 */}
                                <div className="p-4 bg-gray-50/50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                  <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Student 2</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white mt-1 truncate">{flag.submission_id_2?.student_name || 'Removed User'}</p>
                                    <p className="text-[10px] text-gray-450 mt-0.5 truncate">{flag.submission_id_2?.file_name}</p>
                                    <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Submitted {flag.submission_id_2?.submitted_at ? format(new Date(flag.submission_id_2.submitted_at), 'PP p') : ''}</p>
                                  </div>
                                  {flag.submission_id_2 && (
                                    <button
                                      onClick={() => handleDownloadFlagCert(flag.submission_id_2, flag.structural_hash)}
                                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 text-gray-500 hover:text-gray-755 transition shadow-xs"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Hash match string */}
                              <div className="space-y-1 bg-gray-50 dark:bg-gray-950/80 p-3 rounded-2xl border border-gray-100 dark:border-gray-850">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 select-none">Structural AST Hash Match Proof</p>
                                <p className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300 break-all select-all">{flag.structural_hash}</p>
                              </div>

                              {/* Action buttons */}
                              {!isResolved && isAdmin && (
                                <div className="flex gap-3 pt-1 select-none">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResolveFlag(flag.id, 'cleared')}
                                    className="border border-green-200 text-green-700 hover:bg-green-50/50 hover:border-green-300 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/10 shrink-0"
                                  >
                                    Clear &mdash; Not Plagiarism
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleResolveFlag(flag.id, 'confirmed')}
                                    className="bg-red-600 hover:bg-red-750 text-white shrink-0"
                                  >
                                    Confirm Plagiarism
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 6. API KEYS TAB */}
              {activeTab === 'api-keys' && isAdmin && (
                <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
                  
                  {/* Explanation card */}
                  <Card className="bg-blue-50/40 border-blue-100 dark:bg-blue-950/15 dark:border-blue-900/40">
                    <CardBody className="flex gap-3.5">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">Workspace LMS Integration</h4>
                        <p className="text-xs text-gray-450 dark:text-gray-400 leading-relaxed font-semibold">
                          Generate API Keys to connect Vouch secure notarization directly with Canvas, Moodle, or custom testing tools. 
                          Read the <a href="/docs" target="_blank" rel="noopener noreferrer" className="text-vouch-600 dark:text-vouch-400 hover:underline inline-flex items-center gap-0.5">API documentation <ExternalLink className="w-3 h-3" /></a> to get started.
                        </p>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Generate Key Form */}
                  <Card>
                    <CardHeader className="pb-3">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Generate Integration Token</h3>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <form onSubmit={handleCreateApiKey} className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          required
                          value={newKeyLabel}
                          onChange={(e) => setNewKeyLabel(e.target.value)}
                          placeholder="Label name (e.g. Moodle Production Environment)"
                          className="flex-1 px-4 py-2.5 bg-gray-50/50 dark:bg-gray-905 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 text-gray-900 dark:text-white"
                        />
                        <Button variant="primary" type="submit" size="md">
                          Generate Key
                        </Button>
                      </form>
                    </CardBody>
                  </Card>

                  {/* Existing keys list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Active API Keys</h4>
                    {apiKeys.length === 0 ? (
                      <div className="p-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-center text-xs text-gray-400 font-semibold bg-white dark:bg-gray-900/50">
                        No active tokens configured
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-3xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 dark:bg-gray-950 text-gray-450 uppercase font-black select-none">
                              <tr>
                                <th className="px-4 py-3">Label</th>
                                <th className="px-4 py-3">Key Preview</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {apiKeys.map(key => (
                                <tr key={key.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{key.label}</td>
                                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{key.key_preview}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                      key.is_active 
                                        ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' 
                                        : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                    }`}>
                                      {key.is_active ? 'Active' : 'Revoked'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right select-none">
                                    {key.is_active && (
                                      <button 
                                        onClick={() => handleRevokeApiKey(key.id)} 
                                        className="text-red-600 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                                      >
                                        Revoke
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>

      {/* Overlay Modals */}
      
      {/* 1. Create Org Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Create Organization</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-650" />
              </button>
            </div>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Organization Name *</label>
                <input 
                  type="text" 
                  required 
                  value={newOrgName} 
                  onChange={e => setNewOrgName(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Type *</label>
                <select 
                  value={newOrgType} 
                  onChange={e => setNewOrgType(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 text-gray-900 dark:text-white cursor-pointer"
                >
                  <option value="classroom">Classroom</option>
                  <option value="team">Team / Company</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Description</label>
                <textarea 
                  value={newOrgDesc} 
                  onChange={e => setNewOrgDesc(e.target.value)} 
                  rows="3"
                  className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 text-gray-900 dark:text-white"
                />
              </div>
              <Button type="submit" className="w-full justify-center py-3 mt-2" variant="primary">
                Create Workspace
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Join Org Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Join Organization</h2>
              <button 
                onClick={() => setShowJoinModal(false)}
                className="p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-650" />
              </button>
            </div>
            <form onSubmit={handleJoinOrg} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Invite Code *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="VOUCH-XXXXX" 
                  value={joinCode} 
                  onChange={e => setJoinCode(e.target.value.toUpperCase())} 
                  className="w-full px-4 py-3 font-mono text-center text-base border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 text-gray-900 dark:text-white uppercase tracking-widest bg-gray-550/5"
                />
              </div>
              <Button type="submit" className="w-full justify-center py-3" variant="primary">
                Join Classroom
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 3. API Key Generation Details Fullscreen Overlay Modal */}
      {showApiKeyModal && generatedKeyData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 space-y-5">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl text-xs text-amber-800 dark:text-amber-400 flex gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-500 animate-bounce" />
              <div className="space-y-1">
                <p className="font-bold">⚠️ Copy this key now &mdash; it will never be shown again</p>
                <p className="text-[11px] opacity-90">If you lose this key, you will have to generate a new token and update your configurations.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 select-none">API Secret Key</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedKeyData.key} 
                  className="flex-1 p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-mono text-xs text-gray-800 dark:text-gray-200 outline-none select-all" 
                />
                <button 
                  onClick={() => handleCopyKey(generatedKeyData.key)} 
                  className={`p-3 border rounded-xl transition ${
                    copiedKey 
                      ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-950/30 dark:border-green-900' 
                      : 'bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {copiedKey ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button 
              onClick={() => { setShowApiKeyModal(false); setGeneratedKeyData(null); }} 
              className="w-full justify-center py-3 select-none"
              variant="primary"
            >
              I've copied my key
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
