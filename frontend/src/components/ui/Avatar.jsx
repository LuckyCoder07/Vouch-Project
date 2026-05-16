import React from 'react';

export default function Avatar({ src, seed, className = "w-full h-full" }) {
  // If src is provided, we still check if it's a Google/OAuth photo 
  // and prioritize the randomized one if the user wants "GitHub style instead of Google"
  // For now, let's assume we ALWAYS want the randomized one if it's the requested style.
  
  const avatarSeed = seed || 'vouch';
  // GitHub-style identicon using Dicebear
  const dicebearUrl = `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundType=solid&backgroundColor=f0f0f0`;

  return (
    <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden`}>
      <img 
        src={dicebearUrl} 
        alt="Avatar" 
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarSeed)}&background=random&color=fff`;
        }}
      />
    </div>
  );
}
