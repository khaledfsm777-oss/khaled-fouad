import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  getAllMushafSurahs, 
  getMushafSurah, 
  getMushafVersesForSurah, 
  toArabicNumerals, 
  JUZ_DEFINITIONS, 
  MushafSurahInfo, 
  DUAA_KHATM_QURAN 
} from '../utils/mushafData';
import { quranData } from '../utils/quranData';
import { 
  BookOpen, Search, Bookmark, ChevronRight, ChevronLeft, 
  ZoomIn, ZoomOut, RotateCcw, Copy, Check, Sparkles, 
  Sun, Moon, Compass, X, Share2, HelpCircle, Layers, ArrowUp
} from 'lucide-react';

interface MushafReaderProps {
  initialSurahId?: number;
  initialVerseNumber?: number;
  onAnalyzeSurah?: (surahId: number) => void;
  onBackToHome?: () => void;
}

type ThemeMode = 'parchment' | 'night' | 'emerald' | 'pure';

interface BookmarkData {
  surahId: number;
  verseNumber: number;
  surahName: string;
  savedAt: string;
}

export default function MushafReader({
  initialSurahId = 1,
  initialVerseNumber,
  onAnalyzeSurah,
  onBackToHome
}: MushafReaderProps) {
  // Navigation state
  const [currentSurahId, setCurrentSurahId] = useState<number>(initialSurahId);
  const [targetVerseToHighlight, setTargetVerseToHighlight] = useState<number | null>(initialVerseNumber || null);

  // Modals & Panels
  const [showSurahPicker, setShowSurahPicker] = useState<boolean>(false);
  const [showJuzPicker, setShowJuzPicker] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showDuaaModal, setShowDuaaModal] = useState<boolean>(false);
  const [activeVerseMenu, setActiveVerseMenu] = useState<{ verseNumber: number; text: string } | null>(null);
  const [copiedVerseNumber, setCopiedVerseNumber] = useState<number | null>(null);

  // Customization
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bonyan_mushaf_font_size');
      return saved ? parseInt(saved, 10) : 26;
    } catch {
      return 26;
    }
  });

  const [lineSpacing, setLineSpacing] = useState<'normal' | 'relaxed' | 'loose'>(() => {
    try {
      const saved = localStorage.getItem('bonyan_mushaf_line_spacing') as any;
      return saved || 'relaxed';
    } catch {
      return 'relaxed';
    }
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('bonyan_mushaf_theme') as ThemeMode;
      return saved || 'parchment';
    } catch {
      return 'parchment';
    }
  });

  // Bookmark state
  const [bookmark, setBookmark] = useState<BookmarkData | null>(() => {
    try {
      const saved = localStorage.getItem('bonyan_mushaf_bookmark');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showBookmarkToast, setShowBookmarkToast] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [surahFilterTab, setSurahFilterTab] = useState<'all' | 'makki' | 'madani' | 'noorani'>('all');
  const [surahSearchFilter, setSurahSearchFilter] = useState<string>('');

  const mushafContainerRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  // Surahs list
  const allSurahs = useMemo(() => getAllMushafSurahs(), []);
  const currentSurah = useMemo(() => getMushafSurah(currentSurahId) || allSurahs[0], [currentSurahId, allSurahs]);
  const currentVerses = useMemo(() => getMushafVersesForSurah(currentSurahId), [currentSurahId]);

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem('bonyan_mushaf_font_size', fontSize.toString());
    } catch {}
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem('bonyan_mushaf_line_spacing', lineSpacing);
    } catch {}
  }, [lineSpacing]);

  useEffect(() => {
    try {
      localStorage.setItem('bonyan_mushaf_theme', theme);
    } catch {}
  }, [theme]);

  // Scroll to target verse when set
  useEffect(() => {
    if (targetVerseToHighlight && verseRefs.current.has(targetVerseToHighlight)) {
      const el = verseRefs.current.get(targetVerseToHighlight);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
        // Clear highlight after 4 seconds
        const timer = setTimeout(() => {
          setTargetVerseToHighlight(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    } else {
      // Scroll to top of page on surah change
      if (mushafContainerRef.current) {
        mushafContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentSurahId, targetVerseToHighlight]);

  // Handle Surah change
  const handleSelectSurah = (surahId: number, verseNumber?: number) => {
    setCurrentSurahId(surahId);
    setShowSurahPicker(false);
    setShowJuzPicker(false);
    setShowSearchModal(false);
    setActiveVerseMenu(null);
    if (verseNumber) {
      setTargetVerseToHighlight(verseNumber);
    } else {
      setTargetVerseToHighlight(null);
    }
  };

  // Previous & Next Surah
  const handlePrevSurah = () => {
    if (currentSurahId > 1) {
      handleSelectSurah(currentSurahId - 1);
    }
  };

  const handleNextSurah = () => {
    if (currentSurahId < 114) {
      handleSelectSurah(currentSurahId + 1);
    }
  };

  // Bookmark save
  const handleSaveBookmark = (verseNumber: number) => {
    const newBookmark: BookmarkData = {
      surahId: currentSurah.id,
      verseNumber,
      surahName: currentSurah.name,
      savedAt: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
    };
    try {
      localStorage.setItem('bonyan_mushaf_bookmark', JSON.stringify(newBookmark));
      setBookmark(newBookmark);
      setShowBookmarkToast(true);
      setTimeout(() => setShowBookmarkToast(false), 3000);
    } catch {}
    setActiveVerseMenu(null);
  };

  const handleGoToBookmark = () => {
    if (bookmark) {
      handleSelectSurah(bookmark.surahId, bookmark.verseNumber);
    }
  };

  // Copy verse
  const handleCopyVerse = (verseNumber: number, text: string) => {
    const fullText = `﴿ ${text} ﴾ [سورة ${currentSurah.name} : ${verseNumber}]`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullText).then(() => {
        setCopiedVerseNumber(verseNumber);
        setTimeout(() => setCopiedVerseNumber(null), 2500);
      });
    }
    setActiveVerseMenu(null);
  };

  // Filtered surahs for the picker
  const filteredSurahs = useMemo(() => {
    let list = allSurahs;
    if (surahFilterTab === 'makki') {
      list = list.filter((s) => s.type === 'مكية');
    } else if (surahFilterTab === 'madani') {
      list = list.filter((s) => s.type === 'مدنية');
    } else if (surahFilterTab === 'noorani') {
      list = list.filter((s) => s.isNoorani);
    }

    if (surahSearchFilter.trim()) {
      const q = surahSearchFilter.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.includes(q) ||
          s.fullName.includes(q) ||
          s.id.toString() === q ||
          (s.nooraniLetters && s.nooraniLetters.includes(q))
      );
    }
    return list;
  }, [allSurahs, surahFilterTab, surahSearchFilter]);

  // Full Quran text search across 6,236 verses
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    const query = searchQuery.trim();
    // Normalize arabic query slightly for wider matches
    const norm = query
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[إأآٱء]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');

    const results: {
      surahId: number;
      surahName: string;
      verseNumber: number;
      text: string;
    }[] = [];

    for (const v of quranData) {
      const vTextNorm = v.text
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[إأآٱء]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي');

      if (vTextNorm.includes(norm) || v.text.includes(query)) {
        results.push({
          surahId: v.surahId,
          surahName: v.surahName,
          verseNumber: v.verseNumber,
          text: v.text,
        });
        if (results.length >= 60) break; // Limit for instantaneous responsiveness
      }
    }
    return results;
  }, [searchQuery]);

  // Dynamic theme CSS classes
  const themeStyles = useMemo(() => {
    switch (theme) {
      case 'night':
        return {
          wrapper: 'bg-[#0a0f0d] text-[#e8dfc8]',
          pageBg: 'bg-[#0f1714] border-emerald-900/60 shadow-2xl shadow-black/80',
          frameBorder: 'border-[#b89547]/50',
          innerBorder: 'border-[#b89547]/30',
          surahBanner: 'bg-gradient-to-r from-emerald-950 via-[#182a22] to-emerald-950 border-[#b89547]/60 text-amber-200',
          basmalahBox: 'bg-[#0a120f]/80 border-[#b89547]/40 text-amber-200',
          verseText: 'text-[#f5eedb] hover:text-[#fef08a]',
          ayahBadge: 'bg-[#182a22] text-amber-300 border-[#b89547]/60 shadow-sm',
          highlightVerse: 'bg-amber-900/40 text-amber-200 rounded px-1 transition-all duration-700',
          toolbar: 'bg-[#0d1612] border-emerald-900/80 text-amber-200',
          toolbarBtn: 'bg-[#13221b] hover:bg-[#1a3026] text-amber-200 border-emerald-800/80',
          toolbarActiveBtn: 'bg-amber-500 text-slate-950 font-black',
        };
      case 'emerald':
        return {
          wrapper: 'bg-[#031510] text-[#f7fee7]',
          pageBg: 'bg-[#06241b] border-emerald-700/60 shadow-2xl shadow-emerald-950/60',
          frameBorder: 'border-amber-400/60',
          innerBorder: 'border-amber-400/30',
          surahBanner: 'bg-gradient-to-r from-[#083023] via-[#0b3c2c] to-[#083023] border-amber-400/70 text-amber-300',
          basmalahBox: 'bg-[#041a13]/80 border-amber-400/50 text-amber-300',
          verseText: 'text-[#fdfcf7] hover:text-amber-200',
          ayahBadge: 'bg-[#093627] text-amber-300 border-amber-400/70 shadow-sm',
          highlightVerse: 'bg-emerald-900/60 text-amber-200 rounded px-1 transition-all duration-700 ring-2 ring-amber-400/50',
          toolbar: 'bg-[#051e16] border-emerald-800 text-amber-200',
          toolbarBtn: 'bg-[#0a2e22] hover:bg-[#0f4030] text-amber-200 border-emerald-700/60',
          toolbarActiveBtn: 'bg-amber-400 text-emerald-950 font-black',
        };
      case 'pure':
        return {
          wrapper: 'bg-slate-100 text-slate-900',
          pageBg: 'bg-white border-slate-300 shadow-xl',
          frameBorder: 'border-slate-800',
          innerBorder: 'border-slate-400',
          surahBanner: 'bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-slate-800 text-slate-950',
          basmalahBox: 'bg-slate-50 border-slate-300 text-slate-950',
          verseText: 'text-slate-950 hover:text-emerald-900',
          ayahBadge: 'bg-slate-100 text-slate-900 border-slate-400 shadow-sm',
          highlightVerse: 'bg-amber-100 text-slate-950 rounded px-1 transition-all duration-700 ring-2 ring-amber-400',
          toolbar: 'bg-white border-slate-300 text-slate-800',
          toolbarBtn: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300',
          toolbarActiveBtn: 'bg-emerald-900 text-white font-black',
        };
      case 'parchment':
      default:
        return {
          wrapper: 'bg-[#f4ede0] text-[#1c1813]',
          pageBg: 'bg-[#fbf7ee] border-[#cbb382] shadow-2xl shadow-[#5c4923]/15',
          frameBorder: 'border-[#b89547]',
          innerBorder: 'border-[#d4be88]',
          surahBanner: 'bg-gradient-to-r from-[#edd9ab]/80 via-[#f9ebd0] to-[#edd9ab]/80 border-[#b89547] text-[#4a3411]',
          basmalahBox: 'bg-[#f5e7c8]/60 border-[#cbb382] text-[#4a3411]',
          verseText: 'text-[#1c1813] hover:text-[#78350f]',
          ayahBadge: 'bg-[#edd9ab] text-[#4a3411] border-[#b89547] shadow-sm',
          highlightVerse: 'bg-amber-200/80 text-amber-950 rounded px-1 transition-all duration-700 ring-2 ring-amber-500/50',
          toolbar: 'bg-[#ede1c9] border-[#cbb382] text-[#3d2c10]',
          toolbarBtn: 'bg-[#f8f1df] hover:bg-[#fffcf5] text-[#3d2c10] border-[#cbb382]',
          toolbarActiveBtn: 'bg-[#8d6928] text-white font-black',
        };
    }
  }, [theme]);

  // Line spacing class
  const lineSpacingClass = useMemo(() => {
    switch (lineSpacing) {
      case 'loose':
        return 'leading-[3.3] md:leading-[3.6]';
      case 'normal':
        return 'leading-[2.5] md:leading-[2.7]';
      case 'relaxed':
      default:
        return 'leading-[2.9] md:leading-[3.2]';
    }
  }, [lineSpacing]);

  return (
    <div className={`min-h-screen ${themeStyles.wrapper} transition-colors duration-300 flex flex-col`} dir="rtl">
      
      {/* 1. TOP STICKY READING TOOLBAR */}
      <header className={`sticky top-0 z-40 ${themeStyles.toolbar} border-b shadow-md backdrop-blur-sm px-3 py-2.5 transition-all`}>
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Right Section: Back to Al-Bunyan & Surah Selector */}
          <div className="flex items-center gap-2">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="px-3 py-1.5 text-xs font-black rounded-lg border border-amber-600/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 transition-all flex items-center gap-1 cursor-pointer"
                title="العودة لشاشات البرنامج الرئيسية"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الرئيسية</span>
              </button>
            )}

            {/* Surah Selector Main Dropdown Button */}
            <button
              type="button"
              onClick={() => setShowSurahPicker(true)}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-black rounded-xl border flex items-center gap-2 cursor-pointer shadow-sm transition-all ${themeStyles.toolbarBtn}`}
              title="فتح فهرس سور القرآن الكريم (114 سورة)"
            >
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span className="font-serif font-black">{currentSurah.name}</span>
              <span className="text-[11px] opacity-75 font-sans">({toArabicNumerals(currentSurah.id)})</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                {currentSurah.type}
              </span>
            </button>

            {/* Juz Selector Quick Button */}
            <button
              type="button"
              onClick={() => setShowJuzPicker(true)}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border hidden md:flex items-center gap-1.5 cursor-pointer transition-all ${themeStyles.toolbarBtn}`}
              title="الانتقال المباشر لأحد الأجزاء الثلاثين"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>الجزء {toArabicNumerals(currentSurah.startJuz)}</span>
            </button>
          </div>

          {/* Center Section: Quick Surah Prev / Next buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevSurah}
              disabled={currentSurahId <= 1}
              className={`p-1.5 px-2.5 text-xs font-bold rounded-lg border flex items-center gap-1 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${themeStyles.toolbarBtn}`}
              title="السورة السابقة"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">السابقة</span>
            </button>

            <span className="text-xs font-black px-2 text-center opacity-80 min-w-[70px]">
              {toArabicNumerals(currentSurah.versesCount)} آية
            </span>

            <button
              type="button"
              onClick={handleNextSurah}
              disabled={currentSurahId >= 114}
              className={`p-1.5 px-2.5 text-xs font-bold rounded-lg border flex items-center gap-1 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${themeStyles.toolbarBtn}`}
              title="السورة التالية"
            >
              <span className="hidden sm:inline">التالية</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Left Section: Search, Font size, Bookmark & Themes */}
          <div className="flex items-center gap-1.5 flex-wrap">
            
            {/* Search in Quran */}
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className={`p-1.5 px-2.5 text-xs font-black rounded-lg border flex items-center gap-1 cursor-pointer transition-all ${themeStyles.toolbarBtn}`}
              title="البحث في نصوص القرآن الكريم كاملاً"
            >
              <Search className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">بحث</span>
            </button>

            {/* Bookmark button */}
            {bookmark && (
              <button
                type="button"
                onClick={handleGoToBookmark}
                className="px-2.5 py-1.5 text-xs font-black rounded-lg border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                title={`الذهاب لعلامة الحفظ: سورة ${bookmark.surahName} (آية ${bookmark.verseNumber})`}
              >
                <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                <span className="hidden sm:inline">متابعة: {bookmark.surahName} ﴿{toArabicNumerals(bookmark.verseNumber)}﴾</span>
              </button>
            )}

            {/* Font Zoom Controls */}
            <div className={`flex items-center border rounded-lg p-0.5 ${themeStyles.toolbarBtn}`}>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(18, s - 2))}
                className="px-2 py-0.5 text-xs font-black hover:opacity-70 cursor-pointer"
                title="تصغير حجم خط المصحف"
              >
                -A
              </button>
              <span className="text-[10px] font-mono px-1 opacity-70">
                {fontSize}
              </span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(42, s + 2))}
                className="px-2 py-0.5 text-xs font-black hover:opacity-70 cursor-pointer"
                title="تكبير حجم خط المصحف"
              >
                +A
              </button>
            </div>

            {/* Theme switcher */}
            <div className="flex items-center gap-1 border border-amber-600/30 rounded-lg p-0.5 bg-black/5">
              <button
                type="button"
                onClick={() => setTheme('parchment')}
                className={`w-6 h-6 rounded-md text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                  theme === 'parchment' ? 'bg-[#cbb382] text-amber-950 ring-1 ring-amber-700' : 'opacity-60 hover:opacity-100'
                }`}
                title="نمط ورق المصحف الأصيل (عاجي كلاسيكي)"
              >
                📜
              </button>
              <button
                type="button"
                onClick={() => setTheme('night')}
                className={`w-6 h-6 rounded-md text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                  theme === 'night' ? 'bg-[#182a22] text-amber-300 ring-1 ring-amber-400' : 'opacity-60 hover:opacity-100'
                }`}
                title="النمط الليلي المريح للعين"
              >
                🌙
              </button>
              <button
                type="button"
                onClick={() => setTheme('emerald')}
                className={`w-6 h-6 rounded-md text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                  theme === 'emerald' ? 'bg-emerald-800 text-amber-300 ring-1 ring-amber-400' : 'opacity-60 hover:opacity-100'
                }`}
                title="النمط الملكي الزمردي"
              >
                🌿
              </button>
              <button
                type="button"
                onClick={() => setTheme('pure')}
                className={`w-6 h-6 rounded-md text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                  theme === 'pure' ? 'bg-white text-slate-900 ring-1 ring-slate-400' : 'opacity-60 hover:opacity-100'
                }`}
                title="النمط الأبيض الناصع"
              >
                ☀️
              </button>
            </div>

            {/* Khatm Al-Quran Duaa */}
            <button
              type="button"
              onClick={() => setShowDuaaModal(true)}
              className={`p-1.5 px-2 text-xs font-black rounded-lg border cursor-pointer transition-all ${themeStyles.toolbarBtn}`}
              title="دعاء ختم القرآن الكريم"
            >
              🤲
            </button>

            {/* Analyze in Al-Bunyan */}
            {onAnalyzeSurah && (
              <button
                type="button"
                onClick={() => onAnalyzeSurah(currentSurah.id)}
                className="px-2.5 py-1.5 text-xs font-black rounded-lg border border-emerald-600 bg-gradient-to-r from-emerald-800 to-emerald-950 text-amber-300 hover:from-emerald-700 hover:to-emerald-900 shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                title="تحليل هذه السورة بالكامل واستخراج حساب الجُمّل والتوافقات في محرك البنيان"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">تحليل في البنيان ⚖️</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Bookmark notification toast */}
      {showBookmarkToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-amber-300 border-2 border-amber-400 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce font-bold text-xs">
          <Bookmark className="w-4 h-4 fill-amber-400" />
          <span>تم حفظ علامة القراءة بنجاح في مصحف البنيان 🔖</span>
        </div>
      )}

      {/* 2. MAIN MUSHAF PAGE CANVAS (NOT FRAGMENTED - CONTINUOUS FLOWING TEXT) */}
      <main ref={mushafContainerRef} className="flex-grow max-w-4xl w-full mx-auto px-2 sm:px-4 md:px-6 py-6 md:py-10">
        
        {/* Outer Islamic Mushaf Border & Card */}
        <div className={`p-4 sm:p-8 md:p-12 rounded-3xl border-4 ${themeStyles.pageBg} ${themeStyles.frameBorder} relative transition-all duration-300 select-text`}>
          
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 right-2 text-amber-600/40 text-lg select-none pointer-events-none">۞</div>
          <div className="absolute top-2 left-2 text-amber-600/40 text-lg select-none pointer-events-none">۞</div>
          <div className="absolute bottom-2 right-2 text-amber-600/40 text-lg select-none pointer-events-none">۞</div>
          <div className="absolute bottom-2 left-2 text-amber-600/40 text-lg select-none pointer-events-none">۞</div>

          {/* Internal Double Border Line */}
          <div className={`border-2 border-double ${themeStyles.innerBorder} p-4 sm:p-8 md:p-10 rounded-2xl space-y-6 md:space-y-8`}>
            
            {/* Surah Header Banner (ترويسة السورة المصحفية الكبرى) */}
            <div className={`p-4 sm:p-6 rounded-2xl border-2 text-center relative shadow-sm ${themeStyles.surahBanner}`}>
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold opacity-80 border-b border-amber-500/20 pb-2 mb-3">
                <span>الجزء: {toArabicNumerals(currentSurah.startJuz)}</span>
                <span className="font-serif text-sm sm:text-base font-extrabold">{currentSurah.type}</span>
                <span>ترتيب النزول: {toArabicNumerals(currentSurah.revelationOrder)}</span>
              </div>

              {/* Calligraphic Surah Name */}
              <div className="py-1">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-serif tracking-normal leading-relaxed drop-shadow-sm">
                  {currentSurah.fullName}
                </h1>
              </div>

              <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-bold opacity-85 mt-2">
                <span>عدد آياتها: {toArabicNumerals(currentSurah.versesCount)} آية</span>
                <span>•</span>
                <span>ترتيبها بالمصحف: {toArabicNumerals(currentSurah.id)}</span>
                {currentSurah.isNoorani && (
                  <>
                    <span>•</span>
                    <span className="text-amber-600 font-black">
                      سورة نورانية ﴿{currentSurah.nooraniLetters}﴾
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Noble Basmalah (البسملة الشريفة) */}
            {/* Rendered for all Surahs except At-Tawbah (9) and for Al-Fatihah (1) where verse 1 is itself the Basmalah */}
            {currentSurah.id !== 9 && currentSurah.id !== 1 && (
              <div className="text-center py-2 md:py-4">
                <div className={`inline-block px-6 md:px-12 py-2.5 md:py-3.5 rounded-2xl border-2 shadow-inner font-serif ${themeStyles.basmalahBox}`}>
                  <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-wide leading-relaxed block font-serif">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </span>
                </div>
              </div>
            )}

            {/* CONTINUOUS QURANIC TEXT FLOW (المصحف الشريف غير المجزأ) */}
            <div 
              className={`text-justify leading-loose font-serif ${lineSpacingClass} select-text transition-all`}
              style={{ 
                fontSize: `${fontSize}px`,
                fontFamily: "'Amiri', 'Scheherazade New', 'Traditional Arabic', serif",
                textJustify: 'inter-word'
              }}
            >
              {currentVerses.map((verse) => {
                const isHighlighted = targetVerseToHighlight === verse.verseNumber;
                const isBookmarked = bookmark?.surahId === currentSurah.id && bookmark?.verseNumber === verse.verseNumber;

                return (
                  <span
                    key={verse.id}
                    ref={(el) => {
                      if (el) verseRefs.current.set(verse.verseNumber, el);
                      else verseRefs.current.delete(verse.verseNumber);
                    }}
                    onClick={() => setActiveVerseMenu({ verseNumber: verse.verseNumber, text: verse.text })}
                    className={`inline cursor-pointer group rounded transition-all duration-300 relative ${
                      isHighlighted 
                        ? themeStyles.highlightVerse 
                        : isBookmarked 
                        ? 'bg-amber-400/20 ring-1 ring-amber-500/50' 
                        : ''
                    }`}
                    title={`انقر لخيارات الآية ${verse.verseNumber} (نسخ، حفظ علامة، تحليل)`}
                  >
                    {/* Verse Text */}
                    <span className={`${themeStyles.verseText} inline mx-0.5 transition-colors`}>
                      {verse.text}
                    </span>

                    {/* Ayah End Ornament & Number (﴿١﴾, ﴿٢﴾...) */}
                    <span 
                      className={`inline-flex items-center justify-center font-sans font-black text-xs sm:text-sm rounded-full mx-1.5 align-middle select-none transition-transform group-hover:scale-110 shadow-sm ${themeStyles.ayahBadge}`}
                      style={{
                        width: `${Math.max(24, fontSize * 0.95)}px`,
                        height: `${Math.max(24, fontSize * 0.95)}px`,
                        fontSize: `${Math.max(11, fontSize * 0.44)}px`,
                      }}
                    >
                      {toArabicNumerals(verse.verseNumber)}
                    </span>

                    {/* Bookmarked Indicator Ribbon */}
                    {isBookmarked && (
                      <span className="inline-block text-amber-500 font-bold mx-0.5 align-middle text-sm" title="علامة القراءة المحفوظة">
                        🔖
                      </span>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Bottom Surah End Decoration */}
            <div className="pt-6 border-t border-amber-500/20 text-center space-y-3">
              <div className="flex items-center justify-center gap-3 text-amber-700/60 text-sm select-none">
                <span>❖</span>
                <span className="font-serif font-black text-base opacity-75">
                  تمت بحمد الله {currentSurah.fullName}
                </span>
                <span>❖</span>
              </div>

              {/* Quick Navigation Between Surahs */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {currentSurahId > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevSurah}
                    className={`px-4 py-2 text-xs font-black rounded-xl border flex items-center gap-1.5 cursor-pointer shadow-sm transition-all ${themeStyles.toolbarBtn}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السورة السابقة: {allSurahs[currentSurahId - 2]?.name}</span>
                  </button>
                )}

                {/* Save bookmark at end of surah */}
                <button
                  type="button"
                  onClick={() => handleSaveBookmark(currentSurah.versesCount)}
                  className={`px-4 py-2 text-xs font-black rounded-xl border flex items-center gap-1.5 cursor-pointer shadow-sm transition-all ${themeStyles.toolbarBtn}`}
                >
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>حفظ علامة القراءة هنا 🔖</span>
                </button>

                {currentSurahId < 114 && (
                  <button
                    type="button"
                    onClick={handleNextSurah}
                    className={`px-4 py-2 text-xs font-black rounded-xl border flex items-center gap-1.5 cursor-pointer shadow-sm transition-all ${themeStyles.toolbarBtn}`}
                  >
                    <span>السورة التالية: {allSurahs[currentSurahId]?.name}</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 3. VERSE QUICK ACTIONS POPUP MODAL */}
      {activeVerseMenu && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveVerseMenu(null)}
        >
          <div 
            className="bg-white border-2 border-amber-400 text-slate-900 p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl relative text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVerseMenu(null)}
              className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-amber-200 pb-3">
              <span className="p-2 bg-amber-100 text-amber-900 rounded-xl text-xs font-black">
                سورة {currentSurah.name} : الآية {toArabicNumerals(activeVerseMenu.verseNumber)}
              </span>
            </div>

            {/* Verse Text Display */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl max-h-48 overflow-y-auto font-serif text-lg leading-loose text-slate-950 font-bold">
              {activeVerseMenu.text} ﴿{toArabicNumerals(activeVerseMenu.verseNumber)}﴾
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleSaveBookmark(activeVerseMenu.verseNumber)}
                className="p-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                <span>وضع علامة القراءة 🔖</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyVerse(activeVerseMenu.verseNumber, activeVerseMenu.text)}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition-all cursor-pointer"
              >
                {copiedVerseNumber === activeVerseMenu.verseNumber ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">تم النسخ ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ الآية 📋</span>
                  </>
                )}
              </button>

              {onAnalyzeSurah && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveVerseMenu(null);
                    onAnalyzeSurah(currentSurah.id);
                  }}
                  className="p-3 bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>تحليل في البنيان ⚖️</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 4. SURAH PICKER MODAL (فهرس الـ 114 سورة) */}
      {showSurahPicker && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setShowSurahPicker(false)}
        >
          <div 
            className="bg-[#fcfaf5] border-2 border-amber-500 text-slate-900 rounded-3xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-amber-200 bg-amber-100/50 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-emerald-950 font-serif">
                  فهرس سور القرآن الكريم (114 سورة)
                </h2>
                <p className="text-[11px] text-slate-600">اختر السورة الكريمة للقراءة المباشرة دون انقطاع</p>
              </div>
              <button
                onClick={() => setShowSurahPicker(false)}
                className="p-1.5 rounded-full hover:bg-black/10 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="p-3 sm:p-4 border-b border-amber-200 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute top-3 right-3 text-slate-400" />
                <input
                  type="text"
                  value={surahSearchFilter}
                  onChange={(e) => setSurahSearchFilter(e.target.value)}
                  placeholder="ابحث باسم السورة أو رقمها (مثال: الكهف، 18، يس)..."
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setSurahFilterTab('all')}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                    surahFilterTab === 'all' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  جميع السور (114)
                </button>
                <button
                  type="button"
                  onClick={() => setSurahFilterTab('makki')}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                    surahFilterTab === 'makki' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  السور المكية (89)
                </button>
                <button
                  type="button"
                  onClick={() => setSurahFilterTab('madani')}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                    surahFilterTab === 'madani' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  السور المدنية (25)
                </button>
                <button
                  type="button"
                  onClick={() => setSurahFilterTab('noorani')}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                    surahFilterTab === 'noorani' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  السور النورانية (29) ✨
                </button>
              </div>
            </div>

            {/* Grid of Surahs */}
            <div className="flex-grow overflow-y-auto p-3 sm:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredSurahs.map((surah) => (
                <button
                  key={surah.id}
                  type="button"
                  onClick={() => handleSelectSurah(surah.id)}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    surah.id === currentSurahId
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md font-black scale-[1.02]'
                      : 'bg-white hover:bg-amber-50/70 border-slate-200 hover:border-amber-400 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-serif font-black text-sm sm:text-base">
                      {surah.name}
                    </span>
                    <span className="text-[10px] font-sans font-black px-1.5 py-0.5 rounded-md bg-black/5">
                      {toArabicNumerals(surah.id)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] opacity-75 mt-2">
                    <span>{surah.type}</span>
                    <span>{toArabicNumerals(surah.versesCount)} آية</span>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 5. JUZ PICKER MODAL (الأجزاء الثلاثون) */}
      {showJuzPicker && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowJuzPicker(false)}
        >
          <div 
            className="bg-[#fcfaf5] border-2 border-amber-500 text-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-amber-200 bg-amber-100/50 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-emerald-950 font-serif">
                  أجزاء القرآن الكريم (٣٠ جزءاً)
                </h2>
                <p className="text-[11px] text-slate-600">انتقل مباشرة لبداية أي جزء من المصحف الشريف</p>
              </div>
              <button
                onClick={() => setShowJuzPicker(false)}
                className="p-1.5 rounded-full hover:bg-black/10 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {JUZ_DEFINITIONS.map((juz) => (
                <button
                  key={juz.juzNumber}
                  type="button"
                  onClick={() => handleSelectSurah(juz.startSurahId, juz.startVerse)}
                  className="p-3 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-2xl flex items-center justify-between text-right cursor-pointer transition-all shadow-sm"
                >
                  <div>
                    <span className="font-serif font-black text-sm text-emerald-950 block">
                      {juz.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      يبدأ من سورة {juz.startSurahName} (آية {toArabicNumerals(juz.startVerse)})
                    </span>
                  </div>
                  <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-1 rounded-lg">
                    {toArabicNumerals(juz.juzNumber)}
                  </span>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 6. FULL QURAN TEXT SEARCH MODAL (البحث السريع الشامل) */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            className="bg-[#fcfaf5] border-2 border-amber-500 text-slate-900 rounded-3xl max-w-2xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-amber-200 bg-amber-100/50 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-emerald-950 font-serif">
                  البحث في نصوص القرآن الكريم
                </h2>
                <p className="text-[11px] text-slate-600">بحث فوري أوفلاين في كافة الآيات (6,236 آية)</p>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1.5 rounded-full hover:bg-black/10 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white border-b border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute top-3.5 right-3 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="اكتب كلمة أو عبارة للبحث (مثال: نور، الرحمن، موسى، عسق)..."
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
              {searchQuery && (
                <div className="text-[11px] text-slate-500 mt-2 font-bold">
                  تم العثور على {toArabicNumerals(searchResults.length)} نتيجة مطابقة
                </div>
              )}
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-2.5">
              {searchResults.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Search className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">
                    {searchQuery.trim().length < 2 
                      ? 'يرجى كتابة حرفين على الأقل لبدء البحث...' 
                      : 'لم يتم العثور على نتائج مطابقة لهذا البحث.'}
                  </p>
                </div>
              ) : (
                searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSurah(res.surahId, res.verseNumber)}
                    className="w-full p-3.5 bg-white hover:bg-amber-50/80 border border-slate-200 hover:border-amber-400 rounded-2xl text-right transition-all flex flex-col gap-1.5 cursor-pointer shadow-sm group"
                  >
                    <div className="flex items-center justify-between text-xs font-black text-emerald-950">
                      <span className="font-serif">سورة {allSurahs[res.surahId - 1]?.name}</span>
                      <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg text-[11px]">
                        الآية {toArabicNumerals(res.verseNumber)}
                      </span>
                    </div>
                    <p className="font-serif text-sm text-slate-800 leading-relaxed group-hover:text-amber-950">
                      {res.text} ﴿{toArabicNumerals(res.verseNumber)}﴾
                    </p>
                  </button>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* 7. KHATM AL-QURAN DUAA MODAL (دعاء ختم القرآن المبارك) */}
      {showDuaaModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setShowDuaaModal(false)}
        >
          <div 
            className="bg-[#fcf7ee] border-2 border-amber-500 text-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-amber-200 bg-amber-100/60 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-emerald-950 font-serif">
                  دعاء ختم القرآن الكريم المبارك
                </h2>
                <p className="text-[11px] text-slate-600">نسأل الله القبول والنفع العظيم</p>
              </div>
              <button
                onClick={() => setShowDuaaModal(false)}
                className="p-1.5 rounded-full hover:bg-black/10 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 md:p-8 font-serif text-base sm:text-lg leading-loose text-slate-900 whitespace-pre-line text-center select-text">
              {DUAA_KHATM_QURAN}
            </div>

            <div className="p-4 border-t border-amber-200 bg-amber-50/70 text-center">
              <button
                type="button"
                onClick={() => setShowDuaaModal(false)}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer shadow-sm"
              >
                تقبل الله منا ومنكم صالح الأعمال
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
