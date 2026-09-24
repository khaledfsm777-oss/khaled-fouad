import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Type } from 'lucide-react';

interface QuranFontSizeControlProps {
  className?: string;
  compact?: boolean;
}

export default function QuranFontSizeControl({ className = '', compact = false }: QuranFontSizeControlProps) {
  const [scale, setScale] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quran_font_scale');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.8 && parsed <= 2.5) {
          return parsed;
        }
      }
    }
    return 1.25; // Default 125%
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--quran-font-scale', scale.toString());
      localStorage.setItem('quran_font_scale', scale.toString());
    }
  }, [scale]);

  const handleIncrease = () => {
    setScale((prev) => Math.min(2.2, Math.round((prev + 0.1) * 100) / 100));
  };

  const handleDecrease = () => {
    setScale((prev) => Math.max(0.85, Math.round((prev - 0.1) * 100) / 100));
  };

  const handleReset = () => {
    setScale(1.25);
  };

  const percent = Math.round(scale * 100);

  if (compact) {
    return (
      <div className={`inline-flex items-center justify-center gap-1.5 bg-[#051c16] border border-amber-500/40 px-2 py-1 rounded-xl shadow-sm text-slate-100 ${className}`} dir="rtl">
        <span className="text-[11px] font-black text-amber-300 px-1 flex items-center gap-1 select-none">
          <Type className="w-3.5 h-3.5 text-amber-400" />
          <span>خط الآيات:</span>
        </span>

        <button
          type="button"
          onClick={handleDecrease}
          disabled={scale <= 0.85}
          className="p-1 hover:bg-emerald-800 text-amber-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="تصغير خط الآيات (A-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="text-xs font-mono font-black text-amber-100 min-w-[42px] text-center bg-[#092b22] px-1.5 py-0.5 rounded border border-emerald-800/80 shadow-inner">
          {percent}%
        </span>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={scale >= 2.2}
          className="p-1 hover:bg-emerald-800 text-amber-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="تكبير خط الآيات (A+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {scale !== 1.25 && (
          <button
            type="button"
            onClick={handleReset}
            className="p-1 hover:bg-rose-900/60 text-rose-300 rounded-lg cursor-pointer transition-colors"
            title="إعادة ضبط حجم الخط إلى الافتراضي (125%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 bg-[#06241c] border border-amber-500/40 px-4 py-2 rounded-xl shadow-md text-slate-100 ${className}`} dir="rtl">
      <div className="flex items-center gap-1.5 select-none">
        <Type className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-black text-amber-300">حجم خط الآيات القرآنية:</span>
      </div>

      <div className="flex items-center gap-1 bg-[#092b22] p-1 rounded-lg border border-emerald-800">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={scale <= 0.85}
          className="px-2 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-amber-200 font-black text-xs rounded border border-emerald-700/60 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1 active:scale-95"
          title="تصغير الخط"
        >
          <ZoomOut className="w-3.5 h-3.5" />
          <span>أصغر</span>
        </button>

        <div className="px-2.5 py-1 text-center min-w-[50px] font-mono font-black text-xs text-amber-200 bg-[#051c16] rounded border border-amber-500/30 shadow-inner">
          {percent}%
        </div>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={scale >= 2.2}
          className="px-2 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-amber-200 font-black text-xs rounded border border-emerald-700/60 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1 active:scale-95"
          title="تكبير الخط"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>أكبر</span>
        </button>
      </div>

      {/* Preset Quick Buttons */}
      <div className="hidden sm:flex items-center gap-1">
        {[
          { label: 'عادي', value: 1.0 },
          { label: 'كبير (افتراضي)', value: 1.25 },
          { label: 'ضخم', value: 1.5 },
          { label: 'كبير جداً', value: 1.8 }
        ].map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setScale(p.value)}
            className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
              scale === p.value
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-emerald-950/60 text-slate-300 hover:bg-emerald-900 hover:text-white border border-emerald-800/50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {scale !== 1.25 && (
        <button
          type="button"
          onClick={handleReset}
          className="px-2 py-1 text-[10px] bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-bold rounded border border-rose-800/60 flex items-center gap-1 cursor-pointer transition-all"
          title="إعادة الضبط"
        >
          <RotateCcw className="w-3 h-3" />
          <span>إعادة ضبط</span>
        </button>
      )}
    </div>
  );
}
