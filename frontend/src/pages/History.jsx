import API_URL from '../lib/apiUrl.js';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Search, FileCode2, Download, Copy, Check, ChevronRight, X, 
  Code2, Coffee, Braces, FileText, Anchor, Link2, DownloadCloud, Share2,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AnchorBadge from '../components/ui/AnchorBadge';
import { Button, Input, Card, Badge, SkeletonTable, EmptyState } from '../components/ui';



// Language icon/color mapping
const getLangConfig = (lang) => {
  const norm = (lang || '').toLowerCase();
  if (norm === 'python' || norm === 'py') return { icon: Code2, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
  if (norm === 'java') return { icon: Coffee, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' };
  if (norm === 'cpp' || norm === 'c++') return { icon: Braces, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' };
  return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' };
};

const getBadgeColor = (lang) => {
  const norm = (lang || '').toLowerCase();
  if (norm === 'python' || norm === 'py') return 'blue';
  if (norm === 'java') return 'orange';
  if (norm === 'cpp' || norm === 'c++') return 'purple';
  return 'gray';
};

export default function History() {
  const { user, session } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  // State
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/records?user_id=${user.id}`, {
          headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
        });
        if (!res.ok) throw new Error("Failed to fetch records");
        const data = await res.json();
        setRecords(data.records || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user?.id, session?.access_token]);

  // Computed data
  const filteredRecords = useMemo(() => {
    return records
      .filter(record => {
        const q = debouncedSearch.toLowerCase();
        const matchSearch = !q || (record.file_name || '').toLowerCase().includes(q) || (record.verification_code || '').toLowerCase().includes(q);
        const matchLang = filterLanguage === 'all' || (record.language || '').toLowerCase() === filterLanguage;
        const matchStatus = filterStatus === 'all' || 
          (filterStatus === 'anchored' && record.anchored) || 
          (filterStatus === 'pending' && !record.anchored);
        
        return matchSearch && matchLang && matchStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.submitted_at).getTime();
        const dateB = new Date(b.submitted_at).getTime();
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [records, debouncedSearch, filterLanguage, filterStatus, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  // Group by month
  const groupedRecords = useMemo(() => {
    const groups = {};
    paginatedRecords.forEach(record => {
      const monthYear = format(new Date(record.submitted_at), 'MMMM yyyy');
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(record);
    });
    return groups;
  }, [paginatedRecords]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (!filteredRecords.length) return;
    
    const headers = ['Student Name', 'File Name', 'Language', 'Submitted At', 'Verification Code', 'Structural Hash', 'Anchored', 'Organization'];
    const rows = filteredRecords.map(r => [
      `"${r.student_name || ''}"`,
      `"${r.file_name || ''}"`,
      `"${r.language || ''}"`,
      `"${r.submitted_at || ''}"`,
      `"${r.verification_code || ''}"`,
      `"${r.structural_hash || ''}"`,
      r.anchored ? 'Yes' : 'No',
      `"${r.org_name || 'Personal'}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vouch_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredRecords]);

  // Copy helper
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Download Cert
  const handleDownloadCert = async (record) => {
    try {
      const res = await fetch(`${API_URL}/api/certificate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
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
      a.download = `Vouch_Cert_${record.verification_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const hasActiveFilters = searchQuery !== '' || filterLanguage !== 'all' || filterStatus !== 'all' || sortBy !== 'newest';
  const clearFilters = () => {
    setSearchQuery('');
    setFilterLanguage('all');
    setFilterStatus('all');
    setSortBy('newest');
    setPage(1);
  };

  // Compute stats for the header
  const stats = useMemo(() => {
    const total = records.length;
    const anchored = records.filter(r => r.anchored).length;
    const uniqueLangs = new Set(records.map(r => (r.language || '').toLowerCase()).filter(Boolean));
    return {
      total,
      anchored,
      languages: uniqueLangs.size
    };
  }, [records]);

  return (
    <div className="flex h-full relative overflow-hidden animate-in fade-in duration-300 pb-20">
      
      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 transition-all duration-300 ${selectedRecord ? 'pr-96' : ''} overflow-y-auto w-full max-w-7xl mx-auto px-2 lg:px-4`}>
        
        {/* HEADER */}
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submission History</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All your vouched files, searchable and filterable.
              </p>
            </div>
            <Button variant="outline" onClick={handleExportCSV} disabled={!filteredRecords.length}>
              <DownloadCloud className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center justify-between shadow-soft hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Submissions</p>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-vouch-50 dark:bg-vouch-950/30 flex items-center justify-center text-vouch-600 dark:text-vouch-400">
                <FileCode2 className="w-5 h-5" />
              </div>
            </Card>
            <Card className="p-4 flex items-center justify-between shadow-soft hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Anchored on-chain</p>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.anchored}</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <Anchor className="w-5 h-5" />
              </div>
            </Card>
            <Card className="p-4 flex items-center justify-between shadow-soft hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Languages Used</p>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.languages}</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Code2 className="w-5 h-5" />
              </div>
            </Card>
          </div>
        </div>

        {/* FILTER BAR */}
        <Card className="p-3 mb-8 flex flex-col sm:flex-row flex-wrap items-center gap-3 sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder="Search files or code..."
              value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-semibold outline-none focus:border-vouch-500 transition-colors"
            />
          </div>
          
          <select value={filterLanguage} onChange={e => { setFilterLanguage(e.target.value); setPage(1); }} className="px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-semibold outline-none cursor-pointer">
            <option value="all">All Languages</option>
            <option value="py">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="txt">Text</option>
          </select>
          
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-semibold outline-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="anchored">Anchored</option>
            <option value="pending">Pending</option>
          </select>
          
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} className="px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-semibold outline-none cursor-pointer">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 transition-colors">
              Clear filters
            </button>
          )}
        </Card>

        {/* LOADING SKELETON */}
        {isLoading ? (
          <SkeletonTable rows={6} cols={4} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={<FileCode2 />}
            title="No submissions yet"
            description="Vouch your first file from the Dashboard to see it here."
            action={() => navigate('/dashboard')}
            actionLabel="Go to Dashboard"
          />
        ) : filteredRecords.length === 0 ? (
          /* EMPTY STATE FOR FILTERS */
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl mt-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
              <FileCode2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No submissions match your filters</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Try adjusting your search query or clear the filters.</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters}>Clear filters</Button>
            )}
          </div>
        ) : (
          /* TIMELINE VIEW */
          <div className="space-y-8 relative">
            {Object.entries(groupedRecords).map(([month, monthRecords]) => (
              <div key={month} className="relative">
                <div className="flex items-center gap-3 mb-4 sticky top-[72px] z-10 bg-vouch-light dark:bg-vouch-dark py-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{month}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400">{monthRecords.length}</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                </div>
                
                <div className="space-y-2">
                  {monthRecords.map(record => {
                    const isSelected = selectedRecord?.id === record.id;
                    const langConf = getLangConfig(record.language);
                    const Icon = langConf.icon;
                    const timeAgo = formatDistanceToNow(new Date(record.submitted_at), { addSuffix: true });
                    
                    return (
                      <div 
                        key={record.id}
                        onClick={() => setSelectedRecord(record)}
                        className={`group flex items-center p-4 rounded-2xl border transition-all cursor-pointer shadow-sm
                          ${isSelected 
                            ? 'bg-vouch-50 dark:bg-vouch-900/20 border-vouch-500 shadow-md' 
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                      >
                        {/* LEFT: Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${langConf.bg} ${langConf.color} mr-4`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        {/* CENTER: Info */}
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900 dark:text-white truncate">{record.file_name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                              {record.language || 'txt'}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                            {record.verification_code}
                          </div>
                          <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 truncate flex items-center gap-1.5">
                            Vouched {timeAgo} 
                            {record.org_name && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                <span className="text-vouch-600 dark:text-vouch-400">{record.org_name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* RIGHT: Actions */}
                        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <AnchorBadge anchored={record.anchored} compact={true} />
                          <button onClick={(e) => { e.stopPropagation(); handleCopy(record.verification_code); }} className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Copy code">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDownloadCert(record); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title="Download cert">
                            <Download className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 ml-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-800">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  &larr; Previous
                </Button>
                <span className="text-sm font-bold text-gray-500">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next &rarr;
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL SIDE PANEL */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div 
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-40 flex flex-col pt-16 lg:pt-0"
          >
            {/* Detail Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-150 dark:border-gray-800">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Submission Details</h2>
              <button onClick={() => setSelectedRecord(null)} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title: File Name */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">File Name</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white break-words">{selectedRecord.file_name}</h3>
              </div>

              {/* Status and Language Badge */}
              <div className="flex items-center gap-3">
                <AnchorBadge anchored={selectedRecord.anchored} compact={false} />
                <Badge variant={getBadgeColor(selectedRecord.language)} className="uppercase font-bold tracking-wider text-xs">
                  {selectedRecord.language || 'text'}
                </Badge>
              </div>

              {/* Submitted At */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Submitted At</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {format(new Date(selectedRecord.submitted_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>

              {/* Verification Code */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verification Code</p>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl">
                  <code className="font-mono text-sm font-bold text-vouch-600 dark:text-vouch-400 select-all">
                    {selectedRecord.verification_code}
                  </code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedRecord.verification_code);
                      toast.success("Verification code copied!");
                    }} 
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500"
                    title="Copy Verification Code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Structural Hash */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Structural Hash</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedRecord.structural_hash);
                      toast.success("Structural hash copied!");
                    }} 
                    className="text-[10px] font-bold text-vouch-600 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl">
                  <p className="font-mono text-xs text-gray-500 break-all leading-relaxed">
                    {selectedRecord.structural_hash && selectedRecord.structural_hash.length > 32 
                      ? `${selectedRecord.structural_hash.substring(0, 32)}...` 
                      : selectedRecord.structural_hash}
                  </p>
                </div>
              </div>

              {/* Meta details if helpful */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Student</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{selectedRecord.student_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Organization</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{selectedRecord.org_name || 'Personal'}</p>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="p-5 border-t border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 space-y-3 pb-8 sm:pb-5">
              <Button variant="primary" className="w-full shadow-lg shadow-blue-500/20 flex items-center justify-center" onClick={() => handleDownloadCert(selectedRecord)}>
                <Download className="w-4 h-4 mr-2" /> Download Certificate
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-[11px] h-9" onClick={() => window.open(`/verify/${selectedRecord.verification_code}`, '_blank')}>
                  <ExternalLink className="w-3 h-3 mr-1.5" /> Portal
                </Button>
                <Button variant="outline" className="flex-1 text-[11px] h-9" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/verify/${selectedRecord.verification_code}`);
                  toast.success("Verification link copied!");
                }}>
                  <Share2 className="w-3 h-3 mr-1.5" /> Share
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
