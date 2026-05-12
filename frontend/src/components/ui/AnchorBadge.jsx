import React from 'react';
import { Link2, Clock, ExternalLink } from 'lucide-react';

export default function AnchorBadge({ anchored, txHash, compact = false }) {
  if (compact) {
    return anchored ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-800/50">
        <Link2 size={10} />
        Anchored
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700">
        <Clock size={10} />
        Pending
      </span>
    );
  }

  return anchored ? (
    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
        <Link2 size={16} />
        Blockchain Anchored
      </div>
      {txHash && (
        <a 
          href={`https://amoy.polygonscan.com/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-800 dark:hover:text-emerald-200 flex items-center gap-1 font-medium"
        >
          View on Amoy PolygonScan <ExternalLink size={10} />
        </a>
      )}
    </div>
  ) : (
    <div className="flex flex-col gap-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm">
        <Clock size={16} />
        Pending Blockchain Anchor
      </div>
      <p className="text-[10px] text-slate-400 font-medium italic">
        Anchored every 24 hours on Polygon Amoy
      </p>
    </div>
  );
}
