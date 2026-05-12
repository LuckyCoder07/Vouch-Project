import React, { useState, useEffect } from 'react';
import {
  User, Mail, Building, Award, FileBadge, TrendingUp, FileText, ArrowRight, Download,
  Pen, Save, Github, Globe, RefreshCcw, X, Camera, Briefcase, MessageSquare, CheckCircle, AlertCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import Skeleton from '../components/ui/Skeleton';
import { updateProfile } from '../lib/supabase';

const ROLES = [
  'Student', 'Professor', 'Security Researcher', 'Software Engineer', 'Code Auditor', 'Blockchain Developer', 'Other'
];

const getRankStyle = (rank) => {
  switch (rank) {
    case 'Unranked':           return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600';
    case 'Code Notary Rookie': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
    case 'Code Notary Pro':    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-700';
    case 'Code Notary Master': return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg shadow-amber-500/30';
    default:                   return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  }
};

export default function Profile() {
  const { user, profile: userProfile, refreshProfile, setProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [stats, setStats] = useState({ vScore: 0, contributions: 0, rank: 'Unranked' });
  const [recentActivity, setRecentActivity] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', institution: '', role: 'Student', bio: '', github_username: '', website: ''
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      setIsLoadingStats(true);
      try {
        const res = await fetch(`/api/records?user_id=${user.id}`);
        if (!res.ok) throw new Error('Failed to fetch records');
        const data = await res.json();
        const records = data.records || [];

        const vScore = records.length * 150;
        let rank = 'Unranked';
        if (vScore >= 5000) rank = 'Code Notary Master';
        else if (vScore >= 1000) rank = 'Code Notary Pro';
        else if (vScore >= 100) rank = 'Code Notary Rookie';

        setStats({ vScore, contributions: records.length, rank });
        setRecentActivity(records.slice(0, 5));
      } catch (err) {
        toast.error('Failed to load stats: ' + err.message);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, [user?.id]);

  useEffect(() => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name || '',
        institution: userProfile.institution || '',
        role: userProfile.role || 'Student',
        bio: userProfile.bio || '',
        github_username: userProfile.github_username || '',
        website: userProfile.website || ''
      });
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsUpdating(true);
    try {
      const updates = {
        name: editForm.name.trim(),
        institution: editForm.institution.trim(),
        role: editForm.role,
        bio: (editForm.bio || '').trim(),
        github_username: (editForm.github_username || '').trim(),
        website: (editForm.website || '').trim()
      };

      const { data, error } = await updateProfile(user.id, updates);
      
      if (error) {
        // Handle missing columns if migrations haven't been run
        if (error.code === '42703' || error.message?.includes('column')) {
          const { data: retryData, error: retryError } = await updateProfile(user.id, {
            name: updates.name, 
            institution: updates.institution, 
            role: updates.role
          });
          if (retryError) throw retryError;
          if (retryData) setProfile(retryData);
          toast.warning('Bio/Website were skipped (DB migration needed).');
        } else {
          throw error;
        }
      } else if (data) {
        // Success - update state instantly with returned data
        setProfile(data);
      }

      toast.success('Profile synchronized.');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  const downloadCertificate = async (record) => {
    try {
      const res = await fetch(`/api/certificate`, {
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
      if (!res.ok) throw new Error('Failed to generate certificate.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${record.student_name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Download failed: ' + err.message);
    }
  };

  const avatarSeed = user?.email || 'vouch';
  const avatarUrl = userProfile?.avatar_url || user?.user_metadata?.avatar_url || null;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Personal Ledger</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">Your decentralized identity and reputation score.</p>
      </div>

      {/* ── PROFILE HERO CARD - Avatar + Info side-by-side ── */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
        </div>

        {/* Content row */}
        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-12 mb-8">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-[1.5rem] border-4 border-white dark:border-gray-800 overflow-hidden shadow-xl bg-white dark:bg-gray-900">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/8.x/identicon/svg?seed=${avatarSeed}`} alt="Avatar" className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            {/* Name / Role / Rank */}
            <div className="flex-1 pt-2 sm:pt-8">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  {userProfile?.name || 'Vouch Member'}
                </h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getRankStyle(stats.rank)}`}>
                  <Award size={12} /> {stats.rank}
                </span>
              </div>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">{userProfile?.role || 'Vouch Member'}</p>
              {userProfile?.bio && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-lg">"{userProfile.bio}"</p>
              )}
            </div>

            {/* Edit Button — right of avatar row */}
            <div className="sm:pt-8">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 ${
                  isEditing
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                }`}
              >
                {isEditing ? <X size={16} /> : <Pen size={16} />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Quick info bar */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-50 dark:border-gray-700 pt-5">
            <span className="flex items-center gap-2"><Mail size={15} className="text-gray-400" />{user?.email}</span>
            <span className="flex items-center gap-2"><Building size={15} className="text-gray-400" />{userProfile?.institution || 'Vouch Global'}</span>
            {userProfile?.github_username && (
              <a href={`https://github.com/${userProfile.github_username}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-900 dark:text-white font-bold hover:text-blue-600 dark:hover:text-blue-400 transition">
                <Github size={15} /> {userProfile.github_username}
              </a>
            )}
            {userProfile?.website && (
              <a href={userProfile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-900 dark:text-white font-bold hover:text-blue-600 dark:hover:text-blue-400 transition">
                <Globe size={15} /> Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── INLINE EDIT FORM (slides open below hero) ── */}
      {isEditing && (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-8">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Pen size={20} className="text-blue-600" /> Identity Settings
            </h3>
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Full Name</label>
                  <input type="text" required value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white font-bold text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Institution</label>
                  <input type="text" required value={editForm.institution}
                    onChange={e => setEditForm({ ...editForm, institution: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white font-bold text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Network Role</label>
                  <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white font-bold text-sm appearance-none">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Bio</label>
                  <input type="text" value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Short expertise summary..."
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white font-bold text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">GitHub Username</label>
                  <div className="relative">
                    <Github size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={editForm.github_username}
                      onChange={e => setEditForm({ ...editForm, github_username: e.target.value })}
                      placeholder="username"
                      className="w-full pl-10 pr-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white font-bold text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Website</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={editForm.website}
                      onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full pl-10 pr-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white font-bold text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50 dark:border-gray-700">
                <button type="button" onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-black text-gray-500 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdating}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-600/20 transition disabled:opacity-50 active:scale-95 text-xs">
                  {isUpdating ? <RefreshCcw className="animate-spin" size={15} /> : <Save size={15} />}
                  Commit Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STATS + ACTIVITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div onClick={() => navigate('/vscore')} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-lg relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-full group-hover:scale-110 transition-transform" />
            <TrendingUp className="text-blue-600 mb-2" size={28} />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Reputation Score</h4>
            <p className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{isLoadingStats ? '---' : stats.vScore}</p>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-blue-600"><span>Analyze Score</span><ArrowRight size={14} /></div>
          </div>
          <div onClick={() => navigate('/history')} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-lg relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-bl-full group-hover:scale-110 transition-transform" />
            <FileBadge className="text-indigo-600 mb-2" size={28} />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Decentralized Assets</h4>
            <p className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{isLoadingStats ? '---' : stats.contributions}</p>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-indigo-600"><span>View History</span><ArrowRight size={14} /></div>
          </div>
        </div>

        {/* Live Ledger Stream */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 h-full">
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 dark:border-gray-700 pb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Ledger Stream</h2>
              <Link to="/history" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">See All <ArrowRight size={14} /></Link>
            </div>
            {isLoadingStats ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} height="5rem" className="rounded-2xl" />)}</div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all group">
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm group-hover:scale-110 transition-transform shrink-0">
                        <FileText className="text-blue-500" size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate text-lg">{record.file_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(record.submitted_at).toLocaleDateString()}</span>
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">· {record.language || 'Code'}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => downloadCertificate(record)} className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 transition shadow-sm border border-gray-100 dark:border-gray-700">
                      <Download size={20} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">No assets vouchered yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
