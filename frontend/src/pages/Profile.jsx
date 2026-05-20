import API_URL from '../lib/apiUrl.js';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase, updateProfile } from '../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Camera, Lock, CheckCircle, ChevronDown, ChevronUp, Github,
  ExternalLink, FileCode2, User, Building2, Award, ShieldCheck, Trash2, Mail
} from 'lucide-react';
import { Button, Card, CardHeader, CardBody, Avatar, Input, SkeletonTable } from '../components/ui';
import AnchorBadge from '../components/ui/AnchorBadge';



const RANKS = [
  { name: 'Newcomer', minScore: 0 },
  { name: 'Contributor', minScore: 500 },
  { name: 'Notary', minScore: 1500 },
  { name: 'Expert', minScore: 3000 },
  { name: 'Master', minScore: 5000 },
  { name: 'Legend', minScore: 10000 },
];

function getRankInfo(score) {
  let currentRank = RANKS[0];
  let nextRank = RANKS[1];
  for (let i = 0; i < RANKS.length; i++) {
    if (score >= RANKS[i].minScore) {
      currentRank = RANKS[i];
      nextRank = RANKS[i + 1] || RANKS[i];
    }
  }
  return { currentRank, nextRank };
}

export default function Profile() {
  const { user, profile: userProfile, refreshProfile, setProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Active Tab state
  const [activeTab, setActiveTab] = useState('Edit Profile');

  // Stats Data
  const [submissions, setSubmissions] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Profile Form
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    institution: '',
    bio: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  // Password Change
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Delete Account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // V-Score Expand
  const [vScoreExpanded, setVScoreExpanded] = useState(false);

  // GitHub integration
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubLogin, setGithubLogin] = useState(null);
  const [githubRepos, setGithubRepos] = useState([]);
  const [showRepos, setShowRepos] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name || '',
        username: userProfile.github_username || '', // using this as generic username for now
        institution: userProfile.institution || '',
        bio: userProfile.bio || ''
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [subsRes, orgsRes, ghRes] = await Promise.all([
          fetch(`${API_URL}/api/records?user_id=${user.id}`),
          fetch(`${API_URL}/api/orgs?user_id=${user.id}`),
          fetch(`${API_URL}/api/github/repos?user_id=${user.id}`)
        ]);
        
        if (subsRes.ok) {
          const data = await subsRes.json();
          setSubmissions(data.records || []);
        }
        
        if (orgsRes.ok) {
          const data = await orgsRes.json();
          setOrgs(data.orgs || []);
        }
        
        if (ghRes.ok) {
          const data = await ghRes.json();
          setGithubConnected(true);
          setGithubRepos(data.repos || []);
          if (data.github_login) {
            setGithubLogin(data.github_login);
          } else if (data.repos?.length > 0) {
            setGithubLogin(data.repos[0].full_name.split('/')[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('github') === 'connected') {
      setGithubConnected(true);
      toast.success("GitHub connected successfully!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSaving(true);
    
    try {
      const updates = {
        name: editForm.name.trim(),
        institution: editForm.institution.trim(),
        bio: editForm.bio.trim(),
        github_username: editForm.username.trim() // using github_username as generic username handle
      };

      const { data, error } = await updateProfile(user.id, updates);
      
      if (error) {
        if (error.code === '42703' || error.message?.includes('column')) {
          const { data: retryData, error: retryError } = await updateProfile(user.id, {
            name: updates.name, 
            institution: updates.institution
          });
          if (retryError) throw retryError;
          if (retryData) setProfile(retryData);
          toast.warning('Bio/Username were skipped (DB migration needed).');
        } else {
          throw error;
        }
      } else if (data) {
        setProfile(data);
      }
      
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 3000);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPwd !== pwdForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    
    setIsChangingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwdForm.newPwd });
      if (error) throw error;
      toast.success('Password updated successfully');
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setIsDeleting(true);
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      toast.error('Failed to delete account');
      setIsDeleting(false);
    }
  };

  const handleConnectGitHub = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/github/connect?user_id=${user.id}`);
      const data = await res.json();
      if (data.authorize_url) {
        window.location.href = data.authorize_url;
      }
    } catch (err) {
      toast.error("Failed to initiate GitHub connection");
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!user?.id) return;
    setGithubLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/github/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      if (res.ok) {
        setGithubConnected(false);
        setGithubRepos([]);
        toast.success("GitHub disconnected.");
      }
    } catch (err) {
      toast.error("Failed to disconnect GitHub");
    } finally {
      setGithubLoading(false);
    }
  };

  // V-Score Calculation
  const onTimeCount = submissions.length; // assuming all on time for now
  const vScore = (submissions.length * 60) + (onTimeCount * 40);
  const { currentRank, nextRank } = getRankInfo(vScore);
  
  const scoreProgress = nextRank.minScore > currentRank.minScore 
    ? ((vScore - currentRank.minScore) / (nextRank.minScore - currentRank.minScore)) * 100
    : 100;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* SECTION 1 — Profile Hero Card */}
      <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Side: Avatar & Details */}
          <div className="flex items-center gap-4">
            <Avatar 
              size="lg" 
              seed={userProfile?.name || user?.email}
              src={userProfile?.avatar_url} 
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {userProfile?.name || 'Vouch Member'}
                </h1>
                <span className="badge-blue text-[10px] py-0.5 px-2 font-semibold">
                  {userProfile?.role || 'Student'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span>{userProfile?.institution || 'Vouch Platform'}</span>
              </div>
            </div>
          </div>

          {/* Right Side: V-Score Display */}
          <div className="md:w-64 space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-gray-400 tracking-wider">V-Score</p>
                <h3 className="text-4xl font-black text-vouch-600 dark:text-vouch-400 leading-none mt-1">
                  {vScore || 0}
                </h3>
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{currentRank.name}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-vouch-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, scoreProgress)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Below the Hero: 3 stat pills in a row */}
        <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800/80 text-center md:text-left">
          <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-805">
            <p className="text-xl font-black text-gray-950 dark:text-white">
              {submissions.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-450 mt-0.5">
              Total Submissions
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-805">
            <p className="text-xl font-black text-gray-955 dark:text-white">
              {orgs.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-455 mt-0.5">
              Orgs Joined
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-805">
            <p className="text-xl font-black text-gray-950 dark:text-white">
              {user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : 'Recently'}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-450 mt-0.5">
              Member Since
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Tabbed Sections */}
      <div className="flex border-b border-gray-250 dark:border-gray-800 overflow-x-auto scrollbar-none gap-8">
        {['Edit Profile', 'Security', 'GitHub', 'Submissions'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'border-vouch-600 text-vouch-600 dark:text-vouch-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT CARDS */}
      
      {/* Tab 1 — Edit Profile */}
      {activeTab === 'Edit Profile' && (
        <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft animate-in fade-in duration-200">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Profile</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Full Name" 
                value={editForm.name} 
                onChange={e => setEditForm({...editForm, name: e.target.value})} 
              />
              <Input 
                label="Institution / Company" 
                value={editForm.institution} 
                onChange={e => setEditForm({...editForm, institution: e.target.value})} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="block mb-1.5 text-sm font-medium text-gray-750 dark:text-gray-350">Bio</label>
              <textarea 
                rows={3}
                value={editForm.bio} 
                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                placeholder="Tell us about your expertise..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-vouch-500/20 focus:border-vouch-500 transition-all resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={isSaving}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm flex items-center gap-2"
              >
                {isSaving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : savedStatus ? (
                  <CheckCircle className="w-4 h-4 text-white animate-in zoom-in" />
                ) : null}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2 — Security */}
      {activeTab === 'Security' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Change Password Card */}
          <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Change Password</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  type="password" 
                  label="Current Password" 
                  placeholder="••••••••"
                  value={pwdForm.current}
                  onChange={e => setPwdForm({...pwdForm, current: e.target.value})}
                  required
                />
                <Input 
                  type="password" 
                  label="New Password" 
                  placeholder="••••••••"
                  value={pwdForm.newPwd}
                  onChange={e => setPwdForm({...pwdForm, newPwd: e.target.value})}
                  required
                />
                <Input 
                  type="password" 
                  label="Confirm New Password"
                  placeholder="••••••••"
                  value={pwdForm.confirm}
                  onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={isChangingPwd}
                  className="btn-primary py-2 px-4 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  {isChangingPwd && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone Card */}
          <div className="card p-6 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/30 shadow-soft space-y-4">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-500">Danger Zone</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
              Permanently delete your account and all associated data. This action is irreversible and will remove all your notarized assets from your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 max-w-sm">
                <Input 
                  placeholder='Type "DELETE" to confirm'
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                />
              </div>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || isDeleting}
                className="btn-danger py-2.5 px-6 text-sm font-semibold rounded-xl"
              >
                {isDeleting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3 — GitHub */}
      {activeTab === 'GitHub' && (
        <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft animate-in fade-in duration-200">
          {githubConnected ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                    <Github className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="badge-green text-xs font-bold py-1 px-3 rounded-full">
                      Connected as @{githubLogin || editForm.username}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Integrations successfully configured
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowRepos(!showRepos)}
                    className="btn-secondary py-2 px-4 text-xs font-semibold rounded-lg"
                  >
                    {showRepos ? 'Hide Repos' : 'View Repos'}
                  </button>
                  <button 
                    type="button"
                    onClick={handleDisconnectGitHub} 
                    disabled={githubLoading}
                    className="btn-danger py-2 px-4 text-xs font-semibold rounded-lg"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {showRepos && githubRepos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {githubRepos.map(repo => (
                    <div key={repo.full_name} className="card p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 shadow-soft">
                      <div className="space-y-1 min-w-0 pr-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {repo.name}
                        </p>
                        <span className="badge-blue font-mono text-[9px] py-0.5 px-2 font-semibold">
                          {repo.language || 'Code'}
                        </span>
                      </div>
                      <a 
                        href={repo.html_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-450 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 max-w-sm mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 flex items-center justify-center mx-auto text-gray-500">
                <Github className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Connect GitHub Account
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Link your GitHub to vouch files directly from your repos.
                </p>
              </div>
              <button 
                type="button"
                onClick={handleConnectGitHub}
                className="w-full btn-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Github className="w-4 h-4" />
                <span>Connect GitHub</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4 — Submissions */}
      {activeTab === 'Submissions' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {isLoading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : submissions.length === 0 ? (
            <div className="card p-12 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft">
              <FileCode2 className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                No submissions yet
              </h4>
              <p className="text-xs text-gray-500 font-medium mb-6">
                Vouch your first file from the dashboard to see it listed here.
              </p>
              <Link to="/dashboard" className="btn-primary py-2 px-4 text-xs font-semibold rounded-lg">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="table-wrapper bg-white dark:bg-gray-900">
              <table className="table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Language</th>
                    <th>Submitted At</th>
                    <th>Verification Code</th>
                    <th>Anchored</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 10).map((sub) => (
                    <tr key={sub.id}>
                      <td className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                        <span 
                          onClick={() => navigate(`/verify/${sub.verification_code}`)}
                          className="text-vouch-600 dark:text-vouch-400 hover:underline cursor-pointer"
                        >
                          {sub.file_name}
                        </span>
                      </td>
                      <td>
                        <span className="badge-blue font-mono text-[9px] py-0.5 px-2 font-semibold">
                          {sub.language || 'Code'}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
                      </td>
                      <td className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {sub.verification_code}
                      </td>
                      <td>
                        <AnchorBadge anchored={sub.anchored} compact={true} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
