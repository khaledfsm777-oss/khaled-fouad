import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  Copy, 
  CheckCircle2, 
  FileText, 
  FileSpreadsheet, 
  Filter, 
  Compass, 
  BookOpen, 
  ArrowRightCircle, 
  Layers, 
  Check, 
  Hash, 
  Share2,
  X,
  RotateCcw,
  Star,
  CheckCheck,
  Bookmark
} from 'lucide-react';
import { 
  NOORANI_SURAHS, 
  NooraniSurah, 
  getNooraniWordMatches, 
  NooraniMatchedWordResult,
  checkVerseNooraniGathering,
  VerseNooraniGatheringResult,
  normalizeArabicForSearch,
  JUMMAL_MAP,
  removeTashkeel,
  cleanForCalculations
} from '../utils/jummal';
import quranData, { QuranVerse } from '../utils/quranData';
import { copyToClipboard } from '../utils/clipboard';
import { generateNooraniWordsDocxBlob, generateNooraniGatheringVersesDocxBlob } from '../utils/docxExportHelper';
import { generateTableExcelBlob } from '../utils/excelExportHelper';
import { handleSafeExport } from '../utils/exportHelper';
import { ExportModal } from './ExportModal';

interface NooraniWordExplorerProps {
  initialSurahId?: number | null;
  onSelectSurahForAnalysis?: (surah: NooraniSurah) => void;
  onTransferVersesToOutput?: (
    matchingRefs: { surahId: number; verseNumber: number }[],
    label: string,
    surah: NooraniSurah
  ) => void;
}

interface ExtractedWordRow extends NooraniMatchedWordResult {
  index: number;
  surahId: number;
  surahName: string;
  verseNumber: number;
  verseText: string;
  verseWordCount: number;
  verseLetterCount: number;
  wordLetterCount: number;
  trackLabel?: string;
  isGatheringAllVerse: boolean;
  verseGatheringLetters: string[];
  verseGatheringSummary: string;
}

// 14 Individual Noorani Letters ("نص حكيم قاطع له سر")
export const NOORANI_INDIVIDUAL_LETTERS = [
  { letter: 'أ', jummal: 1 },
  { letter: 'ل', jummal: 30 },
  { letter: 'م', jummal: 40 },
  { letter: 'ص', jummal: 90 },
  { letter: 'ر', jummal: 200 },
  { letter: 'ك', jummal: 20 },
  { letter: 'هـ', jummal: 5 },
  { letter: 'ي', jummal: 10 },
  { letter: 'ع', jummal: 70 },
  { letter: 'ط', jummal: 9 },
  { letter: 'س', jummal: 60 },
  { letter: 'ح', jummal: 8 },
  { letter: 'ق', jummal: 100 },
  { letter: 'ن', jummal: 50 },
];

export default function NooraniWordExplorer({
  initialSurahId = 0,
  onSelectSurahForAnalysis,
  onTransferVersesToOutput
}: NooraniWordExplorerProps) {
  // Selected Noorani Surah (default to 0: اختيار سورة)
  const [selectedSurahId, setSelectedSurahId] = useState<number>(initialSurahId || 0);
  const [searchScope, setSearchScope] = useState<'single_surah' | 'all_29' | 'all_quran'>('single_surah');
  
  // Default to false so all extracted words are visible by default and not filtered out to 0
  const [onlyCompatible, setOnlyCompatible] = useState<boolean>(false);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [shuraTrack, setShuraTrack] = useState<'both' | 'hameem' | 'asaq'>('both');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  // Active formula filter (null when no formula is active - toggle on/off)
  const [activeFormula, setActiveFormula] = useState<string | null>(null);
  // Active individual letter filter (null when no letter is active - toggle on/off)
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  
  // Specific letter filter for the active Surah (e.g. 'ك' or 'ص' in Maryam)
  const [activeSurahLetter, setActiveSurahLetter] = useState<string | null>(null);
  // Filter exclusively for verses that gather all opening letters of the Surah (e.g. 11 verses in Maryam)
  const [isGatheringVersesOnly, setIsGatheringVersesOnly] = useState<boolean>(false);
  // Filter for words containing the whole formula in a single word
  const [isWholeFormulaOnly, setIsWholeFormulaOnly] = useState<boolean>(false);

  // Control table visibility: open by default so users see data immediately
  const [isTableManuallyOpen, setIsTableManuallyOpen] = useState<boolean>(true);

  // Find active Noorani Surah object (or null if selectedSurahId is 0)
  const activeSurah = useMemo(() => {
    if (!selectedSurahId || selectedSurahId <= 0) return null;
    return NOORANI_SURAHS.find(s => s.id === selectedSurahId) || null;
  }, [selectedSurahId]);

  // Extract distinct letters of the active Surah with their individual metadata
  const surahDistinctLetters = useMemo(() => {
    if (!activeSurah || !activeSurah.letters) return [];
    const normalizeChar = (char: string): string => {
      if (['ا', 'أ', 'إ', 'آ', 'ٱ', 'ء', '\u0670'].includes(char)) return 'ا';
      if (['ي', 'ى', 'ئ', '\u06CC'].includes(char)) return 'ي';
      if (['و', 'ؤ'].includes(char)) return 'و';
      if (['ه', 'ة', 'هـ'].includes(char)) return 'ه';
      return char;
    };
    
    const raw = activeSurah.letters.split('');
    const lettersList: { char: string; norm: string; jummal: number }[] = [];
    const seen = new Set<string>();

    raw.forEach(c => {
      const norm = normalizeChar(c);
      if (c.trim() && !seen.has(norm)) {
        seen.add(norm);
        const jVal = JUMMAL_MAP[c] || JUMMAL_MAP[norm] || 0;
        lettersList.push({ char: c, norm, jummal: jVal });
      }
    });

    return lettersList;
  }, [activeSurah]);

  // Verses in this Surah that gather ALL distinct letters of the opening formula
  const surahGatheringVerses = useMemo(() => {
    if (!activeSurah) return [];
    const versesInSurah = (quranData as QuranVerse[]).filter(v => v.surahId === activeSurah.id);
    return versesInSurah.filter(v => {
      const g = checkVerseNooraniGathering(v.text, activeSurah.letters);
      return g.isGatheringAll;
    });
  }, [activeSurah]);

  // Count words containing each letter in the current Surah
  const surahLetterWordCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!activeSurah) return counts;
    const versesInSurah = (quranData as QuranVerse[]).filter(v => v.surahId === activeSurah.id);
    
    surahDistinctLetters.forEach(l => {
      let count = 0;
      versesInSurah.forEach(v => {
        const matches = getNooraniWordMatches(v.text, l.char, activeSurah.digitalRoot, false, 'any_letter');
        count += matches.length;
      });
      counts[l.norm] = count;
      counts[l.char] = count;
    });

    return counts;
  }, [activeSurah, surahDistinctLetters]);

  // Handle Surah change: reset sub-filters cleanly
  const handleSelectSurah = (id: number) => {
    setSelectedSurahId(id);
    setActiveSurahLetter(null);
    setIsGatheringVersesOnly(false);
    setIsWholeFormulaOnly(false);
    setActiveLetter(null);
    setActiveFormula(null);
    setSearchQuery('');
  };

  const handleToggleSurahLetter = (letter: string) => {
    if (!activeSurah) return;
    if (activeSurahLetter === letter) {
      setActiveSurahLetter(null);
      showToast(`تم إلغاء فلترة حرف [${letter}].`);
    } else {
      setActiveSurahLetter(letter);
      setActiveLetter(null);
      setActiveFormula(null);
      setIsGatheringVersesOnly(false);
      setIsWholeFormulaOnly(false);
      showToast(`تم تنشيط فلترة حرف [${letter}] بسورة ${activeSurah.name}.`);
    }
  };

  const handleToggleGatheringVersesOnly = () => {
    if (!activeSurah) return;
    if (isGatheringVersesOnly) {
      setIsGatheringVersesOnly(false);
      showToast(`تم إلغاء حصر الآيات الجامعة والعودة للعرض العام.`);
    } else {
      setIsGatheringVersesOnly(true);
      setActiveSurahLetter(null);
      setActiveLetter(null);
      setActiveFormula(null);
      setIsWholeFormulaOnly(false);
      showToast(`تم حصر الآيات الجامعة لكافة حروف (${activeSurah.letters}) (${surahGatheringVerses.length} آية). ⭐`);
    }
  };

  const handleToggleWholeFormulaOnly = () => {
    if (!activeSurah) return;
    if (isWholeFormulaOnly) {
      setIsWholeFormulaOnly(false);
      showToast(`تم إلغاء حصر الكلمات الجامعة لحروف (${activeSurah.letters}) مجتمعة.`);
    } else {
      setIsWholeFormulaOnly(true);
      setIsGatheringVersesOnly(false);
      setActiveSurahLetter(null);
      setActiveLetter(null);
      setActiveFormula(null);
      showToast(`تم حصر الكلمات المشتملة على حروف (${activeSurah.letters}) كاملة في كلمة واحدة.`);
    }
  };

  const handleToggleFormula = (formula: string, surahIds: number[]) => {
    if (activeFormula === formula) {
      setActiveFormula(null);
      showToast(`تم إلغاء تنشيط صيغة [${formula}] وعرض الحالة العامة.`);
    } else {
      setActiveFormula(formula);
      setActiveLetter(null);
      setActiveSurahLetter(null);
      setIsGatheringVersesOnly(false);
      setIsWholeFormulaOnly(false);
      if (!selectedSurahId || !surahIds.includes(selectedSurahId)) {
        setSelectedSurahId(surahIds[0]);
      }
      showToast(`تم تنشيط صيغة [${formula}] - انقر عليها مجدداً لإلغائها.`);
    }
  };

  const handleToggleLetter = (letter: string) => {
    if (activeLetter === letter) {
      setActiveLetter(null);
      showToast(`تم إلغاء تنشيط حرف [${letter}].`);
    } else {
      setActiveLetter(letter);
      setActiveFormula(null);
      setActiveSurahLetter(null);
      setIsGatheringVersesOnly(false);
      setIsWholeFormulaOnly(false);
      showToast(`تم تنشيط حرف [${letter}] - انقر عليه مجدداً لإلغائه.`);
    }
  };

  const handleClearLettersActivation = () => {
    setActiveFormula(null);
    setActiveLetter(null);
    setActiveSurahLetter(null);
    setIsGatheringVersesOnly(false);
    setIsWholeFormulaOnly(false);
    showToast('تم إلغاء تنشيط كافة الحروف والصيغ والعودة للوضع العام.');
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setActiveFormula(null);
    setActiveLetter(null);
    setActiveSurahLetter(null);
    setIsGatheringVersesOnly(false);
    setIsWholeFormulaOnly(false);
    setSearchScope('single_surah');
    setOnlyCompatible(false);
    setIsTableManuallyOpen(true);
    showToast('تم تفريغ مربع البحث وإعادة ضبط كافة الفلاتر بنجاح! ✨');
  };

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

  // Grouped formulas for quick-filter tabs
  const formulaGroups = useMemo(() => [
    { label: 'الم (6 سور)', formula: 'الم', surahIds: [2, 3, 29, 30, 31, 32] },
    { label: 'الر (5 سور)', formula: 'الر', surahIds: [10, 11, 12, 14, 15] },
    { label: 'حم (7 سور)', formula: 'حم', surahIds: [40, 41, 42, 43, 44, 45, 46] },
    { label: 'طسم (سورتان)', formula: 'طسم', surahIds: [26, 28] },
    { label: 'كهيعص', formula: 'كهيعص', surahIds: [19] },
    { label: 'طه', formula: 'طه', surahIds: [20] },
    { label: 'طس', formula: 'طس', surahIds: [27] },
    { label: 'يس', formula: 'يس', surahIds: [36] },
    { label: 'ص', formula: 'ص', surahIds: [38] },
    { label: 'ق', formula: 'ق', surahIds: [50] },
    { label: 'ن', formula: 'ن', surahIds: [68] },
    { label: 'المص', formula: 'المص', surahIds: [7] },
    { label: 'المر', formula: 'المر', surahIds: [13] },
  ], []);

  // Compute extracted words based on selected scope and settings
  const extractedWords: ExtractedWordRow[] = useMemo(() => {
    if (!activeSurah) return [];

    let targetVerses: QuranVerse[] = [];

    if (searchScope === 'single_surah') {
      targetVerses = (quranData as QuranVerse[]).filter(v => v.surahId === activeSurah.id);
    } else if (searchScope === 'all_29') {
      const nooraniIdSet = new Set(NOORANI_SURAHS.map(s => s.id));
      targetVerses = (quranData as QuranVerse[]).filter(v => nooraniIdSet.has(v.surahId));
    } else {
      targetVerses = quranData as QuranVerse[];
    }

    // Filter to gathering verses if gathering filter is active
    if (isGatheringVersesOnly) {
      targetVerses = targetVerses.filter(v => {
        const g = checkVerseNooraniGathering(v.text, activeSurah.letters);
        return g.isGatheringAll;
      });
    }

    const results: ExtractedWordRow[] = [];
    let counter = 1;

    // Check what letter or formula is effective
    const effectiveLetter = activeSurahLetter || activeLetter;

    targetVerses.forEach(verse => {
      const gatheringInfo = checkVerseNooraniGathering(verse.text, activeSurah.letters);
      const verseWords = verse.text.split(/\s+/).filter((w: string) => w.trim().length > 0);
      const verseWordCount = verseWords.length;
      const cleanV = cleanForCalculations(verse.text);
      let verseLetterCount = 0;
      for (let i = 0; i < cleanV.length; i++) {
        if (JUMMAL_MAP[cleanV[i]] !== undefined) {
          verseLetterCount++;
        }
      }

      const getWordLetterCount = (wordStr: string) => {
        const cleanW = cleanForCalculations(wordStr);
        let count = 0;
        for (let i = 0; i < cleanW.length; i++) {
          if (JUMMAL_MAP[cleanW[i]] !== undefined) {
            count++;
          }
        }
        return count;
      };

      const pushRow = (m: NooraniMatchedWordResult, trackLabel?: string) => {
        results.push({
          index: counter++,
          surahId: verse.surahId,
          surahName: verse.surahName,
          verseNumber: verse.verseNumber,
          verseText: verse.text,
          verseWordCount,
          verseLetterCount,
          wordLetterCount: getWordLetterCount(m.word),
          trackLabel,
          isGatheringAllVerse: gatheringInfo.isGatheringAll,
          verseGatheringLetters: gatheringInfo.matchedLetters,
          verseGatheringSummary: gatheringInfo.summaryLabel,
          ...m
        });
      };

      if (effectiveLetter) {
        // Individual letter match: matches any word having this letter
        const matches = getNooraniWordMatches(verse.text, effectiveLetter, activeSurah.digitalRoot, onlyCompatible, 'any_letter');
        matches.forEach(m => pushRow(m, `فلترة حرف [${effectiveLetter}]`));
      } else if (activeFormula) {
        // Compound formula from top pills
        const matches = getNooraniWordMatches(verse.text, activeFormula, activeSurah.digitalRoot, onlyCompatible, 'all_letters');
        matches.forEach(m => pushRow(m, `صيغة [${activeFormula}]`));
      } else if (isWholeFormulaOnly) {
        // Whole formula in single word
        const matches = getNooraniWordMatches(verse.text, activeSurah.letters, activeSurah.digitalRoot, onlyCompatible, 'all_letters');
        matches.forEach(m => pushRow(m, `حروف [${activeSurah.letters}] مجتمعة`));
      } else if (activeSurah.id === 42 && searchScope === 'single_surah') {
        // Handle Surah Al-Shura tracks
        if (shuraTrack === 'both' || shuraTrack === 'hameem') {
          const matchesH = getNooraniWordMatches(verse.text, 'حم', 3, onlyCompatible, 'all_letters');
          matchesH.forEach(m => pushRow(m, 'مسار حم (معامل 3)'));
        }
        if (shuraTrack === 'both' || shuraTrack === 'asaq') {
          const matchesA = getNooraniWordMatches(verse.text, 'عسق', 5, onlyCompatible, 'all_letters');
          matchesA.forEach(m => pushRow(m, 'مسار عسق (معامل 5)'));
        }
      } else {
        // Default extraction
        const defaultMatchMode = activeSurah.letters.length >= 4 ? 'any_letter' : 'all_letters';
        const matches = getNooraniWordMatches(verse.text, activeSurah.letters, activeSurah.digitalRoot, onlyCompatible, defaultMatchMode);
        matches.forEach(m => pushRow(m));
      }
    });

    return results;
  }, [
    activeSurah, 
    searchScope, 
    onlyCompatible, 
    shuraTrack, 
    activeFormula, 
    activeLetter, 
    activeSurahLetter, 
    isGatheringVersesOnly, 
    isWholeFormulaOnly
  ]);

  // Robust live search across extracted words and Quranic text
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return extractedWords;
    const qRaw = searchQuery.trim();
    const qLower = qRaw.toLowerCase();
    const normQ = normalizeArabicForSearch(qRaw);

    return extractedWords.filter(item => {
      // 1. Direct word or verse match
      if (item.word.toLowerCase().includes(qLower)) return true;
      if (item.verseText.toLowerCase().includes(qLower)) return true;
      if (item.surahName.toLowerCase().includes(qLower)) return true;
      if (String(item.verseNumber) === qRaw) return true;
      if (String(item.wordJummal) === qRaw) return true;

      // 2. Direct letter search in matched letters
      if (item.matchedLetters.some(l => l.includes(qRaw) || normalizeArabicForSearch(l) === normQ)) return true;

      // 3. Normalized search on word & verse (handles tashkeel, dagger alifs, hamzas, taa marbuta)
      if (normQ) {
        if (normalizeArabicForSearch(item.word).includes(normQ)) return true;
        if (normalizeArabicForSearch(item.verseText).includes(normQ)) return true;
      }

      return false;
    });
  }, [extractedWords, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = filteredWords.length;
    const exactCount = filteredWords.filter(w => w.isExact).length;
    const exactPct = total > 0 ? Math.round((exactCount / total) * 100) : 0;
    const totalJummal = filteredWords.reduce((s, w) => s + w.wordJummal, 0);
    const avgJummal = total > 0 ? Math.round(totalJummal / total) : 0;
    const gatheringVersesCount = new Set(
      filteredWords.filter(w => w.isGatheringAllVerse).map(w => `${w.surahId}_${w.verseNumber}`)
    ).size;

    // Map unique verses for accurate word and letter counts
    const verseMap = new Map<string, { surahId: number; verseNumber: number; wordCount: number; letterCount: number }>();
    filteredWords.forEach(w => {
      const key = `${w.surahId}_${w.verseNumber}`;
      if (!verseMap.has(key)) {
        verseMap.set(key, {
          surahId: w.surahId,
          verseNumber: w.verseNumber,
          wordCount: w.verseWordCount || 0,
          letterCount: w.verseLetterCount || 0
        });
      }
    });

    const uniqueVerses = Array.from(verseMap.values());
    const uniqueVersesCount = uniqueVerses.length;
    const totalVerseWords = uniqueVerses.reduce((sum, v) => sum + v.wordCount, 0);
    const totalVerseLetters = uniqueVerses.reduce((sum, v) => sum + v.letterCount, 0);
    const totalWordLetters = filteredWords.reduce((sum, w) => sum + (w.wordLetterCount || 0), 0);

    return {
      total,
      exactCount,
      exactPct,
      totalJummal,
      avgJummal,
      gatheringVersesCount,
      uniqueVersesCount,
      totalVerseWords,
      totalVerseLetters,
      totalWordLetters
    };
  }, [filteredWords]);

  // Unique verses matching the filtered words
  const matchingVerseRefs = useMemo(() => {
    const map = new Map<string, { surahId: number; verseNumber: number }>();
    filteredWords.forEach(w => {
      const key = `${w.surahId}_${w.verseNumber}`;
      if (!map.has(key)) {
        map.set(key, { surahId: w.surahId, verseNumber: w.verseNumber });
      }
    });
    return Array.from(map.values());
  }, [filteredWords]);

  const handleTransferFilteredVerses = () => {
    if (matchingVerseRefs.length === 0) {
      if (onSelectSurahForAnalysis && activeSurah) {
        onSelectSurahForAnalysis(activeSurah);
      }
      return;
    }

    if (onTransferVersesToOutput && activeSurah) {
      const filterDesc = searchQuery.trim() 
        ? `بحث: «${searchQuery}»`
        : isGatheringVersesOnly
          ? `الآيات الجامعة لحروف ${activeSurah.letters}`
          : activeSurahLetter
            ? `حرف [${activeSurahLetter}]`
            : activeFormula 
              ? `صيغة [${activeFormula}]` 
              : activeLetter 
                ? `حرف [${activeLetter}]` 
                : 'الحروف النورانية والآيات المفلترة';
      onTransferVersesToOutput(matchingVerseRefs, `سورة ${activeSurah.name} (${filterDesc})`, activeSurah);
    } else if (onSelectSurahForAnalysis && activeSurah) {
      onSelectSurahForAnalysis(activeSurah);
    }
  };

  // Transfer specifically the gathering verses to the output screen
  const handleTransferGatheringVersesToOutput = () => {
    if (!activeSurah || surahGatheringVerses.length === 0 || !onTransferVersesToOutput) return;
    const refs = surahGatheringVerses.map(v => ({ surahId: v.surahId, verseNumber: v.verseNumber }));
    onTransferVersesToOutput(
      refs, 
      `الآيات الجامعة لكافة حروف ${activeSurah.letters} (${refs.length} آية)`, 
      activeSurah
    );
    showToast(`تم نقل ${refs.length} آية جامعة إلى شاشة المخرجات بنجاح! 🚀`);
  };

  // Export specifically the gathering verses to Excel (.xlsx)
  const handleExportGatheringVersesExcel = async () => {
    if (!activeSurah || surahGatheringVerses.length === 0) return;
    
    const headers = [
      'م',
      'السورة',
      'رقم الآية',
      'النص القرآني الكريـم',
      'حساب الجمل الكبير',
      'عدد الكلمات',
      'عدد الحروف',
      'الحروف النورانية المتوفرة بالآية',
      'المعامل النوراني',
      'ناتج القسمة',
      'حالة التوافق الرياضي',
      'الجمع النوراني'
    ];
    
    const colWidths = [6, 16, 12, 60, 16, 14, 14, 24, 14, 16, 16, 26];
    
    const rows = surahGatheringVerses.map((v, idx) => {
      const g = checkVerseNooraniGathering(v.text, activeSurah.letters);
      const cleanW = removeTashkeel(v.text).split(/\s+/).filter(Boolean);
      let vJummal = 0;
      cleanW.forEach(w => {
        const clean = w.replace(/[^\u0621-\u064A]/g, '');
        for (const ch of clean) {
          vJummal += JUMMAL_MAP[ch] || 0;
        }
      });
      const divisor = activeSurah.digitalRoot > 0 ? activeSurah.digitalRoot : 1;
      const isExact = vJummal % divisor === 0;
      const quotientStr = isExact ? (vJummal / divisor).toString() : (vJummal / divisor).toFixed(2);
      
      return [
        idx + 1,
        v.surahName,
        v.verseNumber,
        v.text,
        vJummal,
        cleanW.length,
        v.text.replace(/[^\u0621-\u064A]/g, '').length,
        g.matchedLetters.join(' - '),
        activeSurah.digitalRoot,
        quotientStr,
        isExact ? 'متوافقة ✅' : 'كسر ⭕',
        `آية جامعة لكافة حروف (${activeSurah.letters}) ⭐`
      ];
    });

    const excelBlob = await generateTableExcelBlob({
      sheetTitle: `آيات جامعة ${activeSurah.letters}`,
      headers,
      rows,
      colWidths,
      rightToLeft: true
    });

    setExportModalState({
      isOpen: true,
      format: 'xlsx',
      defaultFileName: `الآيات_الجامعة_لحروف_${activeSurah.letters}_سورة_${activeSurah.name}`,
      data: excelBlob,
      onSuccessToast: `تم تصدير ملف Excel للآيات الجامعة (${surahGatheringVerses.length} آية) بنجاح! 📊✨`
    });
  };

  // Export specifically the gathering verses to Word (.docx)
  const handleExportGatheringVersesDocx = async () => {
    if (!activeSurah || surahGatheringVerses.length === 0) return;
    try {
      const versesData = surahGatheringVerses.map((v, idx) => {
        const g = checkVerseNooraniGathering(v.text, activeSurah.letters);
        const cleanW = removeTashkeel(v.text).split(/\s+/).filter(Boolean);
        let vJummal = 0;
        cleanW.forEach(w => {
          const clean = w.replace(/[^\u0621-\u064A]/g, '');
          for (const ch of clean) {
            vJummal += JUMMAL_MAP[ch] || 0;
          }
        });
        const divisor = activeSurah.digitalRoot > 0 ? activeSurah.digitalRoot : 1;
        const isExact = vJummal % divisor === 0;
        const quotientStr = isExact ? (vJummal / divisor).toString() : (vJummal / divisor).toFixed(2);

        return {
          index: idx + 1,
          verseNumber: v.verseNumber,
          verseText: v.text,
          jummalValue: vJummal,
          wordCount: cleanW.length,
          letterCount: v.text.replace(/[^\u0621-\u064A]/g, '').length,
          matchedLetters: g.matchedLetters,
          isExact,
          quotientStr
        };
      });

      const blob = await generateNooraniGatheringVersesDocxBlob({
        surahTitle: `سورة ${activeSurah.name}`,
        surahNumber: activeSurah.id,
        openingLetters: activeSurah.letters,
        digitalRoot: activeSurah.digitalRoot,
        verses: versesData
      });

      setExportModalState({
        isOpen: true,
        format: 'docx',
        defaultFileName: `الآيات_الجامعة_لحروف_${activeSurah.letters}_سورة_${activeSurah.name}`,
        data: blob,
        onSuccessToast: `تم تصدير مستند Word الأصلي للآيات الجامعة (${surahGatheringVerses.length} آية) بنجاح! 📄✨`
      });
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تصدير ملف Word للآيات الجامعة.');
    }
  };

  // Copy specifically the gathering verses text
  const handleCopyGatheringVerses = async () => {
    if (!activeSurah || surahGatheringVerses.length === 0) return;
    let text = `⭐ قائمة الآيات الجامعة لكافة حروف الفاتحة النورانية («${activeSurah.letters}») - سورة ${activeSurah.name}:\n`;
    text += `• عدد الآيات الجامعة: ${surahGatheringVerses.length} آية شريفة\n`;
    text += `• المعامل النوراني: ${activeSurah.digitalRoot} | جمل الفاتحة: ${activeSurah.keyValue}\n`;
    text += `------------------------------------------------------------\n`;
    surahGatheringVerses.forEach((v, idx) => {
      const g = checkVerseNooraniGathering(v.text, activeSurah.letters);
      text += `${idx + 1}. [آية ${v.verseNumber}]: ( ${v.text} )\n`;
      text += `   - الحروف المتوفرة: [${g.matchedLetters.join(' - ')}] (كاملة ⭐)\n\n`;
    });
    text += `«منظومة البنيان الرقمي للقرآن الكريم» • تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}`;
    await copyToClipboard(text);
    showToast(`تم نسخ الآيات الجامعة (${surahGatheringVerses.length} آية) بنجاح! 📋✨`);
  };

  // Copy full table to clipboard
  const handleCopyResults = async () => {
    if (!activeSurah || filteredWords.length === 0) return;

    let textToCopy = `📋 نتائج استخراج الحروف النورانية والكلمات (${activeSurah.letters}) - سورة ${activeSurah.name}:\n`;
    textToCopy += `• المعامل النوراني الحاكم: ${activeSurah.digitalRoot} (جمل الفاتحة: ${activeSurah.keyValue})\n`;
    textToCopy += `• نطاق البحث: ${searchScope === 'single_surah' ? `سورة ${activeSurah.name}` : searchScope === 'all_29' ? 'كافة السور الـ 29 النورانية' : 'المصحف كاملاً 114 سورة'}\n`;
    textToCopy += `• إحصائيات الجدول: عدد الآيات: ${stats.uniqueVersesCount} آية | عدد الكلمات: ${stats.total} مفردة (${stats.totalVerseWords} كلمة بالآيات) | عدد الحروف: ${stats.totalVerseLetters.toLocaleString()} حرف\n`;
    textToCopy += `• الكلمات المتوافقة تماماً: ${stats.exactCount} (${stats.exactPct}%)\n`;
    textToCopy += `------------------------------------------------------------\n`;

    filteredWords.forEach((w, idx) => {
      textToCopy += `${idx + 1}. كلمة [${w.word}] | سورة ${w.surahName} آية (${w.verseNumber})\n`;
      textToCopy += `   - الآية الكريمة: ( ${w.verseText} )\n`;
      textToCopy += `   - عدد كلمات الآية: ${w.verseWordCount} | عدد حروف الآية: ${w.verseLetterCount}\n`;
      textToCopy += `   - الحروف النورانية فيها: [${w.matchedLetters.join(' - ')}] | حساب الجمل: ${w.wordJummal} | جمل الحروف: ${w.lettersJummal}\n`;
      textToCopy += `   - القسمة على المعامل (${activeSurah.digitalRoot}): ${w.quotientStr} ${w.isExact ? '✅ [متوافقة]' : '❌ [كسر]'}\n`;
      textToCopy += `   - الجمع النوراني للآية: ${w.isGatheringAllVerse ? `⭐ آية جامعة لكافة حروف (${activeSurah.letters})` : w.verseGatheringSummary}\n\n`;
    });

    textToCopy += `«منظومة البنيان للقرآن الكريم» • تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}`;

    await copyToClipboard(textToCopy);
    setIsCopied(true);
    showToast('تم نسخ جدول الحروف النورانية بنجاح! 📋✨');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Copy single word row
  const handleCopySingleRow = async (row: ExtractedWordRow) => {
    if (!activeSurah) return;
    const rowKey = `${row.surahId}_${row.verseNumber}_${row.word}_${row.index}`;
    let text = `الكلمة القرآنية المستخرجة: [${row.word}]\n`;
    text += `• السورة: ${row.surahName} (آية ${row.verseNumber})\n`;
    text += `• الآية الكريمة: ( ${row.verseText} )\n`;
    text += `• عدد كلمات الآية: ${row.verseWordCount} | عدد حروف الآية: ${row.verseLetterCount}\n`;
    text += `• الحروف النورانية الشاملة: [${row.matchedLetters.join(' - ')}]\n`;
    text += `• حساب جمل الكلمة: ${row.wordJummal} | جمل الحروف: ${row.lettersJummal}\n`;
    text += `• القسمة على المعامل (${activeSurah.digitalRoot}): ${row.quotientStr} ${row.isExact ? '✅ متوافقة' : '❌ كسر'}\n`;
    text += `• الجمع النوراني للآية: ${row.isGatheringAllVerse ? `⭐ آية جامعة لكافة حروف (${activeSurah.letters})` : row.verseGatheringSummary}`;

    await copyToClipboard(text);
    setCopiedRowId(rowKey);
    showToast(`تم نسخ بيانات الكلمة [${row.word}]`);
    setTimeout(() => setCopiedRowId(null), 2000);
  };

  // Export to native Word (.docx)
  const handleExportDocx = async () => {
    if (!activeSurah || filteredWords.length === 0) return;
    try {
      const blob = await generateNooraniWordsDocxBlob({
        surahTitle: searchScope === 'single_surah' ? `سورة ${activeSurah.name}` : searchScope === 'all_29' ? 'كافة السور الـ 29 النورانية' : 'المصحف الشريف',
        openingLetters: activeSurah.letters,
        digitalRoot: activeSurah.digitalRoot,
        words: filteredWords.map((w, idx) => ({
          index: idx + 1,
          surahName: w.surahName,
          verseNumber: w.verseNumber,
          word: w.word,
          matchedLetters: w.matchedLetters,
          wordJummal: w.wordJummal,
          lettersJummal: w.lettersJummal,
          quotientStr: w.quotientStr,
          isExact: w.isExact,
          verseSnippet: w.verseText,
          verseWordCount: w.verseWordCount,
          verseLetterCount: w.verseLetterCount
        }))
      });

      setExportModalState({
        isOpen: true,
        format: 'docx',
        defaultFileName: `استخراج_الحروف_النورانية_${activeSurah.letters}_سورة_${activeSurah.name}`,
        data: blob,
        onSuccessToast: 'تم تصدير مستند Word الأصلي بنجاح! 📄✨'
      });
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تصدير ملف Word.');
    }
  };

  // Export to Excel (.xlsx) with table columns
  const handleExportCsv = async () => {
    if (!activeSurah || filteredWords.length === 0) return;
    const headers = [
      'م', 
      'السورة', 
      'رقم الآية', 
      'الآية الكريمة',
      'عدد كلمات الآية',
      'عدد حروف الآية',
      'الجمع النوراني للآية',
      'الكلمة القرآنية', 
      'الحروف النورانية', 
      'حساب جمل الكلمة', 
      'جمل الحروف', 
      'المعامل النوراني',
      'ناتج القسمة', 
      'حالة التوافق'
    ];
    const colWidths = [6, 16, 10, 68, 14, 14, 22, 18, 18, 14, 14, 12, 14, 14];
    const rows = filteredWords.map((w, idx) => [
      idx + 1,
      w.surahName,
      w.verseNumber,
      w.verseText,
      w.verseWordCount,
      w.verseLetterCount,
      w.isGatheringAllVerse ? `آية جامعة لكافة حروف (${activeSurah.letters}) ⭐` : w.verseGatheringSummary,
      w.word,
      w.matchedLetters.join(' '),
      w.wordJummal,
      w.lettersJummal,
      activeSurah.digitalRoot,
      w.quotientStr,
      w.isExact ? 'متوافقة' : 'غير متوافقة'
    ]);

    const excelBlob = await generateTableExcelBlob({
      sheetTitle: 'الحروف النورانية',
      headers,
      rows,
      colWidths,
      rightToLeft: true
    });

    setExportModalState({
      isOpen: true,
      format: 'xlsx',
      defaultFileName: `الحروف_النورانية_${activeSurah.letters}_${activeSurah.name}`,
      data: excelBlob,
      onSuccessToast: 'تم تصدير ملف Excel (.xlsx) الأصلي بنجاح مع ضبط الأعمدة والجداول! 📊'
    });
  };

  return (
    <div className="bg-white border-2 border-emerald-800/60 p-6 md:p-8 space-y-6 text-right rounded-2xl shadow-md relative" dir="rtl">
      <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-800 via-amber-500 to-emerald-800 rounded-t-2xl" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-250/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-900 text-amber-300 rounded-xl shadow-inner">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg md:text-xl font-black text-emerald-950">
                مستكشف وباحث الحروف النورانية (29 سورة)
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                محرك الاستقصاء المباشر
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              استخراج وفلترة الحروف المقطعة والكلمات المشتملة عليها والآيات الجامعة للفواتح وتوافقاتها الرياضية بدقة
            </p>
          </div>
        </div>

        {/* Quick actions on the top right */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyResults}
            disabled={!activeSurah || filteredWords.length === 0}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="نسخ جدول الحروف النورانية"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{isCopied ? 'تم النسخ' : 'نسخ النتائج'}</span>
          </button>

          <button
            onClick={handleExportDocx}
            disabled={!activeSurah || filteredWords.length === 0}
            className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-950 text-amber-200 font-bold text-xs rounded-xl border border-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="تصدير ملف Word (.docx)"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>تصدير Word</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!activeSurah || filteredWords.length === 0}
            className="px-3.5 py-2 bg-white hover:bg-amber-50 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="تصدير ملف Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-black text-xs rounded-xl shadow-sm animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Selection & Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#fdfcf7] p-5 border border-amber-200/80 rounded-2xl">
        {/* Surah Dropdown: Starts on '0: اختيار سورة' rather than default Al-Baqarah */}
        <div className="space-y-1.5">
          <label htmlFor="noorani-surah-picker" className="block text-xs font-black text-slate-800">
            📖 السورة النورانية المستهدفة (من الـ 29):
          </label>
          <select
            id="noorani-surah-picker"
            value={selectedSurahId}
            onChange={(e) => handleSelectSurah(parseInt(e.target.value, 10))}
            className="w-full bg-white border border-amber-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-xs font-black text-slate-900 cursor-pointer outline-none shadow-sm"
          >
            <option value={0}>اختيار سورة من الـ 29 سورة النورانية...</option>
            {NOORANI_SURAHS.map((s, idx) => (
              <option key={s.id} value={s.id}>
                {idx + 1}. سورة {s.name} (رقم {s.id}) [الفاتحة: {s.letters} | المعامل: {s.digitalRoot}]
              </option>
            ))}
          </select>
        </div>

        {/* Search Scope */}
        <div className="space-y-1.5">
          <label htmlFor="search-scope-picker" className="block text-xs font-black text-slate-800">
            🔍 نطاق البحث واستخراج المفردات:
          </label>
          <select
            id="search-scope-picker"
            value={searchScope}
            onChange={(e: any) => setSearchScope(e.target.value)}
            disabled={!activeSurah}
            className="w-full bg-white border border-amber-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-xs font-black text-slate-900 cursor-pointer outline-none shadow-sm disabled:opacity-60"
          >
            <option value="single_surah">
              {activeSurah ? `ضمن سورة ${activeSurah.name} فقط` : 'ضمن السورة المختارة فقط'}
            </option>
            <option value="all_29">كافة السور الـ 29 النورانية مجتمعة</option>
            <option value="all_quran">
              {activeSurah ? `المصحف كاملاً (114 سورة) بالأحرف (${activeSurah.letters})` : 'المصحف كاملاً (114 سورة)'}
            </option>
          </select>
        </div>

        {/* Compatibility Filter Mode */}
        <div className="space-y-1.5">
          <label htmlFor="compatibility-mode-picker" className="block text-xs font-black text-slate-800">
            ⚖️ شرط التوافق والتحقق الرياضي:
          </label>
          <select
            id="compatibility-mode-picker"
            value={onlyCompatible ? 'only_compatible' : 'all_words'}
            onChange={(e) => setOnlyCompatible(e.target.value === 'only_compatible')}
            disabled={!activeSurah}
            className="w-full bg-white border border-amber-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-xs font-black text-slate-900 cursor-pointer outline-none shadow-sm disabled:opacity-60"
          >
            <option value="all_words">🌐 كافة الكلمات المحتوية على الحروف النورانية (الافتراضي)</option>
            <option value="only_compatible">✅ الكلمات المتوافقة رياضياً فقط (دون كسور)</option>
          </select>
        </div>
      </div>

      {/* If NO Surah is selected yet, show clean guidance without duplicate surah list */}
      {!activeSurah ? (
        <div className="p-10 md:p-14 text-center bg-[#FAF8F5] border-2 border-dashed border-amber-300/80 rounded-2xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-amber-300 flex items-center justify-center mx-auto shadow-inner">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-emerald-950">
              يرجى اختيار سورة نورانية من القائمة المنسدلة أعلاه 📖
            </h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-semibold">
              اختر السورة المستهدفة من القائمة المنسدلة بالأعلى للبدء في استعراض وفلترة حروفها النورانية المقطعة والآيات الجامعة للفواتح وتوافقاتها الحسابية.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* DEDICATED SURAH NOORANI LETTERS FILTER BAR (فلترة حروف السورة النشطة) */}
          <div className="p-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 rounded-2xl border-2 border-amber-500/60 text-amber-100 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-700/60 pb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="text-xs font-black text-amber-300">
                  فلاتر أحرف سورة {activeSurah.name} النورانية (« {activeSurah.letters} ») - المعامل: {activeSurah.digitalRoot}:
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(activeSurahLetter || isGatheringVersesOnly || isWholeFormulaOnly || activeLetter || activeFormula) && (
                  <button
                    type="button"
                    onClick={handleClearLettersActivation}
                    className="px-2.5 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-black text-[11px] rounded-lg border border-rose-500 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    title="إلغاء تنشيط الفلاتر والعودة للوضع العام"
                  >
                    <X className="w-3 h-3" />
                    <span>إلغاء التنشيط والعودة للعام</span>
                  </button>
                )}
              </div>
            </div>

            {/* Letters Chips for Active Surah + Gathering Verses Badge */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* General View Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveSurahLetter(null);
                  setIsGatheringVersesOnly(false);
                  setIsWholeFormulaOnly(false);
                  setActiveLetter(null);
                  setActiveFormula(null);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  !activeSurahLetter && !isGatheringVersesOnly && !isWholeFormulaOnly && !activeLetter && !activeFormula
                    ? 'bg-amber-400 text-slate-950 border-amber-500 font-black shadow-md ring-2 ring-amber-300/60 scale-105'
                    : 'bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 border-emerald-700'
                }`}
              >
                <span>الكل (عرض عام)</span>
              </button>

              {/* Individual Letters of this Surah (e.g. ك, هـ, ي, ع, ص in Maryam) */}
              {surahDistinctLetters.map(item => {
                const isItemActive = activeSurahLetter === item.char || activeLetter === item.char;
                const wordCount = surahLetterWordCounts[item.char] || surahLetterWordCounts[item.norm] || 0;

                return (
                  <button
                    type="button"
                    key={item.char}
                    onClick={() => handleToggleSurahLetter(item.char)}
                    className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isItemActive
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-300/60 scale-105 font-black'
                        : 'bg-emerald-900/90 hover:bg-emerald-800 text-amber-200 border-emerald-600 hover:border-amber-400'
                    }`}
                    title={`فلترة الكلمات المشتملة على حرف [${item.char}] (جمل: ${item.jummal}) في سورة ${activeSurah.name}`}
                  >
                    {isItemActive && <Check className="w-3.5 h-3.5 text-slate-950" />}
                    <span className="font-serif text-sm">{item.char}</span>
                    <span className="text-[10px] bg-emerald-950/70 text-amber-300 px-1.5 py-0.5 rounded-full font-mono border border-emerald-700/50">
                      {wordCount > 0 ? `${wordCount} كلمة` : `جمل: ${item.jummal}`}
                    </span>
                  </button>
                );
              })}

              {/* Whole formula in single word button */}
              <button
                type="button"
                onClick={handleToggleWholeFormulaOnly}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isWholeFormulaOnly
                    ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-300/60 scale-105 font-black'
                    : 'bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 border-emerald-700'
                }`}
                title={`حصر الكلمات المشتملة على كافة حروف (${activeSurah.letters}) مجتمعة في نفس اللفظ`}
              >
                {isWholeFormulaOnly && <Check className="w-3.5 h-3.5 text-slate-950" />}
                <span>حروف «{activeSurah.letters}» كاملة في كلمة</span>
              </button>

              {/* Prominent Golden Button for Verses Gathering All Opening Letters (e.g. 11 verses in Maryam) */}
              <button
                type="button"
                onClick={handleToggleGatheringVersesOnly}
                className={`px-3.5 py-1.5 text-xs font-black rounded-xl border-2 transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                  isGatheringVersesOnly
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-200 shadow-lg scale-105 animate-pulse'
                    : 'bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 text-amber-300 border-amber-400/70 hover:bg-amber-400/40 hover:border-amber-300'
                }`}
                title={`حصر وعرض الآيات التي تجمع كافة حروف (${activeSurah.letters}) الخمسة في سياق كل آية (${surahGatheringVerses.length} آية)`}
              >
                <Star className={`w-3.5 h-3.5 ${isGatheringVersesOnly ? 'text-amber-900 fill-amber-900' : 'text-amber-300 fill-amber-300'}`} />
                <span>
                  ⭐ الآيات الجامعة لكافة حروف ({activeSurah.letters}) [ {surahGatheringVerses.length} آية ]
                </span>
              </button>
            </div>
          </div>

          {/* SPECIAL HIGHLIGHT CARD FOR GATHERING VERSES (عند تفعيل الآيات الجامعة) */}
          {isGatheringVersesOnly && (
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-50 border-2 border-amber-400 p-5 rounded-2xl shadow-md space-y-4 animate-fade-in text-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-300/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-xs">
                    <Star className="w-5 h-5 fill-slate-950" />
                  </span>
                  <div>
                    <h4 className="text-sm md:text-base font-black text-amber-950 flex items-center gap-2">
                      الآيات القرآنية الجامعة لكافة حروف الفاتحة النورانية («{activeSurah.letters}»): {surahGatheringVerses.length} آية شريفة
                    </h4>
                    <p className="text-xs text-amber-900 font-semibold mt-0.5">
                      هذه الآيات الكريمة اجتمعت في سياق ألفاظ كل آية منها كافة الأحرف النورانية الخمسة لسورة {activeSurah.name} كاملة ({surahDistinctLetters.map(l => l.char).join(' - ')}).
                    </p>
                  </div>
                </div>

                {/* Direct Export Buttons for Gathering Verses */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportGatheringVersesExcel}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-amber-200 font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="تصدير الآيات الجامعة مباشرة لملف Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                    <span>تصدير الآيات لـ Excel 📊</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportGatheringVersesDocx}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-slate-900 text-amber-200 font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="تصدير الآيات الجامعة مباشرة لمستند Word"
                  >
                    <FileText className="w-4 h-4 text-amber-300" />
                    <span>تصدير الآيات لـ Word 📄</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTransferGatheringVersesToOutput}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="نقل الآيات الجامعة مباشرة لشاشة المخرجات لتطبيق كافة الفلاتر والرسوم البيانية"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>نقل للمخرجات 🚀</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyGatheringVerses}
                    className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-slate-800 font-bold text-xs rounded-xl border border-amber-300 transition-all flex items-center gap-1 cursor-pointer"
                    title="نسخ الآيات الجامعة"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>نسخ الآيات</span>
                  </button>
                </div>
              </div>

              {/* Quick list of gathering verse numbers */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-black text-amber-950">أرقام الآيات الجامعة ({surahGatheringVerses.length} آية):</span>
                {surahGatheringVerses.map(v => (
                  <span 
                    key={v.verseNumber}
                    className="px-2.5 py-1 bg-white border border-amber-300 text-amber-950 font-mono font-black rounded-lg shadow-2xs"
                  >
                    آية {v.verseNumber}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Surah Al-Shura Parallel Track Selector */}
          {selectedSurahId === 42 && searchScope === 'single_surah' && (
            <div className="bg-amber-50/80 border border-amber-300 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="font-black text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                سورة الشورى (مساران نورانيان مستقلان):
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShuraTrack('both')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    shuraTrack === 'both' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white text-slate-700 border'
                  }`}
                >
                  كلا المسارين (حم + عسق)
                </button>
                <button
                  onClick={() => setShuraTrack('hameem')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    shuraTrack === 'hameem' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white text-slate-700 border'
                  }`}
                >
                  مسار حم (معامل 3)
                </button>
                <button
                  onClick={() => setShuraTrack('asaq')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    shuraTrack === 'asaq' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white text-slate-700 border'
                  }`}
                >
                  مسار عسق (معامل 5)
                </button>
              </div>
            </div>
          )}

          {/* General 14 Individual Letters & 13 Formulas (Collapsible / Advanced) */}
          <div className="space-y-3 bg-[#FAF8F5] p-4 rounded-2xl border border-amber-200/80 shadow-xs">
            {/* Status bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-emerald-950">
                  ⚡ فلاتر الحروف والصيغ العامة الـ 14:
                </span>
                {activeFormula ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 border border-amber-600 shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                    الصيغة المنشطة: « {activeFormula} » (انقر عليها مجدداً للإلغاء)
                  </span>
                ) : activeLetter ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-800 text-amber-200 border border-emerald-900 shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                    الحرف المنشط: « {activeLetter} » (انقر عليه مجدداً للإلغاء)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-300">
                    ⚪ يمكنك تفعيل أي من الأحرف الـ 14 العامة أدناه للبحث في كامل النطاق
                  </span>
                )}
              </div>

              {(activeFormula || activeLetter) && (
                <button
                  type="button"
                  onClick={handleClearLettersActivation}
                  className="self-start sm:self-auto px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 font-black text-[11px] rounded-lg border border-rose-300 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  title="إلغاء تنشيط الحروف والعودة للوضع الطبيعي"
                >
                  <X className="w-3 h-3" />
                  <span>إلغاء تنشيط الحروف</span>
                </button>
              )}
            </div>

            {/* 14 Individual Letters */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-700">
                • الأحرف النورانية الـ 14 الفردية («نص حكيم قاطع له سر»):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {NOORANI_INDIVIDUAL_LETTERS.map(item => {
                  const isLetterActive = activeLetter === item.letter || activeSurahLetter === item.letter;
                  return (
                    <button
                      type="button"
                      key={item.letter}
                      onClick={() => handleToggleLetter(item.letter)}
                      className={`min-w-9 px-2.5 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                        isLetterActive
                          ? 'bg-emerald-800 text-amber-200 border-emerald-950 shadow-md ring-2 ring-emerald-500/60 scale-105'
                          : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-300 hover:border-amber-400'
                      }`}
                      title={`${item.letter} (جمل: ${item.jummal}) - ${isLetterActive ? 'انقر لإلغاء التنشيط' : 'انقر للتنشيط'}`}
                    >
                      {isLetterActive && <Check className="w-3 h-3 text-amber-300" />}
                      <span className="font-serif text-sm">{item.letter}</span>
                      <span className="text-[9px] opacity-70 font-mono">({item.jummal})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formula Pills */}
            <div className="space-y-1.5 pt-2.5 border-t border-amber-200/60">
              <label className="block text-[11px] font-black text-slate-700">
                • الصيغ النورانية المركبة في الـ 29 سورة:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {formulaGroups.map(fg => {
                  const isGroupActive = activeFormula === fg.formula;
                  return (
                    <button
                      type="button"
                      key={fg.formula}
                      onClick={() => handleToggleFormula(fg.formula, fg.surahIds)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isGroupActive 
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md font-black ring-2 ring-amber-400/60 scale-105' 
                          : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-300 hover:border-emerald-400'
                      }`}
                      title={isGroupActive ? 'انقر لإلغاء تنشيط هذه الصيغة' : 'انقر لتنشيط هذه الصيغة'}
                    >
                      {isGroupActive && <Check className="w-3.5 h-3.5 text-slate-950 shrink-0" />}
                      <span>{fg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Surah Info Card & Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-center">
              <span className="text-[10px] text-emerald-800 font-bold block">الفاتحة النورانية</span>
              <span className="text-xl font-black text-emerald-950 block mt-0.5 quran-font">
                « {activeSurah.letters} »
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                الجُمّل: {activeSurah.keyValue} | المعامل: {activeSurah.digitalRoot}
              </span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl text-center">
              <span className="text-[10px] text-amber-800 font-bold block">الكلمات المعروضة</span>
              <span className="text-xl font-black text-amber-950 block mt-0.5 font-mono">
                {stats.total}
              </span>
              <span className="text-[10px] text-amber-700 font-semibold">
                ضمن {matchingVerseRefs.length} آية
              </span>
            </div>

            <div className="bg-teal-50/70 border border-teal-200 p-3.5 rounded-xl text-center">
              <span className="text-[10px] text-teal-800 font-bold block">المتوافقة رياضياً ✅</span>
              <span className="text-xl font-black text-teal-950 block mt-0.5 font-mono">
                {stats.exactCount} ({stats.exactPct}%)
              </span>
              <span className="text-[10px] text-teal-700 font-semibold">
                مضاعفات صحيحة للمعامل
              </span>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border-2 border-emerald-600/70 p-3 rounded-xl text-center flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-emerald-950 font-black block">نقل الآيات للمخرجات</span>
                <span className="text-xs text-slate-600 font-medium block mt-0.5">
                  {matchingVerseRefs.length > 0 ? `${matchingVerseRefs.length} آية مفلترة` : `سورة ${activeSurah.name}`}
                </span>
              </div>
              <div className="space-y-1 mt-1.5">
                <button
                  type="button"
                  onClick={handleTransferFilteredVerses}
                  className="w-full px-2 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-black text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95"
                  title={
                    matchingVerseRefs.length > 0 
                      ? `نقل الـ ${matchingVerseRefs.length} آية المفلترة إلى جدول شاشة المخرجات لتطبيق فلاتر إضافية`
                      : `فتح كافة آيات سورة ${activeSurah.name} في شاشة المخرجات`
                  }
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {matchingVerseRefs.length > 0 
                      ? `نقل الآيات (${matchingVerseRefs.length}) 🚀` 
                      : 'فتح السورة كاملة ➡️'}
                  </span>
                </button>
                {matchingVerseRefs.length > 0 && onSelectSurahForAnalysis && (
                  <button
                    type="button"
                    onClick={() => onSelectSurahForAnalysis(activeSurah)}
                    className="w-full px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-[10px] rounded-lg border border-emerald-300 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    title={`فتح وتنشيط كافة آيات سورة ${activeSurah.name} بالكامل بالعدد الأصلي`}
                  >
                    <BookOpen className="w-3 h-3 text-emerald-700" />
                    <span>تنشيط السورة كاملة بالعدد الأصلي 📖</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Search Input within extracted results */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearchQuery('');
                  }}
                  placeholder="ابحث بالحرف (مثل: ص أو ك) أو بالكلمة أو سياق الآية الكريمة أو رقم الآية أو حساب الجمل..."
                  className="w-full bg-white border-2 border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 rounded-xl pr-10 pl-24 py-3 text-xs font-bold text-slate-900 outline-none shadow-sm transition-all placeholder:text-slate-400"
                />
                <Search className="w-4 h-4 text-emerald-700 absolute right-3.5 top-1/2 -translate-y-1/2" />
                
                {/* Single clean clear button inside the input */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs hover:scale-105 active:scale-95"
                    title="مسح وتفريغ مربع البحث (أو اضغط زر Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>مسح ✕</span>
                  </button>
                )}
              </div>

              {/* Reset All Filters button */}
              {(searchQuery || activeFormula || activeLetter || activeSurahLetter || isGatheringVersesOnly || isWholeFormulaOnly || searchScope !== 'single_surah' || onlyCompatible) && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-3.5 py-3 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  title="إعادة تعيين وتصفير البحث وكافة الفلاتر"
                >
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>تصفير الكل</span>
                </button>
              )}
            </div>

            {/* Live Filter Summary bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-semibold text-slate-600 px-1 py-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 font-bold">الآيات:</span>
                  <strong className="text-slate-950 font-mono text-xs">{stats.uniqueVersesCount}</strong>
                  <span className="text-slate-500 text-[10px]">آية</span>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                  <span className="text-emerald-700 font-bold">الكلمات:</span>
                  <strong className="text-emerald-950 font-mono text-xs">{stats.total}</strong>
                  <span className="text-emerald-700 text-[10px]">مفردة</span>
                  {stats.totalVerseWords > 0 && (
                    <span className="text-emerald-600 text-[10px] font-mono">({stats.totalVerseWords} بالآيات)</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                  <span className="text-indigo-700 font-bold">الحروف:</span>
                  <strong className="text-indigo-950 font-mono text-xs">{stats.totalVerseLetters.toLocaleString()}</strong>
                  <span className="text-indigo-700 text-[10px]">حرف بالآيات</span>
                  <span className="text-indigo-600 text-[10px] font-mono">({stats.totalWordLetters} بالمفردات)</span>
                </div>

                {searchQuery && (
                  <span className="text-amber-800 mr-1 font-bold">
                    (مصفاة ببحث: «{searchQuery}»)
                  </span>
                )}
                {isGatheringVersesOnly && (
                  <span className="text-emerald-800 mr-1 font-black">
                    (⭐ الآيات الجامعة لكافة حروف {activeSurah.letters})
                  </span>
                )}

                {matchingVerseRefs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleTransferFilteredVerses}
                    className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-black text-[11px] rounded-lg shadow-xs cursor-pointer transition-all inline-flex items-center gap-1 active:scale-95"
                    title="نقل هذه الآيات المختارة فقط إلى جدول شاشة المخرجات لتطبيق فلاتر إضافية"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>نقل الآيات المفلترة ({matchingVerseRefs.length} آية) إلى جدول المخرجات 🚀</span>
                  </button>
                )}
              </div>

              {/* Toggle button to open/close table manually */}
              <button
                type="button"
                onClick={() => setIsTableManuallyOpen(!isTableManuallyOpen)}
                className="text-emerald-800 hover:text-emerald-950 font-black cursor-pointer underline text-[11px] shrink-0"
              >
                {isTableManuallyOpen ? 'إغلاق الجدول 🔼' : 'فتح وعرض الجدول 🔽'}
              </button>
            </div>
          </div>

          {/* Extracted Words Data Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            {!isTableManuallyOpen ? (
              <div className="p-8 text-center bg-slate-50/80 space-y-2">
                <h4 className="text-sm font-black text-slate-800">الجدول مطوي حالياً 🔽</h4>
                <button
                  type="button"
                  onClick={() => setIsTableManuallyOpen(true)}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-black text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>فتح وعرض جدول الكلمات 🔽</span>
                </button>
              </div>
            ) : filteredWords.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 space-y-2">
                <Compass className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
                <p className="text-xs font-black text-slate-700">
                  لم يتم العثور على كلمات مطابقة لمعايير البحث في سورة {activeSurah.name}.
                </p>
                <p className="text-[11px] text-slate-500">
                  تأكد من كتابة الحرف بصورة صحيحة (مثل: «ص» أو «ك») أو اضغط على «تصفير الكل» لإظهار كافة مفردات وحروف السورة النورانية.
                </p>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  تصفير البحث واستعراض الحروف والمفردات
                </button>
              </div>
            ) : (
              <div className="table-container overflow-x-auto max-h-[620px]">
                <table className="w-full text-right border-collapse text-[11px] min-w-[1100px]">
                  <thead className="bg-[#092b22] text-amber-200 sticky top-0 z-10 select-none text-[11px]">
                    <tr className="border-b-2 border-emerald-800 text-center font-bold">
                      <th className="p-2 border border-emerald-800/80 number-column text-center font-black">م</th>
                      <th className="p-2 border border-emerald-800/80 font-black text-center whitespace-nowrap">السورة</th>
                      <th className="p-2 border border-emerald-800/80 number-column text-center font-black whitespace-nowrap">رقم الآية</th>
                      <th className="p-2 border border-emerald-800/80 text-right verse-column font-black">الآية الكريمة</th>
                      <th className="p-2 border border-emerald-800/80 number-column text-center font-black whitespace-nowrap" title="عدد كلمات الآية الكريمة">عدد الكلمات</th>
                      <th className="p-2 border border-emerald-800/80 number-column text-center font-black whitespace-nowrap" title="عدد حروف الآية الكريمة">عدد الحروف</th>
                      <th className="p-2 border border-emerald-800/80 text-center font-black whitespace-nowrap">الجمع النوراني</th>
                      <th className="p-2 border border-emerald-800/80 text-center font-black whitespace-nowrap">الكلمة القرآنية</th>
                      <th className="p-2 border border-emerald-800/80 text-center font-black whitespace-nowrap">الحروف النورانية</th>
                      <th className="p-2 border border-emerald-800/80 text-center font-black whitespace-nowrap">حساب الجمل</th>
                      <th className="p-2 border border-emerald-800/80 text-center font-black whitespace-nowrap">جمل الحروف</th>
                      <th className="p-2 border border-emerald-800/80 text-center font-black whitespace-nowrap">القسمة / المعامل</th>
                      <th className="p-2 border border-emerald-800/80 text-center font-black whitespace-nowrap">المطابقة</th>
                      <th className="p-2 border border-emerald-800/80 text-center w-14 font-black">نسخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredWords.map((row, idx) => {
                      const isEven = idx % 2 === 0;
                      const rowKey = `${row.surahId}_${row.verseNumber}_${row.word}_${row.index}`;
                      const isRowCopied = copiedRowId === rowKey;

                      return (
                        <tr 
                          key={rowKey}
                          className={`hover:bg-amber-50/70 transition-colors text-center ${
                            row.isGatheringAllVerse 
                              ? (isEven ? 'bg-amber-50/50' : 'bg-amber-50/80')
                              : row.isExact 
                                ? (isEven ? 'bg-emerald-50/40' : 'bg-emerald-50/70') 
                                : (isEven ? 'bg-slate-50/40' : 'bg-white')
                          }`}
                        >
                          {/* 1. التسلسل م */}
                          <td className="p-2 border border-slate-100 text-center font-mono text-[10px] text-slate-500 font-bold number-column">
                            {idx + 1}
                          </td>

                          {/* 2. اسم السورة */}
                          <td className="p-2 border border-slate-100 font-bold text-slate-800 text-xs whitespace-nowrap text-center">
                            <span className="block text-emerald-950 font-black">{row.surahName}</span>
                            {row.trackLabel && (
                              <span className="block text-[9px] text-amber-800 font-bold">{row.trackLabel}</span>
                            )}
                          </td>

                          {/* 3. رقم الآية (مطابق لشكل عمود شاشة المخرجات) */}
                          <td className="p-2 border border-slate-100 number-column text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="px-1.5 py-0.5 bg-slate-900 text-white font-black font-sans rounded-sm text-xs shadow-xs">
                                {row.verseNumber}
                              </span>
                            </div>
                          </td>

                          {/* 4. الآية الكريمة (مطابقة لشكل وحجم وخط واتجاه عمود جدول المخرجات والمدخلات) */}
                          <td 
                            className="p-2 border border-slate-100 text-right verse-column verse-text quran-font text-xs text-slate-900 font-black" 
                            title={row.verseText}
                          >
                            <span className="leading-relaxed">
                              ( {row.verseText} )
                            </span>
                          </td>

                          {/* 5. عدد الكلمات للآية */}
                          <td className="p-2 border border-slate-100 number-column text-center font-mono font-bold text-slate-800">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 font-mono font-black rounded text-[11px] border border-slate-200">
                              {row.verseWordCount}
                            </span>
                          </td>

                          {/* 6. عدد الحروف للآية */}
                          <td className="p-2 border border-slate-100 number-column text-center font-mono font-bold text-slate-800">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 font-mono font-black rounded text-[11px] border border-slate-200">
                              {row.verseLetterCount}
                            </span>
                          </td>

                          {/* 7. الجمع النوراني للآية */}
                          <td className="p-2 border border-slate-100 text-center whitespace-nowrap">
                            {row.isGatheringAllVerse ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[10px] font-black rounded-lg border border-amber-500 shadow-xs">
                                <Star className="w-3 h-3 text-amber-950 fill-amber-950 shrink-0" />
                                جامعة لـ ({activeSurah.letters}) ⭐
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md border border-slate-200">
                                {row.verseGatheringSummary}
                              </span>
                            )}
                          </td>

                          {/* 8. الكلمة القرآنية */}
                          <td className="p-2 border border-slate-100 whitespace-nowrap text-center">
                            <span className="text-sm font-black text-emerald-950 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg shadow-xs font-serif">
                              {row.word}
                            </span>
                          </td>

                          {/* 9. الحروف النورانية */}
                          <td className="p-2 border border-slate-100 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1 font-mono font-black text-emerald-800 text-xs">
                              {row.matchedLetters.map((l, lIdx) => (
                                <span key={lIdx} className="bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
                                  {l}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* 10. حساب الجمل */}
                          <td className="p-2 border border-slate-100 text-center font-mono font-black text-slate-900 text-xs">
                            {row.wordJummal}
                          </td>

                          {/* 11. جمل الحروف */}
                          <td className="p-2 border border-slate-100 text-center font-mono text-slate-600 text-xs">
                            {row.lettersJummal}
                          </td>

                          {/* 12. القسمة / المعامل */}
                          <td className="p-2 border border-slate-100 text-center font-mono text-xs whitespace-nowrap">
                            <span className="font-black text-slate-900">{row.quotientStr}</span>
                            <span className="text-[10px] text-slate-400 block">÷ {activeSurah.digitalRoot}</span>
                          </td>

                          {/* 13. المطابقة */}
                          <td className="p-2 border border-slate-100 text-center whitespace-nowrap">
                            {row.isExact ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-black rounded-md border border-emerald-300">
                                <Check className="w-3 h-3 text-emerald-700" />
                                متوافقة ✅
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md border border-slate-200">
                                كسر ⭕
                              </span>
                            )}
                          </td>

                          {/* 14. نسخ */}
                          <td className="p-2 border border-slate-100 text-center">
                            <button
                              type="button"
                              onClick={() => handleCopySingleRow(row)}
                              className="p-1.5 bg-white hover:bg-emerald-100 border border-slate-200 hover:border-emerald-400 rounded-lg text-slate-700 hover:text-emerald-900 transition-all cursor-pointer shadow-xs"
                              title="نسخ بيانات الكلمة والآية"
                            >
                              {isRowCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-[#092b22] text-amber-200 font-bold text-[11px] sticky bottom-0 z-10 border-t-2 border-emerald-700">
                    <tr>
                      <td className="p-2.5 text-center font-mono number-column">∑</td>
                      <td className="p-2.5 text-center whitespace-nowrap font-black">الإجمالي</td>
                      <td className="p-2.5 text-center number-column">
                        <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[10px]">
                          {stats.uniqueVersesCount} آية
                        </span>
                      </td>
                      <td className="p-2.5 text-right verse-column text-xs font-serif text-amber-100">
                        إجمالي آيات وكلمات وحروف الجدول المعروض
                      </td>
                      <td className="p-2.5 text-center number-column font-mono font-black text-amber-300">
                        {stats.totalVerseWords}
                      </td>
                      <td className="p-2.5 text-center number-column font-mono font-black text-amber-300">
                        {stats.totalVerseLetters.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        {stats.gatheringVersesCount > 0 ? `${stats.gatheringVersesCount} آية جامعة` : '—'}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span className="text-amber-300 font-mono font-black">{stats.total}</span> مفردة
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span className="text-amber-300 font-mono font-black">{stats.totalWordLetters}</span> حرف
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-amber-300">
                        {stats.totalJummal.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        —
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        —
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap text-amber-300">
                        {stats.exactCount} متوافقة ({stats.exactPct}%)
                      </td>
                      <td className="p-2.5 text-center">
                        —
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Concluding Note */}
      <div className="bg-[#FAF8F5] border border-amber-250 p-4 rounded-xl text-xs text-slate-600 leading-relaxed font-semibold">
        💡 <strong>قواعد الاستقصاء والجمع النوراني:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1 text-slate-700">
          <li><strong>فلترة الحروف المنفردة:</strong> يمكنك استخراج كافة الكلمات المشتملة على أي من أحرف السورة بالضغط المباشر على الحرف (مثل: [ص] أو [ك] في سورة مريم) أو كتابة الحرف بمربع البحث.</li>
          <li><strong>الآيات الجامعة للفواتح:</strong> الآيات التي تجمع في سياقها القرآني كافة الأحرف النورانية لافتتاحية السورة (مثل: الآيات الـ 11 في سورة مريم التي تجمع حروف «كهيعص» الخمسة كاملة: ك، هـ، ي، ع، ص). تم تمييزها بعمود وشارة ذهبية خاصة، مع إمكانية تصديرها بملف مستقل أو نقلها للمخرجات بنقرة واحدة.</li>
          <li><strong>التوافق الرياضي:</strong> يُحسب حساب الجمل الكبير لللفظ ويُقسَم على المعامل النوراني (الاختزال الرقمي للفاتحة)، وتُميَّز الكلمات المتوافقة دون كسر برتبة التوافق التام ✅.</li>
        </ul>
      </div>

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
