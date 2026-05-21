import React, { useState, useEffect } from 'react';
import API_URL from '../lib/apiUrl.js';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import VScoreHistory from './VScoreHistory';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function VScore() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [userRecords, setUserRecords] = useState([]);
  const [stats, setStats] = useState({ vScore: 0, rank: 'Unranked' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/records?user_id=${user.id}`);
        if (!response.ok) throw new Error("Failed to fetch records");
        const data = await response.json();
        const records = data.records || [];
        
        setUserRecords(records);

        // Calculate V-Score (consistent with Profile logic: 150 pts per submission)
        const vScore = records.length * 150;
        let rank = "Unranked";
        if (vScore >= 5000) rank = "Code Notary Master";
        else if (vScore >= 2500) rank = "Code Notary Elite";
        else if (vScore >= 1000) rank = "Code Notary Pro";
        else if (vScore >= 500) rank = "Code Notary Analyst";
        else if (vScore >= 100) rank = "Code Notary Rookie";

        setStats({ vScore, rank });
      } catch (err) {
        toast.error("Failed to load V-Score history: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4 group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </button>

      <VScoreHistory 
        userRecords={userRecords}
        vScore={stats.vScore}
        rank={stats.rank}
        isLoading={isLoading}
      />
    </div>
  );
}
