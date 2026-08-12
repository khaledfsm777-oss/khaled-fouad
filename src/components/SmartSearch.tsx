import React, { useState, useMemo, useEffect } from 'react';
import { Verse } from '../types';
import { 
  reduceDigitalRoot, 
  NooraniSurah, 
  normalizeArabicForSearch,
  cleanForCalculations,
  analyzeWord,
  stripBismillah,
  removeTashkeel,
  NOORANI_SURAHS,
  ALL_SURAHS,
  formatSurahNameClean,
  getCompatibilityDetails,
  isTripleMatchElite,
  getNooraniRank
} from '../utils/jummal';
import { 
  Search, 
  Info, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Loader2, 
  Copy, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  Sliders, 
  BookOpen, 
  Eye, 
  EyeOff, 
  Clock, 
  HelpCircle,
  Brain,
  Fingerprint
} from 'lucide-react';
import quranData from '../utils/quranData';
import { SURAH_METADATA, getSurahMetadata } from '../utils/surahMetadata';
import QuranFontSizeControl from './QuranFontSizeControl';

interface SmartSearchProps {
  verses: Verse[];
  activeSurah: NooraniSurah | null;
}

// Filter helpers for Essence Verses and Connected Nuranic Roots
export function isEssenceVerse(text: string): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase();
  const essenceKeywords = ['كتاب', 'القرآن', 'قرآن', 'آيات', 'آية', 'تنزيل', 'الذكر', 'ذكر'];
  return essenceKeywords.some(keyword => normalized.includes(keyword));
}

export function isConnectedNuranicRootVerse(text: string, activeSurah: NooraniSurah | null): boolean {
  if (!text || !activeSurah) return false;
  const letters = activeSurah.letters.split('');
  const words = text.split(/\s+/);
  return words.some(w => {
    return letters.every(l => w.includes(l));
  });
}

// Custom dynamic interpretation text based on Surah properties
export function getDynamicInterpretation(s: NooraniSurah) {
  return `تتجلى في سورة ${s.name} علاقة بنيانية استثنائية تتمحور حول شفرة الحروف المقطعة «${s.letters}» والتي تبلغ قيمتها الحسابية الكلية (${s.keyValue}) وتختزل هندسياً إلى الأس الرقمي (${s.digitalRoot}). يعمل هذا المعامل كنغمة بنيانية موحدة تضبط الكثافة اللفظية وترتب الأقسام والوقوف التاريخية بما يدعم رسالة السورة وموضوعاتها العقائدية الكبرى من إثبات التوحيد، وبيان معجزات الأنبياء، وسير الصالحين.`;
}

const NOORANI_SURAHS_IDS = new Set(NOORANI_SURAHS.map(s => s.id));

export default function SmartSearch({ verses, activeSurah }: SmartSearchProps) {
  const [searchScope, setSearchScope] = useState<'active_surah' | 'noorani_29' | 'quran'>(activeSurah ? 'active_surah' : 'quran');
  const [query, setQuery] = useState('');
  const [selectedDigitalRoot, setSelectedDigitalRoot] = useState<number | null>(null);
  const [compactOnlyFilter, setCompactOnlyFilter] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedSearchVerseId, setCopiedSearchVerseId] = useState<number | null>(null);
  const [isAllSearchCopied, setIsAllSearchCopied] = useState(false);

  // Advanced Search Processor States
  const [numericalTarget, setNumericalTarget] = useState<'jummal' | 'words' | 'letters' | 'verseNumber' | 'sum'>('jummal');
  const [isKeyboardHelperVisible, setIsKeyboardHelperVisible] = useState(false);
  const [hideEssenceAndRoots, setHideEssenceAndRoots] = useState(true);

  // Analysis & Progressive Report Generation States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisDuration, setAnalysisDuration] = useState(0);
  const [showFullReport, setShowFullReport] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Entire Quran verses cache
  const [quranVerses, setQuranVerses] = useState<any[]>([]);
  const [loadingQuran, setLoadingQuran] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Auto-fetch full Quran simple text when quran or 29_noorani scope is active and cache is empty
  useEffect(() => {
    if ((searchScope === 'quran' || searchScope === 'noorani_29') && quranVerses.length === 0 && !loadingQuran) {
      handleLoadFullQuran();
    }
  }, [searchScope, quranVerses.length]);

  // Handle Loading Quran data locally from JSON file
  const handleLoadFullQuran = async () => {
    setLoadingQuran(true);
    setLoadError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const parsed: any[] = [];
      quranData.forEach((a: any) => {
        const cleanCalculated = cleanForCalculations(a.text);
        const rawWords = a.text.split(/\s+/).filter((w: string) => w.length > 0);
        const wordsAnalysis = rawWords.map((w: string) => analyzeWord(w));
        const jummalValue = wordsAnalysis.reduce((sum, w) => sum + w.jummalValue, 0);
        const letterCount = wordsAnalysis.reduce((sum, w) => sum + w.letterCount, 0);
        const wordCount = wordsAnalysis.filter(w => w.cleanWord.length > 0).length || rawWords.length;

        parsed.push({
          id: a.id,
          surahId: a.surahId,
          surahName: formatSurahNameClean(a.surahName),
          verseNumber: a.verseNumber,
          text: removeTashkeel(a.text),
          rawText: a.text,
          cleanTextForCalculation: cleanCalculated,
          jummalValue,
          wordCount,
          letterCount,
          words: wordsAnalysis
        });
      });
      setQuranVerses(parsed);
    } catch (err) {
      console.error('Failed to load entire Quran simple text:', err);
      setLoadError('فشل تحميل نص القرآن الكريم المخزن محلياً.');
    } finally {
      setLoadingQuran(false);
    }
  };

  // Clean and parse query
  const parsedQuery = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) return { isNumerical: false, operator: 'none', value: null, targetField: numericalTarget, text: '' };

    // Check for operator like >=, <=, >, <, =
    const operatorMatch = normalized.match(/(>=|<=|=>|=<|>|<|=)\s*(\d+)/);
    if (operatorMatch) {
      const opStr = operatorMatch[1];
      const valStr = operatorMatch[2];
      const numericValue = parseInt(valStr, 10);
      let op: 'none' | 'equal' | 'greater' | 'less' | 'greater_equal' | 'less_equal' = 'none';

      if (opStr === '=' || opStr === '==') op = 'equal';
      else if (opStr === '>') op = 'greater';
      else if (opStr === '<') op = 'less';
      else if (opStr === '>=' || opStr === '=>') op = 'greater_equal';
      else if (opStr === '<=' || opStr === '=<') op = 'less_equal';

      // Detect keyword for target field in the query
      let field = numericalTarget;
      if (/جمل|الجمل/.test(normalized)) field = 'jummal';
      else if (/كلم|الكلم|كلمات|الكلمات/.test(normalized)) field = 'words';
      else if (/حرف|الحرف|حروف|الحروف/.test(normalized)) field = 'letters';
      else if (/آية|الآية|آيه|الآيه/.test(normalized)) field = 'verseNumber';
      else if (/مجموع|المجموع/.test(normalized)) field = 'sum';

      // Clean the numerical operator from the text search portion
      let cleanedText = normalized.replace(operatorMatch[0], '').trim();
      cleanedText = cleanedText.replace(/جمل|الجمل|كلم|الكلم|كلمات|الكلمات|حرف|الحرف|حروف|الحروف|آية|الآية|آيه|الآيه|مجموع|المجموع/g, '').trim();

      return {
        isNumerical: true,
        operator: op,
        value: numericValue,
        targetField: field,
        text: cleanedText
      };
    }

    // Check for a simple raw number
    const simpleNumMatch = normalized.match(/^\s*(\d+)\s*$/);
    if (simpleNumMatch) {
      return {
        isNumerical: true,
        operator: 'equal',
        value: parseInt(simpleNumMatch[1], 10),
        targetField: numericalTarget,
        text: ''
      };
    }

    // Check for specific Surah name and Verse Number (e.g. "البقرة 255")
    const surahVerseMatch = normalized.match(/^([^\d\s]+)\s+(\d+)$/);
    if (surahVerseMatch) {
      const nameCand = surahVerseMatch[1].trim();
      const numCand = parseInt(surahVerseMatch[2], 10);
      return {
        isNumerical: false,
        isSpecificSurahVerse: true,
        surahCandidate: nameCand,
        verseNumberCandidate: numCand,
        text: ''
      };
    }

    return {
      isNumerical: false,
      operator: 'none',
      value: null,
      targetField: numericalTarget,
      text: normalized
    };
  }, [query, numericalTarget]);

  // Helper to determine Surah context for any verse
  const getSurahContextForVerse = (v: any) => {
    const sId = (v && typeof v.surahId === 'number' && !isNaN(v.surahId))
      ? v.surahId
      : (activeSurah ? activeSurah.id : 1);

    if (activeSurah && (v.surahId === activeSurah.id || !v.surahId)) {
      return activeSurah;
    }
    const nooraniMatch = NOORANI_SURAHS.find(s => s.id === sId);
    if (nooraniMatch) {
      return nooraniMatch;
    }
    const surahItem = ALL_SURAHS.find(s => s.id === sId);
    return {
      id: sId,
      name: surahItem?.name || v?.surahName || `سورة ${sId}`,
      letters: '',
      keyValue: 0,
      digitalRoot: reduceDigitalRoot(sId)
    };
  };

  // Main matching engine
  const searchResultsState = useMemo(() => {
    let targetList: any[] = [];
    if (searchScope === 'active_surah') {
      targetList = verses;
    } else if (searchScope === 'noorani_29') {
      targetList = quranVerses.filter(v => NOORANI_SURAHS_IDS.has(v.surahId));
    } else {
      targetList = quranVerses;
    }

    if (!targetList || targetList.length === 0) {
      return { matchedVerses: [], totalRepetitions: 0, totalVersesFound: 0, uniqueSurahsCount: 0 };
    }

    // If neither query nor selected digital root nor compact filter is active, don't display list unless scope is selected explicitly
    if (!query.trim() && selectedDigitalRoot === null && !compactOnlyFilter && !hasSearched) {
      return { matchedVerses: [], totalRepetitions: 0, totalVersesFound: 0, uniqueSurahsCount: 0 };
    }

    const { isNumerical, operator, value, targetField, text, isSpecificSurahVerse, surahCandidate, verseNumberCandidate } = parsedQuery;
    const normalizedQ = text ? normalizeArabicForSearch(text) : '';

    const matched = targetList.filter(v => {
      if (!v) return false;

      const verseNum = typeof v.verseNumber === 'number' && !isNaN(v.verseNumber)
        ? v.verseNumber
        : (parseInt(v.verseNumber, 10) || 1);

      // Rule 4: Skipped first verse (Letters) in Noorani Surah study
      if (searchScope === 'active_surah' && activeSurah && verseNum === 1) {
        return false;
      }

      const surahObj = getSurahContextForVerse(v);
      const comp = getCompatibilityDetails(v, surahObj);

      // Single-Digit Fingerprint Filter (1..9) based on new column equation
      if (selectedDigitalRoot !== null) {
        if (!comp || comp.finalSingleDigit !== selectedDigitalRoot) return false;
      }

      // Filter for Integrated Matches only
      if (compactOnlyFilter) {
        if (!comp || !comp.compactStatus || comp.compactStatus === 'غير محققة') return false;
      }

      // Check specific Surah & Verse query (e.g., "البقرة 255")
      if (isSpecificSurahVerse && surahCandidate && verseNumberCandidate) {
        const cleanSurahName = formatSurahNameClean(v.surahName || surahObj?.name || '');
        const surahMatch = cleanSurahName.includes(surahCandidate) || (v.surahName && v.surahName.includes(surahCandidate));
        const verseMatch = verseNum === verseNumberCandidate;
        return surahMatch && verseMatch;
      }

      // 1. Text Search matching
      if (normalizedQ) {
        const textNormal = normalizeArabicForSearch(v.text || '');
        const rawTextNormal = normalizeArabicForSearch(v.rawText || '');
        const textClean = normalizeArabicForSearch(v.cleanTextForCalculation || '');
        const hasText = textNormal.includes(normalizedQ) || rawTextNormal.includes(normalizedQ) || textClean.includes(normalizedQ);
        if (!hasText) return false;
      }

      // 2. Numerical evaluation
      if (isNumerical && operator !== 'none' && value !== null) {
        let fieldVal = 0;
        const jVal = comp?.jummal || v.jummalValue || 0;
        const wVal = comp?.wordCount || v.wordCount || 0;
        const lVal = comp?.letterCount || v.letterCount || 0;

        if (targetField === 'jummal') fieldVal = jVal;
        else if (targetField === 'words') fieldVal = wVal;
        else if (targetField === 'letters') fieldVal = lVal;
        else if (targetField === 'verseNumber') fieldVal = verseNum;
        else if (targetField === 'sum') fieldVal = wVal + lVal;

        if (operator === 'equal' && fieldVal !== value) return false;
        if (operator === 'greater' && fieldVal <= value) return false;
        if (operator === 'less' && fieldVal >= value) return false;
        if (operator === 'greater_equal' && fieldVal < value) return false;
        if (operator === 'less_equal' && fieldVal > value) return false;
      }

      return true;
    });

    let repetitions = 0;
    const uniqueSurahSet = new Set<string>();

    matched.forEach(v => {
      const sName = formatSurahNameClean(v.surahName || (activeSurah ? activeSurah.name : ''));
      if (sName) uniqueSurahSet.add(sName);

      if (normalizedQ) {
        const textNormal = normalizeArabicForSearch(v.text);
        let count = 0;
        let pos = textNormal.indexOf(normalizedQ);
        while (pos !== -1) {
          count++;
          pos = textNormal.indexOf(normalizedQ, pos + normalizedQ.length || 1);
        }
        repetitions += count || 1;
      } else {
        repetitions += 1;
      }
    });

    return {
      matchedVerses: matched,
      totalRepetitions: repetitions,
      totalVersesFound: matched.length,
      uniqueSurahsCount: uniqueSurahSet.size
    };
  }, [verses, quranVerses, searchScope, query, selectedDigitalRoot, compactOnlyFilter, hasSearched, parsedQuery, activeSurah]);

  const { matchedVerses, totalRepetitions, totalVersesFound, uniqueSurahsCount } = searchResultsState;

  // Split results into viewable list versus hidden/report-only based on Part 4 rules
  const sortedAndFilteredVerses = useMemo(() => {
    return matchedVerses.map(v => {
      const isEssence = isEssenceVerse(v.rawText || v.text);
      const isConnectedRoot = isConnectedNuranicRootVerse(v.rawText || v.text, activeSurah);
      const surahObj = getSurahContextForVerse(v);
      const compatibility = getCompatibilityDetails(v, surahObj);
      const surahMeta = getSurahMetadata(v.surahId);
      const tripleRes = isTripleMatchElite(v, surahObj, surahMeta);
      return {
        ...v,
        isEssence,
        isConnectedRoot,
        surahObj,
        compatibility,
        tripleRes
      };
    });
  }, [matchedVerses, activeSurah]);

  // Hidden verses count
  const hiddenVersesCount = useMemo(() => {
    return sortedAndFilteredVerses.filter(v => v.isEssence || v.isConnectedRoot).length;
  }, [sortedAndFilteredVerses]);

  // Clear query and reset
  const handleClear = () => {
    setQuery('');
    setHasSearched(false);
    setShowFullReport(false);
    setProgress(0);
  };

  // Change scope and load Quran if needed
  const handleScopeChange = (scope: 'active_surah' | 'noorani_29' | 'quran') => {
    setSearchScope(scope);
    setShowFullReport(false);
    setProgress(0);
    if ((scope === 'quran' || scope === 'noorani_29') && quranVerses.length === 0) {
      handleLoadFullQuran();
    }
  };

  // Unified Start Analysis and Export Report Button with real timer and percentage loader
  const handleStartAnalysis = () => {
    if (matchedVerses.length === 0) {
      showToast('يرجى تحديد شروط بحث صحيحة للحصول على نتائج لوزنها.');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisDuration(0);
    setShowFullReport(false);

    // Dynamic progress bar updates
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsAnalyzing(false);
            setShowFullReport(true);
            showToast('اكتمل وزن وتحليل مصفوفة البنيان بنجاح تام!');
          }, 300);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
      setAnalysisDuration(d => d + 0.1);
    }, 150);
  };

  // Export to Excel-compatible CSV
  const handleExportExcel = () => {
    if (matchedVerses.length === 0) return;

    const BOM = '\uFEFF';
    let csvContent = '';

    const headers = [
      'م',
      'رقم الآية',
      'الآية الكريمة',
      'حساب الجمل الكلي',
      'البنيان الهيكلي',
      'الكثافة اللفظية',
      'الاختزال الرقمي',
      'الكلمات',
      'الحروف',
      'التحقيق في التقرير'
    ];

    const rows = sortedAndFilteredVerses.map((v, idx) => {
      const compLabel = v.compatibility ? v.compatibility.statusLabel : 'N/A';
      const structuralVal = v.compatibility ? v.compatibility.structuralVal : v.jummalValue;
      const densityVal = v.compatibility ? v.compatibility.densityVal : (v.wordCount + v.letterCount);
      return [
        idx + 1,
        v.verseNumber,
        `"( ${v.rawText || v.text} )"`,
        v.jummalValue,
        structuralVal,
        densityVal,
        reduceDigitalRoot(v.jummalValue),
        v.wordCount,
        v.letterCount,
        compLabel
      ];
    });

    csvContent = BOM + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const surahName = activeSurah ? activeSurah.name.split(' ')[0] : 'القرآن';
    link.setAttribute('download', `تقرير_البنيان_الموحد_${surahName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Word Document
  const handleExportWord = () => {
    if (matchedVerses.length === 0) return;
    const BOM = '\uFEFF';
    
    let html = `<html dir="rtl" xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"><title>التقرير الموحد للبنيان</title>`;
    html += `<style>
      body { font-family: 'Arial', sans-serif; direction: rtl; padding: 20px; }
      h2, h3 { text-align: center; color: #0f172a; border-bottom: 2px solid #b45309; padding-bottom: 8px; }
      p { margin-bottom: 12px; font-size: 14px; text-align: right; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; direction: rtl; }
      th, td { border: 1px solid #475569; padding: 8px; text-align: center; font-size: 11px; }
      th { background-color: #0f172a; color: #ffffff; font-weight: bold; }
    </style></head><body>`;
    
    html += `<h2>بِرْنَامَج البُنْيَان لِلْقُرْآنِ الكَرِيمِ - التقرير الموحد للتحليل البياني</h2>`;
    if (activeSurah) {
      html += `<h3>سورة ${activeSurah.name} (الموضع: ${activeSurah.id} | المعامل: ${activeSurah.keyValue} | الأس: ${activeSurah.digitalRoot})</h3>`;
      html += `<p><strong>الهوية التعريفية الثلاثية للسورة:</strong><br>`;
      html += `• الموضع الترتيبي: ${activeSurah.id}<br>`;
      html += `• مفتاح الشفرة النورانية: ${activeSurah.letters}<br>`;
      html += `• الهوية الرقمية الكلية لجمع الحروف: ${activeSurah.keyValue}</p>`;
      
      html += `<p><strong>تفسير المعامل الرقمي والتحليل الإعجازي:</strong><br>${getDynamicInterpretation(activeSurah)}</p>`;
    }

    html += `<table>`;
    html += `<thead><tr>`;
    html += `<th>م</th><th>رقم الآية</th><th>الآية الكريمة</th><th>حساب الجمل</th><th>الهيكل البنياني</th><th>الكثافة اللفظية</th><th>التحقق</th>`;
    html += `</tr></thead><tbody>`;
    
    sortedAndFilteredVerses.forEach((v, idx) => {
      const compLabel = v.compatibility ? v.compatibility.statusLabel : 'N/A';
      const structuralVal = v.compatibility ? v.compatibility.structuralVal : v.jummalValue;
      const densityVal = v.compatibility ? v.compatibility.densityVal : (v.wordCount + v.letterCount);
      html += `<tr>`;
      html += `<td>${idx + 1}</td>`;
      html += `<td>${v.verseNumber}</td>`;
      html += `<td style="text-align: right; font-weight: bold;">( ${v.rawText || v.text} )</td>`;
      html += `<td>${v.jummalValue}</td>`;
      html += `<td>${structuralVal}</td>`;
      html += `<td>${densityVal}</td>`;
      html += `<td>${compLabel}</td>`;
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    html += `</body></html>`;

    const blob = new Blob([BOM + html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const surahName = activeSurah ? activeSurah.name.split(' ')[0] : 'القرآن';
    link.setAttribute('download', `التقرير_الموحد_للبنيان_${surahName}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard adjust helper functions to append symbols easily
  const appendSymbol = (symbol: string) => {
    // If query already has some operator, replace it, otherwise append
    const cleaned = query.replace(/(>=|<=|=>|=<|>|<|=)/g, '').trim();
    setQuery(`${symbol} ${cleaned}`);
    setHasSearched(true);
  };

  const handlePresetClick = (presetText: string) => {
    setQuery(presetText);
    setHasSearched(true);
  };

  // List of active/inactive quotes during progress simulation
  const loadingQuotes = [
    "يجري حالياً تفكيك بنية الآيات هندسياً...",
    "حساب الكثافة اللفظية وربط موضع الوقف...",
    "استخلاص المعطيات ومقارنة النتائج مقابل مصفوفة الأس النوراني...",
    "توصيل الموازين 6 بقيم التطابق التراكمي الشامل...",
    "يصيغ المعالج البياني التقرير الموحد الخالي من الوميض..."
  ];

  const currentQuote = loadingQuotes[Math.floor((progress / 100) * loadingQuotes.length)] || loadingQuotes[0];

  return (
    <div className="space-y-6 text-right animate-fade-in relative" dir="rtl">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white border border-slate-700 px-4 py-2 text-xs font-black z-50 shadow-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Scope Toggles */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white border-2 border-slate-200 p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-900" />
            <span>البحث المتقدم والمعالج المرن للبنيان ⚡</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            البحث اللفظي والرقمي الموحد وتصفية البصمة الأحادية والنسب النورانية
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <QuranFontSizeControl compact={true} />
          
          <div className="flex flex-wrap bg-slate-100 p-1 border border-slate-200 rounded-lg">
            <button
              onClick={() => handleScopeChange('active_surah')}
              className={`px-3 py-2 text-xs font-black transition-all cursor-pointer rounded-md ${
                searchScope === 'active_surah'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              السورة النشطة الحالية 📖
            </button>
            <button
              onClick={() => handleScopeChange('noorani_29')}
              className={`px-3 py-2 text-xs font-black transition-all cursor-pointer rounded-md ${
                searchScope === 'noorani_29'
                  ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-400'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              السور النورانية الـ 29 ✨
            </button>
            <button
              onClick={() => handleScopeChange('quran')}
              className={`px-3 py-2 text-xs font-black transition-all cursor-pointer rounded-md ${
                searchScope === 'quran'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              القرآن الكريم كاملاً 📖
            </button>
          </div>
        </div>
      </div>

      {/* Error / Loading fallbacks */}
      {searchScope === 'active_surah' && !activeSurah && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 text-center space-y-3 rounded-lg">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" strokeWidth={1.5} />
          <h3 className="text-sm font-black text-slate-800">يرجى اختيار سورة نشطة للبدء بالبحث المتخصص</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            توجّه للشاشة الرئيسية لتبديل السورة أو فعّل خيار البحث في "السور النورانية الـ 29" أو "القرآن الكريم كاملاً" بالأعلى لتصفية الآيات مباشرة.
          </p>
        </div>
      )}

      {(searchScope === 'quran' || searchScope === 'noorani_29') && loadingQuran && (
        <div className="bg-slate-50 border border-slate-200 p-8 text-center space-y-4 animate-pulse rounded-lg">
          <Loader2 className="w-10 h-10 text-slate-950 mx-auto animate-spin" />
          <h4 className="text-xs font-black text-slate-800">جاري تعبئة وتفكيك حروف القرآن الكريم (6236 آية)...</h4>
        </div>
      )}

      {/* Main Single Box Search Engine */}
      {((searchScope === 'active_surah' && activeSurah) || ((searchScope === 'quran' || searchScope === 'noorani_29') && quranVerses.length > 0 && !loadingQuran)) && (
        <div className="bg-white border-2 border-slate-200 p-6 space-y-6 rounded-lg">
          
          {/* Digital Root Filter Bar (البصمة الأحادية من 1 إلى 9) */}
          <div className="bg-slate-50 border border-slate-200 p-4 space-y-3 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-amber-600" />
                <span>فلتر البصمة الأحادية للآيات (من 1 إلى 9):</span>
              </span>
              {selectedDigitalRoot !== null && (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  البصمة الأحادية النشطة: ({selectedDigitalRoot})
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedDigitalRoot(null);
                  setHasSearched(true);
                }}
                className={`px-3.5 py-2 text-xs font-black rounded-lg transition-all cursor-pointer border ${
                  selectedDigitalRoot === null
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                الكل (جميع البصمات)
              </button>

              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => {
                    setSelectedDigitalRoot(digit);
                    setHasSearched(true);
                  }}
                  className={`min-w-[42px] min-h-[42px] text-sm font-black rounded-lg transition-all cursor-pointer flex items-center justify-center border-2 ${
                    selectedDigitalRoot === digit
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-300 scale-105'
                      : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setCompactOnlyFilter(prev => !prev);
                  setHasSearched(true);
                }}
                className={`mr-auto px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
                  compactOnlyFilter
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-300'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>عرض التوافقات المدمجة فقط ✨</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-900 block">
              🔍 اكتب نصاً، رقماً، أو دمجاً بنيانياً في صندوق البحث الموحد:
            </label>
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onFocus={() => setIsKeyboardHelperVisible(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHasSearched(true);
                  setShowFullReport(false);
                  setProgress(0);
                }}
                placeholder="ابحث بالنص (مثال: كتب عليكم)، برقم الآية والاسم (البقرة 255) أو بالأرقام (مثال: >= 313)..."
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-slate-900 rounded-lg px-4 py-3.5 text-base sm:text-xs text-slate-950 outline-none transition-all font-bold pl-10 pr-4 text-right"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Floating Keyboard Adjust View */}
          {isKeyboardHelperVisible && (
            <div className="bg-slate-50 border border-slate-200 p-4 space-y-3 relative animate-fade-in rounded-lg">
              <div className="absolute top-2 left-2">
                <button 
                  onClick={() => setIsKeyboardHelperVisible(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-800 font-bold"
                >
                  إغلاق اللوحة ✕
                </button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-slate-600" />
                  <span>لوحة تعديل نطاقات الأرقام والرموز (Keyboard Adjust View):</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">المعيار المستهدف للاختبار:</span>
                  {(['jummal', 'words', 'letters', 'verseNumber', 'sum'] as const).map(target => {
                    const label = target === 'jummal' ? 'حساب الجمل' : target === 'words' ? 'الكلمات' : target === 'letters' ? 'الحروف' : target === 'verseNumber' ? 'رقم الآية' : 'المجموع الكلي';
                    return (
                      <button
                        key={target}
                        onClick={() => {
                          setNumericalTarget(target);
                          setHasSearched(true);
                        }}
                        className={`px-2 py-1 text-[10px] font-black transition-all rounded ${
                          numericalTarget === target 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operators and presets rows - ENLARGED MATH SYMBOLS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <span className="block text-[11px] text-slate-700 font-black">رموز المقارنة الرياضية السريعة (واضحة وكبيرة):</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['=', '>', '<', '>=', '<='].map(sym => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => appendSymbol(sym)}
                        className="min-w-[48px] min-h-[48px] text-base font-black px-4 py-2 bg-white text-slate-900 hover:bg-slate-900 hover:text-white border-2 border-slate-300 rounded-lg shadow-sm transition-all font-mono cursor-pointer flex items-center justify-center"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-[11px] text-slate-700 font-black">اختصارات ومؤشرات رقمية جاهزة:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeSurah ? (
                      <>
                        <button
                          onClick={() => handlePresetClick(`= ${activeSurah.keyValue}`)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-md"
                        >
                          المعامل {activeSurah.keyValue}
                        </button>
                        <button
                          onClick={() => handlePresetClick(`= ${activeSurah.digitalRoot}`)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-md"
                        >
                          الأس {activeSurah.digitalRoot}
                        </button>
                      </>
                    ) : null}
                    <button
                      onClick={() => handlePresetClick('>= 313')}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-md"
                    >
                      بنيان الرسل (313)
                    </button>
                    <button
                      onClick={() => handlePresetClick('<= 19')}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-md"
                    >
                      أحرف قصيرة (19)
                    </button>
                    <button
                      onClick={() => handlePresetClick('>= 500')}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-md"
                    >
                      آيات طويلة (&ge;500 جمل)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Indicators */}
          {hasSearched && (query.trim() || selectedDigitalRoot !== null) && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f8fafc] border border-slate-200 p-3 text-xs font-bold text-slate-800 rounded-lg">
              <div className="flex flex-wrap items-center gap-2">
                <span>🛡️ مرشح البحث الموحد:</span>
                {query.trim() && (
                  <span className="bg-slate-900 text-white px-2.5 py-0.5 font-mono text-xs rounded">
                    {query}
                  </span>
                )}
                {selectedDigitalRoot !== null && (
                  <span className="bg-amber-500 text-slate-950 border border-amber-400 font-black px-2.5 py-0.5 text-xs rounded">
                    البصمة الأحادية: {selectedDigitalRoot}
                  </span>
                )}
                {parsedQuery.isNumerical && (
                  <span className="bg-teal-50 text-teal-800 border border-teal-100 px-2 py-0.5 text-[10px] rounded">
                    نوع الاختبار: {numericalTarget === 'jummal' ? 'حساب الجمل' : numericalTarget === 'words' ? 'الكلمات' : 'الحروف'}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  handleClear();
                  setSelectedDigitalRoot(null);
                }}
                className="text-[10px] text-rose-700 hover:text-rose-900 font-extrabold cursor-pointer"
              >
                تفريغ المدخلات ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Action Bar & Stats Summary Counter */}
      {hasSearched && matchedVerses.length > 0 && !isAnalyzing && (
        <div className="bg-white border-2 border-slate-200 p-6 text-center space-y-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-800">
            <span className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg">
              إجمالي الآيات المطابقة: <strong className="text-slate-900 font-black text-sm">{totalVersesFound} آية</strong>
            </span>
            <span className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-950 rounded-lg">
              عدد السور الناتجة: <strong className="text-amber-700 font-black text-sm">{uniqueSurahsCount} سورة</strong>
            </span>
            {selectedDigitalRoot !== null && (
              <span className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-lg border border-amber-400">
                البصمة الأحادية: ({selectedDigitalRoot})
              </span>
            )}
          </div>
          <button
            onClick={handleStartAnalysis}
            className="w-full sm:w-auto px-8 py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-wide cursor-pointer transition-all flex items-center justify-center gap-2 mx-auto shadow-md rounded-lg"
          >
            <Brain className="w-5 h-5 text-amber-300 animate-pulse" />
            <span>بدء عملية التحليل وتصدير التقرير الموحد ⚡</span>
          </button>
        </div>
      )}

      {/* Dynamic Progress Loader - Prevents flashing/flashing */}
      {isAnalyzing && (
        <div className="bg-slate-900 border-2 border-slate-800 text-white p-8 text-center space-y-6 animate-fade-in">
          <Loader2 className="w-12 h-12 text-amber-400 mx-auto animate-spin" />
          <div className="space-y-2">
            <h4 className="text-sm font-black text-white">جاري حساب مصفوفة البنيان الشاملة...</h4>
            <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
              {currentQuote}
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto bg-slate-800 h-2.5 rounded-none overflow-hidden relative border border-slate-700">
            <div 
              className="bg-amber-400 h-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 block">
            {progress}% (الزمن المنقضي: {analysisDuration.toFixed(1)} ث)
          </span>
        </div>
      )}

      {/* Stunning Interactive Report - Shown live on typing or after complete analysis */}
      {((hasSearched && query.trim() !== '') || showFullReport) && !isAnalyzing && matchedVerses.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header metadata cards */}
          {activeSurah && (
            <div className="bg-white border-2 border-slate-200 p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-black text-[10px] uppercase">
                  الهوية التعريفية الثلاثية للسورة (Triple Definitional Identity)
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  سورة {activeSurah.name}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-3 text-center">
                  <span className="block text-[10px] text-slate-400">موضع الترتيب بالمصحف</span>
                  <span className="text-sm font-black text-slate-900 font-sans mt-0.5 block">{activeSurah.id}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 text-center">
                  <span className="block text-[10px] text-slate-400">مفتاح الشفرة النورانية</span>
                  <span className="text-sm font-black text-slate-900 quran-font mt-0.5 block">{activeSurah.letters}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 text-center">
                  <span className="block text-[10px] text-slate-400">الهوية الرقمية للمعامل النوراني</span>
                  <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">{activeSurah.keyValue}</span>
                </div>
              </div>

              {/* Dynamic Interpretive Text */}
              <div className="bg-amber-50/50 border border-amber-200 p-4 space-y-2">
                <h5 className="text-xs font-black text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>التحليل التأويلي الذكي للمعاملات الرقمية (Dynamic Insight):</span>
                </h5>
                <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                  {getDynamicInterpretation(activeSurah)}
                </p>
              </div>
            </div>
          )}

          {/* Table Explanation Legend (دليل الألوان والتحقق البنيوي المتقدم خارج الجدول) */}
          <div className="bg-white border-2 border-slate-200 p-6 space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>دليل تفسير الألوان والموازين البنيانية للتوافق (Color Code Dictionary):</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                توضيح تفصيلي لمفهوم ومعنى كل لون مخصص للتوافق الهندسي والنوراني خارج جدول العرض:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Golden / Tawheed */}
              <div className="bg-amber-50/70 border border-amber-200 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-amber-400 rounded-none inline-block ring-2 ring-amber-300"></span>
                  <span className="text-xs font-black text-amber-950">اللون الذهبي البرتقالي 🌟 (مفتاح مطلق / توافق توحيدي)</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                  <strong>الدلالة البنيانية:</strong> يمنح هذا اللقب الاستثنائي المرموق للآية الكريمة في حالتين:
                  <br />
                  1. <strong>المفتاح المطلق (6/6):</strong> استيفاء الآية لكافة شروط الفحص السداسية كاملة مع الأس النوراني.
                  <br />
                  2. <strong>التوافق التوحيدي البنيوي المشترك:</strong> عند فحص الكثافة وجمع (الكلمات + الحروف + رقم الآية)، واختزال الخانات للخطوة الأولى لتبلغ الرقم <strong>11</strong>. يتوقف البرنامج فوراً هنا ليمنحها هذا الوسام الذهبي؛ إشارةً إلى بلوغ الآية الذروة التناغمية للتوحيد الإلهي.
                </p>
              </div>

              {/* Emerald Green */}
              <div className="bg-emerald-50/50 border border-emerald-200 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-none inline-block ring-1 ring-emerald-400"></span>
                  <span className="text-xs font-black text-emerald-950">اللون الأخضر الزمردي ✅ (توافق تماماً أو توافق توحيدي ذاتي للآية)</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                  <strong>الدلالة البنيانية:</strong> يشير هذا النطاق الأخضر الفخم إلى حالتين:
                  <br />
                  1. <strong>توافق توحيدي ذاتي للآية:</strong> عندما لا تكون الخطوة الأولى للاختزال 11، ولكن يستمر الاختزال الرقمي الكوني التراكمي لينتهي بالرقم <strong>1</strong> (الواحد الأحد).
                  <br />
                  2. <strong>متوافقة تماماً (3-5 شروط):</strong> تطابق الآية الكريمة مع غالبية شروط الوزن الرقمي النوراني الموزع للسورة، مما يعزز الثبات الإعجازي للآيات.
                </p>
              </div>

              {/* Sky Blue */}
              <div className="bg-blue-50/50 border border-blue-100 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-none inline-block"></span>
                  <span className="text-xs font-black text-blue-950">اللون الأزرق السماوي 🔵 (متوافقة بنيوياً - من 1 إلى 2 شروط)</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  <strong>الدلالة البنيانية:</strong> يدل على وجود روابط بنيانية وهندسية أولية (كأن يقبل حساب الجمل الكلي أو البنيان الهيكلي للآية القسمة على المعامل النوراني أو الأس الموحد للسورة). يعتبر اتصالاً بنيوياً داعماً للنظم العام للآية في فلك السورة الخاص بها.
                </p>
              </div>

              {/* Soft Rose */}
              <div className="bg-rose-50/50 border border-rose-100 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-rose-400 rounded-none inline-block"></span>
                  <span className="text-xs font-black text-rose-950">اللون الوردي الهادئ 🔴 (غير متوافقة - صفر شروط)</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  <strong>الدلالة البنيانية:</strong> يشير هذا اللون إلى عدم وجود تطابق رياضي مباشر للآية مع شروط الفحص الستة للأس النوراني للسورة الحالية. يؤكد هذا وجود بنية تعبيرية حرة ومستقلة تهدف لتكسير الرتابة الحسابية لتناسب الانتقالات العقائدية والموضوعية الحرة، مما يثبت شمولية ومرونة النص الإعجازي وعدم خضوعه لمعادلة ميكانيكية صلبة.
                </p>
              </div>
            </div>
          </div>

          {/* Action export links */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <h4 className="text-xs font-black text-slate-900 uppercase">
              📋 مخرجات التقرير الموزون والتحقق الحسابي:
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>تصدير إلى إكسل 📊</span>
              </button>
              <button
                onClick={handleExportWord}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>تصدير إلى وورد 📝</span>
              </button>
            </div>
          </div>

          {/* Section for hidden verses (Essence & Nuranic Roots) redirected to report */}
          {activeSurah && (
            <div className="bg-[#f8fafc] border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-slate-200 rounded-none text-slate-800">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">
                      حفظ صفاء العرض (آيات الجوهر والأصول النورانية):
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      تم تصنيف وحجب الآيات التي تتضمن كلمات واضحة تعود على كتاب الله أو تنتهي بجذور الحروف النورانية من العرض المباشر في الجدول السفلي لتسهيل المشاهدة.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHideEssenceAndRoots(!hideEssenceAndRoots)}
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[10px] font-black"
                >
                  {hideEssenceAndRoots ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض المحجوب</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>تفعيل الحجب</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic semantic analysis of the hidden/essence verses */}
              <div className="bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-700 leading-relaxed font-semibold">
                💡 <strong>الأثر البياني والروحي لآيات الجوهر المحجوبة:</strong> تتميز هذه المجموعة بكثافة لفظية عالية تدعم أثر التثبيت الإلهي وعقيدة عبودية الوحي والتنزيل؛ حيث تتقاطع قيمها الحسابية لترسم موازين هندسية تساند المعامل الرقمي الكلي.
              </div>
            </div>
          )}

          {/* Complete weighted results table */}
          <div className="table-container overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
            <table className="w-full text-right border-collapse text-xs min-w-[850px]">
              <thead>
                <tr className="bg-slate-950 text-white font-bold text-center border-b border-slate-300 select-none">
                  <th className="p-3 text-center number-column border-l border-slate-800">م</th>
                  {(searchScope === 'quran' || searchScope === 'noorani_29') && <th className="p-3 text-center w-24 whitespace-nowrap">السورة</th>}
                  <th className="p-3 text-center number-column">الآية</th>
                  <th className="p-3 text-right verse-column">نص الآية الكريمة</th>
                  <th className="p-3 text-center w-24">حساب الجمل</th>
                  <th className="p-3 text-center bg-slate-900 text-slate-200 w-32">معادلة العمود الجديد</th>
                  <th className="p-3 text-center bg-amber-950 text-amber-300 w-36">البصمة الأحادية والتحقق المدمج</th>
                  <th className="p-3 text-center w-36">التحقق النوراني السداسي</th>
                  <th className="p-3 text-center number-column">نسخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {sortedAndFilteredVerses
                  .filter(v => {
                    if (hideEssenceAndRoots && activeSurah) {
                      return !v.isEssence && !v.isConnectedRoot;
                    }
                    return true;
                  })
                  .map((v, idx) => {
                    const comp = v.compatibility;
                    const cleanName = formatSurahNameClean(v.surahName || (activeSurah ? activeSurah.name : ''));
                    return (
                      <tr key={v.id} className="hover:bg-amber-50/10 transition-colors text-center">
                        <td className="p-3 text-center number-column border-l border-slate-200 font-mono text-slate-400">{idx + 1}</td>
                        {(searchScope === 'quran' || searchScope === 'noorani_29') && (
                          <td className="p-3 text-center font-black text-slate-900 bg-slate-50 whitespace-nowrap">
                            {cleanName}
                          </td>
                        )}
                        <td className="p-3 text-center number-column font-sans">
                          <span className="px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px] rounded">
                            {v.verseNumber}
                          </span>
                        </td>
                        <td className="p-3 text-right verse-column verse-text quran-font text-sm text-slate-900 font-bold leading-relaxed">
                          « {v.rawText || v.text} »
                          {(v.isEssence || v.isConnectedRoot) && (
                            <span className="mr-2 inline-block bg-indigo-50 text-indigo-700 text-[9px] px-1.5 py-0.5 border border-indigo-100 rounded">
                              {v.isEssence ? 'جوهر' : 'أصل نوراني'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-slate-900">{v.jummalValue}</td>
                        
                        {/* Column Equation Result */}
                        <td className="p-3 text-center font-mono text-xs text-slate-700 dir-ltr bg-slate-50/60">
                          {comp ? (
                            <span className="inline-block px-2 py-1 bg-white border border-slate-200 rounded font-bold">
                              {comp.jummalReduced} × ({v.verseNumber} + {comp.reducedFactor}) = <strong className="text-amber-700">{comp.newColumnProduct}</strong>
                            </span>
                          ) : '-'}
                        </td>

                        {/* Single Fingerprint & Integrated Match Status */}
                        <td className="p-3 text-center space-y-1 bg-amber-50/30">
                          {comp ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-1 text-xs font-black bg-amber-500 text-slate-950 rounded-md inline-block shadow-xs ring-1 ring-amber-400">
                                  بصمة ({comp.finalSingleDigit})
                                </span>
                                {comp.compactStatus && comp.compactStatus !== 'غير محققة' ? (
                                  <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-black rounded-md shadow-2xs">
                                    {comp.compactStatus}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-400 border border-slate-200 rounded-md">
                                    غير مدمجة
                                  </span>
                                )}
                              </div>
                              {comp.compactReasons && comp.compactReasons.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-1 max-w-[200px]">
                                  {comp.compactReasons.map((r: string, rIdx: number) => (
                                    <span key={rIdx} className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded">
                                      {r}
                                    </span>
                                  ))}
                                  {comp.isNooraniRankMatch && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-cyan-100 text-cyan-900 border border-cyan-300 font-black rounded">
                                      ترتيب نوراني ({comp.nooraniRank})
                                    </span>
                                  )}
                                  {v.tripleRes?.isElite && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-200 text-amber-950 border border-amber-400 font-black rounded animate-pulse">
                                      🌟 نخبة نورانية
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-black bg-slate-900 text-amber-300 rounded-md inline-block">
                              {reduceDigitalRoot(v.jummalValue)}
                            </span>
                          )}
                        </td>

                        {/* 6-Condition Compatibility */}
                        <td className="p-3 text-center space-y-1.5">
                          {comp ? (
                            <>
                              <span className={`px-2.5 py-1 text-[10px] border font-bold block text-center ${comp.statusColor}`}>
                                {comp.statusLabel} ({comp.score}/6)
                              </span>
                              {comp.isTawheedCompatibleJoint && (
                                <span className="px-2 py-0.5 text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-black block text-center rounded-none ring-1 ring-amber-400">
                                  توافق توحيدي بنيوي مشترك 🌟
                                </span>
                              )}
                              {comp.isTawheedCompatibleSelf && (
                                <span className="px-2 py-0.5 text-[9px] bg-emerald-50 text-emerald-900 border border-emerald-200 font-black block text-center rounded-none ring-1 ring-emerald-300">
                                  توافق توحيدي ذاتي للآية 🌟
                                </span>
                              )}
                            </>
                          ) : '-'}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const details = comp 
                                ? `\n• المعادلة: ${comp.jummalReduced} × (${v.verseNumber} + ${comp.reducedFactor}) = ${comp.newColumnProduct}\n• البصمة الأحادية: ${comp.finalSingleDigit} (${comp.compactStatus})`
                                : `\n• الاختزال: ${reduceDigitalRoot(v.jummalValue)} | الكلمات: ${v.wordCount} | الحروف: ${v.letterCount}`;
                              const textToCopy = `📋 ميزان البنيان لآية (${v.verseNumber}) سورة ${v.surahName || (activeSurah && activeSurah.name)}:\n« ${v.rawText || v.text} »\n• الجمل: ${v.jummalValue}${details}`;
                              navigator.clipboard.writeText(textToCopy);
                              setCopiedSearchVerseId(v.id);
                              setTimeout(() => setCopiedSearchVerseId(null), 2000);
                              showToast('تم نسخ ميزان الآية بنجاح!');
                            }}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors inline-flex items-center justify-center cursor-pointer"
                          >
                            {copiedSearchVerseId === v.id ? (
                              <span className="text-[10px] text-emerald-600 font-bold">تم!</span>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Empty fallback for filtered state */}
          {sortedAndFilteredVerses.filter(v => !hideEssenceAndRoots || !activeSurah || (!v.isEssence && !v.isConnectedRoot)).length === 0 && (
            <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
              جميع الآيات المطابقة تعتبر من آيات الجوهر أو الأصول وتم توجيهها للتقرير الموحد. انقر فوق زر "عرض المحجوب" بالأعلى لمشاهدتها هنا.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
