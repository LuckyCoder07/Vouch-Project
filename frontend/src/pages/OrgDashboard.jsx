import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Users, FileCode2, BookOpen, AlertTriangle, Search, Download, Copy, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function OrgDashboard() {
  const { user } = useAuth();
  
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [plagiarismFlags, setPlagiarismFlags] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState('classroom');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  
  const [joinCode, setJoinCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Assignment Modal State
  const [newAssignment, setNewAssignment] = useState({
    title: '', description: '', deadline: '', allowLate: false
  });

  // API Key Modal State
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [generatedKeyData, setGeneratedKeyData] = useState(null);

  // Error/Success states
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn("Dashboard loading failsafe triggered.");
        setIsLoading(false);
      }
    }, 5000);

    if (user?.id) {
      fetchOrgs();
    } else if (!user && !isLoading) {
      // Not loading and no user? Something's wrong.
    }

    return () => clearTimeout(timer);
  }, [user]);

  const fetchOrgs = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      console.log("Fetching orgs for user:", user.id);
      const res = await fetch(`${API_URL}/api/orgs?user_id=${user.id}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      
      setOrgs(data.orgs || []);
      if (data.orgs && data.orgs.length > 0) {
        if (!selectedOrg) {
          const firstOrg = data.orgs[0].organizations;
          firstOrg.user_role = data.orgs[0].role;
          setSelectedOrg(firstOrg);
          await loadOrgData(firstOrg);
        }
      }
    } catch (err) {
      console.error("fetchOrgs error:", err);
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
    } catch (err) {
      console.error("Error loading org data:", err);
    }
  };

  const handleSelectOrg = (orgRoleWrapper) => {
    const org = orgRoleWrapper.organizations;
    org.user_role = orgRoleWrapper.role;
    setSelectedOrg(org);
    setActiveTab('overview');
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
    } catch (err) {
      alert(err.message);
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
    } catch (err) {
      alert(err.message);
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
      setSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await fetch(`${API_URL}/api/orgs/${selectedOrg.id}/members/${userId}`, { method: 'DELETE' });
      if (res.ok) loadOrgData(selectedOrg);
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
      setShowCreateAssignmentModal(false);
      setNewAssignment({ title: '', description: '', deadline: '', allowLate: false });
      loadOrgData(selectedOrg);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      const res = await fetch(`${API_URL}/api/assignments/${id}`, { method: 'DELETE' });
      if (res.ok) loadOrgData(selectedOrg);
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
      if (res.ok) loadOrgData(selectedOrg);
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
      loadOrgData(selectedOrg);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRevokeApiKey = async (keyId) => {
    if (!window.confirm('Revoke this API Key? Any integrations using it will break.')) return;
    try {
      const res = await fetch(`${API_URL}/api/orgs/${selectedOrg.id}/api-keys/${keyId}`, { method: 'DELETE' });
      if (res.ok) loadOrgData(selectedOrg);
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
      
      setSuccess('Organization deleted successfully');
      setSelectedOrg(null);
      fetchOrgs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 animate-pulse">Loading dashboard data...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Failed to Load Dashboard</h2>
        <p className="text-gray-500 mb-6 max-w-md">{fetchError}</p>
        <button onClick={fetchOrgs} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
          Retry Connection
        </button>
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Your Organizations</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Create a workspace for your team or join an existing one.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="group bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Create an Organization</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">For professors, instructors, and team leads to manage submissions.</p>
            <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold w-full transition-colors text-lg shadow-md hover:shadow-lg">
              Create New
            </button>
          </div>
          <div className="group bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-12 h-12 text-gray-500 dark:text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Join an Organization</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">For students and team members with an invite code from your admin.</p>
            <button onClick={() => setShowJoinModal(true)} className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-bold w-full transition-colors text-lg">
              Join with Code
            </button>
          </div>
        </div>
        {/* Modals placed at bottom */}
        {showCreateModal && CreateOrgModal()}
        {showJoinModal && JoinOrgModal()}
      </div>
    );
  }

  const isAdmin = selectedOrg?.user_role === 'admin';
  const pendingFlags = plagiarismFlags.filter(f => f.status === 'pending');

  const filteredSubmissions = submissions.filter(sub => 
    sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sub.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black dark:text-white tracking-tight">Workspaces</h2>
          </div>
          
          <div className="space-y-2">
            <button onClick={() => setShowCreateModal(true)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
              <span>Create New</span>
            </button>
            <button onClick={() => setShowJoinModal(true)} className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95">
              Join with Code
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="px-3 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">My Organizations</p>
          {orgs.map((o) => (
            <div 
              key={o.organizations.id} 
              onClick={() => handleSelectOrg(o)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${selectedOrg?.id === o.organizations.id ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${selectedOrg?.id === o.organizations.id ? 'bg-blue-600 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div>
                  <div className={`font-bold text-sm ${selectedOrg?.id === o.organizations.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{o.organizations.name}</div>
                  <div className="text-xs text-gray-400 capitalize font-medium">{o.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {selectedOrg && (
          <>
            <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedOrg.name}</h1>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${isAdmin ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {isAdmin ? 'Administrator' : 'Member'}
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl leading-relaxed font-medium">{selectedOrg.description || "No description provided."}</p>
                  </div>
                  
                  {isAdmin && (
                    <Link to={`/org/${selectedOrg.id}/report`} className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95 text-sm">
                      <Download className="w-4 h-4" /> View Full Analytics
                    </Link>
                  )}
                </div>
              
              <div className="flex mt-8 space-x-2 overflow-x-auto scrollbar-hide">
                {['overview', 'members', 'assignments', 'submissions'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 text-sm font-bold rounded-t-xl capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{tab}</button>
                ))}
                {isAdmin && (
                  <button onClick={() => setActiveTab('plagiarism')} className={`px-5 py-2.5 text-sm font-bold rounded-t-xl capitalize whitespace-nowrap transition-colors ${activeTab === 'plagiarism' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Plagiarism</button>
                )}
                {isAdmin && (
                  <button onClick={() => setActiveTab('settings')} className={`px-5 py-2.5 text-sm font-bold rounded-t-xl capitalize whitespace-nowrap transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Settings</button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50 dark:bg-gray-900">
              
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between"><h3 className="text-gray-500 dark:text-gray-400 font-medium">Members</h3><Users className="text-blue-500 w-5 h-5"/></div>
                      <p className="text-2xl font-bold mt-2 dark:text-white">{members.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between"><h3 className="text-gray-500 dark:text-gray-400 font-medium">Submissions</h3><FileCode2 className="text-green-500 w-5 h-5"/></div>
                      <p className="text-2xl font-bold mt-2 dark:text-white">{submissions.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between"><h3 className="text-gray-500 dark:text-gray-400 font-medium">Assignments</h3><BookOpen className="text-orange-500 w-5 h-5"/></div>
                      <p className="text-2xl font-bold mt-2 dark:text-white">{assignments.length}</p>
                    </div>
                    {pendingFlags.length > 0 && isAdmin && (
                      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between"><h3 className="text-red-600 dark:text-red-400 font-medium">Plagiarism Flags</h3><AlertTriangle className="text-red-500 w-5 h-5"/></div>
                        <p className="text-2xl font-bold mt-2 text-red-700 dark:text-red-400">{pendingFlags.length}</p>
                      </div>
                    )}
                  </div>
                  {/* Recent Submissions */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-lg mb-4 dark:text-white">Recent Submissions</h3>
                    {submissions.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">No submissions yet.</p>
                    ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase font-black bg-gray-50 dark:bg-gray-700/50">
                          <tr><th className="px-4 py-4">Student</th><th className="px-4 py-4">Resource</th><th className="px-4 py-4">Timeline</th><th className="px-4 py-4 font-mono">Vouch Code</th></tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                          {submissions.slice(0, 5).map(sub => (
                            <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="px-4 py-4 font-bold dark:text-white">{sub.student_name}</td>
                              <td className="px-4 py-4">
                                <div className="font-medium dark:text-gray-200">{sub.file_name}</div>
                                <div className="text-xs text-gray-400 uppercase font-black">{sub.language}</div>
                              </td>
                              <td className="px-4 py-4 text-gray-500 dark:text-gray-400">{format(new Date(sub.submitted_at), 'PP p')}</td>
                              <td className="px-4 py-4 font-mono text-xs text-gray-400">{sub.verification_code}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-6">
                  {isAdmin && (
                    <form onSubmit={handleInvite} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <h3 className="font-bold text-lg mb-4 dark:text-white">Invite Member</h3>
                      <div className="flex gap-4 flex-col sm:flex-row">
                        <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address" className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">Send Invite</button>
                      </div>
                      {success && <p className="text-green-600 mt-2 text-sm">{success}</p>}
                      {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
                    </form>
                  )}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase font-black bg-gray-50 dark:bg-gray-700/50">
                          <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Joined</th>{isAdmin && <th className="px-6 py-4 text-right">Actions</th>}</tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                          {members.map(m => (
                            <tr key={m.profiles.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold dark:text-white">{m.profiles.name || 'Unknown'}</div>
                                <div className="text-gray-400 text-xs font-medium">{m.profiles.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 text-xs uppercase font-black rounded-full border ${m.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                  {m.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{format(new Date(m.joined_at), 'PP')}</td>
                              {isAdmin && (
                                <td className="px-6 py-4 text-right">
                                  {m.role !== 'admin' && (
                                    <button onClick={() => handleRemoveMember(m.profiles.id)} className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                      <Trash2 className="w-4 h-4"/>
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'assignments' && (
                <div className="space-y-6">
                  {isAdmin && (
                    <button onClick={() => setShowCreateAssignmentModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 mb-4">Create Assignment</button>
                  )}
                  <div className="grid gap-4">
                    {assignments.map(a => (
                      <div key={a.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg dark:text-white">{a.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{a.description}</p>
                          </div>
                          {isAdmin && (
                            <button onClick={() => handleDeleteAssignment(a.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                          )}
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {a.deadline && <span>Deadline: {format(new Date(a.deadline), 'PP p')}</span>}
                          {a.is_overdue && <span className="text-red-500 font-medium">Overdue</span>}
                          {!a.is_overdue && a.deadline && <span className="text-green-500 font-medium">Open</span>}
                        </div>
                      </div>
                    ))}
                    {assignments.length === 0 && <p className="text-gray-500 dark:text-gray-400">No assignments created yet.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="text" placeholder="Search submissions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                          <tr><th className="px-6 py-4">Student</th><th className="px-6 py-4">File</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Code</th></tr>
                        </thead>
                        <tbody>
                          {filteredSubmissions.map(sub => (
                            <tr key={sub.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-6 py-4 font-medium dark:text-white">{sub.student_name}</td>
                              <td className="px-6 py-4 dark:text-gray-300">{sub.file_name}</td>
                              <td className="px-6 py-4 dark:text-gray-300">{format(new Date(sub.submitted_at), 'PP p')}</td>
                              <td className="px-6 py-4 font-mono text-xs dark:text-gray-400">{sub.verification_code}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'plagiarism' && isAdmin && (
                <div className="space-y-4">
                  {plagiarismFlags.length === 0 ? (
                    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800 text-center">
                      <p className="text-green-700 dark:text-green-400 font-medium">No plagiarism detected.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {plagiarismFlags.map(flag => (
                        <div key={flag.id} className={`p-6 rounded-xl border ${flag.status === 'pending' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-lg dark:text-white">Flag: {flag.structural_hash.substring(0,8)}...</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Detected on {format(new Date(flag.flagged_at), 'PP p')}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${flag.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : flag.status === 'confirmed' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'}`}>
                              {flag.status}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-4 rounded border dark:border-gray-700">
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-bold">Submission 1</p>
                              <p className="font-medium dark:text-white">{flag.submission_id_1?.student_name}</p>
                              <p className="text-sm text-gray-500">{flag.submission_id_1?.file_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-bold">Submission 2</p>
                              <p className="font-medium dark:text-white">{flag.submission_id_2?.student_name}</p>
                              <p className="text-sm text-gray-500">{flag.submission_id_2?.file_name}</p>
                            </div>
                          </div>
                          {flag.status === 'pending' && (
                            <div className="mt-4 flex gap-3">
                              <button onClick={() => handleResolveFlag(flag.id, 'confirmed')} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700">Confirm Plagiarism</button>
                              <button onClick={() => handleResolveFlag(flag.id, 'cleared')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm font-medium hover:bg-gray-300">Clear Flag</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && isAdmin && (
                <div className="space-y-6 max-w-3xl">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-4 dark:text-white">Organization Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organization Name</label>
                        <input type="text" value={selectedOrg.name} readOnly className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invite Code</label>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded text-lg font-bold text-blue-600 dark:text-blue-400 flex-1">{selectedOrg.invite_code}</code>
                          <button onClick={() => navigator.clipboard.writeText(selectedOrg.invite_code)} className="p-2 border rounded hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"><Copy className="w-5 h-5 text-gray-500"/></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg dark:text-white">Analytics & Reports</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View detailed analytics, visualize member submissions, and export CSV reports.</p>
                      </div>
                      <Link to={`/org/${selectedOrg.id}/report`} className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 rounded font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition text-sm whitespace-nowrap">
                        Open Report
                      </Link>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg dark:text-white">API Keys</h3>
                      <button onClick={() => setShowApiKeyModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 text-sm">Generate New API Key</button>
                    </div>
                    {apiKeys.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No active API keys found for this organization.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-400 uppercase font-black bg-gray-50 dark:bg-gray-700/50">
                            <tr><th className="px-4 py-3">Label</th><th className="px-4 py-3">Key Preview</th><th className="px-4 py-3 text-right">Actions</th></tr>
                          </thead>
                          <tbody className="divide-y dark:divide-gray-700">
                            {apiKeys.filter(k => k.is_active).map(key => (
                              <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="px-4 py-3 font-bold dark:text-white">{key.label}</td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{key.key_preview}</td>
                                <td className="px-4 py-3 text-right">
                                  <button onClick={() => handleRevokeApiKey(key.id)} className="text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-wider">Revoke</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-3xl border border-red-100 dark:border-red-900/20">
                    <h3 className="text-red-600 dark:text-red-400 font-black text-xl mb-2">Danger Zone</h3>
                    <p className="text-red-500/80 dark:text-red-400/60 text-sm mb-6">Once you delete an organization, there is no going back. All data associated with this workspace will be permanently erased.</p>
                    <button 
                      onClick={handleDeleteOrg}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-red-600/20 active:scale-95"
                    >
                      Delete Organization
                    </button>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && CreateOrgModal()}
      {showJoinModal && JoinOrgModal()}
      {showCreateAssignmentModal && CreateAssignmentModal()}
      {showApiKeyModal && CreateApiKeyModal()}
    </div>
  );

  function CreateOrgModal() {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold dark:text-white">Create Organization</h2>
            <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-gray-500"/></button>
          </div>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Organization Name</label>
              <input type="text" required value={newOrgName} onChange={e => setNewOrgName(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Type</label>
              <select value={newOrgType} onChange={e => setNewOrgType(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="classroom">Classroom</option>
                <option value="team">Team / Company</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
              <textarea value={newOrgDesc} onChange={e => setNewOrgDesc(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows="3"></textarea>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Create</button>
          </form>
        </div>
      </div>
    );
  }

  function JoinOrgModal() {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold dark:text-white">Join Organization</h2>
            <button onClick={() => setShowJoinModal(false)}><X className="w-5 h-5 text-gray-500"/></button>
          </div>
          <form onSubmit={handleJoinOrg} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Invite Code</label>
              <input type="text" required placeholder="VOUCH-XXXXX" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} className="w-full p-3 font-mono text-center text-lg border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white uppercase tracking-widest" />
            </div>
            <button type="submit" className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2 rounded font-bold hover:bg-gray-800">Join</button>
          </form>
        </div>
      </div>
    );
  }

  function CreateAssignmentModal() {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold dark:text-white">New Assignment</h2>
            <button onClick={() => setShowCreateAssignmentModal(false)}><X className="w-5 h-5 text-gray-500"/></button>
          </div>
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Title</label>
              <input type="text" required value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
              <textarea value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows="3"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Deadline</label>
              <input type="datetime-local" value={newAssignment.deadline} onChange={e => setNewAssignment({...newAssignment, deadline: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <label className="flex items-center gap-2 text-sm dark:text-gray-300">
              <input type="checkbox" checked={newAssignment.allowLate} onChange={e => setNewAssignment({...newAssignment, allowLate: e.target.checked})} />
              Allow late submissions
            </label>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Create</button>
          </form>
        </div>
      </div>
    );
  }

  function CreateApiKeyModal() {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold dark:text-white">Generate API Key</h2>
            <button onClick={() => { setShowApiKeyModal(false); setGeneratedKeyData(null); }}><X className="w-5 h-5 text-gray-500"/></button>
          </div>
          {!generatedKeyData ? (
            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Key Label</label>
                <input type="text" required placeholder="e.g. Moodle Integration" value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Generate Key</button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded text-sm text-yellow-800 dark:text-yellow-500">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                <strong>Important:</strong> This key will not be shown again. Copy it now.
              </div>
              <div className="flex gap-2">
                <input type="text" readOnly value={generatedKeyData.key} className="flex-1 p-2 bg-gray-100 dark:bg-gray-900 border rounded font-mono text-sm dark:text-gray-300 dark:border-gray-700" />
                <button onClick={() => navigator.clipboard.writeText(generatedKeyData.key)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"><Copy className="w-5 h-5 dark:text-gray-300"/></button>
              </div>
              <button onClick={() => { setShowApiKeyModal(false); setGeneratedKeyData(null); }} className="w-full mt-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2 rounded font-bold">Done</button>
            </div>
          )}
        </div>
      </div>
    );
  }
}
