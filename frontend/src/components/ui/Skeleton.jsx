import React from 'react';

export default function Skeleton({ width = '100%', height = '1rem', rounded = false, className = '' }) {
  return (
    <div 
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${rounded ? 'rounded-full' : 'rounded-md'} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm w-full">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton width="3rem" height="3rem" rounded />
        <div className="space-y-2">
          <Skeleton width="150px" height="1.25rem" />
          <Skeleton width="100px" height="0.875rem" />
        </div>
      </div>
      <div className="space-y-3 mt-6">
        <Skeleton width="100%" height="1rem" />
        <Skeleton width="85%" height="1rem" />
        <Skeleton width="60%" height="1rem" />
      </div>
    </div>
  );
}
