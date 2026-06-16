
import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
  percentage, 
  size = 200, 
  strokeWidth = 12 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getGradientId = (pct: number) => {
    if (pct < 50) return 'grad-red';
    if (pct < 80) return 'grad-amber';
    return 'grad-emerald';
  };

  return (
    <div className="relative inline-flex items-center justify-center p-4">
      {/* HUD Accents */}
      <div className="absolute inset-0 border border-white/5 rounded-full animate-ping opacity-20 pointer-events-none"></div>
      
      <svg width={size} height={size} className="transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
        <defs>
          <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
        </defs>
        
        {/* Background Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${getGradientId(percentage)})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Segment Marks */}
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1={size / 2}
            y1={10}
            x2={size / 2}
            y2={20}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            transform={`rotate(${i * 45}, ${size/2}, ${size/2})`}
          />
        ))}
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white tabular-nums tracking-tighter">{percentage}<span className="text-sm opacity-50 ml-0.5">%</span></span>
        <span className="text-[9px] uppercase text-indigo-400 font-black tracking-[0.4em] mt-1">ALIGNMENT</span>
      </div>
    </div>
  );
};

export default CircularProgress;
