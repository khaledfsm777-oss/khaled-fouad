import React, { useState, useMemo, useEffect } from 'react';
import { Verse } from '../types';
import { useGlobalProgress } from '../context/ProgressContext';
import { 
  reduceDigitalRoot, 
  NooraniSurah, 
  normalizeArabicForSearch,
  matchArabicSearchQuery,
  countArabicSearchMatches,
  cleanForCalculations,
  analyzeWord,
  stripBismillah,
  removeTashkeel,
  NOORANI_SURAHS,
  ALL_SURAHS,
  formatSurahNameClean,
  getCompatibilityDetails,
  isTripleMatchElite,
  getNooraniRank,
  getSpecialVerseJummal,
  getNooraniWordMatches
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
  Fingerprint,
  Download
} from 'lucide-react';
import quranData from '../utils/quranData';
import { SURAH_METADATA, getSurahMetadata } from '../utils/surahMetadata';
import { generateDefaultExportFileName, getUniqueExportFileName, handleSafeExport } from '../utils/exportHelper';
import QuranOutput from './QuranOutput';
import { ExportModal } from './ExportModal';

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
  const { startProgress, updateProgress, finishProgress, resetProgress } = useGlobalProgress();
  const [searchScope, setSearchScope] = useState<'active_surah' | 'noorani_29' | 'quran'>(activeSurah ? 'active_surah' : 'quran');
  const [query, setQuery] = useState('');
  const [selectedDigitalRoot, setSelectedDigitalRoot] = useState<number | null>(null);
  const [compactOnlyFilter, setCompactOnlyFilter] = useState<boolean>(false);
  const [searchVerseFingerprint, setSearchVerseFingerprint] = useState<boolean>(false);
  const [searchQuranFingerprint, setSearchQuranFingerprint] = useState<boolean>(false);
  const [searchAsma99, setSearchAsma99] = useState<boolean>(false);
  const [searchAge63, setSearchAge63] = useState<boolean>(false);
  const [searchTanzeel23, setSearchTanzeel23] = useState<boolean>(false);
  const [searchSurahMatch, setSearchSurahMatch] = useState<boolean>(false);
  const [searchNooraniRank, setSearchNooraniRank] = useState<boolean>(false);
  const [searchNooraniWordsOnly, setSearchNooraniWordsOnly] = useState<boolean>(false);
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

  // Interactive Export Modal State for custom naming & direct saving
  const [exportModalState, setExportModalState] = useState<{
    isOpen: boolean;
    format: 'xlsx' | 'docx' | 'csv' | 'png' | 'doc' | string;
    defaultFileName: string;
    data: any;
    onSuccessToast: string;
  }>({
    isOpen: false,
    format: 'xlsx',
    defaultFileName: '',
    data: null,
    onSuccessToast: 'تم تصدير الملف بنجاح! 💾'
  });

  const handleConfirmExport = async (customFileName: string) => {
    if (!exportModalState.data) return;
    const finalName = customFileName.trim() || exportModalState.defaultFileName;
    const success = await handleSafeExport(
      exportModalState.data,
      finalName,
      exportModalState.format
    );
    if (success) {
      showToast(exportModalState.onSuccessToast);
    }
    setExportModalState(prev => ({ ...prev, isOpen: false, data: null }));
  };

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
    startProgress('جلب وتحميل المصحف الشريف كاملاً', 'جارٍ إعداد وفهرسة 6,236 آية بقاعدة البيانات المحلية...');
    updateProgress(15, 'قراءة السجلات العثمانية...');
    try {
      await new Promise(resolve => setTimeout(resolve, 80));
      const parsed: any[] = [];
      const totalVerses = quranData.length;
      updateProgress(40, 'تجريد الرسم وإحصاء الحروف وحساب الجُمّل الكبير...');
      
      quranData.forEach((a: any) => {
        const cleanCalculated = cleanForCalculations(a.text);
        const rawWords = a.text.split(/\s+/).filter((w: string) => w.length > 0);
        const wordsAnalysis = rawWords.map((w: string) => analyzeWord(w));
        let jummalValue = wordsAnalysis.reduce((sum, w) => sum + w.jummalValue, 0);
        const override = getSpecialVerseJummal(a.surahId, a.verseNumber, cleanCalculated);
        if (override !== null) {
          jummalValue = override;
        }
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
      updateProgress(90, 'اكتمال معالجة البنية الحسابية لآيات المصحف...');
      setQuranVerses(parsed);
      finishProgress(`تم تجهيز وفهرسة ${totalVerses} آية قرآنية بنجاح`);
    } catch (err) {
      console.error('Failed to load entire Quran simple text:', err);
      setLoadError('فشل تحميل نص القرآن الكريم المخزن محلياً.');
      resetProgress();
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

      // Verse Fingerprint Filter
      if (searchVerseFingerprint && (!comp || !comp.isVerseFingerprint)) return false;

      // Quran Fingerprint (114) Filter
      if (searchQuranFingerprint && (!comp || !comp.isQuran114Match)) return false;

      // Asma Allah (99) Filter
      if (searchAsma99 && (!comp || !comp.isAsma99Match)) return false;

      // Age of Prophet (63) Filter
      if (searchAge63 && (!comp || !comp.isAge63Match)) return false;

      // Revelation Years (23) Filter
      if (searchTanzeel23 && (!comp || !comp.isTanzeel23Match)) return false;

      // Surah Match Filter
      if (searchSurahMatch && (!comp || !comp.isSurahIdMatch)) return false;

      // Noorani Rank Match Filter
      if (searchNooraniRank && (!comp || !comp.isNooraniRankMatch)) return false;

      // Noorani Words in 29 Noorani Surahs Filter
      if (searchNooraniWordsOnly) {
        if (!surahObj || !surahObj.letters) return false;
        let hasNooraniWords = false;
        if (surahObj.id === 42) {
          const m1 = getNooraniWordMatches(v.rawText || v.text || '', 'حم', 3, false);
          const m2 = getNooraniWordMatches(v.rawText || v.text || '', 'عسق', 5, false);
          hasNooraniWords = m1.length > 0 || m2.length > 0;
        } else {
          const matches = getNooraniWordMatches(v.rawText || v.text || '', surahObj.letters, surahObj.digitalRoot || 1, false);
          hasNooraniWords = matches.length > 0;
        }
        if (!hasNooraniWords) return false;
      }

      // Check specific Surah & Verse query (e.g., "البقرة 255")
      if (isSpecificSurahVerse && surahCandidate && verseNumberCandidate) {
        const cleanSurahName = formatSurahNameClean(v.surahName || surahObj?.name || '');
        const surahMatch = cleanSurahName.includes(surahCandidate) || (v.surahName && v.surahName.includes(surahCandidate));
        const verseMatch = verseNum === verseNumberCandidate;
        return surahMatch && verseMatch;
      }

      // 1. Text Search matching with precision Arabic word and phrase matching
      if (normalizedQ) {
        const hasText = matchArabicSearchQuery(v.text || '', text) || 
                        matchArabicSearchQuery(v.rawText || '', text) || 
                        matchArabicSearchQuery(v.cleanTextForCalculation || '', text);
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
        const count = countArabicSearchMatches(v.text || '', text);
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
  }, [verses, quranVerses, searchScope, query, selectedDigitalRoot, compactOnlyFilter, searchVerseFingerprint, searchQuranFingerprint, searchAsma99, searchAge63, searchTanzeel23, searchSurahMatch, searchNooraniRank, searchNooraniWordsOnly, hasSearched, parsedQuery, activeSurah]);

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

  const surahName = useMemo(() => {
    return activeSurah ? activeSurah.name.replace(/\s*\([^)]*\)/g, '').trim() : 'القرآن';
  }, [activeSurah]);

  const fromVerse = useMemo(() => {
    return sortedAndFilteredVerses.length > 0 ? (sortedAndFilteredVerses[0].verseNumber || 1) : 1;
  }, [sortedAndFilteredVerses]);

  const toVerse = useMemo(() => {
    return sortedAndFilteredVerses.length > 0 ? (sortedAndFilteredVerses[sortedAndFilteredVerses.length - 1].verseNumber || sortedAndFilteredVerses.length) : 1;
  }, [sortedAndFilteredVerses]);

  const dynamicSearchFileName = useMemo(() => {
    return generateDefaultExportFileName(surahName, fromVerse, toVerse, 'البنيان_بحث');
  }, [surahName, fromVerse, toVerse]);

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

    startProgress('وزن وتحليل نتائج البحث المتقدم', `فحص ومطابقة ${matchedVerses.length} آية بالموازين الرقمية...`);

    // Dynamic progress bar updates
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(100, prev + Math.floor(Math.random() * 15) + 8);
        updateProgress(next, `معالجة ومقارنة التوافقات الهندسية (${next}%)...`);

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsAnalyzing(false);
            setShowFullReport(true);
            finishProgress(`اكتمل وزن وتحليل مصفوفة ${matchedVerses.length} آية بنجاح`);
            showToast('اكتمل وزن وتحليل مصفوفة البنيان بنجاح تام!');
          }, 300);
          return 100;
        }
        return next;
      });
      setAnalysisDuration(d => d + 0.1);
    }, 120);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = async () => {
    if (matchedVerses.length === 0) return;
    const BOM = '\uFEFF';

    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40" dir="rtl">
    <head><meta charset="utf-8"/><title>${dynamicSearchFileName}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; direction: rtl; }
      table { border-collapse: collapse; width: 100%; direction: rtl; }
      th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #94a3b8; padding: 6px; }
      td { border: 1px solid #cbd5e1; padding: 6px; text-align: center; }
    </style></head><body>
    <h2>برنامج البنيان للقرآن الكريم - تقرير البحث والاستقصاء الرقمي</h2>
    <table>
    <thead><tr>
      <th>م</th><th>رقم الآية</th><th>السورة</th><th>الآية الكريمة</th><th>حساب الجمل</th><th>الهيكل البنياني</th><th>الكثافة اللفظية</th><th>الاختزال الرقمي</th><th>الكلمات</th><th>الحروف</th><th>التحقق</th>
    </tr></thead><tbody>`;

    sortedAndFilteredVerses.forEach((v, idx) => {
      const compLabel = v.compatibility ? v.compatibility.statusLabel : 'N/A';
      const structuralVal = v.compatibility ? v.compatibility.structuralVal : v.jummalValue;
      const densityVal = v.compatibility ? v.compatibility.densityVal : (v.wordCount + v.letterCount);
      const sName = v.surahName || (activeSurah ? activeSurah.name : '');
      tableHtml += `<tr>
        <td>${idx + 1}</td>
        <td>${v.verseNumber}</td>
        <td>${sName}</td>
        <td style="text-align: right;">( ${v.rawText || v.text} )</td>
        <td>${v.jummalValue}</td>
        <td>${structuralVal}</td>
        <td>${densityVal}</td>
        <td>${reduceDigitalRoot(v.jummalValue)}</td>
        <td>${v.wordCount}</td>
        <td>${v.letterCount}</td>
        <td>${compLabel}</td>
      </tr>`;
    });

    tableHtml += `</tbody></table></body></html>`;
    setExportModalState({
      isOpen: true,
      format: 'xlsx',
      defaultFileName: dynamicSearchFileName,
      data: BOM + tableHtml,
      onSuccessToast: 'تم تصدير ملف Excel بنجاح! 📊'
    });
  };

  // Export to CSV
  const handleExportCSV = async () => {
    if (matchedVerses.length === 0) return;
    const BOM = '\uFEFF';

    const headers = [
      'م',
      'رقم الآية',
      'السورة',
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
      const sName = v.surahName || (activeSurah ? activeSurah.name : '');
      return [
        idx + 1,
        v.verseNumber,
        `"${sName}"`,
        `"( ${v.rawText || v.text} )"`,
        v.jummalValue,
        structuralVal,
        densityVal,
        reduceDigitalRoot(v.jummalValue),
        v.wordCount,
        v.letterCount,
        `"${compLabel}"`
      ];
    });

    const csvContent = BOM + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    setExportModalState({
      isOpen: true,
      format: 'csv',
      defaultFileName: dynamicSearchFileName,
      data: csvContent,
      onSuccessToast: 'تم تصدير ملف CSV بنجاح! 💾'
    });
  };

  // Export to Word Document (.docx)
  const handleExportWord = async () => {
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

    setExportModalState({
      isOpen: true,
      format: 'docx',
      defaultFileName: dynamicSearchFileName,
      data: BOM + html,
      onSuccessToast: 'تم تصدير مستند Word بنجاح! 📝'
    });
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
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white border-2 border-slate-200 p-5 rounded-lg shadow-sm">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-900" />
            <span>البحث المتقدم والمعالج المرن للبنيان ⚡</span>
          </h2>
          <p className="text-sm text-slate-600 font-semibold mt-1">
            البحث اللفظي والرقمي الموحد وتصفية البصمة الأحادية والنسب النورانية
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap bg-slate-100 p-1.5 border border-slate-200 rounded-lg">
            <button
              onClick={() => handleScopeChange('active_surah')}
              className={`px-4 py-2.5 text-sm font-black transition-all cursor-pointer rounded-md ${
                searchScope === 'active_surah'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              السورة النشطة الحالية 📖
            </button>
            <button
              onClick={() => handleScopeChange('noorani_29')}
              className={`px-4 py-2.5 text-sm font-black transition-all cursor-pointer rounded-md ${
                searchScope === 'noorani_29'
                  ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-400'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              السور النورانية الـ 29 ✨
            </button>
            <button
              onClick={() => handleScopeChange('quran')}
              className={`px-4 py-2.5 text-sm font-black transition-all cursor-pointer rounded-md ${
                searchScope === 'quran'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-950'
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
          <h3 className="text-base font-black text-slate-900">يرجى اختيار سورة نشطة للبدء بالبحث المتخصص</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-semibold">
            توجّه للشاشة الرئيسية لتبديل السورة أو فعّل خيار البحث في "السور النورانية الـ 29" أو "القرآن الكريم كاملاً" بالأعلى لتصفية الآيات مباشرة.
          </p>
        </div>
      )}

      {(searchScope === 'quran' || searchScope === 'noorani_29') && loadingQuran && (
        <div className="bg-slate-50 border border-slate-200 p-8 text-center space-y-4 animate-pulse rounded-lg">
          <Loader2 className="w-10 h-10 text-slate-950 mx-auto animate-spin" />
          <h4 className="text-sm font-black text-slate-800">جاري تعبئة وتفكيك حروف القرآن الكريم (6236 آية)...</h4>
        </div>
      )}

      {/* Main Single Box Search Engine */}
      {((searchScope === 'active_surah' && activeSurah) || ((searchScope === 'quran' || searchScope === 'noorani_29') && quranVerses.length > 0 && !loadingQuran)) && (
        <div className="bg-white border-2 border-slate-200 p-6 space-y-6 rounded-lg">
          
          {/* Digital Root Filter Bar (البصمة الأحادية من 1 إلى 9) */}
          <div className="bg-slate-50 border border-slate-200 p-4 space-y-3 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="text-sm md:text-base font-black text-slate-900 flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-amber-600" />
                <span>فلتر البصمة الأحادية للآيات (من 1 إلى 9):</span>
              </span>
              {selectedDigitalRoot !== null && (
                <span className="text-xs md:text-sm font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
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
                className={`px-4 py-2.5 text-sm font-black rounded-lg transition-all cursor-pointer border ${
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
                  className={`min-w-[46px] min-h-[46px] text-base font-black rounded-lg transition-all cursor-pointer flex items-center justify-center border-2 ${
                    selectedDigitalRoot === digit
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-300 scale-105'
                      : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {digit}
                </button>
              ))}

              <div className="flex flex-wrap items-center gap-2 mr-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSearchVerseFingerprint(prev => !prev);
                    setHasSearched(true);
                  }}
                  className={`px-3.5 py-2.5 text-sm font-black rounded-lg transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
                    searchVerseFingerprint
                      ? 'bg-indigo-700 text-white border-indigo-800 shadow-md ring-2 ring-indigo-300'
                      : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                  }`}
                  title="تصفية الآيات حسب بصمة الآية (كثافة أو معادلة أو كلمات أو حروف = رقم الآية)"
                >
                  <Fingerprint className="w-4 h-4 text-indigo-400" />
                  <span>
                    بصمة الآية 🎯 {searchVerseFingerprint ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuranFingerprint(prev => !prev);
                    setHasSearched(true);
                  }}
                  className={`px-3.5 py-2.5 text-sm font-black rounded-lg transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
                    searchQuranFingerprint
                      ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-300'
                      : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
                  }`}
                  title="تصفية الآيات حسب بصمة القرآن 114 (كثافة أو معادلة أو كلمات أو حروف = 114)"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    بصمة القرآن (114) 🌟 {searchQuranFingerprint ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchAsma99(prev => !prev);
                    setHasSearched(true);
                  }}
                  className={`px-3.5 py-2.5 text-sm font-black rounded-lg transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
                    searchAsma99
                      ? 'bg-amber-700 text-white border-amber-800 shadow-md ring-2 ring-amber-300'
                      : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
                  }`}
                  title="تصفية الآيات حسب الأسماء الحسنى 99 (كثافة أو معادلة أو كلمات أو حروف = 99)"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    الأسماء الحسنى (99) 📿 {searchAsma99 ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchAge63(prev => !prev);
                    setHasSearched(true);
                  }}
                  className={`px-3.5 py-2.5 text-sm font-black rounded-lg transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
                    searchAge63
                      ? 'bg-teal-700 text-white border-teal-800 shadow-md ring-2 ring-teal-300'
                      : 'bg-teal-50 text-teal-950 border-teal-200 hover:bg-teal-100'
                  }`}
                  title="تصفية الآيات حسب العمر الشريف 63 (كثافة أو معادلة أو كلمات أو حروف = 63)"
                >
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>
                    العمر الشريف (63) 🕊️ {searchAge63 ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTanzeel23(prev => !prev);
                    setHasSearched(true);
                  }}
                  className={`px-3.5 py-2.5 text-sm font-black rounded-lg transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
                    searchTanzeel23
                      ? 'bg-sky-700 text-white border-sky-800 shadow-md ring-2 ring-sky-300'
                      : 'bg-sky-50 text-sky-950 border-sky-200 hover:bg-sky-100'
                  }`}
                  title="تصفية الآيات حسب سنوات التنزيل 23 (كثافة أو معادلة أو كلمات أو حروف = 23)"
                >
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>
                    سنوات التنزيل (23) 📖 {searchTanzeel23 ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchSurahMatch(prev => !prev);
                    setHasSearched(true);
                  }}
                  className={`px-3.5 py-2.5 text-sm font-black rounded-lg transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
                    searchSurahMatch
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-300'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title="تصفية الآيات حسب رقم السورة (كثافة أو معادلة أو كلمات أو حروف = رقم السورة)"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>
                    رقم السورة 📖 {searchSurahMatch ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchNooraniRank(prev => !prev);
                    setHasSearched(true);
                  }}
                  className={`px-3.5 py-2.5 text-sm font-black rounded-lg transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
                    searchNooraniRank
                      ? 'bg-fuchsia-800 text-white border-fuchsia-900 shadow-md ring-2 ring-fuchsia-300'
                      : 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200 hover:bg-fuchsia-100'
                  }`}
                  title="تصفية الآيات حسب الترتيب النوراني (كثافة أو معادلة أو كلمات أو حروف = ترتيب السورة 1-29)"
                >
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  <span>
                    الترتيب النوراني 💠 {searchNooraniRank ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchNooraniWordsOnly(prev => !prev);
                    setHasSearched(true);
                  }}
                  className={`px-4 py-2.5 text-sm font-black rounded-lg transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
                    searchNooraniWordsOnly
                      ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-300'
                      : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                  }`}
                  title="تصفية الآيات التي تحتوي على كلمات تشتمل على كافة الحروف النورانية الافتتاحية للسورة (29 سورة نورانية)"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    الكلمات النورانية الشاملة ✨ {searchNooraniWordsOnly ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompactOnlyFilter(prev => !prev);
                    setHasSearched(true);
                  }}
                  className={`px-4 py-2.5 text-sm font-black rounded-lg transition-all cursor-pointer border-2 flex items-center gap-1.5 ${
                    compactOnlyFilter
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-300'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>عرض التوافقات المدمجة فقط ✨</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm md:text-base font-black text-slate-950 block">
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
                className="w-full bg-slate-50 border-2 border-slate-300 focus:border-slate-900 rounded-lg px-5 py-4 text-base md:text-lg text-slate-950 outline-none transition-all font-bold pl-12 pr-5 text-right shadow-inner"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Floating Keyboard Adjust View */}
          {isKeyboardHelperVisible && (
            <div className="bg-slate-50 border border-slate-200 p-4 space-y-3 relative animate-fade-in rounded-lg">
              <div className="absolute top-2 left-2">
                <button 
                  onClick={() => setIsKeyboardHelperVisible(false)}
                  className="text-xs text-slate-400 hover:text-slate-800 font-bold"
                >
                  إغلاق اللوحة ✕
                </button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <span className="text-xs md:text-sm font-black text-slate-800 flex items-center gap-1">
                  <Sliders className="w-4 h-4 text-slate-600" />
                  <span>لوحة تعديل نطاقات الأرقام والرموز (Keyboard Adjust View):</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-bold">المعيار المستهدف للاختبار:</span>
                  {(['jummal', 'words', 'letters', 'verseNumber', 'sum'] as const).map(target => {
                    const label = target === 'jummal' ? 'حساب الجمل' : target === 'words' ? 'الكلمات' : target === 'letters' ? 'الحروف' : target === 'verseNumber' ? 'رقم الآية' : 'المجموع الكلي';
                    return (
                      <button
                        key={target}
                        onClick={() => {
                          setNumericalTarget(target);
                          setHasSearched(true);
                        }}
                        className={`px-3 py-1.5 text-xs md:text-sm font-black transition-all rounded ${
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1.5">
                  <span className="block text-xs md:text-sm text-slate-800 font-black">رموز المقارنة الرياضية السريعة (واضحة وكبيرة):</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['=', '>', '<', '>=', '<='].map(sym => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => appendSymbol(sym)}
                        className="min-w-[52px] min-h-[52px] text-lg font-black px-4 py-2 bg-white text-slate-900 hover:bg-slate-900 hover:text-white border-2 border-slate-300 rounded-lg shadow-sm transition-all font-mono cursor-pointer flex items-center justify-center"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs md:text-sm text-slate-800 font-black">اختصارات ومؤشرات رقمية جاهزة:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeSurah ? (
                      <>
                        <button
                          onClick={() => handlePresetClick(`= ${activeSurah.keyValue}`)}
                          className="px-3 py-2 bg-white border border-slate-200 text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-100 rounded-md"
                        >
                          المعامل {activeSurah.keyValue}
                        </button>
                        <button
                          onClick={() => handlePresetClick(`= ${activeSurah.digitalRoot}`)}
                          className="px-3 py-2 bg-white border border-slate-200 text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-100 rounded-md"
                        >
                          الأس {activeSurah.digitalRoot}
                        </button>
                      </>
                    ) : null}
                    <button
                      onClick={() => handlePresetClick('>= 313')}
                      className="px-3 py-2 bg-white border border-slate-200 text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-100 rounded-md"
                    >
                      بنيان الرسل (313)
                    </button>
                    <button
                      onClick={() => handlePresetClick('<= 19')}
                      className="px-3 py-2 bg-white border border-slate-200 text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-100 rounded-md"
                    >
                      أحرف قصيرة (19)
                    </button>
                    <button
                      onClick={() => handlePresetClick('>= 500')}
                      className="px-3 py-2 bg-white border border-slate-200 text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-100 rounded-md"
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
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f8fafc] border border-slate-200 p-3.5 text-sm font-bold text-slate-800 rounded-lg">
              <div className="flex flex-wrap items-center gap-2">
                <span>🛡️ مرشح البحث الموحد:</span>
                {query.trim() && (
                  <span className="bg-slate-900 text-white px-3 py-1 font-mono text-sm rounded">
                    {query}
                  </span>
                )}
                {selectedDigitalRoot !== null && (
                  <span className="bg-amber-500 text-slate-950 border border-amber-400 font-black px-3 py-1 text-sm rounded">
                    البصمة الأحادية: {selectedDigitalRoot}
                  </span>
                )}
                {parsedQuery.isNumerical && (
                  <span className="bg-teal-50 text-teal-800 border border-teal-100 px-2.5 py-1 text-xs rounded">
                    نوع الاختبار: {numericalTarget === 'jummal' ? 'حساب الجمل' : numericalTarget === 'words' ? 'الكلمات' : 'الحروف'}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  handleClear();
                  setSelectedDigitalRoot(null);
                }}
                className="text-xs text-rose-700 hover:text-rose-900 font-extrabold cursor-pointer"
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
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm md:text-base font-bold text-slate-800">
            <span className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg">
              إجمالي الآيات المطابقة: <strong className="text-slate-900 font-black text-base md:text-lg">{totalVersesFound} آية</strong>
            </span>
            <span className="px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-950 rounded-lg">
              عدد السور الناتجة: <strong className="text-amber-700 font-black text-base md:text-lg">{uniqueSurahsCount} سورة</strong>
            </span>
            {selectedDigitalRoot !== null && (
              <span className="px-4 py-2.5 bg-amber-500 text-slate-950 font-black rounded-lg border border-amber-400 text-sm md:text-base">
                البصمة الأحادية: ({selectedDigitalRoot})
              </span>
            )}
          </div>
          <button
            onClick={handleStartAnalysis}
            className="w-full sm:w-auto px-9 py-4.5 bg-slate-950 hover:bg-slate-800 text-white font-black text-base md:text-lg uppercase tracking-wide cursor-pointer transition-all flex items-center justify-center gap-2.5 mx-auto shadow-md rounded-lg"
          >
            <Brain className="w-6 h-6 text-amber-300 animate-pulse" />
            <span>بدء عملية التحليل وتصدير التقرير الموحد ⚡</span>
          </button>
        </div>
      )}

      {/* Dynamic Progress Loader - Prevents flashing/flashing */}
      {isAnalyzing && (
        <div className="bg-slate-900 border-2 border-slate-800 text-white p-8 text-center space-y-6 animate-fade-in">
          <Loader2 className="w-12 h-12 text-amber-400 mx-auto animate-spin" />
          <div className="space-y-2">
            <h4 className="text-base md:text-lg font-black text-white">جاري حساب مصفوفة البنيان الشاملة...</h4>
            <p className="text-sm text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
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
          <span className="text-sm font-mono font-bold text-amber-400 block">
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
                <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-black text-xs uppercase">
                  الهوية التعريفية الثلاثية للسورة (Triple Definitional Identity)
                </span>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                  سورة {activeSurah.name}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-3.5 text-center">
                  <span className="block text-xs text-slate-500 font-bold">موضع الترتيب بالمصحف</span>
                  <span className="text-base font-black text-slate-900 font-sans mt-0.5 block">{activeSurah.id}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 text-center">
                  <span className="block text-xs text-slate-500 font-bold">مفتاح الشفرة النورانية</span>
                  <span className="text-base font-black text-slate-900 quran-font mt-0.5 block">{activeSurah.letters}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 text-center">
                  <span className="block text-xs text-slate-500 font-bold">الهوية الرقمية للمعامل النوراني</span>
                  <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">{activeSurah.keyValue}</span>
                </div>
              </div>

              {/* Dynamic Interpretive Text */}
              <div className="bg-amber-50/50 border border-amber-200 p-4 space-y-2">
                <h5 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>التحليل التأويلي الذكي للمعاملات الرقمية (Dynamic Insight):</span>
                </h5>
                <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                  {getDynamicInterpretation(activeSurah)}
                </p>
              </div>
            </div>
          )}

          {/* Table Explanation Legend (دليل الألوان والتحقق البنيوي المتقدم خارج الجدول) */}
          <div className="bg-white border-2 border-slate-200 p-6 space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>دليل تفسير الألوان والموازين البنيانية للتوافق (Color Code Dictionary):</span>
              </h4>
              <p className="text-xs md:text-sm text-slate-600 mt-1 font-semibold">
                توضيح تفصيلي لمفهوم ومعنى كل لون مخصص للتوافق الهندسي والنوراني خارج جدول العرض:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Golden / Tawheed */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-amber-400 rounded-none inline-block ring-2 ring-amber-300"></span>
                  <span className="text-sm font-black text-amber-950">اللون الذهبي البرتقالي 🌟 (مفتاح مطلق / توافق توحيدي)</span>
                </div>
                <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                  <strong>الدلالة البنيانية:</strong> يمنح هذا اللقب الاستثنائي المرموق للآية الكريمة في حالتين:
                  <br />
                  1. <strong>المفتاح المطلق (6/6):</strong> استيفاء الآية لكافة شروط الفحص السداسية كاملة مع الأس النوراني.
                  <br />
                  2. <strong>التوافق التوحيدي البنيوي المشترك:</strong> عند فحص الكثافة وجمع (الكلمات + الحروف + رقم الآية)، واختزال الخانات للخطوة الأولى لتبلغ الرقم <strong>11</strong>. يتوقف البرنامج فوراً هنا ليمنحها هذا الوسام الذهبي؛ إشارةً إلى بلوغ الآية الذروة التناغمية للتوحيد الإلهي.
                </p>
              </div>

              {/* Emerald Green */}
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-emerald-500 rounded-none inline-block ring-1 ring-emerald-400"></span>
                  <span className="text-sm font-black text-emerald-950">اللون الأخضر الزمردي ✅ (توافق تماماً أو توافق توحيدي ذاتي للآية)</span>
                </div>
                <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                  <strong>الدلالة البنيانية:</strong> يشير هذا النطاق الأخضر الفخم إلى حالتين:
                  <br />
                  1. <strong>توافق توحيدي ذاتي للآية:</strong> عندما لا تكون الخطوة الأولى للاختزال 11، ولكن يستمر الاختزال الرقمي الكوني التراكمي لينتهي بالرقم <strong>1</strong> (الواحد الأحد).
                  <br />
                  2. <strong>متوافقة تماماً (3-5 شروط):</strong> تطابق الآية الكريمة مع غالبية شروط الوزن الرقمي النوراني الموزع للسورة، مما يعزز الثبات الإعجازي للآيات.
                </p>
              </div>

              {/* Sky Blue */}
              <div className="bg-blue-50/50 border border-blue-100 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-blue-500 rounded-none inline-block"></span>
                  <span className="text-sm font-black text-blue-950">اللون الأزرق السماوي 🔵 (متوافقة بنيوياً - من 1 إلى 2 شروط)</span>
                </div>
                <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-medium">
                  <strong>الدلالة البنيانية:</strong> يدل على وجود روابط بنيانية وهندسية أولية (كأن يقبل حساب الجمل الكلي أو البنيان الهيكلي للآية القسمة على المعامل النوراني أو الأس الموحد للسورة). يعتبر اتصالاً بنيوياً داعماً للنظم العام للآية في فلك السورة الخاص بها.
                </p>
              </div>

              {/* Soft Rose */}
              <div className="bg-rose-50/50 border border-rose-100 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-rose-400 rounded-none inline-block"></span>
                  <span className="text-sm font-black text-rose-950">اللون الوردي الهادئ 🔴 (غير متوافقة - صفر شروط)</span>
                </div>
                <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-medium">
                  <strong>الدلالة البنيانية:</strong> يشير هذا اللون إلى عدم وجود تطابق رياضي مباشر للآية مع شروط الفحص الستة للأس النوراني للسورة الحالية. يؤكد هذا وجود بنية تعبيرية حرة ومستقلة تهدف لتكسير الرتابة الحسابية لتناسب الانتقالات العقائدية والموضوعية الحرة، مما يثبت شمولية ومرونة النص الإعجازي وعدم خضوعه لمعادلة ميكانيكية صلبة.
                </p>
              </div>
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
                    <h5 className="text-sm font-black text-slate-900">
                      حفظ صفاء العرض (آيات الجوهر والأصول النورانية):
                    </h5>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      تم تصنيف وحجب الآيات التي تتضمن كلمات واضحة تعود على كتاب الله أو تنتهي بجذور الحروف النورانية من العرض المباشر في الجدول السفلي لتسهيل المشاهدة.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHideEssenceAndRoots(!hideEssenceAndRoots)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-black cursor-pointer shadow-xs"
                >
                  {hideEssenceAndRoots ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>عرض المحجوب</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>تفعيل الحجب</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic semantic analysis of the hidden/essence verses */}
              <div className="bg-slate-50 border border-slate-200 p-3 text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                💡 <strong>الأثر البياني والروحي لآيات الجوهر المحجوبة:</strong> تتميز هذه المجموعة بكثافة لفظية عالية تدعم أثر التثبيت الإلهي وعقيدة عبودية الوحي والتنزيل؛ حيث تتقاطع قيمها الحسابية لترسم موازين هندسية تساند المعامل الرقمي الكلي.
              </div>
            </div>
          )}

          {/* Unified Quran Output Component */}
          <div className="space-y-4">
            <QuranOutput
              verses={sortedAndFilteredVerses.filter(v => {
                if (hideEssenceAndRoots && activeSurah) {
                  return !v.isEssence && !v.isConnectedRoot;
                }
                return true;
              })}
              activeSurah={searchScope === 'active_surah' ? activeSurah : null}
              isSearchMode={true}
              searchScopeTitle={
                searchScope === 'active_surah'
                  ? `نتائج البحث المتقدم في سورة ${activeSurah?.name || ''}`
                  : searchScope === 'noorani_29'
                  ? 'نتائج البحث المتقدم في السور النورانية الـ 29'
                  : 'نتائج البحث المتقدم في القرآن الكريم كاملاً'
              }
              showSurahNameColumn={searchScope !== 'active_surah'}
            />
          </div>

          {/* Empty fallback for filtered state */}
          {sortedAndFilteredVerses.filter(v => !hideEssenceAndRoots || !activeSurah || (!v.isEssence && !v.isConnectedRoot)).length === 0 && (
            <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
              جميع الآيات المطابقة تعتبر من آيات الجوهر أو الأصول وتم توجيهها للتقرير الموحد. انقر فوق زر "عرض المحجوب" بالأعلى لمشاهدتها هنا.
            </div>
          )}
        </div>
      )}

      {/* نافذة تحديد اسم الملف والحفظ المخصصة للجوال واللابتوب */}
      <ExportModal
        isOpen={exportModalState.isOpen}
        format={exportModalState.format}
        defaultFileName={exportModalState.defaultFileName}
        onConfirm={handleConfirmExport}
        onCancel={() => setExportModalState(prev => ({ ...prev, isOpen: false, data: null }))}
      />
    </div>
  );
}
