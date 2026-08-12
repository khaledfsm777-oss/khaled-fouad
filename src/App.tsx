import React, { useState, useEffect } from 'react';
import { Verse } from './types';
import { parseAndAnalyzeVerses, NOORANI_SURAHS, NooraniSurah } from './utils/jummal';
import HelpSection from './components/HelpSection';
import Calculator from './components/Calculator';
import QuranInput from './components/QuranInput';
import QuranOutput from './components/QuranOutput';
import AiAnalysis from './components/AiAnalysis';
import SmartSearch from './components/SmartSearch';
import NooraniCharts from './components/NooraniCharts';
import SurahCard from './components/SurahCard';
import BonyanLogo from './components/BonyanLogo';
import QuranFontSizeControl from './components/QuranFontSizeControl';
import { defaultAnkabutPresetText } from './utils/presets';
import { 
  Compass, LayoutGrid, Calculator as CalcIcon, BookOpen, 
  Sparkles, FileText, Brain, GraduationCap, Search, BarChart2, CheckCircle2,
  BookOpen as BookIcon, LogOut, Info, RefreshCw, ChevronLeft, Calendar, Mail
} from 'lucide-react';

export default function App() {
  const [showCover, setShowCover] = useState(false);

  useEffect(() => {
    // If we are on a desktop screen or iframe, bypass the cover screen to go straight inside
    if (typeof window !== 'undefined') {
      setShowCover(false);
    }
  }, []);
  // Screens: 'portal' (The original tabbed layout) or 'main' (The majestic main portal deck)
  const [currentScreen, setCurrentScreen] = useState<'main' | 'portal'>('main');
  const [activeTab, setActiveTab] = useState<'verses' | 'search' | 'charts' | 'metadata' | 'calculator' | 'ai' | 'guide'>('verses');
  
  // Shared active Surah selection
  const [activeSurah, setActiveSurah] = useState<NooraniSurah | null>(null); // Starts empty
  
  // Shared AI Analysis History to persist across tab unmounts
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  
  // Exit Modal state
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // Toggle state to preview chart inside output screen
  const [previewChartInOutput, setPreviewChartInOutput] = useState(false);

    const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Trigger main extraction analyzer
  const handleAnalyze = (text: string, separator: 'parentheses' | 'curly' | 'auto', excludeBismillah: boolean = true) => {
    setIsLoading(true);
    setTimeout(() => {
      try {
        const results = parseAndAnalyzeVerses(text, separator, excludeBismillah);
        setVerses(results);
        // Switch view to output verses
        setCurrentScreen('portal');
        setActiveTab('verses');
      } catch (err) {
        console.error('Analysis error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 450);
  };

  const handleReset = () => {
    setVerses([]);
    setActiveSurah(null);
    // Direct back to main portal inputs for fresh text
    setCurrentScreen('portal');
    setActiveTab('verses');
  };

  // Close exits / Reset state entirely
  const handleLogoExit = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    setVerses([]);
    setActiveSurah(null);
    setCurrentScreen('main');
    setActiveTab('verses');
    setShowExitModal(false);
    setIsLoggedOut(true);
    setShowCover(true);
    setTimeout(() => {
      setIsLoggedOut(false);
    }, 4000);
  };

  if (showCover) {
    return (
      <div 
        onClick={() => setShowCover(false)}
        className="min-h-screen bg-[#051c16] text-white flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none relative overflow-hidden transition-all duration-700 hover:bg-[#031510]"
        dir="rtl"
      >
        {/* Subtle background radial grid characteristic of Geometric Balance */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FFF 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-32 -bottom-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-2xl w-full space-y-8 flex flex-col items-center z-10">
          
          {/* Logo container with premium golden aura */}
          <div className="transition-transform duration-500 transform hover:scale-105 filter drop-shadow-2xl">
            <BonyanLogo size={240} />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-400 to-amber-100 tracking-tight font-serif">
              بِرْنَامَج البُنْيَان لِلْقُرْآنِ الكَرِيمِ
            </h1>
            <p className="text-sm md:text-base text-amber-300 font-bold max-w-lg mx-auto leading-relaxed">
              ميزان التحقق الحسابي وحساب الجمل الكبير للقرآن الكريم
            </p>
            <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto my-3" />
            
            {/* Raised credit text - Prominent and elegant right below the title */}
            <div className="py-2.5 text-xs md:text-sm text-yellow-100 font-black tracking-wide leading-relaxed bg-[#06241c] border border-emerald-800/60 px-5 py-3.5 rounded-xl max-w-md mx-auto shadow-md">
              💡 ابتكار وإعداد النموذج البحثي العلمي:<br />
              <span className="text-amber-400 underline underline-offset-4 decoration-amber-500 font-extrabold text-sm md:text-base">الباحث / الأستاذ خالد فؤاد السيد</span>
              <div className="mt-1 text-xs text-amber-200/90 font-mono dir-ltr flex items-center justify-center gap-1.5 font-bold">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>k.bonyan7@gmail.com</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-semibold leading-relaxed pt-2">
              منصة بحثية متقدمة في علوم الاستقصاء الرقمي والتحليل النوراني والاتزان الرياضي للفواتح والسور الكريمة
            </p>
          </div>

          {/* Entry Pulse Button */}
          <div className="pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCover(false);
              }}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs md:text-sm rounded-xl border border-amber-350 shadow-lg shadow-amber-950/40 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center gap-3 active:scale-95"
            >
              <span>دخول إلى البرنامج 🏛️</span>
            </button>
            <span className="block text-[10px] text-slate-400 font-bold mt-3 animate-pulse">
              أو اضغط في أي مكان على الشاشة للدخول
            </span>
          </div>

          <div className="pt-4 text-[10px] text-slate-400 font-semibold w-64 mx-auto leading-relaxed">
            مستشار البنيان • ميزان التحقق الحسابي المستقر
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] flex flex-col justify-between font-sans selection:bg-emerald-950/10 selection:text-emerald-950 relative">
      
      {/* Subtle background radial grid characteristic of Geometric Balance */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

      {/* Premium Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#092b22] border-b border-amber-500/30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Identity with Al-Bunyan premium customized branding matching attachment */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentScreen('main')}>
            <BonyanLogo size={70} />
            <div className="text-right">
              <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-400 to-amber-100 tracking-tight font-serif select-none">
                AL-BUNYAN <span className="text-xl md:text-2xl font-bold text-amber-400 font-sans mx-1">البنيان</span>
              </h1>
              <p className="text-[10px] md:text-xs text-slate-300 font-semibold tracking-wide mt-0.5 opacity-90 select-none">
                برنامج البنيان للقرآن الكريم • للتحرير والاستقصاء العددي
              </p>
            </div>
          </div>

          {/* Core Controls, Quran Font Adjuster & Researcher Name on the Top Left */}
          <div className="flex flex-col lg:flex-row items-center gap-3">
            {/* Quran Verse Font Size Adjuster Control */}
            <QuranFontSizeControl compact={true} />

            {/* Researcher's name raised up high for clear visibility */}
            <div className="bg-[#051c16] border border-amber-500/40 px-3.5 py-1.5 text-right rounded-xl shadow-inner flex flex-col justify-center">
              <span className="text-[9px] text-amber-400 font-black tracking-wide block leading-none mb-0.5">💡 ابتكار وإعداد النموذج البحثي:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-100 block leading-none">الأستاذ خالد فؤاد السيد</span>
                <a href="mailto:k.bonyan7@gmail.com" title="k.bonyan7@gmail.com" className="text-[10px] text-amber-300 font-mono underline hover:text-amber-200">k.bonyan7@gmail.com</a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('main')}
                className={`px-4 py-2 text-xs font-black transition-all border rounded-xl outline-none cursor-pointer ${
                  currentScreen === 'main' 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md' 
                    : 'bg-emerald-900/50 text-slate-200 border-emerald-800 hover:bg-emerald-800'
                }`}
              >
                الصفحة الرئيسية للبرنامج 🏛️
              </button>
              <button
                onClick={() => {
                  setCurrentScreen('portal');
                  setActiveTab('verses');
                }}
                className={`px-4 py-2 text-xs font-black transition-all border rounded-xl outline-none cursor-pointer ${
                  currentScreen === 'portal' 
                    ? 'bg-amber-500 text-emerald-950 border-amber-400 shadow-md' 
                    : 'bg-emerald-950 text-slate-200 border-emerald-900 hover:bg-emerald-900'
                }`}
              >
                شاشة المدخلات/المخرجات 📖
              </button>
              <button
                type="button"
                onClick={handleLogoExit}
                className="p-2 px-4 text-xs bg-rose-950 border border-rose-900 hover:bg-rose-900 text-rose-100 font-bold flex items-center gap-1 cursor-pointer transition-all rounded-xl"
                title="خروج من البرنامج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Structural Layout Container */}
      <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-8">
        
        {/* LOGGED OUT BANNER */}
        {isLoggedOut && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 text-right font-black text-sm relative rounded-2xl shadow-sm">
            <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500 rounded-t-2xl" />
            👋 تم إغلاق الجلسة الحالية وإعادة تصفير مخرجات برنامج البنيان بنجاح. نسأل الله النفع والقبول لجميع الباحثين القائمين عليه.
          </div>
        )}

        {/* 1. MAJESTIC MAIN SCREEN / HOME PORTAL */}
        {currentScreen === 'main' ? (
          <div className="space-y-8 text-right" dir="rtl">
            
            {/* Grand Welcome Hero Header */}
            <div className="bg-white border border-amber-250/60 p-6 md:p-10 relative overflow-hidden rounded-2xl shadow-md">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-800 via-amber-500 to-emerald-900" />
              <div className="absolute -left-16 -bottom-16 w-60 h-60 rounded-full bg-amber-50/40 border border-amber-100 pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="space-y-4 max-w-3xl">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-200">
                    النموذج ميزان التحقق الحسابي وحساب الجمل الكبير للقرآن الكريم
                  </span>
                  <h2 className="text-2xl md:text-4xl font-extrabold text-emerald-950 quran-font leading-normal">
                    بِرْنَامَج البُنْيَان لِلْقُرْآنِ الكَرِيمِ
                  </h2>
                  <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
                    منصة بحثية متقدمة في علوم الاستقصاء الرقمي والتحليل النوراني مبنية على المنهج الموزون الذي يتناول العلاقات الأبجدية، إحداثيات السور، وتطابق آيات الذكر الحكيم مع معاملات المفاتيح الكبرى.
                  </p>
                  <p className="text-xs text-emerald-950 font-bold">
                    💡 ابتكار وإعداد النموذج البحثي العلمي: <span className="text-amber-700 underline underline-offset-4 decoration-amber-500 font-extrabold">الباحث / الأستاذ خالد فؤاد السيد</span>
                  </p>
                </div>
                <div className="bg-[#fdfcf7] p-5 border border-amber-200 text-center space-y-1 min-w-[200px] rounded-xl shadow-inner">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">نسخة البرنامج</span>
                  <span className="text-2xl font-black text-emerald-950 block font-mono">v3.0.1</span>
                  <span className="text-[9px] bg-emerald-900 text-amber-300 px-2 py-0.5 font-bold inline-block rounded">النموذج الموزون المستقر</span>
                </div>
              </div>
            </div>

            {/* 8-Button Grand Navigation Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest block">البوابة الإلكترونية الموحدة - لوحة التحكم والتحليل الاستراتيجي:</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Button 1: Input Analysis Screen */}
                <button
                  onClick={() => {
                    setCurrentScreen('portal');
                    setActiveTab('verses');
                  }}
                  className="bg-white border border-slate-200/80 hover:border-amber-500 p-6 text-right transition-all group hover:bg-[#faf9f4] cursor-pointer flex flex-col justify-between h-40 relative rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-850 rounded-t-2xl" />
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl group-hover:scale-110 transition-transform">✍️</span>
                    <span className="text-[10px] bg-emerald-900 text-white font-black px-2 py-0.5 rounded-md">محرك الأدوات</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-900 transition-colors">شاشة المدخلات وتحليل السور</h4>
                    <p className="text-[10px] text-slate-400 mt-1">تفكيك الآيات، عزل البسملة واستخراج نتائج القسمة.</p>
                  </div>
                </button>

                {/* Button 2: Smart Search */}
                <button
                  onClick={() => {
                    setCurrentScreen('portal');
                    setActiveTab('search');
                  }}
                  className="bg-white border border-slate-200/80 hover:border-amber-500 p-6 text-right transition-all group hover:bg-[#faf9f4] cursor-pointer flex flex-col justify-between h-40 relative rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500 rounded-t-2xl" />
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🔍</span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md">البحث المتقدم</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-900 transition-colors">نظام البحث القرآني الرياضي</h4>
                    <p className="text-[10px] text-slate-400 mt-1">البحث عن الحروف والكلمات وحصر تكراراتها بدقة.</p>
                  </div>
                </button>

                {/* Button 3: Surah Metadata Card */}
                <button
                  onClick={() => {
                    setCurrentScreen('portal');
                    setActiveTab('metadata');
                  }}
                  className="bg-white border border-slate-200/80 hover:border-amber-500 p-6 text-right transition-all group hover:bg-[#faf9f4] cursor-pointer flex flex-col justify-between h-40 relative rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-teal-600 rounded-t-2xl" />
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl group-hover:scale-110 transition-transform">📋</span>
                    <span className="text-[10px] bg-teal-600 text-white font-black px-2 py-0.5 rounded-md">سجل السورة الكبرى</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-900 transition-colors">بطاقات تعريف وإحصائيات السور</h4>
                    <p className="text-[10px] text-slate-400 mt-1">عرض أسباب النزول والمقاييس الكاملة لـ 29 سورة.</p>
                  </div>
                </button>

                {/* Button 4: Noorani Wave Charts */}
                <button
                  onClick={() => {
                    setCurrentScreen('portal');
                    setActiveTab('charts');
                  }}
                  className="bg-white border border-slate-200/80 hover:border-amber-500 p-6 text-right transition-all group hover:bg-[#faf9f4] cursor-pointer flex flex-col justify-between h-40 relative rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-indigo-600 rounded-t-2xl" />
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
                    <span className="text-[10px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded-md">الرسم والاتزان</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-900 transition-colors">منصة الرسوم البيانية للبنيان</h4>
                    <p className="text-[10px] text-slate-400 mt-1">توليد الموجات العددية والتطابق الرقمي التلقائي.</p>
                  </div>
                </button>

                {/* Button 5: Instant Calculator */}
                <button
                  onClick={() => {
                    setCurrentScreen('portal');
                    setActiveTab('calculator');
                  }}
                  className="bg-white border border-slate-200/80 hover:border-amber-500 p-6 text-right transition-all group hover:bg-[#faf9f4] cursor-pointer flex flex-col justify-between h-40 relative rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-violet-600 rounded-t-2xl" />
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🧮</span>
                    <span className="text-[10px] bg-violet-600 text-white font-black px-2 py-0.5 rounded-md">حاسبة حرّة</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-900 transition-colors">الحاسبة الأبجدية وحساب الجمل</h4>
                    <p className="text-[10px] text-slate-400 mt-1">استخراج المعايير للأحرف والجمل والكلمات العشوائية.</p>
                  </div>
                </button>

                {/* Button 6: AI Advisor */}
                <button
                  onClick={() => {
                    setCurrentScreen('portal');
                    setActiveTab('ai');
                  }}
                  className="bg-white border border-slate-200/80 hover:border-amber-500 p-6 text-right transition-all group hover:bg-[#faf9f4] cursor-pointer flex flex-col justify-between h-40 relative rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-pink-600 rounded-t-2xl" />
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🧠</span>
                    <span className="text-[10px] bg-pink-600 text-white font-black px-2 py-0.5 rounded-md">مستشار البنيان</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-900 transition-colors">مفسر البنيان بالذكاء الاصطناعي</h4>
                    <p className="text-[10px] text-slate-400 mt-1">توليد شروح تأويلية استقصائية مبنية على الأوزان.</p>
                  </div>
                </button>

                {/* Button 7: Scientific manual */}
                <button
                  onClick={() => {
                    setCurrentScreen('portal');
                    setActiveTab('guide');
                  }}
                  className="bg-white border border-slate-200/80 hover:border-amber-500 p-6 text-right transition-all group hover:bg-[#faf9f4] cursor-pointer flex flex-col justify-between h-40 relative rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-600 rounded-t-2xl" />
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl group-hover:scale-110 transition-transform">ℹ️</span>
                    <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-md">معايير ميثاق العمل</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-900 transition-colors">منهجية البرنامج والدليل العلمي</h4>
                    <p className="text-[10px] text-slate-400 mt-1">ميثاق التوحيد الأبجدي، وقواعد معالجة الحروف.</p>
                  </div>
                </button>

                {/* Button 8: Soft Exit */}
                <button
                  onClick={handleLogoExit}
                  className="bg-rose-50/50 border border-rose-200 hover:border-rose-800 p-6 text-right transition-all group hover:bg-rose-100/50 cursor-pointer flex flex-col justify-between h-40 relative rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-rose-600 rounded-t-2xl" />
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl group-hover:scale-110 transition-transform">❌</span>
                    <span className="text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-md">صيانة الجلسة</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-950 group-hover:text-rose-800 transition-colors">إنهاء الجلسة واستخراج التقارير</h4>
                    <p className="text-[10px] text-rose-600/80 mt-1">تصفير النصوص المسجلة، حفظ المخرجات والخروج الآمن.</p>
                  </div>
                </button>

              </div>
            </div>

            
{/* About Program section on Home Screen */}
            <div className="bg-white border text-right border-amber-200/50 p-6 md:p-8 space-y-5 rounded-2xl relative shadow-md">
              <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-emerald-800 rounded-r-2xl" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100/80 pb-3">
                <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <Info className="w-5 h-5 text-amber-500" />
                  حول برنامج ومؤشرات «البنيان للقرآن الكريم»
                </h3>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs text-emerald-900 font-bold">
                  <Mail className="w-4 h-4 text-emerald-700" />
                  <span>للتواصل مع الباحث:</span>
                  <a href="mailto:k.bonyan7@gmail.com" className="text-amber-700 hover:text-amber-800 font-black font-mono underline underline-offset-2">
                    k.bonyan7@gmail.com
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed font-semibold">
                <div className="space-y-3">
                  <p>
                    <strong>منهجية توحيد الحروف والاستيقار:</strong> يعتمد البرنامج نموذجاً بيانياً موحداً للأبجدية العربية، مما يضمن ثبات مخرجات العمل عند إعادة الحساب بغض النظر عن تفاوتات الرسم العثماني الإلكترونية والترميزات.
                  </p>
                  <p>
                    <strong>قواعد المعالجة الحرفية:</strong> يتم توحيد كافة صور الألف والهمزات (أ، إ، آ، ء، ٱ، ئ) إلى الألف اليابسة الأساسية بقيمتها الحسابية البالغة (1). وتعامل الهاء والتاء المربوطة (ة) ككيان موازن بقيمة (5) في حساب الجمل والاتساق.
                  </p>
                </div>
                <div className="space-y-3">
                  <p>
                    <strong>أصل الموازنة وعمود التحقق:</strong> ينقل جدول المخرجات إحداثية الآيات مستعرضاً ناتج قسمة حساب جمل الآية الكلي على وزن "حروف الفاتح النوراني" للسورة النشطة. وفي حال كان الناتج رقماً صحيحاً تماماً دون كسور، يستقر المؤشر على الحالة كـ <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded">متوافقة</span>.
                  </p>
                  <p>
                    <strong>نطاق الاستقصاء:</strong> تأسس نموذج البنيان كدراسة تخصصية تخدم أغراض التقصي العددي والاتزان الرياضي للحروف المقطعة لـ 29 سورة نورانية وتيسير حساب الجمل الكبير للألفاظ بيسر وموثوقية بالغة.
                  </p>
                </div>
              </div>

              {/* Contact card for Researcher Khaled Fouad El-Sayed */}
              <div className="bg-[#fcfbf7] border border-amber-200/80 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-xl border border-amber-300/50 font-bold flex items-center justify-center">
                    <Mail className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <span className="font-black text-emerald-950 block text-sm">وسيلة الاتصال المعتمدة للتواصل مع الباحث:</span>
                    <span className="text-slate-600">لأية استفسارات بحثية أو ملحوظات علمية حول نموذج البنيان مع <strong className="text-emerald-900 font-black">الأستاذ خالد فؤاد السيد</strong></span>
                  </div>
                </div>
                <a 
                  href="mailto:k.bonyan7@gmail.com" 
                  className="bg-[#092b22] hover:bg-[#051c16] text-amber-300 hover:text-amber-200 font-black px-4 py-2.5 rounded-xl border border-amber-500/40 flex items-center gap-2 transition-all shadow-sm font-mono dir-ltr select-all text-xs"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>k.bonyan7@gmail.com</span>
                </a>
              </div>
            </div>

          </div>
        ) : (
          // 2. ORIGINAL COMPREHENSIVE PORTAL INTERFACE TAB-PANELS
          <div className="space-y-6">
            
            {/* Quick Screen Back Anchor */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-amber-200/40 rounded-xl shadow-sm">
              <button 
                onClick={() => setCurrentScreen('main')}
                className="text-xs font-black text-emerald-900 flex items-center gap-1.5 hover:text-amber-600 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-emerald-800" />
                العودة للشاشة الرئيسية للبرنامج 🏛️
              </button>
              
              <div className="flex items-center gap-3">
                <QuranFontSizeControl compact={true} />
                <div className="text-xs text-slate-500 font-bold hidden md:block">
                  تصفح الآن: <span className="text-emerald-950 font-black">
                    {activeTab === 'verses' && 'معالجة الآيات وحوسبة الجمل'}
                    {activeTab === 'search' && 'نظام البحث الرياضي الفوري'}
                    {activeTab === 'charts' && 'الرسوم البيانية والموجات'}
                    {activeTab === 'metadata' && 'الوزن والبطاقة التعريفية للـ 29'}
                    {activeTab === 'calculator' && 'حاسبة الجمل المفتوحة'}
                    {activeTab === 'ai' && 'مفسّر البنيان بالذكاء الاصطناعي'}
                    {activeTab === 'guide' && 'دليل العمل الأبجدي وقواعد البرنامج'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs bar inside portal */}
            <div className="flex border border-amber-250/50 gap-1.5 overflow-x-auto scrollbar-none bg-[#fdfcf7] p-2 rounded-2xl shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('verses')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all rounded-xl whitespace-nowrap cursor-pointer ${
                  activeTab === 'verses'
                    ? 'bg-emerald-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>المدخلات والمخرجات (الجداول)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all rounded-xl whitespace-nowrap cursor-pointer ${
                  activeTab === 'search'
                    ? 'bg-emerald-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>البحث الرياضي المتقدم</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('charts')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all rounded-xl whitespace-nowrap cursor-pointer ${
                  activeTab === 'charts'
                    ? 'bg-emerald-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>منصة الرسوم والموجات</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('metadata')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all rounded-xl whitespace-nowrap cursor-pointer ${
                  activeTab === 'metadata'
                    ? 'bg-emerald-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                <BookIcon className="w-3.5 h-3.5" />
                <span>بطاقة التعريف بالسورة 📋</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all rounded-xl whitespace-nowrap cursor-pointer ${
                  activeTab === 'calculator'
                    ? 'bg-emerald-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                <CalcIcon className="w-3.5 h-3.5" />
                <span>الحاسبة الفورية للجمل</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all rounded-xl whitespace-nowrap cursor-pointer ${
                  activeTab === 'ai'
                    ? 'bg-emerald-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>المستشار الذكي</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all rounded-xl whitespace-nowrap cursor-pointer ${
                  activeTab === 'guide'
                    ? 'bg-emerald-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>منهج العمل العلمي 📚</span>
              </button>
            </div>

            {/* Render selected frame element */}
            <div className="min-h-[400px]">
              {activeTab === 'verses' && (
                <div className="space-y-6">
                  {verses.length === 0 ? (
                    <QuranInput 
                      onAnalyze={handleAnalyze} 
                      isLoading={isLoading} 
                      activeSurah={activeSurah}
                      setActiveSurah={setActiveSurah}
                    />
                  ) : (
                    <QuranOutput 
                      verses={verses} 
                      onReset={handleReset} 
                      activeSurah={activeSurah}
                      setActiveSurah={setActiveSurah} 
                      previewChartInOutput={previewChartInOutput}
                      setPreviewChartInOutput={setPreviewChartInOutput}
                    />
                  )}
                </div>
              )}

              {activeTab === 'search' && (
                <SmartSearch verses={verses} activeSurah={activeSurah} />
              )}

              {activeTab === 'charts' && (
                <NooraniCharts 
                  verses={verses} 
                  activeSurah={activeSurah} 
                  previewChartInOutput={previewChartInOutput}
                  setPreviewChartInOutput={setPreviewChartInOutput}
                />
              )}

              {activeTab === 'metadata' && (
                <div className="space-y-6">
                  {activeSurah ? (
                    <div className="bg-amber-50 p-4 border border-amber-200 text-right text-xs text-amber-900 font-bold rounded-none flex items-center justify-between">
                      <span>
                        📌 هذه البطاقة والوزن الحسابي لأس الكلمات تعتمد على المفتاح النوراني النشط: <strong>سورة {activeSurah.name} ({activeSurah.letters})</strong>
                      </span>
                      <select
                        value={activeSurah.id}
                        onChange={(e) => {
                          const selected = NOORANI_SURAHS.find(s => s.id === parseInt(e.target.value));
                          if (selected) setActiveSurah(selected);
                        }}
                        className="bg-white border text-xs font-bold p-1 rounded-none text-right cursor-pointer"
                      >
                        {NOORANI_SURAHS.map(s => (
                          <option key={s.id} value={s.id}>
                            سورة {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-4 border border-amber-200 text-right text-xs text-amber-900 font-bold rounded-none flex items-center justify-between">
                      <span>
                        📌 الرجاء تحديد السورة النورانية لتفعيل بطاقة المعالم والخصائص:
                      </span>
                      <select
                        value=""
                        onChange={(e) => {
                          const selected = NOORANI_SURAHS.find(s => s.id === parseInt(e.target.value));
                          if (selected) setActiveSurah(selected);
                        }}
                        className="bg-white border text-xs font-bold p-1 rounded-none text-right cursor-pointer"
                      >
                        <option value="">اختر سورة الكريّمة...</option>
                        {NOORANI_SURAHS.map(s => (
                          <option key={s.id} value={s.id}>
                            سورة {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <SurahCard activeSurah={activeSurah} />
                </div>
              )}

              {activeTab === 'calculator' && <Calculator />}

              {activeTab === 'guide' && <HelpSection />}

              {activeTab === 'ai' && (
                <AiAnalysis 
                  verses={verses} 
                  activeSurah={activeSurah} 
                  history={analysisHistory}
                  setHistory={setAnalysisHistory}
                />
              )}
            </div>

          </div>
        )}

      </main>

      {/* CONFIRM EXIT MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 text-right p-4" dir="rtl">
          <div className="bg-white border-2 border-slate-950 p-6 md:p-8 max-w-md w-full space-y-4 shadow-2xl relative">
            <div className="absolute top-0 right-0 left-0 h-1 bg-rose-600" />
            <h3 className="text-base font-black text-slate-900">⚠️ تأكيد إنهاء الجلسة والخروج</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              هل أنت متأكد من رغبتك في إغلاق الجلسة الحالية وتصفير مخرجات جداول البنيان؟ سيؤدي ذلك إلى إعادة تهيئة النظام واستقبال مدخلات نصية جديدة. يمكنكم تصدير ملفات الوورد والأكسيل التي قمتم بإنشائها قبل المغادرة للحفاظ عليها.
            </p>
            <div className="flex gap-2.5 justify-end pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-none cursor-pointer border border-slate-200"
              >
                تراجع والاستمرار بالعمل
              </button>
              <button
                onClick={confirmExit}
                className="px-5 py-2.5 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer shadow-md border-2 border-red-500 transition-all transform hover:scale-[1.02]"
              >
                نعم، إنهاء الجلسة وتصفير النظام ❌
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern footer built with literal human titles */}
      <footer className="bg-[#061225] text-white mt-12 py-10 border-t-2 border-yellow-600/25 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FFF 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <p className="quran-font text-yellow-100/90 text-sm md:text-base leading-relaxed tracking-wide">
            "وَعِنْدَهُ مَفَاتِحُ الْغَيْبِ لَا يَعْلَمُهَا إِلَّا هُوَ" | ميزان التحقق الحسابي وحساب الجمل الكبير للقرآن الكريم
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-xs text-slate-400 font-medium">
            <span className="font-bold text-amber-500/90">برنامج البنيان للتحليل الرقمي القرآني © 2026</span>
            <span className="hidden sm:inline text-slate-800">|</span>
            <span>بإشراف وتدقيق النظم التحليلية الموزونة - ابتكار الأستاذ خالد فؤاد السيد</span>
            <span className="hidden sm:inline text-slate-800">|</span>
            <span className="px-2 py-0.5 bg-[#0b1e3b] text-amber-200 border border-yellow-600/20 font-mono text-[10px]">AL-BUNYAN v3.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
