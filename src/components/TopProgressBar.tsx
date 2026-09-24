import React from 'react';
import { useGlobalProgress } from '../context/ProgressContext';
import { Sparkles, CheckCircle2, Activity } from 'lucide-react';

export const TopProgressBar: React.FC = () => {
  const { progressState } = useGlobalProgress();

  if (!progressState.isActive) {
    return null;
  }

  const isCompleted = progressState.progress >= 100;

  return (
    <div 
      id="top-dynamic-progress-bar-container"
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300 select-none"
      dir="rtl"
    >
      {/* Dynamic Multi-layer Progress Line */}
      <div className="h-1.5 w-full bg-slate-900/60 backdrop-blur-xs relative overflow-hidden shadow-md">
        {/* Glow backdrop bar */}
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-yellow-300 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(251,191,36,0.8)]"
          style={{ width: `${progressState.progress}%` }}
        />
        
        {/* Animated shimmer highlight sweep */}
        {!isCompleted && (
          <div 
            className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"
            style={{ 
              width: `${progressState.progress}%`,
              transition: 'width 300ms ease-out'
            }}
          />
        )}
      </div>

      {/* Floating Status Notification Pill */}
      <div className="flex justify-center pt-2 px-4">
        <div className="pointer-events-auto max-w-xl w-auto bg-slate-950/95 text-white border border-amber-400/40 rounded-full py-1.5 px-4 sm:px-5 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Status Icon */}
          <div className="shrink-0 flex items-center justify-center">
            {isCompleted ? (
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center animate-spin">
                <Activity className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Text Information */}
          <div className="flex items-center gap-2 text-xs font-bold truncate">
            <span className="text-amber-300 font-black tracking-wide">
              {progressState.title || 'عملية جارية'}
            </span>
            {progressState.subtitle && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 font-medium hidden sm:inline truncate max-w-xs">
                  {progressState.subtitle}
                </span>
              </>
            )}
          </div>

          {/* Percentage badge */}
          <div className="shrink-0 mr-auto bg-slate-900 border border-amber-500/40 px-2 py-0.5 rounded-full text-[11px] font-mono font-black text-amber-300 shadow-inner">
            {Math.round(progressState.progress)}%
          </div>

        </div>
      </div>
    </div>
  );
};

export default TopProgressBar;
