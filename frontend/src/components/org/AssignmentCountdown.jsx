import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, AlertTriangle, ArrowRight, Play } from 'lucide-react';
import { Button, Card } from '../ui';

const calculateTimeLeft = (deadline) => {
  if (!deadline) return { overdue: true, total: 0 };
  const diff = new Date(deadline).getTime() - new Date().getTime();
  if (diff <= 0) return { overdue: true, total: 0 };

  return {
    overdue: false,
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

// Assuming an assignment might have a created_at for the progress bar.
// If not provided, default to a 7-day span.
const getProgressPercentage = (deadline, createdAt, timeLeftTotal) => {
  const end = new Date(deadline).getTime();
  const start = createdAt ? new Date(createdAt).getTime() : end - (7 * 24 * 60 * 60 * 1000);
  const totalDuration = end - start;
  if (totalDuration <= 0) return 100;
  
  const elapsed = totalDuration - timeLeftTotal;
  const percentage = (elapsed / totalDuration) * 100;
  return Math.max(0, Math.min(100, percentage));
};

const AnimatedUnit = ({ value, label, urgencyColor }) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 border ${urgencyColor.border} rounded-xl p-3 sm:p-4 w-16 sm:w-20`}>
      <motion.div
        key={value}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`text-2xl sm:text-3xl font-black ${urgencyColor.text} font-mono`}
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mt-1">
        {label}
      </span>
    </div>
  );
};

export default function AssignmentCountdown({ 
  assignment, 
  submitted = false, 
  submittedAt = null,
  onSubmit, 
  compact = false 
}) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(assignment?.deadline));

  useEffect(() => {
    if (!assignment?.deadline || submitted) return;
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(assignment.deadline));
    }, 1000);

    return () => clearInterval(timer);
  }, [assignment?.deadline, submitted]);

  const { overdue, days, hours, minutes, seconds, total } = timeLeft;
  
  let urgencyLevel = 'safe';
  if (overdue) {
    urgencyLevel = 'closed';
  } else if (total < 1000 * 60 * 60) {
    // Less than 1 hour
    urgencyLevel = 'critical';
  } else if (total < 1000 * 60 * 60 * 24) {
    // Less than 24 hours
    urgencyLevel = 'warning';
  }

  const getUrgencyStyles = () => {
    switch (urgencyLevel) {
      case 'critical': return { text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800/50', bar: 'bg-red-500' };
      case 'warning': return { text: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800/50', bar: 'bg-orange-500' };
      case 'safe': return { text: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800/50', bar: 'bg-green-500' };
      default: return { text: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900', border: 'border-gray-200 dark:border-gray-800', bar: 'bg-gray-500' };
    }
  };

  const urgencyStyle = getUrgencyStyles();
  const progressPercent = getProgressPercentage(assignment?.deadline, assignment?.created_at, total);

  // ─── COMPACT MODE ───
  if (compact) {
    if (submitted) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 rounded-full text-xs font-bold">
          <CheckCircle className="w-3.5 h-3.5" />
          Submitted
        </div>
      );
    }
    
    if (overdue) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          Closed
        </div>
      );
    }

    let timeText = '';
    if (days > 0) timeText = `${days}d ${hours}h left`;
    else if (hours > 0) timeText = `${hours}h ${minutes}m left`;
    else timeText = `${minutes}m left`;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 ${urgencyStyle.bg} ${urgencyStyle.text} ${urgencyStyle.border} border rounded-full text-xs font-bold`}>
        {urgencyLevel === 'critical' ? (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ animationDuration: '0.5s' }} />
        ) : urgencyLevel === 'warning' ? (
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        ) : (
          <Clock className="w-3.5 h-3.5" />
        )}
        {timeText}
      </div>
    );
  }

  // ─── FULL MODE ───
  return (
    <Card className="border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950 flex flex-col h-full">
      
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">{assignment?.title || 'Assignment'}</h3>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Due: {new Date(assignment?.deadline).toLocaleString()}
          </p>
        </div>
        
        {/* Status Badge */}
        {submitted ? (
           <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 border border-green-200 dark:border-green-800">
             <CheckCircle className="w-3 h-3" /> Done
           </span>
        ) : overdue ? (
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 border border-gray-200 dark:border-gray-700">
            <AlertCircle className="w-3 h-3" /> Passed
          </span>
        ) : (
          <span className={`px-3 py-1 ${urgencyStyle.bg} ${urgencyStyle.text} ${urgencyStyle.border} border text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1`}>
            {(urgencyLevel === 'warning' || urgencyLevel === 'critical') && (
              <span className={`w-1.5 h-1.5 rounded-full ${urgencyLevel === 'critical' ? 'bg-red-500' : 'bg-orange-500'} animate-pulse`} style={urgencyLevel === 'critical' ? { animationDuration: '0.5s' } : {}} />
            )}
            {urgencyLevel}
          </span>
        )}
      </div>

      {/* Body Content */}
      <div className="p-6 flex-1 flex flex-col justify-center">
        
        {submitted ? (
          <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">Submitted Successfully</p>
              {submittedAt && (
                <p className="text-xs font-semibold text-gray-500 mt-1">Recorded on {new Date(submittedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        ) : overdue ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-2">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">Deadline has passed</p>
              <p className="text-sm font-semibold text-gray-500">
                {assignment?.allow_late ? "Late submissions are accepted." : "Submissions are closed."}
              </p>
            </div>
            
            {onSubmit && assignment?.allow_late && (
              <Button variant="secondary" onClick={onSubmit} className="mt-2 shadow-sm">
                Submit Late
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            
            {/* The Countdown Clock */}
            <div className="flex items-center gap-2 sm:gap-3 mb-6">
              <AnimatedUnit value={days} label="DD" urgencyColor={urgencyStyle} />
              <span className={`text-2xl font-black ${urgencyStyle.text} mb-5`}>:</span>
              <AnimatedUnit value={hours} label="HH" urgencyColor={urgencyStyle} />
              <span className={`text-2xl font-black ${urgencyStyle.text} mb-5`}>:</span>
              <AnimatedUnit value={minutes} label="MM" urgencyColor={urgencyStyle} />
              <span className={`text-2xl font-black ${urgencyStyle.text} mb-5`}>:</span>
              <AnimatedUnit value={seconds} label="SS" urgencyColor={urgencyStyle} />
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
              Submit before deadline
            </p>

            {onSubmit && (
              <Button 
                variant="primary" 
                onClick={onSubmit} 
                className={`w-full max-w-[240px] shadow-lg ${urgencyLevel === 'critical' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : ''}`}
              >
                <Play className="w-4 h-4 mr-2" fill="currentColor" /> Submit Now
              </Button>
            )}
          </div>
        )}

      </div>

      {/* Progress Bar (Footer) */}
      {!submitted && (
        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800">
          <motion.div
            className={`h-full ${urgencyStyle.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      )}
    </Card>
  );
}
