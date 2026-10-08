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
  RotateCcw
} from 'lucide-react';
import { NOORANI_SURAHS, NooraniSurah, getNooraniWordMatches, NooraniMatchedWordResult } from '../utils/jummal';
import quranData, { QuranVerse } from '../utils/quranData';
import { copyToClipboard } from '../utils/clipboard';
import { generateNooraniWordsDocxBlob } from '../utils/docxExportHelper';
import { generateTableExcelBlob } from '../utils/excelExportHelper';
import { handleSafeExport } from '../utils/exportHelper';
import { ExportModal } from './ExportModal';

interface NooraniWordExplorerProps {
  initialSurahId?: number;
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
  trackLabel?: string;
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
  initialSurahId = 2,
  onSelectSurahForAnalysis,
  onTransferVersesToOutput
}: NooraniWordExplorerProps) {
  // Selected Noorani Surah (default to 2: Al-Baqarah)
  const [selectedSurahId, setSelectedSurahId] = useState<number>(initialSurahId);
  const [searchScope, setSearchScope] = useState<'single_surah' | 'all_29' | 'all_quran'>('single_surah');
  const [onlyCompatible, setOnlyCompatible] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [shuraTrack, setShuraTrack] = useState<'both' | 'hameem' | 'asaq'>('both');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  // Active formula filter (null when no formula is active - toggle on/off)
  const [activeFormula, setActiveFormula] = useState<string | null>(null);
  // Active individual letter filter (null when no letter is active - toggle on/off)
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  // Control table visibility: closed when no search, opens automatically when searching
  const [isTableManuallyOpen, setIsTableManuallyOpen] = useState<boolean>(false);

  const handleToggleFormula = (formula: string, surahIds: number[]) => {
    if (activeFormula === formula) {
      // Toggle OFF: deactivate
      setActiveFormula(null);
      showToast(`تم إلغاء تنشيط صيغة [${formula}] وعرض الحالة العامة.`);
    } else {
      // Toggle ON: activate
      setActiveFormula(formula);
      setActiveLetter(null);
      if (!surahIds.includes(selectedSurahId)) {
        setSelectedSurahId(surahIds[0]);
      }
      showToast(`تم تنشيط صيغة [${formula}] - انقر عليها مجدداً لإلغائها.`);
    }
  };

  const handleToggleLetter = (letter: string) => {
    if (activeLetter === letter) {
      // Toggle OFF: deactivate
      setActiveLetter(null);
      showToast(`تم إلغاء تنشيط حرف [${letter}].`);
    } else {
      // Toggle ON: activate
      setActiveLetter(letter);
      setActiveFormula(null);
      showToast(`تم تنشيط حرف [${letter}] - انقر عليه مجدداً لإلغائه.`);
    }
  };

  const handleClearLettersActivation = () => {
    setActiveFormula(null);
    setActiveLetter(null);
    showToast('تم إلغاء تنشيط كافة الحروف والصيغ النورانية.');
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setActiveFormula(null);
    setActiveLetter(null);
    setSearchScope('single_surah');
    setOnlyCompatible(true);
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

  // Find active Noorani Surah object
  const activeSurah = useMemo(() => {
    return NOORANI_SURAHS.find(s => s.id === selectedSurahId) || NOORANI_SURAHS[0];
  }, [selectedSurahId]);

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

    const results: ExtractedWordRow[] = [];
    let counter = 1;

    targetVerses.forEach(verse => {
      // Determine letters and root to use
      if (activeLetter) {
        const matches = getNooraniWordMatches(verse.text, activeLetter, activeSurah.digitalRoot, onlyCompatible);
        matches.forEach(m => {
          results.push({
            index: counter++,
            surahId: verse.surahId,
            surahName: verse.surahName,
            verseNumber: verse.verseNumber,
            verseText: verse.text,
            trackLabel: `فلترة حرف [${activeLetter}]`,
            ...m
          });
        });
      } else if (activeFormula) {
        const matches = getNooraniWordMatches(verse.text, activeFormula, activeSurah.digitalRoot, onlyCompatible);
        matches.forEach(m => {
          results.push({
            index: counter++,
            surahId: verse.surahId,
            surahName: verse.surahName,
            verseNumber: verse.verseNumber,
            verseText: verse.text,
            trackLabel: `صيغة [${activeFormula}]`,
            ...m
          });
        });
      } else if (activeSurah.id === 42 && searchScope === 'single_surah') {
        // Handle Surah Al-Shura tracks
        if (shuraTrack === 'both' || shuraTrack === 'hameem') {
          const matchesH = getNooraniWordMatches(verse.text, 'حم', 3, onlyCompatible);
          matchesH.forEach(m => {
            results.push({
              index: counter++,
              surahId: verse.surahId,
              surahName: verse.surahName,
              verseNumber: verse.verseNumber,
              verseText: verse.text,
              trackLabel: 'مسار حم (معامل 3)',
              ...m
            });
          });
        }
        if (shuraTrack === 'both' || shuraTrack === 'asaq') {
          const matchesA = getNooraniWordMatches(verse.text, 'عسق', 5, onlyCompatible);
          matchesA.forEach(m => {
            results.push({
              index: counter++,
              surahId: verse.surahId,
              surahName: verse.surahName,
              verseNumber: verse.verseNumber,
              verseText: verse.text,
              trackLabel: 'مسار عسق (معامل 5)',
              ...m
            });
          });
        }
      } else {
        const matches = getNooraniWordMatches(verse.text, activeSurah.letters, activeSurah.digitalRoot, onlyCompatible);
        matches.forEach(m => {
          results.push({
            index: counter++,
            surahId: verse.surahId,
            surahName: verse.surahName,
            verseNumber: verse.verseNumber,
            verseText: verse.text,
            ...m
          });
        });
      }
    });

    return results;
  }, [activeSurah, searchScope, onlyCompatible, shuraTrack, activeFormula, activeLetter]);

  // Filter extracted words by live search text query
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return extractedWords;
    const q = searchQuery.trim().toLowerCase();
    return extractedWords.filter(item => 
      item.word.toLowerCase().includes(q) ||
      item.verseText.toLowerCase().includes(q) ||
      item.surahName.toLowerCase().includes(q) ||
      String(item.verseNumber) === q ||
      String(item.wordJummal) === q
    );
  }, [extractedWords, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = filteredWords.length;
    const exactCount = filteredWords.filter(w => w.isExact).length;
    const exactPct = total > 0 ? Math.round((exactCount / total) * 100) : 0;
    const totalJummal = filteredWords.reduce((s, w) => s + w.wordJummal, 0);
    const avgJummal = total > 0 ? Math.round(totalJummal / total) : 0;

    return {
      total,
      exactCount,
      exactPct,
      totalJummal,
      avgJummal
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
        : activeFormula 
          ? `صيغة [${activeFormula}]` 
          : activeLetter 
            ? `حرف [${activeLetter}]` 
            : 'الكلمات النورانية المفلترة';
      onTransferVersesToOutput(matchingVerseRefs, `سورة ${activeSurah.name} (${filterDesc})`, activeSurah);
    } else if (onSelectSurahForAnalysis && activeSurah) {
      onSelectSurahForAnalysis(activeSurah);
    }
  };

  // Copy full table to clipboard
  const handleCopyResults = async () => {
    if (filteredWords.length === 0) return;

    let textToCopy = `📋 نتائج استخراج الكلمات المشتملة على الأحرف النورانية (${activeSurah.letters}) - سورة ${activeSurah.name}:\n`;
    textToCopy += `• المعامل النوراني الحاكم: ${activeSurah.digitalRoot} (جمل الفاتحة: ${activeSurah.keyValue})\n`;
    textToCopy += `• نطاق البحث: ${searchScope === 'single_surah' ? `سورة ${activeSurah.name}` : searchScope === 'all_29' ? 'كافة السور الـ 29 النورانية' : 'المصحف كاملاً 114 سورة'}\n`;
    textToCopy += `• إجمالي الكلمات المستخرجة: ${stats.total} كلمة | الكلمات المتوافقة تماماً: ${stats.exactCount} (${stats.exactPct}%)\n`;
    textToCopy += `------------------------------------------------------------\n`;

    filteredWords.forEach((w, idx) => {
      textToCopy += `${idx + 1}. كلمة [${w.word}] | سورة ${w.surahName} آية (${w.verseNumber})\n`;
      textToCopy += `   - الحروف النورانية فيها: [${w.matchedLetters.join(' - ')}] | حساب الجمل: ${w.wordJummal} | جمل الحروف: ${w.lettersJummal}\n`;
      textToCopy += `   - القسمة على المعامل (${activeSurah.digitalRoot}): ${w.quotientStr} ${w.isExact ? '✅ [متوافقة]' : '❌ [كسر]'}\n`;
      textToCopy += `   - نص الآية: ( ${w.verseText} )\n\n`;
    });

    textToCopy += `«برنامج البنيان للقرآن الكريم» • تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}`;

    await copyToClipboard(textToCopy);
    setIsCopied(true);
    showToast('تم نسخ جدول الكلمات النورانية بنجاح! 📋✨');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Copy single word row
  const handleCopySingleRow = async (row: ExtractedWordRow) => {
    const rowKey = `${row.surahId}_${row.verseNumber}_${row.word}_${row.index}`;
    let text = `الكلمة النورانية المستخرجة: [${row.word}]\n`;
    text += `• السورة: ${row.surahName} (آية ${row.verseNumber})\n`;
    text += `• الحروف النورانية الشاملة: [${row.matchedLetters.join(' - ')}]\n`;
    text += `• حساب جمل الكلمة: ${row.wordJummal} | جمل الحروف: ${row.lettersJummal}\n`;
    text += `• القسمة على المعامل (${activeSurah.digitalRoot}): ${row.quotientStr} ${row.isExact ? '✅ متوافقة' : '❌ كسر'}\n`;
    text += `• الآية الكريمة: ( ${row.verseText} )`;

    await copyToClipboard(text);
    setCopiedRowId(rowKey);
    showToast(`تم نسخ بيانات الكلمة [${row.word}]`);
    setTimeout(() => setCopiedRowId(null), 2000);
  };

  // Export to native Word (.docx)
  const handleExportDocx = async () => {
    if (filteredWords.length === 0) return;
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
          verseSnippet: w.verseText
        }))
      });

      setExportModalState({
        isOpen: true,
        format: 'docx',
        defaultFileName: `استخراج_كلمات_الحروف_النورانية_${activeSurah.letters}_سورة_${activeSurah.name}`,
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
    if (filteredWords.length === 0) return;
    const headers = ['م', 'السورة', 'رقم الآية', 'الكلمة القرآنية', 'الحروف النورانية', 'حساب جمل الكلمة', 'جمل الحروف', 'ناتج القسمة', 'المعامل', 'حالة التوافق', 'نص الآية الكريمة'];
    const colWidths = [6, 16, 10, 18, 18, 14, 14, 14, 12, 14, 68];
    const rows = filteredWords.map((w, idx) => [
      idx + 1,
      w.surahName,
      w.verseNumber,
      w.word,
      w.matchedLetters.join(' '),
      w.wordJummal,
      w.lettersJummal,
      w.quotientStr,
      activeSurah.digitalRoot,
      w.isExact ? 'متوافقة' : 'غير متوافقة',
      w.verseText
    ]);

    const excelBlob = await generateTableExcelBlob({
      sheetTitle: 'كلمات نورانية',
      headers,
      rows,
      colWidths,
      rightToLeft: true
    });

    setExportModalState({
      isOpen: true,
      format: 'xlsx',
      defaultFileName: `كلمات_الحروف_النورانية_${activeSurah.letters}_${activeSurah.name}`,
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
                مستكشف وباحث الكلمات ذات الأحرف النورانية (29 سورة)
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                محرك الاستقصاء المباشر
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              استخراج وحصر الكلمات القرآنية المشتملة على حروف الفواتح النورانية وحساب توافقاتها الرياضية بدقة
            </p>
          </div>
        </div>

        {/* Quick actions on the top right */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyResults}
            disabled={filteredWords.length === 0}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="نسخ جدول الكلمات"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{isCopied ? 'تم النسخ' : 'نسخ النتائج'}</span>
          </button>

          <button
            onClick={handleExportDocx}
            disabled={filteredWords.length === 0}
            className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-950 text-amber-200 font-bold text-xs rounded-xl border border-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="تصدير ملف Word (.docx)"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>تصدير Word</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredWords.length === 0}
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

      {/* Quick Formula & Individual Letters Toggle Section */}
      <div className="space-y-3 bg-[#FAF8F5] p-4 rounded-2xl border border-amber-200/80 shadow-xs">
        {/* Status bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-emerald-950">
              ⚡ حالة تنشيط الحروف والصيغ:
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
                ⚪ الحروف غير منشطة (اضغط على أي حرف أو صيغة لتنشيطها والعكس)
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

        {/* Formula Pills */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black text-slate-700">
            • الصيغ النورانية المركبة (اضغط للتنشيط واضغط مجدداً للإلغاء):
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

        {/* 14 Individual Letters */}
        <div className="space-y-1.5 pt-2.5 border-t border-amber-200/60">
          <label className="block text-[11px] font-black text-slate-700">
            • الأحرف النورانية الـ 14 الفردية («نص حكيم قاطع له سر» - اضغط لتنشيط الحرف واضغط مجدداً لإلغائه):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {NOORANI_INDIVIDUAL_LETTERS.map(item => {
              const isLetterActive = activeLetter === item.letter;
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
      </div>

      {/* Main Selection & Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#fdfcf7] p-5 border border-amber-200/80 rounded-2xl">
        {/* Surah Dropdown */}
        <div className="space-y-1.5">
          <label htmlFor="noorani-surah-picker" className="block text-xs font-black text-slate-800">
            📖 السورة النورانية المستهدفة (من الـ 29):
          </label>
          <select
            id="noorani-surah-picker"
            value={selectedSurahId}
            onChange={(e) => setSelectedSurahId(parseInt(e.target.value, 10))}
            className="w-full bg-white border border-amber-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-xs font-black text-slate-900 cursor-pointer outline-none shadow-sm"
          >
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
            🔍 نطاق استخراج الكلمات:
          </label>
          <select
            id="search-scope-picker"
            value={searchScope}
            onChange={(e: any) => setSearchScope(e.target.value)}
            className="w-full bg-white border border-amber-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-xs font-black text-slate-900 cursor-pointer outline-none shadow-sm"
          >
            <option value="single_surah">ضمن سورة {activeSurah.name} فقط</option>
            <option value="all_29">كافة السور الـ 29 النورانية مجتمعة</option>
            <option value="all_quran">المصحف كاملاً (114 سورة) بالأحرف ({activeSurah.letters})</option>
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
            className="w-full bg-white border border-amber-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-xs font-black text-slate-900 cursor-pointer outline-none shadow-sm"
          >
            <option value="only_compatible">✅ الكلمات المتوافقة رياضياً فقط (دون كسور)</option>
            <option value="all_words">🌐 كافة الكلمات المحتوية على الأحرف النورانية</option>
          </select>
        </div>
      </div>

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
          <span className="text-[10px] text-amber-800 font-bold block">الكلمات المستخرجة</span>
          <span className="text-xl font-black text-amber-950 block mt-0.5 font-mono">
            {stats.total}
          </span>
          <span className="text-[10px] text-amber-700 font-semibold">
            كلمة مطابقة للشروط
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
              {matchingVerseRefs.length > 0 ? `${matchingVerseRefs.length} آية متطابقة` : `سورة ${activeSurah.name}`}
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
                className="text-[10px] text-slate-500 hover:text-slate-900 font-bold underline cursor-pointer block w-full text-center"
                title="فتح كافة آيات السورة في شاشة المخرجات بدلاً من الآيات المفلترة فقط"
              >
                أو فتح آيات السورة كاملة ➡️
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
              placeholder="ابحث في الكلمات المستخرجة أو نص وسياق الآية الكريمة أو رقم الآية أو حساب الجمل..."
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
          {(searchQuery || activeFormula || activeLetter || searchScope !== 'single_surah' || !onlyCompatible) && (
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              {searchQuery.trim() || activeFormula || activeLetter || isTableManuallyOpen ? (
                <>
                  عدد الكلمات المعروضة حالياً: <strong className="text-emerald-950 font-mono text-xs">{filteredWords.length}</strong> كلمة
                  {matchingVerseRefs.length > 0 && (
                    <span className="text-slate-600 mr-1.5 font-bold">
                      (ضمن <strong className="text-emerald-900 font-mono text-xs">{matchingVerseRefs.length}</strong> آية)
                    </span>
                  )}
                  {searchQuery && (
                    <span className="text-amber-800 mr-2 font-bold">
                      (مصفاة بكلمة: «{searchQuery}»)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-500 font-medium">
                  الجدول مغلق حالياً (اكتب في مربع البحث أعلاه أو فعّل حرفاً لفتحه وعرض النتائج)
                </span>
              )}
            </span>

            {matchingVerseRefs.length > 0 && (searchQuery.trim() || activeFormula || activeLetter || isTableManuallyOpen) && (
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
            {isTableManuallyOpen || searchQuery.trim() || activeFormula || activeLetter ? 'إغلاق الجدول 🔼' : 'فتح الجدول يدوياً 🔽'}
          </button>
        </div>
      </div>

      {/* Extracted Words Data Table / Closed State */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
        {!(searchQuery.trim() || activeFormula || activeLetter || isTableManuallyOpen) ? (
          <div className="p-10 text-center bg-slate-50/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
              <Search className="w-6 h-6 text-emerald-700" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800">
                الجدول مغلق في انتظار استدعاء البحث 🔍
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                يرجى كتابة كلمة أو مقطع قرآني في مربع البحث أعلاه (أو تفعيل أحد الحروف النورانية) لفتح الجدول واستعراض الكلمات المتوافقة فوراً.
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsTableManuallyOpen(true)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                <span>فتح وعرض جدول الكلمات 🔽</span>
              </button>
            </div>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 space-y-2">
            <Compass className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
            <p className="text-xs font-black text-slate-700">
              لم يتم العثور على كلمات مطابقة للمعايير المحددة في هذا النطاق.
            </p>
            <p className="text-[11px] text-slate-500">
              جرب تغيير شرط التوافق إلى «كافة الكلمات المحتوية» أو توسيع نطاق البحث ليشمل «كافة السور الـ 29 النورانية».
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-[#092b22] text-amber-200 sticky top-0 z-10 select-none text-[11px]">
                <tr>
                  <th className="p-3 text-center border-b border-emerald-800 w-12 font-black">م</th>
                  <th className="p-3 border-b border-emerald-800 font-black">السورة والآية</th>
                  <th className="p-3 border-b border-emerald-800 font-black">الكلمة القرآنية</th>
                  <th className="p-3 border-b border-emerald-800 font-black">الحروف النورانية</th>
                  <th className="p-3 text-center border-b border-emerald-800 font-black">حساب الجمل</th>
                  <th className="p-3 text-center border-b border-emerald-800 font-black">جمل الحروف</th>
                  <th className="p-3 text-center border-b border-emerald-800 font-black">القسمة / المعامل</th>
                  <th className="p-3 text-center border-b border-emerald-800 font-black">المطابقة</th>
                  <th className="p-3 border-b border-emerald-800 font-black">سياق الآية الكريمة</th>
                  <th className="p-3 text-center border-b border-emerald-800 w-16 font-black">نسخ</th>
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
                      className={`hover:bg-amber-50/60 transition-colors ${
                        row.isExact ? (isEven ? 'bg-emerald-50/40' : 'bg-emerald-50/70') : (isEven ? 'bg-slate-50/40' : 'bg-white')
                      }`}
                    >
                      <td className="p-3 text-center font-mono text-[10px] text-slate-500 font-bold">
                        {idx + 1}
                      </td>

                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                        <span className="block text-emerald-950 font-black">{row.surahName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">آية ({row.verseNumber})</span>
                        {row.trackLabel && (
                          <span className="block text-[9px] text-amber-800 font-bold">{row.trackLabel}</span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className="text-sm font-black text-emerald-950 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg shadow-xs font-serif">
                          {row.word}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono font-black text-emerald-800 text-xs">
                          {row.matchedLetters.map((l, lIdx) => (
                            <span key={lIdx} className="bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200">
                              {l}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 text-center font-mono font-black text-slate-900 text-xs">
                        {row.wordJummal}
                      </td>

                      <td className="p-3 text-center font-mono text-slate-600 text-xs">
                        {row.lettersJummal}
                      </td>

                      <td className="p-3 text-center font-mono text-xs whitespace-nowrap">
                        <span className="font-black text-slate-900">{row.quotientStr}</span>
                        <span className="text-[10px] text-slate-400 block">÷ {activeSurah.digitalRoot}</span>
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        {row.isExact ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-black rounded-md border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-700" />
                            متوافقة ✅
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md">
                            كسر
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-slate-700 text-xs max-w-xs md:max-w-sm quran-font leading-relaxed">
                        ( {row.verseText} )
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleCopySingleRow(row)}
                          className="p-1.5 bg-white hover:bg-emerald-100 border border-slate-200 hover:border-emerald-400 rounded-lg text-slate-700 hover:text-emerald-900 transition-all cursor-pointer shadow-xs"
                          title="نسخ بيانات الكلمة"
                        >
                          {isRowCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Concluding Note */}
      <div className="bg-[#FAF8F5] border border-amber-250 p-4 rounded-xl text-xs text-slate-600 leading-relaxed font-semibold">
        💡 <strong>قاعدة الاستقصاء النوراني:</strong> يتم استخراج الكلمات التي تتضمن في بنيتها اللفظية كافة الحروف المقطعة لافتتاحية السورة النورانية المعنية، ثم يُحسب حساب الجمل الكبير للفظ ويُقسَم على المعامل النوراني (الاختزال الرقمي للفاتحة). في حال جاء الناتج عدداً صحيحاً دون كسر، تستقر الكلمة على رتبة التوافق التام ✅.
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
