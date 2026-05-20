import API_URL from '../../lib/apiUrl.js';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Crown, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, Avatar } from '../ui';



// Animated Number Component
const AnimatedNumber = ({ value }) => {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

export default function Leaderboard({ orgId, limit = 10, compact = false }) {
  const { user, session } = useAuth();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    if (!orgId) return;
    try {
      const headers = session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
      const res = await fetch(`${API_URL}/api/orgs/${orgId}/submissions`, { headers });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      
      const { submissions } = await res.json();
      
      // Group by student_name
      const grouped = {};
      (submissions || []).forEach(sub => {
        const name = sub.student_name || 'Unknown Student';
        if (!grouped[name]) {
          grouped[name] = { name, submissions: 0, onTime: 0, userId: sub.user_id };
        }
        grouped[name].submissions += 1;
        
        // Count on-time (mocking `is_late = false` check based on actual schema if available)
        // If the backend has `is_late` we use it, otherwise we assume true for now.
        if (sub.is_late === false || sub.is_late === undefined) {
          grouped[name].onTime += 1;
        }
      });
      
      // Calculate scores & sort
      const mapped = Object.values(grouped).map(g => ({
        ...g,
        score: (g.submissions * 10) + (g.onTime * 15)
      })).sort((a, b) => b.score - a.score);
      
      // Add ranks
      mapped.forEach((m, idx) => { m.rank = idx + 1; });
      setEntries(mapped);
    } catch (e) {
      console.error("Leaderboard fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Subscribe to realtime submissions for this org
    const channel = supabase.channel(`leaderboard-${orgId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'submissions',
        filter: `org_id=eq.${orgId}`
      }, () => {
        fetchLeaderboard(); // Refetch when a new submission drops
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const currentUserRank = useMemo(() => {
    if (!user) return null;
    const found = entries.find(e => e.userId === user.id || e.name === user.user_metadata?.full_name);
    return found ? found.rank : null;
  }, [entries, user]);

  const displayedEntries = limit ? entries.slice(0, limit) : entries;
  const isUserInDisplayed = displayedEntries.some(e => e.rank === currentUserRank);
  const currentUserEntry = entries.find(e => e.rank === currentUserRank);

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
    if (rank === 2) return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    if (rank === 3) return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700';
    return 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-800';
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // ─── COMPACT MODE ───
  if (compact) {
    return (
      <div className="space-y-2">
        {displayedEntries.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">No submissions yet</p>
        ) : (
          displayedEntries.map((e) => {
            const isMe = e.rank === currentUserRank;
            return (
              <div key={e.name} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isMe ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-6 h-6 shrink-0 flex items-center justify-center text-[10px] font-bold rounded-full border ${getRankStyle(e.rank)}`}>
                    {getRankMedal(e.rank)}
                  </span>
                  <span className={`text-xs font-semibold truncate ${isMe ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {e.name} {isMe && "(You)"}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400 shrink-0">
                  <AnimatedNumber value={e.score} />
                </span>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ─── FULL MODE ───
  return (
    <Card className="flex flex-col h-full border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden bg-white dark:bg-gray-900">
      
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Leaderboard</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full border border-green-200 dark:border-green-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="w-12 h-12 text-gray-200 dark:text-gray-800 mb-3" />
            <p className="text-sm font-bold text-gray-400">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Podium (if >= 3 entries) */}
            {entries.length >= 3 && (
              <div className="flex items-end justify-center gap-2 sm:gap-4 mt-4 mb-10 h-48">
                
                {/* 2nd Place */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center w-1/3 max-w-[100px]">
                  <Avatar seed={entries[1].name} size="md" className="border-4 border-gray-200 dark:border-gray-700 shadow-lg mb-2" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate w-full text-center">{entries[1].name.split(' ')[0]}</span>
                  <div className="w-full bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 h-24 rounded-t-xl border-x border-t border-gray-300 dark:border-gray-600 mt-2 flex flex-col items-center justify-start pt-3">
                    <span className="text-2xl font-black text-gray-400 dark:text-gray-500">2</span>
                    <span className="text-[10px] font-mono font-bold mt-1 text-gray-500"><AnimatedNumber value={entries[1].score} /></span>
                  </div>
                </motion.div>

                {/* 1st Place */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col items-center w-1/3 max-w-[120px] relative z-10">
                  <Crown className="w-6 h-6 text-yellow-500 mb-[-10px] relative z-20 drop-shadow-md" />
                  <Avatar seed={entries[0].name} size="lg" className="border-4 border-yellow-400 shadow-xl shadow-yellow-500/20 mb-2" />
                  <span className="text-sm font-black text-yellow-600 dark:text-yellow-500 truncate w-full text-center">{entries[0].name.split(' ')[0]}</span>
                  <div className="w-full bg-gradient-to-t from-yellow-200 to-yellow-50 dark:from-yellow-900/50 dark:to-yellow-700/30 h-32 rounded-t-xl border-x border-t border-yellow-300 dark:border-yellow-600/50 mt-2 flex flex-col items-center justify-start pt-3 shadow-2xl">
                    <span className="text-3xl font-black text-yellow-600 dark:text-yellow-500">1</span>
                    <span className="text-xs font-mono font-bold mt-1 text-yellow-700 dark:text-yellow-400"><AnimatedNumber value={entries[0].score} /></span>
                  </div>
                </motion.div>

                {/* 3rd Place */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0 }} className="flex flex-col items-center w-1/3 max-w-[100px]">
                  <Avatar seed={entries[2].name} size="md" className="border-4 border-orange-200 dark:border-orange-800 shadow-lg mb-2" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate w-full text-center">{entries[2].name.split(' ')[0]}</span>
                  <div className="w-full bg-gradient-to-t from-orange-200 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/30 h-20 rounded-t-xl border-x border-t border-orange-300 dark:border-orange-700/50 mt-2 flex flex-col items-center justify-start pt-3">
                    <span className="text-2xl font-black text-orange-400 dark:text-orange-500">3</span>
                    <span className="text-[10px] font-mono font-bold mt-1 text-orange-500"><AnimatedNumber value={entries[2].score} /></span>
                  </div>
                </motion.div>
                
              </div>
            )}

            {/* List */}
            <div className="space-y-2">
              <div className="flex text-[10px] font-black uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-100 dark:border-gray-800 px-4">
                <div className="w-12">Rank</div>
                <div className="flex-1">Member</div>
                <div className="w-20 text-center hidden sm:block">Subs</div>
                <div className="w-20 text-center hidden sm:block">On Time</div>
                <div className="w-16 text-right">Score</div>
              </div>
              
              {displayedEntries.slice(entries.length >= 3 ? 3 : 0).map((e) => {
                const isMe = e.rank === currentUserRank;
                return (
                  <div key={e.name} className={`flex items-center px-4 py-3 rounded-xl transition-all ${isMe ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'}`}>
                    <div className="w-12 font-bold text-gray-400 dark:text-gray-500 text-sm">#{e.rank}</div>
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <Avatar seed={e.name} size="sm" />
                      <span className={`font-semibold text-sm truncate ${isMe ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                        {e.name} {isMe && "(You)"}
                      </span>
                    </div>
                    <div className="w-20 text-center text-xs font-medium text-gray-500 hidden sm:block">{e.submissions}</div>
                    <div className="w-20 text-center text-xs font-medium text-gray-500 hidden sm:block">{e.onTime}</div>
                    <div className="w-16 text-right font-mono font-bold text-sm text-gray-700 dark:text-gray-300">
                      <AnimatedNumber value={e.score} />
                    </div>
                  </div>
                );
              })}

              {/* Current User Fallback (If they aren't in the top limits) */}
              {!isUserInDisplayed && currentUserEntry && (
                <>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800 border-dashed" /></div>
                    <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-900 px-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Your Rank</span></div>
                  </div>
                  <div className="flex items-center px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm">
                    <div className="w-12 font-bold text-blue-500 text-sm">#{currentUserEntry.rank}</div>
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <Avatar seed={currentUserEntry.name} size="sm" />
                      <span className="font-semibold text-sm truncate text-blue-700 dark:text-blue-400">
                        {currentUserEntry.name} (You)
                      </span>
                    </div>
                    <div className="w-20 text-center text-xs font-medium text-blue-500/70 hidden sm:block">{currentUserEntry.submissions}</div>
                    <div className="w-20 text-center text-xs font-medium text-blue-500/70 hidden sm:block">{currentUserEntry.onTime}</div>
                    <div className="w-16 text-right font-mono font-bold text-sm text-blue-700 dark:text-blue-400">
                      <AnimatedNumber value={currentUserEntry.score} />
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
