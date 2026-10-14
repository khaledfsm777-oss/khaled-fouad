import React, { useState, useEffect, useMemo } from 'react';
import { Verse } from '../types';
import { 
  NooraniSurah, 
  NOORANI_SURAHS, 
  parseAndAnalyzeVerses, 
  getCompatibilityDetails, 
  reduceDigitalRoot, 
  cleanForCalculations 
} from '../utils/jummal';
import quranData from '../utils/quranData';
import { SURAH_METADATA, getSurahMetadata } from '../utils/surahMetadata';
import { 
  getMukhtasarSurahOverview, 
  fetchMukhtasarVerseData, 
  MUKHTASAR_29_SURAHS, 
  generateVerseBenefits, 
  generateVerseTadabburTouch 
} from '../utils/mukhtasarData';
import { 
  generateMukhtasarSmartReport, 
  MukhtasarReportVerseDetail 
} from '../utils/reportTemplates';
import { handleSafeExport } from '../utils/exportHelper';
import { copyToClipboard } from '../utils/clipboard';
import { safeStorage } from '../utils/safeStorage';
import { 
  Sparkles, 
  Brain, 
  AlertCircle, 
  RefreshCw, 
  Compass, 
  ShieldCheck, 
  FileDown, 
  FileSpreadsheet, 
  Copy,
  Key,
  Award,
  Fingerprint,
  BookOpen,
  ChevronDown,
  ChevronUp,
  History,
  Trash2,
  Search,
  Wifi,
  WifiOff,
  CheckCircle2,
  Bookmark,
  Layers,
  Star
} from 'lucide-react';

interface AiAnalysisProps {
  verses: Verse[];
  activeSurah: NooraniSurah | null;
  history: any[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function AiAnalysis({ verses, activeSurah: parentActiveSurah, history, setHistory }: AiAnalysisProps) {
  // Local selected Surah (restored from safeStorage, or parent surah, or null for default "اختر سورة قرآنية")
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(() => {
    try {
      const saved = safeStorage.getItem('bonyan_ai_selected_surah');
      if (saved !== null && saved !== '') {
        const id = parseInt(saved, 10);
        if (!isNaN(id) && NOORANI_SURAHS.some(s => s.id === id)) {
          return id;
        }
      }
    } catch {}
    if (parentActiveSurah && NOORANI_SURAHS.some(s => s.id === parentActiveSurah.id)) {
      return parentActiveSurah.id;
    }
    return null;
  });

  const activeSurah = useMemo(() => {
    if (selectedSurahId === null) return null;
    return NOORANI_SURAHS.find(s => s.id === selectedSurahId) || null;
  }, [selectedSurahId]);

  // Keep synced if parent changes
  useEffect(() => {
    if (parentActiveSurah && NOORANI_SURAHS.some(s => s.id === parentActiveSurah.id) && parentActiveSurah.id !== selectedSurahId) {
      setSelectedSurahId(parentActiveSurah.id);
    }
  }, [parentActiveSurah]);

  // Persist selected surah
  useEffect(() => {
    try {
      if (selectedSurahId !== null) {
        safeStorage.setItem('bonyan_ai_selected_surah', selectedSurahId.toString());
      } else {
        safeStorage.removeItem('bonyan_ai_selected_surah');
      }
    } catch {}
  }, [selectedSurahId]);

  // Persistent Fold / Collapse states to keep screen blazing fast
  const [isReportCollapsed, setIsReportCollapsed] = useState<boolean>(() => {
    try {
      const saved = safeStorage.getItem('bonyan_ai_report_collapsed');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const [isBab1Collapsed, setIsBab1Collapsed] = useState<boolean>(() => {
    try {
      const saved = safeStorage.getItem('bonyan_ai_bab1_collapsed');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const [isBab2Collapsed, setIsBab2Collapsed] = useState<boolean>(() => {
    try {
      const saved = safeStorage.getItem('bonyan_ai_bab2_collapsed');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      safeStorage.setItem('bonyan_ai_report_collapsed', isReportCollapsed.toString());
    } catch {}
  }, [isReportCollapsed]);

  useEffect(() => {
    try {
      safeStorage.setItem('bonyan_ai_bab1_collapsed', isBab1Collapsed.toString());
    } catch {}
  }, [isBab1Collapsed]);

  useEffect(() => {
    try {
      safeStorage.setItem('bonyan_ai_bab2_collapsed', isBab2Collapsed.toString());
    } catch {}
  }, [isBab2Collapsed]);

  // Online / Offline connectivity tracker
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persistent Analysis state (restored from safeStorage for current surah or last generated)
  const [analysis, setAnalysis] = useState<string>(() => {
    try {
      const savedSurah = safeStorage.getItem('bonyan_ai_selected_surah');
      if (savedSurah) {
        const savedRep = safeStorage.getItem(`bonyan_ai_saved_report_${savedSurah}`);
        if (savedRep) return savedRep;
      }
      const general = safeStorage.getItem('bonyan_ai_last_analysis');
      if (general) return general;
    } catch {}
    return '';
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  
  // Verse tafseer & benefits state
  const [verseDetails, setVerseDetails] = useState<Record<string, { tafseer: string; benefits: string[]; tadabbur: string; source: 'online' | 'offline' }>>({});
  const [loadingVersesTafseer, setLoadingVersesTafseer] = useState<boolean>(false);

  // Active surah overview from Mukhtasar fi Tafsir
  const surahOverview = useMemo(() => {
    if (!activeSurah) return null;
    return getMukhtasarSurahOverview(activeSurah.id);
  }, [activeSurah]);

  const surahMeta = useMemo(() => {
    if (!activeSurah) return null;
    return getSurahMetadata(activeSurah.id);
  }, [activeSurah]);

  // Load cached report when selected surah changes
  useEffect(() => {
    if (selectedSurahId) {
      try {
        const cached = safeStorage.getItem(`bonyan_ai_saved_report_${selectedSurahId}`);
        if (cached) {
          setAnalysis(cached);
        }
      } catch {}
    }
  }, [selectedSurahId]);

  // Persist latest analysis
  useEffect(() => {
    if (analysis) {
      try {
        safeStorage.setItem('bonyan_ai_last_analysis', analysis);
        if (selectedSurahId) {
          safeStorage.setItem(`bonyan_ai_saved_report_${selectedSurahId}`, analysis);
        }
      } catch {}
    }
  }, [analysis, selectedSurahId]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(prev => prev === message ? null : prev);
    }, 4000);
  };

  // Verses to analyze: if parent passed verses from the active surah, use them; otherwise, load verses from quranData
  const displayVerses = useMemo(() => {
    if (!activeSurah) return [];
    if (verses && verses.length > 0) {
      // Check if verses belong to current surah or if user imported them
      return verses;
    }
    // Fallback: load first 10 verses of the selected surah from quranData
    const surahRaw = quranData.filter(v => v.surahId === activeSurah.id).slice(0, 10);
    const textLines = surahRaw.map(v => `${v.text} (${v.verseNumber})`).join('\n');
    return parseAndAnalyzeVerses(textLines, 'auto', false, activeSurah.id);
  }, [verses, activeSurah]);

  // Compute metrics and analysis for display verses
  const surahLetters = activeSurah?.letters || '';
  const letterSet = useMemo(() => new Set(surahLetters.split('')), [surahLetters]);

  const analyzedVerses = useMemo(() => {
    if (!activeSurah) return [];
    return displayVerses.map(v => {
      const isVerified = (v.jummalValue % activeSurah.digitalRoot === 0);
      const quotient = (v.jummalValue / activeSurah.digitalRoot);
      
      let overlapCount = 0;
      const cleanText = v.cleanTextForCalculation || v.text || '';
      for (let i = 0; i < cleanText.length; i++) {
        if (letterSet.has(cleanText[i])) {
          overlapCount++;
        }
      }
      const overlapRatio = v.letterCount > 0 ? (overlapCount / v.letterCount) : 0;

      // Compatibility details
      const dummySurah = {
        id: activeSurah.id,
        name: activeSurah.name,
        letters: activeSurah.letters,
        keyValue: activeSurah.keyValue,
        digitalRoot: activeSurah.digitalRoot
      };
      const comp = getCompatibilityDetails(v, dummySurah);

      // STRICT 14 check: ONLY literal 14, NEVER reduced to 5
      const isExact14 = 
        v.jummalValue === 14 || 
        v.wordCount === 14 || 
        v.letterCount === 14 || 
        comp.newColumnProduct === 14;

      const exact14Details: string[] = [];
      if (v.jummalValue === 14) exact14Details.push('جمل الآية = 14');
      if (v.wordCount === 14) exact14Details.push('كلمات الآية = 14');
      if (v.letterCount === 14) exact14Details.push('حروف الآية = 14');
      if (comp.newColumnProduct === 14) exact14Details.push('ناتج المعادلة = 14');

      // Rank match
      const isRankMatch = 
        comp.finalSingleDigit === reduceDigitalRoot(activeSurah.id) ||
        (typeof surahMeta?.nooraniOrder === 'number' && comp.finalSingleDigit === reduceDigitalRoot(surahMeta.nooraniOrder));

      // Sovereign 9
      const isSig9 = 
        v.jummalValue % 9 === 0 || 
        comp.newColumnProduct % 9 === 0 || 
        comp.finalSingleDigit === 9;

      return {
        ...v,
        isVerified,
        quotient,
        overlapCount,
        overlapRatio,
        comp,
        isExact14,
        exact14Details,
        isRankMatch,
        isSig9
      };
    });
  }, [displayVerses, activeSurah, letterSet, surahMeta]);

  // Load Mukhtasar Tafseer for the display verses
  useEffect(() => {
    let isCancelled = false;

    async function loadTafseerForVerses() {
      if (!activeSurah || analyzedVerses.length === 0) return;
      setLoadingVersesTafseer(true);

      const newDetails: Record<string, { tafseer: string; benefits: string[]; tadabbur: string; source: 'online' | 'offline' }> = {};

      for (const v of analyzedVerses) {
        if (isCancelled) break;
        const key = `${activeSurah.id}:${v.verseNumber}`;
        if (verseDetails[key]) {
          newDetails[key] = verseDetails[key];
          continue;
        }

        try {
          const num = typeof v.verseNumber === 'number' ? v.verseNumber : parseInt(String(v.verseNumber).replace(/\D/g, '')) || 1;
          const res = await fetchMukhtasarVerseData(activeSurah.id, num, v.text, v.jummalValue);
          newDetails[key] = res;
        } catch (e) {
          // Graceful fallback
          newDetails[key] = {
            tafseer: `تفسير الآية [${v.verseNumber}] من كتاب «المختصر في التفسير»: تبيّن الآية الكريمة حكماً جليلاً وتذكيراً بمقاصد التوحيد والإيمان.`,
            benefits: generateVerseBenefits(v.text, v.verseNumber),
            tadabbur: generateVerseTadabburTouch(v.text, v.verseNumber, v.jummalValue),
            source: 'offline'
          };
        }
      }

      if (!isCancelled) {
        setVerseDetails(prev => ({ ...prev, ...newDetails }));
        setLoadingVersesTafseer(false);
      }
    }

    loadTafseerForVerses();

    return () => {
      isCancelled = true;
    };
  }, [analyzedVerses, activeSurah?.id]);

  // High Quotient & Density Verses
  const verifiedVerses = analyzedVerses.filter(v => v.isVerified);
  const maxQuotientVerse = verifiedVerses.length > 0 
    ? [...verifiedVerses].sort((a, b) => (b.quotient || 0) - (a.quotient || 0))[0] 
    : null;

  const maxDensityVerse = analyzedVerses.length > 0 
    ? [...analyzedVerses].sort((a, b) => (b.overlapRatio || 0) - (a.overlapRatio || 0))[0] 
    : null;

  // Generate the Comprehensive Mukhtasar Smart Report
  const fetchAnalysis = async () => {
    if (!activeSurah) {
      showToast('يرجى اختيار سورة قرآنية أولاً من القائمة المنسدلة');
      return;
    }
    if (analyzedVerses.length === 0) return;
    setLoading(true);
    setError(null);
    setAnalysis('');

    try {
      // Small visual delay for silky smooth calculation feedback
      await new Promise(resolve => setTimeout(resolve, 350));

      const reportVerseDetails: MukhtasarReportVerseDetail[] = analyzedVerses.map(v => {
        const key = `${activeSurah.id}:${v.verseNumber}`;
        const detail = verseDetails[key];
        return {
          verseNumber: v.verseNumber,
          text: v.text,
          jummalValue: v.jummalValue,
          wordCount: v.wordCount,
          letterCount: v.letterCount,
          tafseer: detail?.tafseer,
          benefits: detail?.benefits,
          tadabbur: detail?.tadabbur,
          source: detail?.source || (isOnline ? 'online' : 'offline')
        };
      });

      const generatedAnalysisText = generateMukhtasarSmartReport({
        activeSurah: {
          id: activeSurah.id,
          name: activeSurah.name,
          letters: activeSurah.letters,
          keyValue: activeSurah.keyValue,
          digitalRoot: activeSurah.digitalRoot,
        },
        surahMeta,
        verses: analyzedVerses.map(v => ({
          verseNumber: v.verseNumber,
          text: v.text,
          jummalValue: v.jummalValue,
          wordCount: v.wordCount,
          letterCount: v.letterCount,
          isVerified: v.isVerified,
          quotient: v.quotient,
          overlapCount: v.overlapCount,
          overlapRatio: v.overlapRatio,
        })),
        verseDetails: reportVerseDetails,
        isOnline,
      });

      setAnalysis(generatedAnalysisText);
      // Auto expand report when freshly generated so the user sees it immediately
      setIsReportCollapsed(false);

      // Append to session history
      const newHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('ar-EG'),
        surahName: activeSurah.name,
        surahLetters: activeSurah.letters || 'لا يوجد',
        digitalRoot: activeSurah.digitalRoot,
        keyValue: activeSurah.keyValue,
        versesCount: analyzedVerses.length,
        maxQuotientVerse: maxQuotientVerse ? {
          verseNumber: maxQuotientVerse.verseNumber,
          text: maxQuotientVerse.text,
          jummalValue: maxQuotientVerse.jummalValue,
          quotient: maxQuotientVerse.quotient,
          wordCount: maxQuotientVerse.wordCount,
          letterCount: maxQuotientVerse.letterCount,
        } : null,
        maxDensityVerse: maxDensityVerse ? {
          verseNumber: maxDensityVerse.verseNumber,
          text: maxDensityVerse.text,
          jummalValue: maxDensityVerse.jummalValue,
          overlapCount: maxDensityVerse.overlapCount,
          overlapRatio: maxDensityVerse.overlapRatio,
          wordCount: maxDensityVerse.wordCount,
          letterCount: maxDensityVerse.letterCount,
        } : null,
        analysisText: generatedAnalysisText,
        isOnline,
      };

      setHistory(prev => [newHistoryItem, ...prev]);
      showToast('✨ تم توليد تقرير مفسر البنيان الذكي المرتبط بكتاب المختصر في التفسير بنجاح!');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء إجراء الاستقصاء الذكي للموازين وتفسير المختصر.');
    } finally {
      setLoading(false);
    }
  };

  // Reusable export function for MS Word (.doc) with complete Mukhtasar and numerics layout
  const exportToWord = (
    analysisText: string,
    surahName: string,
    surahLetters: string,
    digitalRoot: number | string,
    keyValue: number | string,
    versesCount: number,
    timestamp: string
  ) => {
    if (!analysisText) return;
    const BOM = '\uFEFF';
    
    const rawLines = analysisText.split('\n');
    let contentHtml = '';
    
    rawLines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        contentHtml += `<h4 style="color: #0f172a; margin-top: 15px; margin-bottom: 5px; border-right: 3px solid #b45309; padding-right: 8px; direction: rtl; text-align: right;">${trimmed.replace(/^###\s*/, '')}</h4>`;
      } else if (trimmed.startsWith('##')) {
        contentHtml += `<h3 style="color: #1e293b; margin-top: 20px; margin-bottom: 10px; border-right: 5px solid #0f172a; padding-right: 12px; direction: rtl; text-align: right;">${trimmed.replace(/^##\s*/, '')}</h3>`;
      } else if (trimmed.startsWith('#')) {
        contentHtml += `<h2 style="color: #0f172a; text-align: center; border-bottom: 2px solid #b45309; padding-bottom: 8px; margin-top: 25px; direction: rtl;">${trimmed.replace(/^#\s*/, '')}</h2>`;
      } else if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        contentHtml += `<li style="margin-right: 20px; font-size: 13px; line-height: 1.6; margin-top: 5px; color: #334155; direction: rtl; text-align: right;">${trimmed.replace(/^[\*\-]\s*/, '')}</li>`;
      } else if (!trimmed) {
        contentHtml += `<div style="height: 10px;"></div>`;
      } else {
        let lineWithBold = trimmed;
        if (trimmed.includes('**')) {
          const parts = trimmed.split('**');
          lineWithBold = parts.map((part, pIdx) => (pIdx % 2 === 1 ? `<strong style="color: #0f172a; font-weight: bold;">${part}</strong>` : part)).join('');
        }
        contentHtml += `<p style="font-size: 13px; line-height: 1.6; color: #334155; margin-top: 5px; text-align: justify; direction: rtl;">${lineWithBold}</p>`;
      }
    });

    let html = `<html dir="rtl" xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"><title>تقرير مفسر البنيان الذكي - المختصر في التفسير</title>`;
    html += `<style>
      body { font-family: 'Arial', sans-serif; direction: rtl; padding: 25px; background-color: #ffffff; text-align: right; }
      h1 { text-align: center; color: #092b22; font-size: 20px; margin-bottom: 15px; border-bottom: 3px double #b45309; padding-bottom: 10px; }
      .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 20px; font-size: 12px; line-height: 1.6; direction: rtl; text-align: right; }
      .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    </style></head><body>`;
    
    html += `<h1>بِرْنَامَج البُنْيَان لِلْقُرْآنِ الكَرِيمِ - مِيزَانُ التَّحَقُّقِ وَالاسْتِقْصَاءِ</h1>`;
    html += `<div class="meta-box">`;
    html += `<strong>التقرير:</strong> دراسة مفسر البنيان الذكي الشامل المرتبط بكتاب «المختصر في التفسير»<br>`;
    html += `<strong>تاريخ الاستخراج:</strong> ${timestamp}<br>`;
    html += `<strong>السورة النشطة:</strong> سورة ${surahName} (معامل الاختزال: ${digitalRoot})<br>`;
    html += `<strong>الحروف الافتتاحية للمقارنة:</strong> ${surahLetters} (حساب الجمل: ${keyValue})<br>`;
    html += `<strong>عدد الآيات المعروضة:</strong> ${versesCount} آية كريمة<br>`;
    html += `<strong>حالة الربط:</strong> ${isOnline ? 'أونلاين (قاعدة بيانات المختصر السحابية)' : 'أوفلاين (البيانات المحلية المدمجة)'}<br>`;
    html += `</div>`;

    html += contentHtml;
    html += `<div class="footer"><p>«مفسر البنيان الذكي» • المرتبط بكتاب «المختصر في التفسير» (مركز تفسير للدراسات القرآنية)</p></div>`;
    html += `</body></html>`;
    
    handleSafeExport(BOM + html, `البنيان_تقرير_المختصر_${surahName.replace(/\s+/g, '_')}`, 'doc');
  };

  // Reusable export function for MS Excel (.csv with proper BOM)
  const exportToExcel = (
    analysisText: string,
    surahName: string,
    surahLetters: string,
    digitalRoot: number | string,
    versesCount: number,
    timestamp: string
  ) => {
    if (!analysisText) return;
    const BOM = '\uFEFF';
    
    let csvRows = [];
    csvRows.push(`"تقرير مفسّر البنيان الذكي الشامل المرتبط بكتاب المختصر في التفسير"`);
    csvRows.push(`"تاريخ الاستخراج:","${timestamp}"`);
    csvRows.push(`"السورة المرتبطة:","سورة ${surahName}","الفواتح النورانية:","${surahLetters}","معامل الاختزال:","${digitalRoot}"`);
    csvRows.push(`"إجمالي الآيات:","${versesCount} آية"`);
    csvRows.push(``);

    csvRows.push(`"رقم الآية","النص القرآني الكريم","حساب الجُمّل","الكلمات","الحروف","توافق المعامل","البصمة 14 الصريحة حصراً","البصمة السيادية 9","التفسير المختصر"`);
    
    analyzedVerses.forEach(v => {
      const key = `${activeSurah.id}:${v.verseNumber}`;
      const taf = (verseDetails[key]?.tafseer || '').replace(/"/g, '""');
      const coeffMatch = v.isVerified ? 'متوافق' : 'غير متوافق';
      const exact14Match = v.isExact14 ? `محقق [${v.exact14Details.join(' | ')}]` : 'لا ينطبق';
      const sig9Match = v.isSig9 ? 'محقق' : 'غير مقترن';
      const cleanText = (v.text || '').replace(/"/g, '""');

      csvRows.push(`"[الآية ${v.verseNumber}]","« ${cleanText} »","${v.jummalValue}","${v.wordCount}","${v.letterCount}","${coeffMatch}","${exact14Match}","${sig9Match}","${taf}"`);
    });

    const csvContent = BOM + csvRows.join('\n');
    handleSafeExport(csvContent, `البنيان_تقرير_المختصر_${surahName.replace(/\s+/g, '_')}`, 'csv');
  };

  const handleExportWord = () => {
    if (!activeSurah) {
      showToast('يرجى اختيار سورة قرآنية أولاً');
      return;
    }
    exportToWord(
      analysis,
      activeSurah.name,
      activeSurah.letters || 'لا يوجد',
      activeSurah.digitalRoot,
      activeSurah.keyValue,
      analyzedVerses.length,
      new Date().toLocaleDateString('ar-EG')
    );
  };

  const handleExportExcel = () => {
    if (!activeSurah) {
      showToast('يرجى اختيار سورة قرآنية أولاً');
      return;
    }
    exportToExcel(
      analysis,
      activeSurah.name,
      activeSurah.letters || 'لا يوجد',
      activeSurah.digitalRoot,
      analyzedVerses.length,
      new Date().toLocaleDateString('ar-EG')
    );
  };

  // Safe basic markdown parser
  const renderFormattedText = (rawText: string) => {
    if (!rawText) return null;
    
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('####')) {
        return (
          <h5 key={idx} className="text-xs font-black text-slate-800 mt-3 mb-1.5 border-r-2 border-amber-600 pr-2">
            {trimmed.replace(/^####\s*/, '')}
          </h5>
        );
      }
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={idx} className="text-sm font-black text-slate-900 mt-4 mb-2 border-r-3 border-emerald-700 pr-2.5">
            {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h3 key={idx} className="text-base font-black text-slate-950 mt-6 mb-3 border-r-4 border-slate-950 pr-3 bg-slate-100/70 p-1.5">
            {trimmed.replace(/^##\s*/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('#')) {
        return (
          <h2 key={idx} className="text-lg font-black text-emerald-950 mt-6 mb-4 font-sans border-b-2 border-amber-500 pb-2 text-center">
            {trimmed.replace(/^#\s*/, '')}
          </h2>
        );
      }
      
      if (trimmed.startsWith('>')) {
        return (
          <blockquote key={idx} className="bg-amber-50/70 border-r-4 border-amber-500 p-2.5 my-2 text-xs text-amber-950 font-semibold leading-relaxed">
            {trimmed.replace(/^>\s*/, '')}
          </blockquote>
        );
      }

      if (!trimmed) {
        return <div key={idx} className="h-1.5" />;
      }

      const isBullet = trimmed.startsWith('*') || trimmed.startsWith('-');
      const textToProcess = isBullet ? trimmed.replace(/^[\*\-]\s*/, '') : line;

      let finalContent: React.ReactNode = textToProcess;
      if (textToProcess.includes('**')) {
        const parts = textToProcess.split('**');
        finalContent = parts.map((part, pIdx) => (
          pIdx % 2 === 1 ? (
            <strong key={pIdx} className="text-slate-950 font-black">{part}</strong>
          ) : (
            part
          )
        ));
      }

      if (isBullet) {
        return (
          <li key={idx} className="text-xs text-slate-700 mr-4 list-disc leading-relaxed mt-1 list-inside">
            {finalContent}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs leading-relaxed text-slate-700 mt-1 pb-1">
          {finalContent}
        </p>
      );
    });
  };

  return (
    <>
      <div className="space-y-6 text-right animate-fade-in" dir="rtl">
        
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-none shadow-2xl border-2 border-amber-400 text-xs font-bold flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toast}</span>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white border-2 border-slate-200 rounded-none p-6 md:p-8 space-y-6 relative shadow-sm">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-700 via-amber-500 to-emerald-700" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-200 pb-5">
            <div className="flex items-start sm:items-center gap-3">
              <span className="p-3 bg-emerald-50 rounded-none text-emerald-800 border-2 border-emerald-200">
                <Brain className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight font-sans">
                    مُـفـسّـر الـبـنـيـان الـذكـي الشّـامـل ⚡
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                    مرتبط بكتاب «المختصر في التفسير» (مركز تفسير)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ربط التفسير الموضوعي ومقاصد ومحاور السور الـ 29 مع التحليل البنيوي الرقمي لكل آية (المعامل، الترتيب، الرقم 14 الصريح حصراً، والبصمات).
                </p>
              </div>
            </div>

            {/* Online / Offline status and controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Online/Offline Badge */}
              <div 
                className={`px-3 py-1.5 text-xs font-black border flex items-center gap-1.5 ${
                  isOnline 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
                title={isOnline ? 'البرنامج متصل بالإنترنت: جلب سحابي مباشر للمختصر' : 'البرنامج يعمل أوفلاين: الاعتماد على محاور وبيانات المختصر المدمجة محلياً'}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span>متصل أونلاين 🌐</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                    <span>وضع أوفلاين 📴</span>
                  </>
                )}
              </div>

              {/* Surah Selector for the 29 Noorani Surahs with first option 'اختر سورة قرآنية' */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 p-1">
                <span className="text-[11px] font-bold text-slate-600 px-1">السورة القرآنية:</span>
                <select
                  value={selectedSurahId ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSurahId(val ? parseInt(val, 10) : null);
                  }}
                  className="bg-white border text-xs font-black p-1 text-right cursor-pointer"
                >
                  <option value="">-- اختر سورة قرآنية --</option>
                  {NOORANI_SURAHS.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id}. سورة {s.name} ({s.letters})
                    </option>
                  ))}
                </select>
              </div>

              {/* Master Collapsing Toggle (طي وبسط التقرير لتسريع وتسهيل البرنامج) */}
              <button
                type="button"
                onClick={() => {
                  const target = !isReportCollapsed;
                  setIsReportCollapsed(target);
                  setIsBab1Collapsed(target);
                  setIsBab2Collapsed(target);
                  showToast(target ? 'تم طي التقرير والأبواب لتسريع وتخفيف الشاشة 📁' : 'تم بسط التقرير والأبواب بالكامل 📖');
                }}
                className="px-3 py-2 text-xs font-black bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-none flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title={isReportCollapsed ? 'بسط التقرير وكافة الأبواب' : 'طي التقرير وكافة الأبواب لتسريع البرنامج'}
              >
                {isReportCollapsed ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
                    <span>بسط التقرير والأبواب 📖</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-amber-700" />
                    <span>طي التقرير والأبواب 📁 (سريع)</span>
                  </>
                )}
              </button>

              {/* Action Button: Generate / Update Report */}
              <button
                type="button"
                disabled={loading || !selectedSurahId}
                onClick={fetchAnalysis}
                className={`px-5 py-2.5 text-xs font-black border-2 rounded-none flex items-center gap-2 transition-all shadow-md ${
                  loading || !selectedSurahId
                    ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-900 hover:to-teal-800 text-amber-200 border-amber-400 cursor-pointer transform hover:scale-[1.02]'
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 text-amber-300 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>{analysis ? 'تحديث تقرير المختصر والبنيان 🔄' : '⚡ توليد تقرير المختصر والبنيان'}</span>
              </button>
            </div>
          </div>

          {!activeSurah ? (
            /* Guidance screen when no surah is chosen */
            <div className="bg-[#fcfbf7] border-2 border-dashed border-amber-300 p-8 md:p-12 text-center space-y-4 shadow-xs animate-fade-in">
              <div className="w-16 h-16 bg-amber-100/90 border border-amber-400/60 rounded-2xl flex items-center justify-center mx-auto text-amber-800 shadow-inner">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base sm:text-lg font-black text-slate-900">
                  اختر سورة قرآنية للبدء في استعراض التقرير وتفاسير المختصر
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  يرجى اختيار إحدى السور النورانية الكريمة من القائمة المنسدلة أعلاه لبدء استكشاف معالم ومقاصد كتاب «المختصر في التفسير» وموازين التوافقات وتوليد التقرير الأكاديمي الشامل.
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-amber-950 bg-amber-100/80 border border-amber-300 px-4 py-2">
                  <span>👆 القائمة المنسدلة بالأعلى: «-- اختر سورة قرآنية --»</span>
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Bab 1: Surah Introduction & Themes from Al-Mukhtasar (Collapsible) */}
              <div className="bg-[#fcfbf7] border-2 border-amber-200/80 relative shadow-xs">
                <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
                
                <div 
                  className="p-4 flex items-center justify-between border-b border-amber-200/70 flex-wrap gap-2 cursor-pointer hover:bg-amber-50/60 transition-colors"
                  onClick={() => setIsBab1Collapsed(!isBab1Collapsed)}
                  title={isBab1Collapsed ? 'انقر لبسط الباب الأول' : 'انقر لطي الباب الأول'}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBab1Collapsed(!isBab1Collapsed);
                      }}
                      className="p-1 rounded bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                      aria-label={isBab1Collapsed ? 'بسط الباب الأول' : 'طي الباب الأول'}
                    >
                      {isBab1Collapsed ? <ChevronDown className="w-4 h-4 text-amber-800" /> : <ChevronUp className="w-4 h-4 text-amber-800" />}
                    </button>
                    <BookOpen className="w-5 h-5 text-emerald-800" />
                    <h4 className="text-sm font-black text-emerald-950">
                      🏛️ الباب الأول: معالم ومقاصد سورة {activeSurah.name} في كتاب «المختصر في التفسير»
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600" onClick={(e) => e.stopPropagation()}>
                    <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 border border-emerald-300">
                      الفاتحة: {activeSurah.letters}
                    </span>
                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-300">
                      معامل الاختزال: {activeSurah.digitalRoot}
                    </span>
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 border border-slate-300">
                      جمل الفاتحة: {activeSurah.keyValue}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsBab1Collapsed(!isBab1Collapsed)}
                      className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 border border-amber-300 cursor-pointer"
                    >
                      {isBab1Collapsed ? 'بسط 🔽' : 'طي 🔼'}
                    </button>
                  </div>
                </div>

                {!isBab1Collapsed && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                      {/* Tamheed */}
                      <div className="bg-white p-3.5 border border-amber-200 space-y-1.5">
                        <span className="font-black text-amber-900 block flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                          📜 تمهيد السورة:
                        </span>
                        <p className="text-slate-700 font-semibold leading-relaxed">
                          {surahOverview?.tamheed || surahMeta?.revelationReason || 'سورة قرآنية كريمة تفتتح بالحروف النورانية المعجزة.'}
                        </p>
                      </div>

                      {/* Maqsad & Mehwar */}
                      <div className="bg-white p-3.5 border border-amber-200 space-y-1.5">
                        <span className="font-black text-emerald-900 block flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-emerald-600" />
                          🎯 مقصد السورة ومحورها العام:
                        </span>
                        <p className="text-slate-700 font-semibold leading-relaxed">
                          <strong>المقصد:</strong> {surahOverview?.maqsad || 'ترسيخ التوحيد والاستجابة لأمر الله.'}
                        </p>
                        <p className="text-slate-600 text-[11px] font-medium pt-1 border-t border-slate-100">
                          <strong>المحور العام:</strong> {surahOverview?.mehwar || surahMeta?.briefTopic}
                        </p>
                      </div>
                    </div>

                    {/* Tadabbur Touches */}
                    {surahOverview?.tadabburTouches && surahOverview.tadabburTouches.length > 0 && (
                      <div className="bg-white p-3.5 border border-amber-200 space-y-2">
                        <span className="font-black text-slate-900 block text-xs">
                          ✨ لمسات تدبرية جامعة لسورة {activeSurah.name}:
                        </span>
                        <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-slate-700 font-semibold">
                          {surahOverview.tadabburTouches.map((touch, tIdx) => (
                            <li key={tIdx} className="bg-slate-50 p-2 border border-slate-200 flex items-start gap-1.5">
                              <span className="text-amber-600 font-black shrink-0">🔹</span>
                              <span>{touch}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bab 2: Displayed Verses with Mukhtasar Tafseer, Benefits, and Numerics Analysis (Collapsible) */}
              <div className="bg-white border-2 border-slate-200 relative shadow-xs">
                <div 
                  className="p-4 flex items-center justify-between border-b border-slate-200 flex-wrap gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setIsBab2Collapsed(!isBab2Collapsed)}
                  title={isBab2Collapsed ? 'انقر لبسط آيات الباب الثاني' : 'انقر لطي آيات الباب الثاني لتسريع الشاشة'}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBab2Collapsed(!isBab2Collapsed);
                      }}
                      className="p-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label={isBab2Collapsed ? 'بسط الآيات' : 'طي الآيات'}
                    >
                      {isBab2Collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <Layers className="w-5 h-5 text-amber-600" />
                    <h4 className="text-sm font-black text-slate-900">
                      📑 الباب الثاني: الآيات المعروضة وقت طلب التقرير ({analyzedVerses.length} آية كريمة)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                    {loadingVersesTafseer && (
                      <span className="text-amber-700 font-bold flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        جاري جلب تفاسير وفوائد المختصر...
                      </span>
                    )}
                    <span className="text-slate-500 font-bold hidden sm:inline">
                      * التحليل البنيوي والتوافقات مع المعامل والرقم 14 الصريح
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsBab2Collapsed(!isBab2Collapsed)}
                      className="text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-0.5 border border-slate-300 cursor-pointer"
                    >
                      {isBab2Collapsed ? 'بسط الآيات 🔽' : 'طي الآيات (تسريع) 🔼'}
                    </button>
                  </div>
                </div>

                {!isBab2Collapsed && (
                  <div className="p-4 space-y-4 bg-slate-50/50">
                    {analyzedVerses.map((v, idx) => {
                      const key = `${activeSurah.id}:${v.verseNumber}`;
                      const detail = verseDetails[key];
                      const tafseerText = detail?.tafseer || `تفسير الآية [${v.verseNumber}] من كتاب «المختصر في التفسير»: تبيّن الآية الكريمة حكماً جليلاً ودعوة إلى الامتثال والتوحيد.`;
                      const benefitsList = detail?.benefits && detail.benefits.length > 0 
                        ? detail.benefits 
                        : generateVerseBenefits(v.text, v.verseNumber);
                      const tadabburText = detail?.tadabbur || generateVerseTadabburTouch(v.text, v.verseNumber, v.jummalValue);
                      const sourceBadge = detail?.source || (isOnline ? 'online' : 'offline');

                      return (
                        <div key={idx} className="bg-white border-2 border-slate-200 p-4 md:p-5 space-y-3.5 relative hover:border-amber-400 transition-colors shadow-xs">
                          {/* Top Verse Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-xs font-black bg-slate-900 text-white font-mono">
                                آية {v.verseNumber}
                              </span>
                              <span className="text-xs text-slate-500 font-bold">
                                سورة {activeSurah.name}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 text-[10px]">
                              <span className={`px-2 py-0.5 font-black border ${
                                sourceBadge === 'online' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {sourceBadge === 'online' ? '🌐 المختصر (أونلاين)' : '📴 المختصر (أوفلاين مدمج)'}
                              </span>
                              <span className="px-2 py-0.5 font-mono font-bold bg-slate-50 border border-slate-200 text-slate-700">
                                جمل: {v.jummalValue}
                              </span>
                              <span className="px-2 py-0.5 font-mono font-bold bg-slate-50 border border-slate-200 text-slate-700">
                                كلمات: {v.wordCount}
                              </span>
                              <span className="px-2 py-0.5 font-mono font-bold bg-slate-50 border border-slate-200 text-slate-700">
                                حروف: {v.letterCount}
                              </span>
                            </div>
                          </div>

                          {/* Verse Text (Uthmani) */}
                          <div className="bg-[#faf9f4] p-3 border border-amber-200/60 text-center">
                            <p className="quran-font text-base sm:text-lg text-slate-950 font-black leading-loose select-all">
                              « {v.text} »
                            </p>
                          </div>

                          {/* Mukhtasar Tafseer Section */}
                          <div className="space-y-1 bg-slate-50/70 p-3 border border-slate-200 text-xs">
                            <span className="font-black text-emerald-950 block flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                              📖 التفسير المختصر (من كتاب «المختصر في التفسير»):
                            </span>
                            <p className="text-slate-700 font-semibold leading-relaxed pr-2">
                              {tafseerText}
                            </p>
                          </div>

                          {/* Benefits & Tadabbur */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-amber-50/50 p-2.5 border border-amber-200 space-y-1">
                              <span className="font-black text-amber-950 block text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-amber-700" />
                                💎 من فوائد الآية واللطائف:
                              </span>
                              <ul className="space-y-1 text-[11px] text-slate-700 font-semibold list-disc list-inside pr-1">
                                {benefitsList.map((b, bIdx) => (
                                  <li key={bIdx}>{b}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-teal-50/40 p-2.5 border border-teal-200 space-y-1">
                              <span className="font-black text-teal-950 block text-[11px] flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-teal-700" />
                                🌿 لمسة تدبرية:
                              </span>
                              <p className="text-[11px] text-slate-700 font-semibold leading-relaxed pr-1">
                                {tadabburText}
                              </p>
                            </div>
                          </div>

                          {/* Al-Bunyan Numerics & Compatibilities Bar */}
                          <div className="bg-white border border-slate-200 p-3 space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-[11px] font-black text-slate-800">
                              <span>⚙️ تحليل البرنامج البنيوي والتوافقات:</span>
                              <span className="font-mono text-slate-500 text-[10px] sm:text-xs">
                                المعادلة: {v.comp.verseDigitalRoot} × ({v.verseNumber} + {v.comp.reducedFactor}) = {v.comp.newColumnProduct} (البصمة: {v.comp.finalSingleDigit})
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              {/* Coefficient Match */}
                              <span className={`px-2 py-0.5 text-[10px] font-black border ${
                                v.isVerified 
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {v.isVerified 
                                  ? `✅ متوافق مع المعامل (${activeSurah.digitalRoot}) بقوة: ${v.quotient.toFixed(2)}` 
                                  : `⚠️ ميزان كسري (${(v.jummalValue / activeSurah.digitalRoot).toFixed(2)})`}
                              </span>

                              {/* Surah Rank Match */}
                              <span className={`px-2 py-0.5 text-[10px] font-black border ${
                                v.isRankMatch 
                                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {v.isRankMatch 
                                  ? `✅ متطابق مع ترتيب السورة (${v.comp.finalSingleDigit})` 
                                  : `➖ غير مقترن برقم السورة`}
                              </span>

                              {/* STRICT 14 Match (Literal ONLY 14, NEVER 5) */}
                              <span className={`px-2.5 py-0.5 text-[10px] font-black border ${
                                v.isExact14 
                                  ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}>
                                {v.isExact14 
                                  ? `👑 البصمة 14 الصريحة حصراً [${v.exact14Details.join(' | ')}]` 
                                  : `➖ البصمة 14: لا تنطبق (الشرط = 14 صريحاً)`}
                              </span>

                              {/* Sovereign 9 Match */}
                              {v.isSig9 && (
                                <span className="px-2 py-0.5 text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                                  🌟 بصمة سيادية (9)
                                </span>
                              )}

                              {/* Compatibility Score */}
                              <span className="px-2 py-0.5 text-[10px] font-mono font-black bg-slate-900 text-amber-300">
                                الميزان: {v.comp.score}/6 ({v.comp.statusLabel})
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Active Generated Report View (with Folding / Collapsing capability) */}
          {analysis && !loading && (
            <div className="bg-[#fdfcf9] border-2 border-emerald-400 relative animate-fade-in shadow-md overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-emerald-800" />
              
              {/* Report Header: Clickable for Fold / Expand */}
              <div 
                className="p-4 md:p-5 flex items-center justify-between border-b border-emerald-200 flex-wrap gap-2 cursor-pointer bg-emerald-50/70 hover:bg-emerald-50 transition-colors"
                onClick={() => setIsReportCollapsed(!isReportCollapsed)}
                title={isReportCollapsed ? 'انقر لبسط التقرير وعرضه كاملاً' : 'انقر لطي التقرير وتخفيف الشاشة'}
              >
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsReportCollapsed(!isReportCollapsed);
                    }}
                    className="p-1 rounded bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
                    aria-label={isReportCollapsed ? 'بسط التقرير' : 'طي التقرير'}
                  >
                    {isReportCollapsed ? <ChevronDown className="w-4 h-4 text-emerald-800" /> : <ChevronUp className="w-4 h-4 text-emerald-800" />}
                  </button>
                  <div>
                    <span className="text-sm font-black text-emerald-950 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                      مخرجات التقرير الأكاديمي الشامل للمفسر الذكي (جاهز للحفظ والتصدير):
                    </span>
                    {isReportCollapsed && (
                      <span className="text-[11px] text-emerald-800 font-bold block mt-0.5">
                        ⚡ التقرير مطوي حالياً لتسريع التصفح وتخفيف الحمل على الشاشة - انقر هنا أو على زر البسط للمعاينة الكاملة
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Collapsing toggle button */}
                  <button
                    type="button"
                    onClick={() => setIsReportCollapsed(!isReportCollapsed)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-400 cursor-pointer shadow-xs"
                  >
                    {isReportCollapsed ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
                        <span>بسط التقرير 📖</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 text-amber-700" />
                        <span>طي التقرير 📁</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportWord}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-700" />
                    <span>تصدير وورد (Word .doc) 📝</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>تصدير إكسيل (Excel) 📥</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await copyToClipboard(analysis);
                      showToast('تم نسخ التقرير الشامل بالكامل للحافظة!');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                    <span>نسخ التقرير 📋</span>
                  </button>
                </div>
              </div>

              {/* Report Body: conditionally shown when not collapsed */}
              {!isReportCollapsed && (
                <div className="p-5 space-y-4">
                  <div className="quran-font pr-2 leading-relaxed space-y-2 text-slate-800 max-h-[600px] overflow-y-auto p-4 bg-white border border-slate-200 shadow-inner">
                    {renderFormattedText(analysis)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Session History & Archive */}
        {history.length > 0 && (
          <div className="bg-white border-2 border-slate-200 p-6 md:p-8 space-y-4 relative shadow-sm">
            <div className="absolute top-0 right-0 left-0 h-1 bg-slate-500" />
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 text-right">
                <History className="w-5 h-5 text-slate-700" />
                <div>
                  <h3 className="text-base font-black text-slate-900 font-sans">
                    📚 أرشيف وسجل تقارير مفسر البنيان الذكي السابقة
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    التقارير المولدة خلال الجلسة الحالية مرتبة من الأحدث إلى الأقدم
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmClearHistory(true)}
                className="px-3 py-1.5 text-[11px] font-black text-rose-800 bg-rose-50 border border-rose-200 hover:bg-rose-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                <span>تفريغ الأرشيف</span>
              </button>
            </div>

            <div className="space-y-3">
              {history.map((item) => {
                const isExpanded = expandedHistoryId === item.id;
                
                return (
                  <div key={item.id} className="border border-slate-200 overflow-hidden">
                    <div 
                      onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                      className="bg-slate-50 hover:bg-slate-100 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none border-b border-slate-200"
                    >
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 text-right">
                        <span className="text-xs font-black text-white bg-slate-900 px-2 py-0.5">
                          سورة {item.surahName}
                        </span>
                        <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 border border-amber-200">
                          الفواتح: {item.surahLetters}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">
                          • {item.versesCount} آية
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          • {item.timestamp}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportToWord(
                              item.analysisText,
                              item.surahName,
                              item.surahLetters,
                              item.digitalRoot,
                              item.keyValue,
                              item.versesCount,
                              item.timestamp
                            );
                          }}
                          className="px-2 py-0.5 text-[10px] font-black text-blue-900 bg-blue-50 border border-blue-200 cursor-pointer"
                        >
                          وورد 📝
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-white space-y-4 border-t border-slate-100">
                        <div className="quran-font text-xs text-slate-800 leading-relaxed max-h-96 overflow-y-auto p-2 bg-slate-50 border border-slate-200">
                          {renderFormattedText(item.analysisText)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Confirm Clear History Modal */}
        {confirmClearHistory && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 text-right p-4">
            <div className="bg-white border-2 border-slate-950 p-6 max-w-sm w-full space-y-3 relative shadow-2xl">
              <h4 className="text-sm font-black text-slate-950">تأكيد تفريغ أرشيف التقارير</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متأكد من تفريغ كافة التقارير السابقة المخزنة في الجلسة الحالية؟
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearHistory(false)}
                  className="px-3 py-1 text-xs font-bold border border-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHistory([]);
                    setConfirmClearHistory(false);
                    showToast('تم تفريغ أرشيف التقارير بنجاح!');
                  }}
                  className="px-3 py-1 text-xs font-bold bg-rose-700 text-white"
                >
                  تأكيد الحذف 🧹
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
