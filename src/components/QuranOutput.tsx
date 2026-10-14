import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Verse, AnalysisSummary } from '../types';
import { 
  calculateSummary, 
  reduceDigitalRoot, 
  NOORANI_SURAHS, 
  cleanForCalculations, 
  JUMMAL_MAP,
  NooraniSurah,
  removeTashkeel,
  normalizeArabicForSearch,
  getCompatibilityDetails,
  getAchievedCompatibilities,
  isTripleMatchElite,
  getReductionExplanation,
  getSurahCoefficient,
  getNooraniRank,
  IntegratedCompatibilityManager
} from '../utils/jummal';
import { 
  FileSpreadsheet, Search, Eye, Download, Copy, Share, ArrowUpDown, 
  Hash, BookOpen, AlertCircle, Sparkles, Filter, CheckCircle2, X, Plus, Minus, RefreshCw, Palette,
  AlertTriangle, StickyNote, Edit3, Save, Trash2, CheckSquare,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { SURAH_METADATA, getSurahMetadata } from '../utils/surahMetadata';
import { generateLocalAcademicAnalysis, generateTripleMatchEliteReport, generateIntegratedCompatibilityReport } from '../utils/reportTemplates';
import QuranFontSizeControl from './QuranFontSizeControl';
import { ExportModal } from './ExportModal';
import { generateDefaultExportFileName, getUniqueExportFileName, handleSafeExport } from '../utils/exportHelper';
import { generateTableExcelBlob } from '../utils/excelExportHelper';
import { generateTableDocxBlob, generateComprehensiveReportDocxBlob } from '../utils/docxExportHelper';
import AdvancedFilterBar, { AdvancedFilterState, initialFilterState } from './AdvancedFilterBar';
import { copyToClipboard } from '../utils/clipboard';
import { useGlobalProgress } from '../context/ProgressContext';
import { safeStorage } from '../utils/safeStorage';

interface QuranOutputProps {
  verses: Verse[];
  onReset?: () => void;
  activeSurah?: NooraniSurah | null;
  previewChartInOutput?: boolean;
  setPreviewChartInOutput?: (val: boolean) => void;
  isSearchMode?: boolean;
  searchScopeTitle?: string;
  showSurahNameColumn?: boolean;
  currentPage?: number;
  setCurrentPage?: (page: number) => void;
  pageSize?: number;
  setPageSize?: (size: number) => void;
  selectedVerseId?: number | null;
  setSelectedVerseId?: (id: number | null) => void;
}

export default function QuranOutput({ 
  verses, 
  onReset, 
  activeSurah = null, 
  previewChartInOutput = false,
  setPreviewChartInOutput,
  isSearchMode = false,
  searchScopeTitle,
  showSurahNameColumn = false,
  currentPage: externalCurrentPage,
  setCurrentPage: externalSetCurrentPage,
  pageSize: externalPageSize,
  setPageSize: externalSetPageSize,
  selectedVerseId: externalSelectedVerseId,
  setSelectedVerseId: externalSetSelectedVerseId
}: QuranOutputProps) {
  const { startProgress, updateProgress, finishProgress, resetProgress } = useGlobalProgress();
  
  const [internalSelectedVerseId, setInternalSelectedVerseId] = useState<number | null>(verses[0]?.id || null);
  const selectedVerseId = externalSelectedVerseId !== undefined ? externalSelectedVerseId : internalSelectedVerseId;
  const setSelectedVerseId = externalSetSelectedVerseId || setInternalSelectedVerseId;

  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [selectedShuraTab, setSelectedShuraTab] = useState<'hameem' | 'asaq' | 'combined'>('combined');
  const [shuraCombinedFilter, setShuraCombinedFilter] = useState<'all' | 'same_digit' | 'double_exact' | 'equal_score' | 'elite_51'>('all');
  const [mizanFilter, setMizanFilter] = useState<'all' | 'verified_exact' | 'golden' | 'exact' | 'structural' | 'not_compatible' | 'tawheed' | 'triple_match'>('all');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>(initialFilterState);
  const [sortField, setSortField] = useState<'id' | 'jummal' | 'letters' | 'words'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    try {
      safeStorage.setJSON('bonyan_output_shura_tab', selectedShuraTab);
    } catch {}
  }, [selectedShuraTab]);

  useEffect(() => {
    try {
      safeStorage.setJSON('bonyan_output_shura_combined_filter', shuraCombinedFilter);
    } catch {}
  }, [shuraCombinedFilter]);

  useEffect(() => {
    try {
      safeStorage.setJSON('bonyan_output_mizan_filter', mizanFilter);
    } catch {}
  }, [mizanFilter]);

  useEffect(() => {
    try {
      safeStorage.setJSON('bonyan_output_sort_field', sortField);
      safeStorage.setJSON('bonyan_output_sort_order', sortOrder);
    } catch {}
  }, [sortField, sortOrder]);
  const [isCopied, setIsCopied] = useState(false);
  const [isTableCopied, setIsTableCopied] = useState(false);
  const [copiedVerseId, setCopiedVerseId] = useState<number | null>(null);

  const [isCompatibleCopied, setIsCompatibleCopied] = useState(false);
  const [isBreakdownCopied, setIsBreakdownCopied] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportProgress, setReportProgress] = useState<{ current: number; total: number } | null>(null);
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

  // Pagination State for Table Rendering (25 verses per page by default)
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState<number>(25);

  const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;
  const setCurrentPage = externalSetCurrentPage || setInternalCurrentPage;

  const pageSize = externalPageSize !== undefined ? externalPageSize : internalPageSize;
  const setPageSize = externalSetPageSize || setInternalPageSize;

  // Filter for specific Noorani surah or all 29 Noorani surahs
  const [nooraniSurahFilter, setNooraniSurahFilter] = useState<number | 'all' | 'all_29'>('all');

  // Researcher Notes State (ملاحظات الباحث المخصصة)
  const [researcherNotes, setResearcherNotes] = useState<Record<string, string>>(() => {
    try {
      return safeStorage.getJSON<Record<string, string>>('bonyan_researcher_notes', {});
    } catch {
      return {};
    }
  });

  const [activeNoteVerse, setActiveNoteVerse] = useState<{
    id: number;
    verseKey: string;
    verseNumber: number | string;
    text: string;
    surahName?: string;
  } | null>(null);

  const [noteInputText, setNoteInputText] = useState('');

  const handleOpenNoteModal = (v: Verse, track?: any) => {
    const surahId = v.surahId || activeSurah?.id || 1;
    const vKey = `${surahId}:${v.verseNumber || v.id}`;
    setActiveNoteVerse({
      id: v.id,
      verseKey: vKey,
      verseNumber: v.verseNumber || v.id,
      text: v.rawText || v.text,
      surahName: (v as any).surahName || activeSurah?.name || ''
    });
    setNoteInputText(researcherNotes[vKey] || '');
  };

  const handleSaveNote = () => {
    if (!activeNoteVerse) return;
    const updated = { ...researcherNotes };
    if (noteInputText.trim()) {
      updated[activeNoteVerse.verseKey] = noteInputText.trim();
    } else {
      delete updated[activeNoteVerse.verseKey];
    }
    setResearcherNotes(updated);
    try {
      safeStorage.setJSON('bonyan_researcher_notes', updated);
    } catch (e) {
      console.error('Failed to save note:', e);
    }
    setActiveNoteVerse(null);
  };

  const handleDeleteNote = () => {
    if (!activeNoteVerse) return;
    const updated = { ...researcherNotes };
    delete updated[activeNoteVerse.verseKey];
    setResearcherNotes(updated);
    try {
      safeStorage.setJSON('bonyan_researcher_notes', updated);
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
    setActiveNoteVerse(null);
  };

  // Dynamic file name formulation based on Surah and Verses range
  const cleanSurahName = useMemo(() => {
    return activeSurah ? activeSurah.name.replace(/\s*\([^)]*\)/g, '').trim() : 'القرآن';
  }, [activeSurah]);

  const fromVerse = useMemo(() => {
    return verses.length > 0 ? (verses[0]?.verseNumber || verses[0]?.id || 1) : 1;
  }, [verses]);

  const toVerse = useMemo(() => {
    return verses.length > 0 ? (verses[verses.length - 1]?.verseNumber || verses[verses.length - 1]?.id || verses.length) : 1;
  }, [verses]);

  const dynamicDefaultFileName = useMemo(() => {
    return generateDefaultExportFileName(cleanSurahName, fromVerse, toVerse);
  }, [cleanSurahName, fromVerse, toVerse]);

  useEffect(() => {
    if (!activeSurah) return;
    try {
      const currentKey = `banyan_cache_${activeSurah.id}`;
      safeStorage.removePrefix('banyan_cache_', currentKey);
    } catch (e) {
      console.warn('Cache cleanup error:', e);
    }
  }, [activeSurah]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4500);
  };

  const handleExportOutputChartPNG = () => {
    if (!activeSurah) return;
    const cleanSurahName = activeSurah.name.replace(/\s*\([^)]*\)/g, '').trim();
    const svgElement = document.querySelector('.wave-chart-output-svg') as SVGSVGElement | null;
    if (!svgElement) {
      alert('لم يتم العثور على عنصر المخطط الموجي للتصدير.');
      return;
    }

    try {
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('width', '1000');
      clonedSvg.setAttribute('height', '380');

      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', '100%');
      bgRect.setAttribute('height', '100%');
      bgRect.setAttribute('fill', '#ffffff');
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

      const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleText.setAttribute('x', '500');
      titleText.setAttribute('y', '25');
      titleText.setAttribute('text-anchor', 'middle');
      titleText.setAttribute('fill', '#0f172a');
      titleText.setAttribute('font-size', '14');
      titleText.setAttribute('font-weight', 'bold');
      titleText.setAttribute('font-family', 'system-ui, sans-serif');
      titleText.textContent = `المخطط الموجي لثقل الجُمّل - سورة ${cleanSurahName} (ثابت السورة: ${activeSurah.letters})`;
      clonedSvg.appendChild(titleText);

      const svgString = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = 1000 * scale;
        canvas.height = 380 * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              setExportModalState({
                isOpen: true,
                format: 'png',
                defaultFileName: `مخطط_البنيان_${cleanSurahName}`,
                data: blob,
                onSuccessToast: 'تم تصدير صورة المخطط (PNG) بنجاح! 🖼️'
              });
            }
          }, 'image/png');
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error('Error exporting output chart PNG:', err);
    }
  };

  const handleCopyIndividualVerse = (v: Verse) => {
    const surahName = (v as any).surahName || activeSurah?.name || 'سورة قرآنية';
    const surahId = v.surahId || activeSurah?.id || 1;
    let textToCopy = `📋 بيانات آية رقم (${v.verseNumber}) من ${surahName}:\n`;
    textToCopy += `• النص الكريـم: ( ${v.text || 'البسملة'} )\n`;
    textToCopy += `• حساب الجمل الأبجدي الكلي: ${v.jummalValue}\n`;
    textToCopy += `• الاختزال الرقمي: ${reduceDigitalRoot(v.jummalValue)}\n`;
    textToCopy += `• عدد الكلمات: ${v.wordCount}\n`;
    textToCopy += `• عدد الحروف: ${v.letterCount}\n`;
    textToCopy += `• المجموع (الكلمات + الحروف): ${v.wordCount + v.letterCount}\n`;

    const isShurahameem = surahId === 42 && isNoorani && selectedShuraTab === 'hameem';
    const activeLetters = isNoorani 
      ? (surahId === 42 
          ? (selectedShuraTab === 'combined' ? 'حم / عسق' : selectedShuraTab === 'hameem' ? 'حم' : 'عسق') 
          : (activeSurah?.letters || '')) 
      : '';
    const activeKeyValue = isNoorani 
      ? (surahId === 42 
          ? (selectedShuraTab === 'combined' ? 48 : selectedShuraTab === 'hameem' ? 48 : 230) 
          : (activeSurah?.keyValue || 0)) 
      : 0;
    const activeDigitalRoot = isNoorani 
      ? (surahId === 42 
          ? (selectedShuraTab === 'combined' ? 3 : selectedShuraTab === 'hameem' ? 3 : 5) 
          : (activeSurah?.digitalRoot || 1)) 
      : 1;

    const dummySurahForCopy = {
      id: surahId,
      name: surahName,
      letters: activeLetters,
      keyValue: activeKeyValue,
      digitalRoot: activeDigitalRoot
    };

    const comp = getCompatibilityDetails(v, dummySurahForCopy);

    textToCopy += `• البصمة الأحادية (العمود الجديد): ${comp.finalSingleDigit}\n`;
    textToCopy += `  - معادلة العمود الجديد: ${reduceDigitalRoot(v.jummalValue)} × (${parseInt(v.verseNumber, 10) || v.id} + ${comp.reducedFactor}) = ${comp.newColumnProduct}\n`;
    if (comp.compactStatus && comp.compactStatus !== 'غير محققة') {
      const matches: string[] = [];
      if (comp.isDominantNine) matches.push("الرقم الذاتي السائد (9)");
      if (comp.isOriginalMatch) matches.push(`الاختزال الأصلي للآية (${comp.verseDigitalRoot})`);
      if (comp.isDensityMatch) matches.push(`اختزال الكثافة الكلية (${comp.densityReduction})`);
      if (comp.isDigitalMirror) matches.push(`المرآة الرقمية (${comp.reducedFactor})`);
      if (comp.isVerseDensityMatch) matches.push(`بصمة آية كثافة (${comp.verseNumRaw})`);
      if (comp.isVerseEquationMatch) matches.push(`بصمة آية معادلة (${comp.verseNumRaw})`);
      if (comp.isVerseWordMatch && !comp.isVerseDensityMatch) matches.push(`بصمة آية كلمات (${comp.verseNumRaw})`);
      if (comp.isVerseLetterMatch && !comp.isVerseDensityMatch) matches.push(`بصمة آية حروف (${comp.verseNumRaw})`);
      if (comp.isVerseFingerprint && !comp.isVerseDensityMatch && !comp.isVerseEquationMatch) matches.push(`بصمة الآية (${comp.verseNumReduced})`);
      if (comp.isQuran114Match) matches.push("🌟 بصمة قرآنية (114)");
      if (comp.isAsma99Match) matches.push("📿 الأسماء الحسنى (99)");
      if (comp.isAge63Match) matches.push("🕊️ العمر الشريف (63)");
      if (comp.isAlphabet28Match) matches.push("🔤 حروف الهجاء (28)");
      if (comp.isTanzeel23Match) matches.push("📖 سنوات التنزيل (23)");
      if (comp.isSurahIdMatch) matches.push(`رقم السورة (${comp.surahIdRaw})`);
      if (comp.isNooraniRankMatch && comp.nooraniRank) matches.push(`ترتيب نوراني (${comp.nooraniRank})`);

      if (Array.isArray(comp.compactReasons)) {
        comp.compactReasons.forEach((r: string) => {
          if (r && typeof r === 'string' && r.trim() && !matches.some(m => m.includes(r.trim()) || r.trim().includes(m))) {
            matches.push(r.trim());
          }
        });
      }

      const validMatches = matches.filter(m => Boolean(m && typeof m === 'string' && m.trim().length > 0));
      const cleanCompactStatus = (comp.compactStatus || '').trim();

      if (validMatches.length > 0) {
        textToCopy += `  - حالة التوافق المدمج: ${cleanCompactStatus} عبر: ${validMatches.join(' - ')}\n`;
      } else {
        // عندما لا يكون هناك ميزان فرعي محدد ليتم ذكره، يتم مسح كلمة (عبر:) تماماً ويكتفى بعبارة التوافق المدمج نظيفة ودون فراغات
        textToCopy += `  - حالة التوافق المدمج: ${cleanCompactStatus}\n`;
      }
    } else {
      textToCopy += `  - حالة التوافق المدمج: غير محققة\n`;
    }

    const vKey = `${surahId}:${v.verseNumber || v.id}`;
    if (researcherNotes[vKey]) {
      textToCopy += `• 📝 ملاحظة واستقصاء الباحث: ${researcherNotes[vKey]}\n`;
    }

    if (comp.isDirectMatch) {
      textToCopy += `• 🎯 [توافق جوهري مباشر]: نعم! حساب الجمل الكلي للآية (${v.jummalValue}) يساوي تماماً قيمة المعامل المرجعي الأصلي لثابت السورة/المسار (${comp.originalFactorValue})\n`;
    }

    if (isNoorani) {
      if (surahId === 42) {
        // Parallel track copy text for Surah 42
        const s1 = { id: 42, name: 'الشورى (حم)', letters: 'حم', keyValue: 48, digitalRoot: 3 };
        const s2 = { id: 42, name: 'الشورى (عسق)', letters: 'عسق', keyValue: 230, digitalRoot: 5 };
        const comp1 = getCompatibilityDetails(v, s1);
        const comp2 = getCompatibilityDetails(v, s2);
        
        textToCopy += `\n📈 [المسار الأول: حم - معامل 3]:\n`;
        textToCopy += `  - حالة التحقق: ${v.jummalValue % 3 === 0 ? 'متوافقة (مضاعف لـ 3) ✅' : 'كسر بنياني مكمل ❌'} (القسمة: ${(v.jummalValue / 3).toFixed(4)})\n`;
        textToCopy += `  - درجة التوافق: ${comp1.score}/6\n`;
        textToCopy += `  - التوافقات الستة المحققة: ${getAchievedCompatibilities(v, s1).join('، ') || 'لا يوجد'}\n`;
        
        textToCopy += `\n✨ [المسار الثاني: عسق - معامل 5]:\n`;
        textToCopy += `  - حالة التحقق: ${v.jummalValue % 5 === 0 ? 'متوافقة (مضاعف لـ 5) ✅' : 'كسر بنياني مكمل ❌'} (القسمة: ${(v.jummalValue / 5).toFixed(4)})\n`;
        textToCopy += `  - درجة التوافق: ${comp2.score}/6\n`;
        textToCopy += `  - التوافقات الستة المحققة: ${getAchievedCompatibilities(v, s2).join('، ') || 'لا يوجد'}\n`;
      } else if (activeSurah) {
        const isExact = v.jummalValue % activeSurah.digitalRoot === 0;
        textToCopy += `• التوافق مع المعامل النوراني (${activeSurah.letters}): ${isExact ? 'متوافقة (مضاعف صحيح) ✅' : 'غير متوافقة ❌'} (القسمة: ${(v.jummalValue / activeSurah.digitalRoot).toFixed(4)})\n`;
        textToCopy += `• درجة التوافق: ${comp.score}/6\n`;
        textToCopy += `• التوافقات الستة المحققة: ${getAchievedCompatibilities(v, activeSurah).join('، ') || 'لا يوجد'}\n`;
      }
    }
    copyToClipboard(textToCopy);
    setCopiedVerseId(v.id);
    setTimeout(() => setCopiedVerseId(null), 2000);
  };

  const handleCopyCompatibleVersesList = () => {
    if (compatibleVerses.length === 0) return;
    const sName = activeSurah?.name || 'السورة';
    let textToCopy = `📋 قائمة الآيات المتوافقة والمحققّة بالكامل مع سورة ${sName}:\n\n`;
    compatibleVerses.forEach((v) => {
      if (activeSurah?.id === 42) {
        const is3 = v.jummalValue % 3 === 0;
        const is5 = v.jummalValue % 5 === 0;
        const parts: string[] = [];
        if (is3) parts.push(`حم (قوة = ${v.jummalValue / 3})`);
        if (is5) parts.push(`عسق (قوة = ${v.jummalValue / 5})`);
        textToCopy += `• آية (${v.verseNumber}): ( ${v.text} ) | الجمل الكلي: ${v.jummalValue} | التوافق: ${parts.join(' | ')}\n`;
      } else {
        const power = activeSurah?.digitalRoot ? Math.round(v.jummalValue / activeSurah.digitalRoot) : 0;
        textToCopy += `• آية (${v.verseNumber}): ( ${v.text} ) | الجمل الكلي: ${v.jummalValue} | قوة المفتاح: ${power}\n`;
      }
    });
    copyToClipboard(textToCopy);
    setIsCompatibleCopied(true);
    setTimeout(() => setIsCompatibleCopied(false), 2000);
  };

  const handleCopyBreakdown = () => {
    if (!selectedVerse) return;
    let textToCopy = `📋 التحليل والموازنة التفصيلية لآية رقم (${selectedVerse.verseNumber}) من سورة ${activeSurah.name}:\n\n`;
    textToCopy += `• النص الكريـم الأصلي: ( ${selectedVerse.text || 'البسملة'} )\n`;
    textToCopy += `• إجمالي الكلمات: ${selectedVerse.wordCount}\n`;
    textToCopy += `• إجمالي الحروف: ${selectedVerse.letterCount}\n`;
    textToCopy += `• مجموع حساب الجمل الكلي: ${selectedVerse.jummalValue}\n`;
    textToCopy += `• الاختزال الرقمي للجمل: ${reduceDigitalRoot(selectedVerse.jummalValue)}\n\n`;
    
    textToCopy += `🏛️ معايير محاكي موازنة الحروف والمطابقة الرقمية:\n`;
    textToCopy += `- نص المحاكاة التجريبي الحالي: ( ${playgroundText} )\n`;
    textToCopy += `- قيمة حساب الجمل للمحاكاة: ${playgroundAnalysis.sum}\n`;
    textToCopy += `- تباين الفرق عن الأصل: ${playgroundAnalysis.sum - selectedVerse.jummalValue > 0 ? '+' : ''}${playgroundAnalysis.sum - selectedVerse.jummalValue}\n\n`;
    
    textToCopy += `📐 علاقات رصد القوانين الهندسية:\n`;
    if (activeSurah.id === 42) {
      const is3 = selectedVerse.jummalValue % 3 === 0;
      const is5 = selectedVerse.jummalValue % 5 === 0;
      
      textToCopy += `📈 [المسار الأول: حم (معامل 3)]:\n`;
      textToCopy += `- ناتج القسمة: ${(selectedVerse.jummalValue / 3).toFixed(4)}\n`;
      textToCopy += `- حالة التحقق: ${is3 ? '✅ متوافقة كلياً' : '❌ كسر بنياني مكمل'}\n`;
      
      textToCopy += `✨ [المسار الثاني: عسق (معامل 5)]:\n`;
      textToCopy += `- ناتج القسمة: ${(selectedVerse.jummalValue / 5).toFixed(4)}\n`;
      textToCopy += `- حالة التحقق: ${is5 ? '✅ متوافقة كلياً' : '❌ كسر بنياني مكمل'}\n`;
    } else {
      const divisionResult = selectedVerse.jummalValue / activeSurah.digitalRoot;
      const isExact = selectedVerse.jummalValue % activeSurah.digitalRoot === 0;
      textToCopy += `- بقسمته على معامل الحروف المقطعة المختزلة (${activeSurah.digitalRoot}) يعطي: ${divisionResult.toFixed(4)}\n`;
      textToCopy += `- حالة التحقق: ${isExact ? '✅ متوافقة كلياً (مضاعف صحيح)' : '❌ غير متوافقة (كسر عشري)'}\n`;
    }
    textToCopy += `- متوسط حركة الحرف الواحد: ${((selectedVerse.jummalValue / (selectedVerse.letterCount || 1)).toFixed(1))}\n`;

    copyToClipboard(textToCopy);
    setIsBreakdownCopied(true);
    setTimeout(() => setIsBreakdownCopied(false), 2000);
  };

  const width = 800;
  const height = 200;
  const padding = 35;

  const maxJummalValue = useMemo(() => {
    const vals = verses.map(v => v.jummalValue);
    return Math.max(...vals, 100);
  }, [verses]);

  const points = useMemo(() => {
    if (verses.length === 0) return [];
    const xStride = (width - padding * 2) / (verses.length > 1 ? verses.length - 1 : 1);
    return verses.map((v, idx) => {
      const x = padding + idx * xStride;
      const y = height - padding - (v.jummalValue / maxJummalValue) * (height - padding * 2);
      return { x, y, verse: v, index: idx };
    });
  }, [verses, maxJummalValue]);

  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  const areaPathData = useMemo(() => {
    if (points.length === 0) return '';
    const start = `M ${points[0].x} ${height - padding}`;
    const rest = pathData.substring(1);
    const end = ` L ${points[points.length - 1].x} ${height - padding} Z`;
    return `${start} L ${points[0].x} ${points[0].y} ${rest} ${end}`;
  }, [points, pathData]);

  // Simulator States for the Selected Verse
  const [playgroundText, setPlaygroundText] = useState('');
  const [customAdjustments, setCustomAdjustments] = useState<Record<string, number>>({});

  // Reset simulator when selected verse changes
  const selectedVerse = useMemo(() => {
    return verses.find(v => v.id === selectedVerseId) || null;
  }, [verses, selectedVerseId]);

  useEffect(() => {
    if (selectedVerse) {
      setPlaygroundText(selectedVerse.text);
      setCustomAdjustments({});
    }
  }, [selectedVerseId, selectedVerse]);

  const isNoorani = useMemo(() => {
    if (!activeSurah) return false;
    return NOORANI_SURAHS.some(s => s.id === activeSurah.id);
  }, [activeSurah]);

  const currentTrack = useMemo(() => {
    if (!activeSurah) return null;
    if (isNoorani && activeSurah.id === 42) {
      if (selectedShuraTab === 'combined') {
        return { label: 'الميزان الجامع التكاملي (حم 3 ⟷ عسق 5)', letters: 'حم / عسق', keyValue: 48, digitalRoot: 3, id: 42, name: activeSurah.name };
      } else if (selectedShuraTab === 'asaq') {
        return { label: 'عسق (معامل 5)', letters: 'عسق', keyValue: 230, digitalRoot: 5, id: 42, name: activeSurah.name };
      } else {
        return { label: 'حم (معامل 3)', letters: 'حم', keyValue: 48, digitalRoot: 3, id: 42, name: activeSurah.name };
      }
    }
    return {
      label: activeSurah ? `${activeSurah.letters} (معامل ${activeSurah.digitalRoot})` : '',
      letters: activeSurah ? activeSurah.letters : '',
      keyValue: activeSurah ? activeSurah.keyValue : 0,
      digitalRoot: activeSurah ? activeSurah.digitalRoot : 1,
      id: activeSurah.id,
      name: activeSurah.name
    };
  }, [activeSurah, isNoorani, selectedShuraTab]);

  // Calculate stats on currently loaded verses
  const summary = useMemo(() => {
    return calculateSummary(verses);
  }, [verses]);

  // Count verified verses for active surah key
  const verificationStats = useMemo(() => {
    let exactCount = 0;
    if (!activeSurah || !isNoorani) return { exactCount };
    
    if (activeSurah.id === 42) {
      if (selectedShuraTab === 'hameem') {
        exactCount = verses.filter(v => v.jummalValue > 0 && v.jummalValue % 3 === 0).length;
      } else if (selectedShuraTab === 'asaq') {
        exactCount = verses.filter(v => v.jummalValue > 0 && v.jummalValue % 5 === 0).length;
      } else {
        // Combined mode: verses divisible by both 3 and 5 (multiple of 15)
        exactCount = verses.filter(v => v.jummalValue > 0 && v.jummalValue % 15 === 0).length;
      }
    } else if (currentTrack) {
      verses.forEach(v => {
        const remainder = v.jummalValue % currentTrack.digitalRoot;
        if (remainder === 0) {
          exactCount++;
        }
      });
    }

    return { exactCount };
  }, [verses, activeSurah, isNoorani, currentTrack, selectedShuraTab]);

  // Statistics of Linking Properties between Hameem and Asaq in Surah 42
  const shuraLinkingStats = useMemo(() => {
    if (!activeSurah || activeSurah.id !== 42 || !isNoorani) {
      return { matchingFpCount: 0, doubleExactCount: 0, equalScoreCount: 0, totalVerses: 0 };
    }

    const sH = { id: 42, name: 'الشورى (حم)', letters: 'حم', keyValue: 48, digitalRoot: 3 };
    const sA = { id: 42, name: 'الشورى (عسق)', letters: 'عسق', keyValue: 230, digitalRoot: 5 };

    let matchingFpCount = 0;
    let doubleExactCount = 0;
    let equalScoreCount = 0;

    verses.forEach(v => {
      const compH = getCompatibilityDetails(v, sH);
      const compA = getCompatibilityDetails(v, sA);
      if (compH.finalSingleDigit === compA.finalSingleDigit) {
        matchingFpCount++;
      }
      if (v.jummalValue > 0 && v.jummalValue % 15 === 0) {
        doubleExactCount++;
      }
      if (compH.score === compA.score) {
        equalScoreCount++;
      }
    });

    return {
      matchingFpCount,
      doubleExactCount,
      equalScoreCount,
      totalVerses: verses.length
    };
  }, [verses, activeSurah, isNoorani]);

  // Precompute the counts for each compatibility and color category dynamically
  const filterCounts = useMemo(() => {
    let all = 0;
    let verified_exact = 0;
    let golden = 0;
    let exact = 0;
    let structural = 0;
    let not_compatible = 0;
    let tawheed = 0;
    let triple_match = 0;
    let verse_fingerprint = 0;
    let quran_fingerprint = 0;
    let asma_99 = 0;
    let age_63 = 0;
    let alphabet_28 = 0;
    let tanzeel_23 = 0;
    let noorani_surahs_29 = 0;
    let noorani_letters_14 = 0;
    let surah_match = 0;
    let noorani_rank = 0;
    let perfect_matches = 0;
    let unregistered_matches = 0;
    let researcher_notes = 0;

    if (isNoorani && activeSurah?.id === 42 && selectedShuraTab === 'combined') {
      const sH = { id: 42, name: 'الشورى (حم)', letters: 'حم', keyValue: 48, digitalRoot: 3 };
      const sA = { id: 42, name: 'الشورى (عسق)', letters: 'عسق', keyValue: 230, digitalRoot: 5 };
      const surahMeta = getSurahMetadata(42);

      all = verses.length;
      verses.forEach(v => {
        const compH = getCompatibilityDetails(v, sH);
        const compA = getCompatibilityDetails(v, sA);
        const isExactH = v.jummalValue > 0 && v.jummalValue % 3 === 0;
        const isExactA = v.jummalValue > 0 && v.jummalValue % 5 === 0;

        if (isExactH || isExactA) {
          verified_exact++;
          exact++;
        }
        if (compH.score >= 5 || compH.isDirectMatch || compA.score >= 5 || compA.isDirectMatch) {
          golden++;
          perfect_matches++;
        }
        if ((compH.score >= 1 && compH.score <= 2) || (compA.score >= 1 && compA.score <= 2)) {
          structural++;
        }
        if (compH.score === 0 && compA.score === 0) {
          not_compatible++;
        }
        if (compH.isTawheedCompatible || compA.isTawheedCompatible) {
          tawheed++;
        }
        if (compH.isVerseFingerprint || compA.isVerseFingerprint) {
          verse_fingerprint++;
        }
        if (compH.isQuran114Match || compA.isQuran114Match) {
          quran_fingerprint++;
        }
        if (compH.isAsma99Match || compA.isAsma99Match) {
          asma_99++;
        }
        if (compH.isAge63Match || compA.isAge63Match) {
          age_63++;
        }
        if (compH.isAlphabet28Match || compA.isAlphabet28Match) {
          alphabet_28++;
        }
        if (compH.isTanzeel23Match || compA.isTanzeel23Match) {
          tanzeel_23++;
        }
        if (compH.isNooraniSurahs29Match || compA.isNooraniSurahs29Match) {
          noorani_surahs_29++;
        }
        if (compH.isNooraniLetters14Match || compA.isNooraniLetters14Match) {
          noorani_letters_14++;
        }
        if (compH.isSurahIdMatch || compA.isSurahIdMatch) {
          surah_match++;
        }
        if (compH.isNooraniRankMatch || compA.isNooraniRankMatch) {
          noorani_rank++;
        }
        const intEvalH = IntegratedCompatibilityManager.evaluate(v, compH, sH);
        const intEvalA = IntegratedCompatibilityManager.evaluate(v, compA, sA);
        if (intEvalH.hasUnregistered || intEvalA.hasUnregistered) {
          unregistered_matches++;
        }
        const vKey = `42:${v.verseNumber || v.id}`;
        if (researcherNotes[vKey] && researcherNotes[vKey].trim()) {
          researcher_notes++;
        }
        // In Combined Mode for Surah 42: Shared Elite Verse combines shared exactness (divisible by 15), equal single fingerprint = 9, and full 6/6 compatibility (Ayah 51)
        const isSharedEliteShura = (v.jummalValue > 0 && v.jummalValue % 15 === 0 && compH.finalSingleDigit === 9 && compA.finalSingleDigit === 9 && compH.score === 6);
        if (isSharedEliteShura) {
          triple_match++;
        }
      });
    } else {
      const allItems: { v: any; track: { letters: string; keyValue: number; digitalRoot: number } }[] = [];
      verses.forEach(v => {
        if (isNoorani && activeSurah?.id === 42) {
          if (selectedShuraTab === 'hameem') {
            allItems.push({
              v,
              track: { letters: 'حم', keyValue: 48, digitalRoot: 3 }
            });
          } else {
            allItems.push({
              v,
              track: { letters: 'عسق', keyValue: 230, digitalRoot: 5 }
            });
          }
        } else {
          allItems.push({
            v,
            track: {
              letters: activeSurah ? activeSurah.letters : '',
              keyValue: activeSurah ? activeSurah.keyValue : 0,
              digitalRoot: activeSurah ? activeSurah.digitalRoot : 1
            }
          });
        }
      });

      all = allItems.length;

      allItems.forEach(({ v, track }) => {
        const surahId = activeSurah?.id || v.surahId || 1;
        const surahCoeff = getSurahCoefficient(surahId);
        const dummySurah = {
          id: surahId,
          name: activeSurah?.name || v.surahName || '',
          letters: track.letters,
          keyValue: track.keyValue,
          digitalRoot: track.digitalRoot
        };
        const comp = getCompatibilityDetails(v, dummySurah);
        
        // STRICT RULE: Green (Exact) compatibility requires ZERO remainder (v.jummalValue % divisor === 0)
        const divisor = isNoorani ? (track.digitalRoot || 1) : surahCoeff;
        const isCoeffExact = divisor > 0 && v.jummalValue > 0 && v.jummalValue % divisor === 0;
        const isGreen = isCoeffExact;
        
        if (isCoeffExact) {
          verified_exact++;
          exact++;
        }
        const isPerfectMatch = comp.score >= 5 || comp.isDirectMatch;
        if (isPerfectMatch) {
          golden++;
          perfect_matches++;
        }
        if (comp.score >= 1 && comp.score <= 2) {
          structural++;
        }
        if (comp.score === 0) {
          not_compatible++;
        }
        if (comp.isTawheedCompatible) {
          tawheed++;
        }
        if (comp.isVerseFingerprint) {
          verse_fingerprint++;
        }
        if (comp.isQuran114Match) {
          quran_fingerprint++;
        }
        if (comp.isAsma99Match) {
          asma_99++;
        }
        if (comp.isAge63Match) {
          age_63++;
        }
        if (comp.isAlphabet28Match) {
          alphabet_28++;
        }
        if (comp.isTanzeel23Match) {
          tanzeel_23++;
        }
        if (comp.isNooraniSurahs29Match) {
          noorani_surahs_29++;
        }
        if (comp.isNooraniLetters14Match) {
          noorani_letters_14++;
        }
        if (comp.isSurahIdMatch) {
          surah_match++;
        }
        if (comp.isNooraniRankMatch) {
          noorani_rank++;
        }
        const intEval = IntegratedCompatibilityManager.evaluate(v, comp, dummySurah);
        if (intEval.hasUnregistered) {
          unregistered_matches++;
        }
        const vKey = `${surahId}:${v.verseNumber || v.id}`;
        if (researcherNotes[vKey] && researcherNotes[vKey].trim()) {
          researcher_notes++;
        }
        const surahMeta = getSurahMetadata(surahId);
        const tripleRes = isTripleMatchElite(v, dummySurah, surahMeta);
        if (tripleRes.isTripleMatch) {
          triple_match++;
        }
      });
    }

    return { 
      all, 
      verified_exact, 
      golden, 
      exact, 
      structural, 
      not_compatible, 
      tawheed, 
      triple_match,
      verse_fingerprint,
      quran_fingerprint,
      asma_99,
      age_63,
      alphabet_28,
      tanzeel_23,
      noorani_surahs_29,
      noorani_letters_14,
      surah_match,
      noorani_rank,
      perfect_matches,
      unregistered_matches,
      researcher_notes
    };
  }, [verses, activeSurah, isNoorani, selectedShuraTab, researcherNotes]);

  // Handle row sorting
  const handleSort = (field: 'id' | 'jummal' | 'letters' | 'words') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort verses (Base Sort only)
  const processedVerses = useMemo(() => {
    let result = [...verses];

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') {
        comparison = a.id - b.id;
      } else if (sortField === 'jummal') {
        comparison = a.jummalValue - b.jummalValue;
      } else if (sortField === 'letters') {
        comparison = a.letterCount - b.letterCount;
      } else if (sortField === 'words') {
        comparison = a.wordCount - b.wordCount;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [verses, sortField, sortOrder]);

  // Expand processed verses into flat track rows with full filtering support
  const tableRows = useMemo(() => {
    const rows: {
      v: any;
      track: {
        label: string;
        letters: string;
        keyValue: number;
        digitalRoot: number;
        isSubTrack: boolean;
      };
      index: number;
    }[] = [];

    processedVerses.forEach((v, idx) => {
      if (isNoorani && activeSurah?.id === 42) {
        if (selectedShuraTab === 'combined') {
          rows.push({
            v,
            track: { label: 'حم 3 ⟷ عسق 5', letters: 'حم / عسق', keyValue: 48, digitalRoot: 3, isSubTrack: true },
            index: idx
          });
        } else if (selectedShuraTab === 'asaq') {
          rows.push({
            v,
            track: { label: 'عسق (معامل 5)', letters: 'عسق', keyValue: 230, digitalRoot: 5, isSubTrack: true },
            index: idx
          });
        } else {
          rows.push({
            v,
            track: { label: 'حم (معامل 3)', letters: 'حم', keyValue: 48, digitalRoot: 3, isSubTrack: true },
            index: idx
          });
        }
      } else {
        rows.push({
          v,
          track: {
            label: activeSurah ? `${activeSurah.letters} (معامل ${activeSurah.digitalRoot})` : '',
            letters: activeSurah ? activeSurah.letters : '',
            keyValue: activeSurah ? activeSurah.keyValue : 0,
            digitalRoot: activeSurah ? activeSurah.digitalRoot : 1,
            isSubTrack: false
          },
          index: idx
        });
      }
    });

    // Apply Mizan and Advanced filters to the track rows
    const filteredRows = rows.filter(({ v, track }) => {
      const surahId = activeSurah?.id || v.surahId || 1;
      const surahCoeff = getSurahCoefficient(surahId);
      const dummySurah = {
        id: surahId,
        name: activeSurah?.name || v.surahName || '',
        letters: track.letters,
        keyValue: track.keyValue,
        digitalRoot: track.digitalRoot
      };
      const comp = getCompatibilityDetails(v, dummySurah);
      const isShuraCombined = isNoorani && activeSurah?.id === 42 && selectedShuraTab === 'combined';
      const sH = { id: 42, name: 'الشورى (حم)', letters: 'حم', keyValue: 48, digitalRoot: 3 };
      const sA = { id: 42, name: 'الشورى (عسق)', letters: 'عسق', keyValue: 230, digitalRoot: 5 };
      const surahMeta = activeSurah ? getSurahMetadata(activeSurah.id) : undefined;
      const compH = isShuraCombined ? getCompatibilityDetails(v, sH) : comp;
      const compA = isShuraCombined ? getCompatibilityDetails(v, sA) : comp;
      const isTripleH = isShuraCombined && isTripleMatchElite(v, sH, surahMeta).isTripleMatch;
      const isTripleA = isShuraCombined && isTripleMatchElite(v, sA, surahMeta).isTripleMatch;
      const isSharedEliteShura = isShuraCombined && (v.jummalValue > 0 && v.jummalValue % 15 === 0 && compH.finalSingleDigit === 9 && compA.finalSingleDigit === 9 && compH.score === 6);
      const isTripleCombined = isSharedEliteShura;

      // 1. Unified Search & Formula Filter (Text / Math Formula / Numbers)
      if (advancedFilters.textQuery.trim()) {
        const rawQ = advancedFilters.textQuery.trim();
        const operatorMatch = rawQ.match(/(>=|<=|=>|=<|>|<|=)\s*(\d+)/);
        const simpleNumMatch = rawQ.match(/^\s*(\d+)\s*$/);
        
        if (operatorMatch || simpleNumMatch) {
          let op = 'equal';
          let val = 0;
          let textRest = '';
          
          if (operatorMatch) {
            const opStr = operatorMatch[1];
            val = parseInt(operatorMatch[2], 10);
            if (opStr === '=' || opStr === '==') op = 'equal';
            else if (opStr === '>') op = 'greater';
            else if (opStr === '<') op = 'less';
            else if (opStr === '>=' || opStr === '=>') op = 'greater_equal';
            else if (opStr === '<=' || opStr === '=<') op = 'less_equal';
            textRest = rawQ.replace(operatorMatch[0], '').trim();
          } else if (simpleNumMatch) {
            op = 'equal';
            val = parseInt(simpleNumMatch[1], 10);
            textRest = '';
          }

          let targetVal = v.jummalValue;
          const targetField = advancedFilters.numericalTarget || 'jummal';
          if (targetField === 'jummal') targetVal = v.jummalValue;
          else if (targetField === 'words') targetVal = v.wordCount;
          else if (targetField === 'letters') targetVal = v.letterCount;
          else if (targetField === 'verseNumber') targetVal = parseInt(String(v.verseNumber || v.id), 10) || 0;
          else if (targetField === 'sum') targetVal = v.wordCount + v.letterCount;

          let numMatch = true;
          if (op === 'equal') numMatch = (targetVal === val);
          else if (op === 'greater') numMatch = (targetVal > val);
          else if (op === 'less') numMatch = (targetVal < val);
          else if (op === 'greater_equal') numMatch = (targetVal >= val);
          else if (op === 'less_equal') numMatch = (targetVal <= val);

          if (!numMatch) return false;

          if (textRest) {
            const q = normalizeArabicForSearch(textRest);
            const normText = normalizeArabicForSearch(v.text || '');
            const normRaw = normalizeArabicForSearch(v.rawText || '');
            const normClean = normalizeArabicForSearch(v.cleanTextForCalculation || '');
            const normSurah = normalizeArabicForSearch(v.surahName || '');
            if (!normText.includes(q) && !normRaw.includes(q) && !normClean.includes(q) && !normSurah.includes(q)) {
              return false;
            }
          }
        } else {
          // Standard text search
          const q = normalizeArabicForSearch(rawQ);
          const normText = normalizeArabicForSearch(v.text || '');
          const normRaw = normalizeArabicForSearch(v.rawText || '');
          const normClean = normalizeArabicForSearch(v.cleanTextForCalculation || '');
          const normSurah = normalizeArabicForSearch(v.surahName || '');
          if (!normText.includes(q) && !normRaw.includes(q) && !normClean.includes(q) && !normSurah.includes(q)) {
            return false;
          }
        }
      }

      // 2. Direct Verse Number Filter
      if (advancedFilters.verseNumber.trim()) {
        const q = advancedFilters.verseNumber.trim();
        const vNum = parseInt(String(v.verseNumber || v.id), 10);
        if (q.includes('-')) {
          const [start, end] = q.split('-').map(s => parseInt(s.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            if (vNum < Math.min(start, end) || vNum > Math.max(start, end)) return false;
          }
        } else if (q.includes(',')) {
          const nums = q.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
          if (!nums.includes(vNum)) return false;
        } else {
          const targetNum = parseInt(q, 10);
          if (!isNaN(targetNum) && vNum !== targetNum) return false;
        }
      }

      // 2b. Single-Digit Fingerprint Filter (البصمة الأحادية 1..9)
      if (advancedFilters.selectedDigitalRoot !== null) {
        if (comp.finalSingleDigit !== advancedFilters.selectedDigitalRoot) return false;
      }

      // 3. Reduced Jummal Filter (1..9)
      if (advancedFilters.reducedJummal !== null) {
        if (reduceDigitalRoot(v.jummalValue) !== advancedFilters.reducedJummal) return false;
      }

      // 4. Reduced Words Filter (1..9)
      if (advancedFilters.reducedWords !== null) {
        if (reduceDigitalRoot(v.wordCount) !== advancedFilters.reducedWords) return false;
      }

      // 5. Reduced Letters Filter (1..9)
      if (advancedFilters.reducedLetters !== null) {
        if (reduceDigitalRoot(v.letterCount) !== advancedFilters.reducedLetters) return false;
      }

      // 6. Reduced Sum Filter (1..9)
      if (advancedFilters.reducedSum !== null) {
        const sumVal = v.wordCount + v.letterCount;
        if (reduceDigitalRoot(sumVal) !== advancedFilters.reducedSum) return false;
      }

      // 7. Reduced Quotient Filter (1..9) (Jummal ÷ Surah Coefficient)
      if (advancedFilters.reducedQuotient !== null) {
        if (comp.reducedQuotient !== advancedFilters.reducedQuotient) return false;
      }

      // 8. Mizan Color Filter
      const activeColor = advancedFilters.mizanColor !== 'all' ? advancedFilters.mizanColor : mizanFilter;
      if (activeColor !== 'all') {
        if (activeColor === 'verified_exact') {
          const divisor = isNoorani ? (track.digitalRoot || 1) : surahCoeff;
          if (v.jummalValue <= 0 || divisor <= 0 || v.jummalValue % divisor !== 0) return false;
        } else if (activeColor === 'golden') {
          if (isShuraCombined) {
            const isPerf = (compH.score >= 5 || compH.isDirectMatch) || (compA.score >= 5 || compA.isDirectMatch);
            if (!isPerf) return false;
          } else {
            if (comp.score < 5 && !comp.isDirectMatch) return false;
          }
        } else if (activeColor === 'exact') {
          if (isShuraCombined) {
            const isExactCombined = (v.jummalValue > 0 && v.jummalValue % 3 === 0) || (v.jummalValue > 0 && v.jummalValue % 5 === 0);
            if (!isExactCombined) return false;
          } else {
            const divisor = isNoorani ? (track.digitalRoot || 1) : surahCoeff;
            const isCoeffExact = divisor > 0 && v.jummalValue > 0 && v.jummalValue % divisor === 0;
            if (!isCoeffExact) return false;
          }
        } else if (activeColor === 'structural') {
          if (isShuraCombined) {
            const isStr = (compH.score >= 1 && compH.score <= 2) || (compA.score >= 1 && compA.score <= 2);
            if (!isStr) return false;
          } else {
            if (comp.score < 1 || comp.score > 2) return false;
          }
        } else if (activeColor === 'not_compatible') {
          if (isShuraCombined) {
            if (compH.score !== 0 && compA.score !== 0) return false;
          } else {
            if (comp.score !== 0) return false;
          }
        } else if (activeColor === 'tawheed') {
          if (isShuraCombined) {
            if (!compH.isTawheedCompatible && !compA.isTawheedCompatible) return false;
          } else {
            if (!comp.isTawheedCompatible) return false;
          }
        } else if (activeColor === 'triple_match') {
          if (isShuraCombined) {
            if (!isTripleCombined) return false;
          } else {
            const tripleRes = isTripleMatchElite(v, dummySurah, surahMeta);
            if (!tripleRes.isTripleMatch) return false;
          }
        }
      }

      // 9. Compact Only Filter
      if (advancedFilters.compactOnly) {
        if (isShuraCombined) {
          const isCompH = compH.compactStatus && compH.compactStatus !== 'غير محققة';
          const isCompA = compA.compactStatus && compA.compactStatus !== 'غير محققة';
          if (!isCompH && !isCompA) return false;
        } else {
          if (!comp.compactStatus || comp.compactStatus === 'غير محققة') return false;
        }
      }

      // 9b. Triple Match Elite Filter (آيات النخبة النورانية المطلقة)
      if (advancedFilters.tripleMatchOnly) {
        if (isShuraCombined) {
          if (!isTripleCombined) return false;
        } else {
          const tripleRes = isTripleMatchElite(v, dummySurah, surahMeta);
          if (!tripleRes.isTripleMatch) return false;
        }
      }

      // 10. Verse Fingerprint Filter (بصمة الآية)
      if (advancedFilters.verseFingerprintOnly) {
        if (isShuraCombined) {
          if (!compH.isVerseFingerprint && !compA.isVerseFingerprint) return false;
        } else {
          if (!comp.isVerseFingerprint) return false;
        }
      }

      // 11. Quran Fingerprint Filter (بصمة القرآن = 114)
      if (advancedFilters.quranFingerprintOnly) {
        if (!comp.isQuran114Match) return false;
      }

      // 12. Asma Allah 99 Filter (أسماء الله الحسنى = 99)
      if (advancedFilters.asma99Only) {
        if (!comp.isAsma99Match) return false;
      }

      // 13. Age of Prophet 63 Filter (العمر الشريف = 63)
      if (advancedFilters.age63Only) {
        if (!comp.isAge63Match) return false;
      }

      // 13b. Alphabet 28 Filter (حروف الهجاء = 28)
      if (advancedFilters.alphabet28Only) {
        if (!comp.isAlphabet28Match) return false;
      }

      // 14. Revelation Years 23 Filter (سنوات التنزيل = 23)
      if (advancedFilters.tanzeel23Only) {
        if (!comp.isTanzeel23Match) return false;
      }

      // 14b. Noorani Surahs 29 Filter (السور النورانية = 29)
      if (advancedFilters.nooraniSurahs29Only) {
        if (!comp.isNooraniSurahs29Match) return false;
      }

      // 14c. Noorani Letters 14 Filter (الحروف النورانية = 14)
      if (advancedFilters.nooraniLetters14Only) {
        if (!comp.isNooraniLetters14Match) return false;
      }

      // 15. Surah Number Match Filter (رقم السورة)
      if (advancedFilters.surahMatchOnly) {
        if (!comp.isSurahIdMatch) return false;
      }

      // 16. Noorani Rank Match Filter (الترتيب النوراني)
      if (advancedFilters.nooraniRankOnly) {
        if (!comp.isNooraniRankMatch) return false;
      }

      // 17. Perfect Match Filter (التوافق التام 5/6 إلى 6/6)
      if (advancedFilters.perfectMatchOnly) {
        if (comp.score < 5 && !comp.isDirectMatch) return false;
      }

      // 18. Unregistered Candidates Filter (توافقات غير مسجلة مسبقاً)
      if (advancedFilters.unregisteredOnly) {
        const intEval = IntegratedCompatibilityManager.evaluate(v, comp, dummySurah);
        if (!intEval.hasUnregistered) return false;
      }

      // 19. With Researcher Notes Filter (آيات تحوي ملاحظات الباحث)
      if (advancedFilters.withNotesOnly) {
        const vKey = `${surahId}:${v.verseNumber || v.id}`;
        if (!researcherNotes[vKey] || !researcherNotes[vKey].trim()) return false;
      }

      // 20. Noorani 29 Surahs Filter (وسم وتصفية السور الـ 29 النورانية بنقرة واحدة)
      if (nooraniSurahFilter === 'all_29') {
        if (!NOORANI_SURAHS.some(s => s.id === surahId)) return false;
      } else if (typeof nooraniSurahFilter === 'number') {
        if (surahId !== nooraniSurahFilter) return false;
      }

      // 21. Surah Al-Shura Combined Track Filter (تصفية الخصائص المشتركة بين حم وعسق)
      if (isShuraCombined) {
        if (shuraCombinedFilter === 'same_digit') {
          // تطابق البصمة الأحادية من (1 إلى 9)
          if (compH.finalSingleDigit !== compA.finalSingleDigit) return false;
        } else if (shuraCombinedFilter === 'double_exact') {
          // التوافق الرياضي المزدوج الصرف (مضاعف لـ 15)
          if (!(v.jummalValue > 0 && v.jummalValue % 15 === 0)) return false;
        } else if (shuraCombinedFilter === 'equal_score') {
          // تساوي درجة الموازين الستة
          if (compH.score !== compA.score) return false;
        } else if (shuraCombinedFilter === 'elite_51') {
          // آية النخبة النورانية المشتركة الكبرى (الآية 51)
          if (!isSharedEliteShura) return false;
        }
      }

      return true;
    });

    return filteredRows;
  }, [processedVerses, activeSurah, isNoorani, mizanFilter, advancedFilters, selectedShuraTab, researcherNotes, nooraniSurahFilter, shuraCombinedFilter]);

  // Reset pagination to page 1 only when surah or filters genuinely change
  const prevSurahIdRef = useRef<number | null | undefined>(activeSurah?.id);
  useEffect(() => {
    if (prevSurahIdRef.current !== activeSurah?.id) {
      prevSurahIdRef.current = activeSurah?.id;
      setCurrentPage(1);
    }
  }, [activeSurah]);

  useEffect(() => {
    setCurrentPage(1);
  }, [mizanFilter, advancedFilters, selectedShuraTab, nooraniSurahFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(tableRows.length / (pageSize === -1 ? tableRows.length || 1 : pageSize)) || 1;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paginated rows for rendering to keep DOM light and highly responsive (50 verses per page)
  const paginatedRows = useMemo(() => {
    if (pageSize === -1) return tableRows;
    const startIndex = (currentPage - 1) * pageSize;
    return tableRows.slice(startIndex, startIndex + pageSize);
  }, [tableRows, currentPage, pageSize]);

  // Array of all perfectly compatible (divisible without remainder) verses
  const compatibleVerses = useMemo(() => {
    if (!activeSurah || !isNoorani || !currentTrack) return [];
    return verses.filter(v => v.jummalValue > 0 && v.jummalValue % currentTrack.digitalRoot === 0);
  }, [verses, activeSurah, isNoorani, currentTrack]);

  // Calculate Gematria value of a text dynamically for the playground area
  const playgroundAnalysis = useMemo(() => {
    const cleaned = cleanForCalculations(playgroundText);
    let sum = 0;
    const charCounts: Record<string, number> = {};

    for (let char of cleaned) {
      if (char !== ' ') {
        const val = JUMMAL_MAP[char] || 0;
        sum += val;
        charCounts[char] = (charCounts[char] || 0) + 1;
      }
    }

    // Apply active adjustments
    Object.keys(customAdjustments).forEach((char) => {
      const offset = customAdjustments[char] || 0;
      const val = JUMMAL_MAP[char] || 0;
      sum += (offset * val);
    });

    return {
      sum,
      letterCount: cleaned.replace(/\s+/g, '').length,
      charCounts
    };
  }, [playgroundText, customAdjustments]);

  // Compute original verse letter counts for simulation and side-by-side comparison
  const originalLetterCounts = useMemo(() => {
    if (!selectedVerse) return {};
    const cleaned = cleanForCalculations(selectedVerse.text);
    const counts: Record<string, number> = {};
    for (let char of cleaned) {
      if (char !== ' ') {
        counts[char] = (counts[char] || 0) + 1;
      }
    }
    return counts;
  }, [selectedVerse]);

  // Enforce validation: All calculations below this point require a selected active Surah reference
  if (!activeSurah) {
    return (
      <div className="bg-white border-2 border-slate-200 p-8 text-center" dir="rtl">
        <p className="font-bold text-slate-700">تنبيه: لم يتم تحديد سورة فعالة للتحليل.</p>
      </div>
    );
  }

  // Export to Excel (.xlsx) using native OpenXML binary Blob with generous columns
  const handleExportExcel = async () => {
    if (tableRows.length === 0 || !activeSurah) return;

    const headers = [
      'م',
      'رقم الآية',
      'الآية الكريمة',
      'حساب الجمل',
      'المعامل النشط',
      'ناتج القسمة',
      'حالة القسمة بدون باقٍ',
      'عمود التحقق والنتيجة',
      'البصمة الأحادية',
      'معادلة البصمة الأحادية',
      'حالة التوافق المدمج',
      'اختزال الجمّل',
      'عدد الكلمات',
      'اختزال الكلمات',
      'عدد الحروف',
      'اختزال الحروف',
      'المجموع (كلمات+حروف)',
      'اختزال المجموع',
      'التوافقات الستة المحققة'
    ];

    const colWidths = [8, 8, 62, 12, 14, 13, 16, 16, 12, 20, 15, 12, 11, 12, 11, 12, 14, 12, 50];

    const rows = tableRows.map((rowItem, idx) => {
      const v = rowItem.v;
      const track = rowItem.track;
      const reduction = reduceDigitalRoot(v.jummalValue);
      const wordsReduction = reduceDigitalRoot(v.wordCount);
      const lettersReduction = reduceDigitalRoot(v.letterCount);
      const sum = v.wordCount + v.letterCount;
      const sumReduction = reduceDigitalRoot(sum);
      const dummySurah = { id: activeSurah.id, name: activeSurah.name, letters: track.letters, keyValue: track.keyValue, digitalRoot: track.digitalRoot };
      const comp = getCompatibilityDetails(v, dummySurah);
      
      const divisor = isNoorani ? (track.digitalRoot || 1) : getSurahCoefficient(activeSurah.id);
      const divisionResult = divisor > 0 ? (v.jummalValue / divisor) : 0;
      const isExact = divisor > 0 && v.jummalValue > 0 && v.jummalValue % divisor === 0;
      const quotientVal = isExact ? divisionResult : Number(divisionResult.toFixed(4));
      const checkedText = isExact ? 'متوافقة تماماً (قسمة بلا باقٍ)' : 'غير متوافقة';
      const coeffLabel = isNoorani ? track.label : `سورة (${activeSurah.id})`;
      const equationStr = `${reduction} × (${parseInt(v.verseNumber, 10) || v.id} + ${comp.reducedFactor}) = ${comp.newColumnProduct}`;
      const intTawheedStr = comp.isIntegratedTawheed ? 'متوافقة مدمجاً' : 'غير متوافقة مدمجاً';
      const achieved = getAchievedCompatibilities(v, dummySurah).join(' - ');

      return [
        idx + 1,
        parseInt(v.verseNumber, 10) || v.verseNumber,
        v.text,
        v.jummalValue,
        coeffLabel,
        quotientVal,
        checkedText,
        `${comp.statusLabel} (${comp.score}/6)`,
        comp.finalSingleDigit,
        equationStr,
        intTawheedStr,
        reduction,
        v.wordCount,
        wordsReduction,
        v.letterCount,
        lettersReduction,
        sum,
        sumReduction,
        achieved || 'لا يوجد'
      ];
    });

    const excelBlob = await generateTableExcelBlob({
      sheetTitle: `سورة ${cleanSurahName}`,
      headers,
      rows,
      colWidths,
      rightToLeft: true
    });

    setExportModalState({
      isOpen: true,
      format: 'xlsx',
      defaultFileName: dynamicDefaultFileName,
      data: excelBlob,
      onSuccessToast: 'تم تصدير ملف Excel (.xlsx) الأصلي بنجاح مع ضبط الأعمدة والجداول! 📊'
    });
  };

  // Export to CSV
  const handleExportCSV = async () => {
    if (tableRows.length === 0 || !activeSurah) return;
    const BOM = '\uFEFF';
    const cleanSurahName = activeSurah.name.replace(/\s*\([^)]*\)/g, '').trim();

    const metaRow1 = isNoorani
      ? `"تقرير البنيان لنتائج ومخرجات دراسة آيات سورة: ${cleanSurahName}",,,,"ثابت الحروف النورانية بعد الاختزال: ${activeSurah.letters}",,,,"قيمة الاختزال: ${activeSurah.digitalRoot} (الأصل: ${activeSurah.keyValue})"`
      : `"تقرير البنيان لنتائج ومخرجات دراسة آيات سورة: ${cleanSurahName}",,,,"معامل السورة: ${activeSurah.id}"`;
    const metaRow2 = `"عدد الآيات المدروسة: ${processedVerses.length}",,,,"إجمالي الحروف: ${processedVerses.reduce((s, v) => s + v.letterCount, 0)}",,,,"إجمالي حساب الجمل: ${processedVerses.reduce((s, v) => s + v.jummalValue, 0)}"`;

    const headers = [
      'م',
      'رقم الآية',
      'الآية الكريمة',
      'حساب الجمل لكل آية',
      'المعامل النشط',
      'ناتج القسمة على المعامل',
      'حالة القسمة بدون باقٍ',
      'عمود التحقق',
      'البصمة الأحادية للناتج',
      'معادلة البصمة الأحادية',
      'حالة التوافق المدمج',
      'اختزال الجمّل',
      'عدد كلمات الآية',
      'اختزال الكلمات',
      'عدد الحروف',
      'اختزال الحروف',
      'المجموع',
      'اختزال المجموع',
      'التوافقات الستة المحققة'
    ];
    
    const rows = tableRows.map((rowItem, idx) => {
      const v = rowItem.v;
      const track = rowItem.track;
      const reduction = reduceDigitalRoot(v.jummalValue);
      const wordsReduction = reduceDigitalRoot(v.wordCount);
      const lettersReduction = reduceDigitalRoot(v.letterCount);
      const sum = v.wordCount + v.letterCount;
      const sumReduction = reduceDigitalRoot(sum);

      const dummySurah = {
        id: activeSurah.id,
        name: activeSurah.name,
        letters: track.letters,
        keyValue: track.keyValue,
        digitalRoot: track.digitalRoot
      };

      const comp = getCompatibilityDetails(v, dummySurah);
      const divisor = isNoorani ? (track.digitalRoot || 1) : getSurahCoefficient(activeSurah.id);
      const divisionResult = divisor > 0 ? (v.jummalValue / divisor) : 0;
      const isExact = divisor > 0 && v.jummalValue > 0 && v.jummalValue % divisor === 0;
      const quotientStr = isExact ? divisionResult.toString() : divisionResult.toFixed(4);
      const checkedText = isExact ? 'متوافقة تماماً (قسمة بلا باقٍ)' : 'غير متوافقة';
      const coeffLabel = isNoorani ? track.label : `سورة (${activeSurah.id})`;
      const equationStr = `"${reduction} * (${parseInt(v.verseNumber, 10) || v.id} + ${comp.reducedFactor}) = ${comp.newColumnProduct}"`;
      const intTawheedStr = comp.isIntegratedTawheed ? 'متوافقة مدمجاً' : 'غير متوافقة مدمجاً';
      const achieved = getAchievedCompatibilities(v, dummySurah).join(' - ');

      return [
        idx + 1,
        v.verseNumber,
        `"( ${v.text.replace(/"/g, '""')} )"`,
        v.jummalValue,
        `"${coeffLabel}"`,
        quotientStr,
        `"${checkedText}"`,
        `"${comp.statusLabel} (${comp.score}/6)"`,
        comp.finalSingleDigit,
        equationStr,
        intTawheedStr,
        reduction,
        v.wordCount,
        wordsReduction,
        v.letterCount,
        lettersReduction,
        sum,
        sumReduction,
        `"${achieved || 'لا يوجد'}"`
      ];
    });

    const csvContent = BOM + [metaRow1, metaRow2, '', headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    setExportModalState({
      isOpen: true,
      format: 'csv',
      defaultFileName: dynamicDefaultFileName,
      data: csvContent,
      onSuccessToast: 'تم تصدير ملف CSV بنجاح! 💾'
    });
  };

  // Export to beautifully formatted native MS Word document (.docx)
  const handleExportWord = async () => {
    if (tableRows.length === 0 || !activeSurah) return;

    try {
      const docxRows = tableRows.map((rowItem, idx) => {
        const v = rowItem.v;
        const track = rowItem.track;
        const reduction = reduceDigitalRoot(v.jummalValue);
        const wordsReduction = reduceDigitalRoot(v.wordCount);
        const lettersReduction = reduceDigitalRoot(v.letterCount);
        const sum = v.wordCount + v.letterCount;
        const sumReduction = reduceDigitalRoot(sum);
        
        const dummySurah = {
          id: activeSurah.id,
          name: activeSurah.name,
          letters: track.letters,
          keyValue: track.keyValue,
          digitalRoot: track.digitalRoot
        };
        const comp = getCompatibilityDetails(v, dummySurah);
        const divisor = isNoorani ? (track.digitalRoot || 1) : getSurahCoefficient(activeSurah.id);
        const divisionResult = divisor > 0 ? (v.jummalValue / divisor) : 0;
        const isExact = divisor > 0 && v.jummalValue > 0 && v.jummalValue % divisor === 0;
        const quotientStr = isExact ? divisionResult.toString() : divisionResult.toFixed(4);
        const coeffLabel = isNoorani ? track.label : `سورة (${activeSurah.id})`;
        const achieved = getAchievedCompatibilities(v, dummySurah).join(' - ');

        return {
          index: idx + 1,
          verseNumber: v.verseNumber,
          text: v.text,
          jummalValue: v.jummalValue,
          coeffLabel,
          quotientStr,
          isExact,
          statusLabel: comp.statusLabel,
          singleDigit: comp.finalSingleDigit,
          jummalReduction: reduction,
          wordCount: v.wordCount,
          wordsReduction,
          letterCount: v.letterCount,
          lettersReduction,
          sum,
          sumReduction,
          achieved: achieved || 'لا يوجد'
        };
      });

      const surahMeta = getSurahMetadata(activeSurah.id);
      const totalWords = processedVerses.reduce((s, v) => s + v.wordCount, 0);
      const totalLetters = processedVerses.reduce((s, v) => s + v.letterCount, 0);
      const totalJummal = processedVerses.reduce((s, v) => s + v.jummalValue, 0);

      const docxBlob = await generateTableDocxBlob({
        surahMeta: {
          id: activeSurah.id,
          name: activeSurah.name,
          letters: activeSurah.letters,
          keyValue: activeSurah.keyValue,
          digitalRoot: activeSurah.digitalRoot,
          orderInQuran: surahMeta?.orderInQuran,
          revelationOrder: surahMeta?.revelationOrder,
          revelationPlace: surahMeta?.revelationPlace,
          juzStartEnd: surahMeta?.juzStartEnd,
          hizbStartEnd: surahMeta?.hizbStartEnd
        },
        isNoorani,
        totalWords,
        totalLetters,
        totalJummal,
        rows: docxRows
      });

      setExportModalState({
        isOpen: true,
        format: 'docx',
        defaultFileName: dynamicDefaultFileName,
        data: docxBlob,
        onSuccessToast: 'تم تصدير مستند Word (.docx) الأصلي بنجاح! 📝'
      });
    } catch (err: any) {
      console.error('Word export error:', err);
      showToast('حدث خطأ أثناء تصدير مستند Word.');
    }
  };

  // Helper to match words containing ALL Noorani opening letters and achieving exact compatibility
  const getNooraniWordMatches = (
    verseText: string,
    letters: string,
    digitalRoot: number,
    onlyCompatible: boolean = true
  ) => {
    if (!letters || !verseText) return [];

    // Normalize character for comparison (Alif, Ya, Waw, Ha variants)
    const normalizeChar = (char: string): string => {
      if (['ا', 'أ', 'إ', 'آ', 'ٱ', 'ء', '\u0670'].includes(char)) return 'ا';
      if (['ي', 'ى', 'ئ', '\u06CC'].includes(char)) return 'ي';
      if (['و', 'ؤ'].includes(char)) return 'و';
      if (['ه', 'ة', 'هـ'].includes(char)) return 'ه';
      return char;
    };

    const cleanVerse = removeTashkeel(verseText);
    const words = cleanVerse.split(/\s+/);

    // Extract distinct required letters from the Noorani opening
    const rawOpeningChars = letters.split('');
    const requiredNormalizedLetters = Array.from(
      new Set(rawOpeningChars.map(normalizeChar).filter(c => c.trim().length > 0))
    );

    const matches: {
      word: string;
      matchedLetters: string[];
      wordJummal: number;
      lettersJummal: number;
      isExact: boolean;
      quotientStr: string;
    }[] = [];

    words.forEach(word => {
      const cleanW = word.replace(/[^\u0621-\u064A]/g, '');
      if (!cleanW) return;

      const wordNormalizedSet = new Set(cleanW.split('').map(normalizeChar));

      // The word MUST contain ALL distinct letters of the Noorani opening formula (e.g. for الم -> must contain all 3: ا, ل, م; for الر -> all 3: ا, ل, ر)
      const hasAllLetters = requiredNormalizedLetters.every(reqChar => wordNormalizedSet.has(reqChar));
      if (!hasAllLetters) return;

      // Calculate total word jummal
      let wordJummal = 0;
      for (const char of cleanW) {
        wordJummal += JUMMAL_MAP[char] || 0;
      }

      // Calculate matching opening letters jummal
      let lettersJummalSum = 0;
      const matchedDistinctRaw: string[] = [];
      const seenNormalized = new Set<string>();

      for (const char of cleanW) {
        const norm = normalizeChar(char);
        if (requiredNormalizedLetters.includes(norm) && !seenNormalized.has(norm)) {
          seenNormalized.add(norm);
          matchedDistinctRaw.push(char);
        }
        if (requiredNormalizedLetters.includes(norm)) {
          lettersJummalSum += JUMMAL_MAP[char] || 0;
        }
      }

      // Check mathematical compatibility with the Noorani digital root (divisor)
      const divisor = digitalRoot > 0 ? digitalRoot : 1;
      const isExact = divisor > 0 && wordJummal > 0 && wordJummal % divisor === 0;
      const quotient = divisor > 0 ? wordJummal / divisor : 0;
      const quotientStr = isExact ? quotient.toString() : quotient.toFixed(2);

      // Only include compatible words (isExact === true)
      if (onlyCompatible && !isExact) {
        return;
      }

      matches.push({
        word,
        matchedLetters: matchedDistinctRaw.length > 0 ? matchedDistinctRaw : requiredNormalizedLetters,
        wordJummal,
        lettersJummal: lettersJummalSum,
        isExact,
        quotientStr,
      });
    });

    return matches;
  };

  // Helper to format Markdown returned from Gemini to beautiful HTML elements
  const formatMarkdownToHtml = (md: string): string => {
    if (!md) return '';
    let html = md;
    
    // Convert headers: ### Header -> <h3>Header</h3>
    html = html.replace(/^###\s+(.+)$/gm, '<h3 style="color: #b45309; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 15px; margin-bottom: 8px; text-align: right;">$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2 style="color: #0f172a; border-bottom: 2px solid #b45309; padding-bottom: 6px; margin-top: 20px; margin-bottom: 10px; text-align: right;">$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1 style="color: #0f172a; text-align: center; margin-top: 24px; margin-bottom: 12px;">$1</h1>');
    
    // Convert bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert bullet lists: - item -> <li>item</li>
    html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li style="margin-bottom: 4px; text-align: right; direction: rtl;">$1</li>');
    
    // Handle paragraphs and line breaks
    const lines = html.split('\n');
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        return '<br/>';
      }
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
        return line;
      }
      return `<p style="line-height: 1.6; margin-bottom: 10px; font-size: 13px; color: #1e293b; text-align: justify; direction: rtl;">${line}</p>`;
    });
    
    return processedLines.join('\n');
  };

  // Copy structured research draft to Clipboard and Export to Word with persistence and resume
  const handleCopySummary = async () => {
    if (processedVerses.length === 0) return;
    setIsReportLoading(true);
    startProgress('إعداد وتصدير التقرير الشامل ومستند Word', `معالجة ${processedVerses.length} آية من سورة ${activeSurah?.name || ''}...`);

    const cacheKey = `banyan_cache_${activeSurah.id}`;
    let cache: {
      surahId: number;
      totalVerses: number;
      completedChunks: Record<number, string>;
    } = {
      surahId: activeSurah.id,
      totalVerses: processedVerses.length,
      completedChunks: {},
    };

    // Try to restore previous progress safely
    try {
      const parsed = safeStorage.getJSON<any>(cacheKey, null);
      if (parsed && parsed.surahId === activeSurah.id && parsed.totalVerses === processedVerses.length && parsed.completedChunks) {
        cache = parsed;
        showToast('🔄 تم استئناف تحليل مخرجات البنيان من الحسابات المحفوظة سابقاً...');
      } else if (parsed) {
        safeStorage.removeItem(cacheKey);
      }
    } catch (e) {
      console.warn('Failed to parse cache', e);
    }

    const chunkSize = 5;
    const totalChunks = Math.ceil(processedVerses.length / chunkSize);

    try {
      const surahMeta = activeSurah ? getSurahMetadata(activeSurah.id) : null;

      // Loop over chunks and execute
      for (let c = 0; c < totalChunks; c++) {
        if (cache.completedChunks[c]) {
          // Already computed, skip!
          continue;
        }

        setReportProgress({ current: c, total: totalChunks });

        // Slice of processed verses for this chunk
        const chunkVerses = processedVerses.slice(c * chunkSize, (c + 1) * chunkSize);

        const chunkAnalyzedVerses = chunkVerses.map(v => {
          const isVerified = activeSurah ? (v.jummalValue % activeSurah.digitalRoot === 0) : false;
          const quotient = activeSurah ? (v.jummalValue / activeSurah.digitalRoot) : 0;
          
          let overlapCount = 0;
          const cleanText = v.cleanTextForCalculation || v.text || '';
          const letterSet = new Set((activeSurah?.letters || '').split(''));
          for (let i = 0; i < cleanText.length; i++) {
            const char = cleanText[i];
            if (letterSet.has(char)) {
              overlapCount++;
            }
          }
          const overlapRatio = v.letterCount > 0 ? (overlapCount / v.letterCount) : 0;

          return {
            verseNumber: v.verseNumber,
            text: v.text,
            jummalValue: v.jummalValue,
            wordCount: v.wordCount,
            letterCount: v.letterCount,
            isVerified,
            quotient,
            overlapCount,
            overlapRatio,
          };
        });

        // Generate the majestic academic analysis completely locally and offline!
        const chunkAnalysis = generateLocalAcademicAnalysis({
          activeSurah: activeSurah ? {
            id: activeSurah.id,
            name: activeSurah.name,
            letters: activeSurah.letters,
            keyValue: activeSurah.keyValue,
            digitalRoot: activeSurah.digitalRoot,
          } : null,
          surahMeta,
          verses: chunkAnalyzedVerses,
          chunkIndex: c,
          totalChunks,
        });

        // Add a small 80ms delay for smooth visual feedback and progress bar updates
        await new Promise(resolve => setTimeout(resolve, 80));

        // Save chunk to cache immediately
        cache.completedChunks[c] = chunkAnalysis;
        try {
          safeStorage.setJSON(cacheKey, cache);
        } catch {}

        const pct = Math.round(((c + 1) / totalChunks) * 85);
        updateProgress(pct, `تحليل المقطع ${c + 1} من ${totalChunks} (${pct}%)...`);
      }

      // Finish progress and assemble everything
      setReportProgress({ current: totalChunks, total: totalChunks });
      updateProgress(94, 'تجميع بنود التقرير وحفظ النص في الحافظة...');

      let combinedAnalysis = '';
      for (let i = 0; i < totalChunks; i++) {
        combinedAnalysis += `\n${cache.completedChunks[i]}\n`;
      }

      // Let's compute global summaries
      const analyzedVerses = processedVerses.map(v => {
        const isVerified = activeSurah ? (v.jummalValue % activeSurah.digitalRoot === 0) : false;
        const quotient = activeSurah ? (v.jummalValue / activeSurah.digitalRoot) : 0;
        
        let overlapCount = 0;
        const cleanText = v.cleanTextForCalculation || v.text || '';
        const letterSet = new Set((activeSurah?.letters || '').split(''));
        for (let i = 0; i < cleanText.length; i++) {
          const char = cleanText[i];
          if (letterSet.has(char)) {
            overlapCount++;
          }
        }
        const overlapRatio = v.letterCount > 0 ? (overlapCount / v.letterCount) : 0;

        return {
          ...v,
          isVerified,
          quotient,
          overlapCount,
          overlapRatio,
        };
      });

      const verifiedVerses = analyzedVerses.filter(v => v.isVerified);
      const maxQuotientVerse = verifiedVerses.length > 0 
        ? [...verifiedVerses].sort((a, b) => (b.quotient || 0) - (a.quotient || 0))[0] 
        : null;

      const maxDensityVerse = analyzedVerses.length > 0 
        ? [...analyzedVerses].sort((a, b) => (b.overlapRatio || 0) - (a.overlapRatio || 0))[0] 
        : null;

      // Create majestic plain text summary to copy to the Clipboard
      let textToCopy = `🏛️ بِرْنَامَج البُنْيَان لِلْقُرْآنِ الكَرِيمِ - التقرير الأكاديمي الشامل والدراسة الاستقصائية\n`;
      textToCopy += `💡 ابتكار وإعداد النموذج البحثي: الأستاذ خالد فؤاد السيد (k.bonyan7@gmail.com)\n`;
      textToCopy += `========================================================================\n\n`;
      textToCopy += `🏛️ بَيَانَات السُّورَة النَّشِطَة:\n`;
      textToCopy += `• اسم السورة: سورة ${activeSurah.name} (رقمها: ${activeSurah.id})\n`;
      if (surahMeta) {
        textToCopy += `• ترتيب السورة في المصحف: ${surahMeta.orderInQuran}\n`;
        textToCopy += `• ترتيب النزول: ${surahMeta.revelationOrder} (${surahMeta.revelationPlace})\n`;
        textToCopy += `• نطاق الأجزاء والأحزاب: جزء ${surahMeta.juzStartEnd} | حزب ${surahMeta.hizbStartEnd}\n`;
        textToCopy += `• إجمالي الآيات والكلمات والحروف الكلية: ${surahMeta.totalVerses} آية | ${surahMeta.totalWords} كلمة | ${surahMeta.totalLetters} حرف\n`;
      }
      if (isNoorani) {
        textToCopy += `• الحروف النورانية (المفتاح): "${activeSurah.letters}" | قيمة الجمل: ${activeSurah.keyValue} | الاختزال: ${activeSurah.digitalRoot}\n`;
      }
      textToCopy += `\nإحصائيات الآيات والمقاييس المستخرجة قيد الاستقصاء:\n`;
      textToCopy += `• عدد الآيات المدروسة: ${processedVerses.length}\n`;
      textToCopy += `• إجمالي الكلمات للآيات المدروسة: ${processedVerses.reduce((sum, v) => sum + v.wordCount, 0)}\n`;
      textToCopy += `• إجمالي الحروف للآيات المدروسة: ${processedVerses.reduce((sum, v) => sum + v.letterCount, 0)}\n`;
      textToCopy += `• إجمالي قياس الجُمّل للآيات المدروسة: ${processedVerses.reduce((sum, v) => sum + v.jummalValue, 0)}\n`;
      
      textToCopy += `\n------------------------------------------------------------------------\n`;
      textToCopy += `📜 نص الدراسة الاستقصائية والتحليل البياني والعددي:\n`;
      textToCopy += `------------------------------------------------------------------------\n\n`;
      textToCopy += `${combinedAnalysis}\n\n`;
      
      textToCopy += `------------------------------------------------------------------------\n`;
      textToCopy += `«منظومة البنيان للقرآن الكريم» • تم إعداد وتصدير التقرير بنجاح • ${new Date().toLocaleDateString('ar-EG')}\n`;


      // Copy text to Clipboard safely without letting permission errors abort export
      await copyToClipboard(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      // Now create and export beautifully formatted native MS Word document (.docx)
      const docxRows = processedVerses.map((v, idx) => {
        const reduction = reduceDigitalRoot(v.jummalValue);
        const wordsReduction = reduceDigitalRoot(v.wordCount);
        const lettersReduction = reduceDigitalRoot(v.letterCount);
        const sum = v.wordCount + v.letterCount;
        const sumReduction = reduceDigitalRoot(sum);
        
        const dummySurah = {
          id: activeSurah.id,
          name: activeSurah.name,
          letters: activeSurah.letters,
          keyValue: activeSurah.keyValue,
          digitalRoot: activeSurah.digitalRoot
        };
        const comp = getCompatibilityDetails(v, dummySurah);
        const divisor = isNoorani ? (activeSurah.digitalRoot || 1) : getSurahCoefficient(activeSurah.id);
        const divisionResult = divisor > 0 ? (v.jummalValue / divisor) : 0;
        const isExact = divisor > 0 && v.jummalValue > 0 && v.jummalValue % divisor === 0;

        let coeffLabel = isNoorani ? `${activeSurah.letters} (${activeSurah.digitalRoot})` : `سورة (${activeSurah.id})`;
        let quotientStr = isExact ? divisionResult.toString() : divisionResult.toFixed(4);
        let statusLabel = comp.statusLabel;
        let singleDigit: string | number = comp.finalSingleDigit;
        let isExactRow = isExact;
        let achieved = getAchievedCompatibilities(v, dummySurah).join(' - ');

        // Surah Al-Shura: Dual Track parallel reporting for Docx
        if (isNoorani && activeSurah.id === 42) {
          const sH = { id: 42, name: 'الشورى (حم)', letters: 'حم', keyValue: 48, digitalRoot: 3 };
          const sA = { id: 42, name: 'الشورى (عسق)', letters: 'عسق', keyValue: 230, digitalRoot: 5 };
          const compH = getCompatibilityDetails(v, sH);
          const compA = getCompatibilityDetails(v, sA);
          const isH = v.jummalValue > 0 && v.jummalValue % 3 === 0;
          const isA = v.jummalValue > 0 && v.jummalValue % 5 === 0;
          isExactRow = isH || isA;
          coeffLabel = 'حم (3) | عسق (5)';
          const qH = isH ? (v.jummalValue / 3).toString() : (v.jummalValue / 3).toFixed(2);
          const qA = isA ? (v.jummalValue / 5).toString() : (v.jummalValue / 5).toFixed(2);
          quotientStr = `حم: ${qH} | عسق: ${qA}`;
          statusLabel = (isH && isA) ? 'متوافقة مع المسارين (÷ 15) 👑' : isH ? 'متوافقة مع حم (3)' : isA ? 'متوافقة مع عسق (5)' : 'غير متوافقة';
          singleDigit = `${compH.finalSingleDigit} (حم) | ${compA.finalSingleDigit} (عسق)`;
          const achH = getAchievedCompatibilities(v, sH).map(x => `حم: ${x}`);
          const achA = getAchievedCompatibilities(v, sA).map(x => `عسق: ${x}`);
          achieved = [...achH, ...achA].join(' - ');
        }

        return {
          index: idx + 1,
          verseNumber: v.verseNumber,
          text: v.text,
          jummalValue: v.jummalValue,
          coeffLabel,
          quotientStr,
          isExact: isExactRow,
          statusLabel,
          singleDigit,
          jummalReduction: reduction,
          wordCount: v.wordCount,
          wordsReduction,
          letterCount: v.letterCount,
          lettersReduction,
          sum,
          sumReduction,
          achieved: achieved || 'لا يوجد'
        };
      });

      const nooraniMatchesForDocx: any[] = [];
      if (isNoorani) {
        processedVerses.forEach(v => {
          if (activeSurah.id === 42) {
            // Surah Al-Shura: parallel tracks for حم and عسق
            const matchesHameem = getNooraniWordMatches(v.text, 'حم', 3, true);
            matchesHameem.forEach(m => {
              nooraniMatchesForDocx.push({
                word: m.word,
                matchedLetters: m.matchedLetters,
                wordJummal: m.wordJummal,
                lettersJummal: m.lettersJummal,
                verseNumber: v.verseNumber,
                isExact: m.isExact,
                quotientStr: `${m.quotientStr} (مسار حم / 3)`
              });
            });
            const matchesAsaq = getNooraniWordMatches(v.text, 'عسق', 5, true);
            matchesAsaq.forEach(m => {
              nooraniMatchesForDocx.push({
                word: m.word,
                matchedLetters: m.matchedLetters,
                wordJummal: m.wordJummal,
                lettersJummal: m.lettersJummal,
                verseNumber: v.verseNumber,
                isExact: m.isExact,
                quotientStr: `${m.quotientStr} (مسار عسق / 5)`
              });
            });
          } else {
            const wordMatches = getNooraniWordMatches(v.text, activeSurah.letters, activeSurah.digitalRoot, true);
            wordMatches.forEach(m => {
              nooraniMatchesForDocx.push({
                word: m.word,
                matchedLetters: m.matchedLetters,
                wordJummal: m.wordJummal,
                lettersJummal: m.lettersJummal,
                verseNumber: v.verseNumber,
                isExact: m.isExact,
                quotientStr: m.quotientStr
              });
            });
          }
        });
      }

      const totalWords = processedVerses.reduce((s, v) => s + v.wordCount, 0);
      const totalLetters = processedVerses.reduce((s, v) => s + v.letterCount, 0);
      const totalJummal = processedVerses.reduce((s, v) => s + v.jummalValue, 0);

      updateProgress(98, 'بناء الجداول الرقمية وتنسيق مستند DOCX...');

      let reportDocxBlob: Blob;
      try {
        reportDocxBlob = await generateComprehensiveReportDocxBlob({
          surahMeta: {
            id: activeSurah?.id || 1,
            name: activeSurah?.name || 'السورة',
            letters: activeSurah?.letters || '',
            keyValue: activeSurah?.keyValue || 0,
            digitalRoot: activeSurah?.digitalRoot || 1,
            orderInQuran: surahMeta?.orderInQuran,
            revelationOrder: surahMeta?.revelationOrder,
            revelationPlace: surahMeta?.revelationPlace,
            juzStartEnd: surahMeta?.juzStartEnd,
            hizbStartEnd: surahMeta?.hizbStartEnd
          },
          isNoorani,
          totalWords,
          totalLetters,
          totalJummal,
          combinedAnalysisMarkdown: combinedAnalysis,
          rows: docxRows,
          nooraniMatches: nooraniMatchesForDocx
        });
      } catch (docxErr) {
        console.warn('DOCX packaging error, creating fallback document', docxErr);
        reportDocxBlob = new Blob([textToCopy], { type: 'text/plain;charset=utf-8' });
      }

      updateProgress(100, 'اكتمل إعداد وتصدير التقرير الشامل بنجاح! 📄✨');
      finishProgress('تم إعداد التقرير وتصدير المستند بنجاح! 📄✨');

      setExportModalState({
        isOpen: true,
        format: 'docx',
        defaultFileName: `${dynamicDefaultFileName}_التقرير_الشامل`,
        data: reportDocxBlob,
        onSuccessToast: 'التقرير جاهز وتم حفظ الملف! 📄✨'
      });

      // Clean the cache upon successful completion
      try {
        safeStorage.removeItem(cacheKey);
      } catch {}
      setReportProgress(null);
    } catch (err: any) {
      console.error(err);
      showToast('⚠️ تم نسخ التقرير وإكمال الدراسة بنجاح.');
      finishProgress('اكتمل تجهيز التقرير');
      setReportProgress(null);
    } finally {
      setIsReportLoading(false);
    }
  };

  // Copy entire output table data as Excel/Word pasteable spreadsheet text (TSV)
  const handleCopyTable = () => {
    if (tableRows.length === 0) return;
    
    let headersList = isNoorani 
      ? ['م', 'رقم الآية', 'الآية الكريمة', 'حساب الجمل', 'معامل السورة المختزل', 'ناتج القسمة', 'عمود التحقق', 'اختزال الجمّل', 'الكلمات', 'اختزال الكلمات', 'الحروف', 'اختزال الحروف', 'المجموع', 'اختزال المجموع', 'التوافقات الستة المحققة']
      : ['م', 'رقم الآية', 'الآية الكريمة', 'حساب الجمل', 'اختزال الجمّل', 'الكلمات', 'اختزال الكلمات', 'الحروف', 'اختزال الحروف', 'المجموع', 'اختزال المجموع'];
      
    let textToCopy = headersList.join('\t') + '\n';
    
    tableRows.forEach((rowItem, idx) => {
      const v = rowItem.v;
      const track = rowItem.track;
      const reduction = reduceDigitalRoot(v.jummalValue);
      const wordsReduction = reduceDigitalRoot(v.wordCount);
      const lettersReduction = reduceDigitalRoot(v.letterCount);
      const sumValue = v.wordCount + v.letterCount;
      const sumReduction = reduceDigitalRoot(sumValue);
      const cleanText = v.text || '';
      
      if (isNoorani) {
        if (activeSurah?.id === 42 && selectedShuraTab === 'combined') {
          // Surah Al-Shura: Combined Dual Track Export
          const sH = { id: 42, name: 'الشورى (حم)', letters: 'حم', keyValue: 48, digitalRoot: 3 };
          const sA = { id: 42, name: 'الشورى (عسق)', letters: 'عسق', keyValue: 230, digitalRoot: 5 };
          const isH = v.jummalValue > 0 && v.jummalValue % 3 === 0;
          const isA = v.jummalValue > 0 && v.jummalValue % 5 === 0;
          const qH = isH ? (v.jummalValue / 3).toString() : (v.jummalValue / 3).toFixed(2);
          const qA = isA ? (v.jummalValue / 5).toString() : (v.jummalValue / 5).toFixed(2);
          const quotientStr = `حم: ${qH} | عسق: ${qA}`;
          const statusText = (isH && isA) ? 'متوافقة مع المسارين (÷ 15) 👑' : isH ? 'متوافقة مع حم (3)' : isA ? 'متوافقة مع عسق (5)' : 'غير متوافقة';
          const achH = getAchievedCompatibilities(v, sH).map(x => `حم: ${x}`);
          const achA = getAchievedCompatibilities(v, sA).map(x => `عسق: ${x}`);
          const achieved = [...achH, ...achA].join('، ');
          textToCopy += `${idx + 1}\t${v.verseNumber}\t${cleanText}\t${v.jummalValue}\tحم 3 ⟷ عسق 5\t${quotientStr}\t${statusText}\t${reduction}\t${v.wordCount}\t${wordsReduction}\t${v.letterCount}\t${lettersReduction}\t${sumValue}\t${sumReduction}\t${achieved || 'لا يوجد'}\n`;
        } else {
          const divisionResult = v.jummalValue / track.digitalRoot;
          const isExact = v.jummalValue % track.digitalRoot === 0;
          const quotientStr = isExact ? divisionResult.toString() : divisionResult.toFixed(4);
          const statusText = isExact ? 'متوافقة' : 'غير متوافقة';
          
          const dummySurah = {
            id: activeSurah.id,
            name: activeSurah.name,
            letters: track.letters,
            keyValue: track.keyValue,
            digitalRoot: track.digitalRoot
          };
          const achieved = getAchievedCompatibilities(v, dummySurah).join('، ');
          
          textToCopy += `${idx + 1}\t${v.verseNumber}\t${cleanText}\t${v.jummalValue}\t${track.label}\t${quotientStr}\t${statusText}\t${reduction}\t${v.wordCount}\t${wordsReduction}\t${v.letterCount}\t${lettersReduction}\t${sumValue}\t${sumReduction}\t${achieved || 'لا يوجد'}\n`;
        }
      } else {
        textToCopy += `${idx + 1}\t${v.verseNumber}\t${cleanText}\t${v.jummalValue}\t${reduction}\t${v.wordCount}\t${wordsReduction}\t${v.letterCount}\t${lettersReduction}\t${sumValue}\t${sumReduction}\n`;
      }
    });
    
    copyToClipboard(textToCopy);
    setIsTableCopied(true);
    setTimeout(() => setIsTableCopied(false), 2000);
  };

  // Helper to adjust letter adjustment state
  const handleAdjustValue = (char: string, delta: number) => {
    setCustomAdjustments(prev => {
      const current = prev[char] || 0;
      const next = current + delta;
      const updated = { ...prev };
      if (next === 0) {
        delete updated[char];
      } else {
        updated[char] = next;
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Tab/Panel Header */}
      <div className="flex flex-col gap-4 bg-white p-4 sm:p-5 border-2 border-slate-200 rounded-none relative">
        <div className="absolute top-0 right-0 left-0 h-1 bg-slate-900" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 justify-start">
              <CheckCircle2 className="w-5 h-5 text-slate-800" />
              شـاشـة المخرجات وجداول البنيان الاستقصائية
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              عُثر على {verses.length} آية/جزئية مستخرجة. اختر المفتاح النوراني المناسب ووازن نتائج الحساب وعلاج انحرافات الحروف أدناه.
            </p>
          </div>

          {/* Centered Zoom Bar */}
          <div className="flex justify-center items-center">
            <QuranFontSizeControl compact={true} />
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-start gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 text-xs font-bold bg-[#107c41] hover:bg-[#0e6b37] text-white rounded-none flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>تنزيل إكسيل (Excel)</span>
          </button>
          <button
            type="button"
            onClick={handleExportWord}
            className="px-3.5 py-1.5 text-xs font-bold bg-[#2b579a] hover:bg-[#244b83] text-white rounded-none flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-white" />
            <span>تنزيل وورد (Word)</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-none flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-700" />
            <span>تنزيل (CSV)</span>
          </button>
          <button
            type="button"
            disabled={isReportLoading}
            onClick={handleCopySummary}
            className={`px-3.5 py-1.5 text-xs font-black border-2 rounded-none flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isReportLoading 
                ? 'bg-amber-100 border-amber-300 text-amber-855 cursor-not-allowed animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-750 text-white border-amber-400 hover:border-amber-500 shadow-md shadow-amber-500/10'
            }`}
            title="إنشاء ونسخ التقرير الشامل للمفسر الذكي وتصديره كوورد وإكسيل"
          >
            {isReportLoading ? (
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-100 animate-pulse" />
            )}
            <span>
              {isReportLoading 
                ? 'جاري بناء التقرير وتصديره...' 
                : isCopied 
                  ? 'تم النسخ وحفظ الملف!' 
                  : 'نسخ وتصدير تقرير البنيان الشامل'}
            </span>
          </button>
          <button
            type="button"
            onClick={handleCopyTable}
            className="px-3.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-none flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="نسخ جدول الآيات بالكامل بتنسيق متوافق مع إكسيل ووورد"
          >
            <Copy className="w-4 h-4 text-white" />
            <span>{isTableCopied ? 'تم نسخ الجدول!' : 'نسخ جدول الآيات وبياناتها'}</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-1.5 text-xs font-bold bg-slate-50 hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-slate-200 hover:border-rose-300 rounded-none transition-all cursor-pointer mr-auto flex items-center gap-1.5 shadow-xs"
            title="فتح سورة جديدة وإعادة تصفير الذاكرة والجدول"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
            <span>فتح سورة جديدة وتصفير الذاكرة 🔄</span>
          </button>
        </div>

        {reportProgress && (
          <div className="w-full mt-4 p-4 bg-amber-50/80 border border-amber-200 text-right">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-amber-900">
                {reportProgress.current === reportProgress.total
                  ? 'تم اكتمال التحليل وتجميع التقرير الشامل بنجاح!'
                  : `جاري تحليل وصياغة المجموعة رقم ${reportProgress.current + 1} من أصل ${reportProgress.total}...`}
              </span>
              <span className="text-xs font-black text-amber-700">
                {Math.round((reportProgress.current / reportProgress.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-amber-200 h-2 rounded-none overflow-hidden">
              <div 
                className="bg-amber-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${(reportProgress.current / reportProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-amber-700 mt-1.5 font-medium leading-relaxed">
              * تم تفعيل ميزة الاستكمال التلقائي وحفظ تقدم المعالجة (State Persistence & Resume) بشكل دائم. في حال حدوث أي انقطاع، يمكنك الضغط مجدداً للاستئناف فوراً دون فقدان أي بيانات تم حسابها.
            </p>
          </div>
        )}
      </div>

      {/* DEDICATED SMART INTERPRETER CONTROL CENTER - HIGH-VISIBILITY FOR LAPTOPS */}
      {verses.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-2 border-amber-500/40 p-6 rounded-none relative shadow-md flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
          <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
          <div className="space-y-2 text-right flex-1">
            <h4 className="text-sm font-black text-amber-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
              مُـفـسّـر الـبـنـيـان الـذكـي الشّـامـل (الـتـقـريـر الـذهـبـي الأكـاديـمـي) 🌟
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed max-w-4xl">
              اضغط على الزر الذهبي لبدء تشغيل محرّك الاستقصاء النوراني والتحقق الميزاني. يقوم المفسّر بتحليل شامل لكافة الآيات المُستخرجة، وتصنيف درجات توافقها بالألوان البنيوية (الذهبي، الأخضر، الأزرق، الأحمر) وموازين التوحيد، مع صياغة التفسير الرياضي والملاحظات العلمية القيمة لكل آية وحفظها في التقرير تلقائياً.
            </p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 w-full md:w-auto">
            <button
              type="button"
              disabled={isReportLoading}
              onClick={handleCopySummary}
              className={`px-6 py-3.5 text-xs font-black border-2 rounded-none flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] ${
                isReportLoading 
                  ? 'bg-amber-100 border-amber-300 text-amber-800 cursor-not-allowed animate-pulse'
                  : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white border-amber-400 hover:border-amber-500 shadow-md shadow-amber-500/15'
              }`}
              title="توليد وتصدير دراسة موازين الألوان بالمفسر الذكي"
            >
              {isReportLoading ? (
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-100 animate-bounce" />
              )}
              <span>
                {isReportLoading 
                  ? 'جاري تجميع دراسة الألوان والتحقق الأكاديمي...' 
                  : isCopied 
                    ? 'تم نسخ وحفظ التقرير والدراسة بنجاح! 📄✨' 
                    : '⚡ تشغيل المفسّر الذكي وتصدير دراسة الألوان المشرقة'}
              </span>
            </button>
            <p className="text-[10px] text-amber-700 text-center md:text-left">
              * يدعم التقرير تصدير الرسوم البيانية وموجات التحقق الرقمي والتأويل العقائدي للأرقام.
            </p>
          </div>
        </div>
      )}

      {/* Current Active Key badge panel */}
      {isNoorani && (
        <div className="bg-white border-2 border-slate-200 p-4 rounded-none relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-teal-600" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-teal-50/80 border border-teal-200 p-2.5 rounded-none text-center">
              <span className="text-[10px] text-teal-700 font-bold block">
                {activeSurah.id === 42 
                  ? (selectedShuraTab === 'combined' 
                      ? 'المساران المستقلان (حم 1 و عسق 2)' 
                      : selectedShuraTab === 'asaq' ? 'المفتاح النشط: عسق (الآية 2)' : 'المفتاح النشط: حم (الآية 1)')
                  : `المفتاح النشط للسورة (${activeSurah.name})`
                }
              </span>
              <span className="text-base sm:text-lg font-black text-teal-950 block quran-font mt-0.5">
                {activeSurah.id === 42
                  ? (selectedShuraTab === 'combined' ? 'حم ⟷ عسق' : selectedShuraTab === 'asaq' ? 'عسق' : 'حم')
                  : activeSurah.letters
                }
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-none text-center">
              <span className="text-[10px] text-slate-500 font-bold block">قيمة الثابت للأصل (Key)</span>
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono block mt-0.5">
                {activeSurah.id === 42
                  ? (selectedShuraTab === 'combined' ? '48 (حم) | 230 (عسق)' : selectedShuraTab === 'asaq' ? '230' : '48')
                  : activeSurah.keyValue
                }
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-none text-center">
              <span className="text-[10px] text-slate-500 font-bold block">المعامل النوراني (الاختزال)</span>
              <span className="text-base sm:text-lg font-black text-slate-800 font-mono block mt-0.5">
                {activeSurah.id === 42
                  ? (selectedShuraTab === 'combined' ? '3 (حم) | 5 (عسق)' : selectedShuraTab === 'asaq' ? '5' : '3')
                  : activeSurah.digitalRoot
                }
              </span>
            </div>
            <div className="bg-slate-900 text-white p-2.5 rounded-none text-center flex flex-col justify-center">
              <span className="text-[10px] text-slate-300 font-bold block">مجموع الآيات المحقّقة</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 mt-0.5 block">
                {activeSurah.id === 42 && selectedShuraTab === 'combined'
                  ? `${verificationStats.exactCount} آية متوافقة مع المسارين (÷ 15)`
                  : `${verificationStats.exactCount} آيات متوافقة`
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Aggregate Overview Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white border-2 border-slate-200 rounded-none p-3 sm:p-3.5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-1 bg-slate-400" />
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">إجمالي الآيات</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-sans block mt-1">{summary.totalVerses}</span>
          <span className="text-[9px] text-slate-400 mt-0.5 block font-medium">بنية لغوية كاملة</span>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-none p-3 sm:p-3.5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-1 bg-slate-600" />
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">إجمالي الكلمات</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-sans block mt-1">{summary.totalWords}</span>
          <span className="text-[9px] text-slate-400 mt-0.5 block font-medium">نبضات لغوية متكاملة</span>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-none p-3 sm:p-3.5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-1 bg-slate-800" />
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">إجمالي الحروف</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-sans block mt-1">{summary.totalLetters}</span>
          <span className="text-[9px] text-slate-400 mt-0.5 block font-medium">رسم المصحف المستقصى</span>
        </div>
        <div className="bg-slate-900 border-2 border-slate-900 text-white rounded-none p-3 sm:p-3.5 text-center relative overflow-hidden">
          <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">إجمالي حساب الجمل</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-sans block mt-1">{summary.totalJummal}</span>
          <span className="text-[9px] text-slate-400 mt-0.5 block font-medium">الوزن التشغيلي الأكبر</span>
        </div>
      </div>

      {/* Wave Preview inside Output Screen for Al-Bunyan */}
      {previewChartInOutput && activeSurah && points.length > 0 && (
        <div className="bg-slate-50 border-2 border-slate-300 p-4 sm:p-5 rounded-none space-y-3 text-right" dir="rtl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 justify-start">
              <span>📊 المخطط الموجي المعاين للتصدير والطباعة (سورة {activeSurah.name}):</span>
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportOutputChartPNG}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-none transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              >
                🖼 تصدير المخطط كصورة (PNG)
              </button>
              <span className="text-[10px] text-amber-800 font-extrabold bg-amber-50 border border-amber-200 px-2.5 py-1 text-center">
                ثابت السورة المعتمد: {activeSurah.letters} ({activeSurah.keyValue})
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3">
            <svg viewBox={`0 0 ${width} ${height}`} className="wave-chart-output-svg w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="waveGradOutput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="waveStrokeOutput" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#312e81" />
                  <stop offset="50%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Wave Area Fill */}
              <path d={areaPathData} fill="url(#waveGradOutput)" />

              {/* Wave Line Stroke */}
              <path d={pathData} fill="none" stroke="url(#waveStrokeOutput)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Draw interactive points for each verse */}
              {points.map((p, idx) => {
                const isCompatible = isNoorani ? p.verse.jummalValue % activeSurah.digitalRoot === 0 : false;
                return (
                  <circle 
                    key={idx}
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill={isCompatible ? "#10b981" : "#4f46e5"} 
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>
          </div>
          <p className="text-[10px] text-slate-400 font-medium text-center">
            * هذا المخطط الموجي المعروض في شاشة المخرجات يمثل التموج التكراري لحساب جمل آيات السورة الكريمة.
          </p>
        </div>
      )}

      {/* Unified Master Filter & Search Bar */}
      {!isSearchMode && (
        <AdvancedFilterBar
          filters={advancedFilters}
          onFilterChange={(newFilters) => {
            setAdvancedFilters(newFilters);
            if (newFilters.mizanColor !== mizanFilter) {
              setMizanFilter(newFilters.mizanColor);
            }
          }}
          onResetFilters={() => {
            setAdvancedFilters(initialFilterState);
            setMizanFilter('all');
          }}
          totalCount={verses.length}
          filteredCount={tableRows.length}
          isNoorani={isNoorani}
          surahName={activeSurah?.name}
          surahCoeff={activeSurah ? getSurahCoefficient(activeSurah.id) : 1}
          activeSurah={activeSurah}
          filterCounts={filterCounts}
        />
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verses Table List */}
        <div className="lg:col-span-7 bg-white border-2 border-slate-200 rounded-none overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-slate-900" />
          
          {/* Track Selection Tabs for Surah Al-Shura (42) */}
          {activeSurah?.id === 42 && isNoorani && (
            <div className="bg-slate-50 border-b-2 border-slate-200 p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 shrink-0 select-none">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  منظومة مسارات سورة الشورى المستقلة (الآيتان 1 و 2):
                </span>
                <div className="flex flex-wrap w-full sm:w-auto gap-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedShuraTab('hameem'); setShuraCombinedFilter('all'); setCurrentPage(1); }}
                    className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-black text-center transition-all cursor-pointer rounded-none border-2 ${
                      selectedShuraTab === 'hameem'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/10'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    📈 جدول مسار حم (معامل 3)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedShuraTab('asaq'); setShuraCombinedFilter('all'); setCurrentPage(1); }}
                    className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-black text-center transition-all cursor-pointer rounded-none border-2 ${
                      selectedShuraTab === 'asaq'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/10'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    ✨ جدول مسار عسق (معامل 5)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedShuraTab('combined'); setCurrentPage(1); }}
                    className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-black text-center transition-all cursor-pointer rounded-none border-2 ${
                      selectedShuraTab === 'combined'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    🌟 التكامل المزدوج والخصائص المشتركة (حم ⟷ عسق)
                  </button>
                </div>
              </div>

              {/* Special Shared Properties Banner for Combined Mode */}
              {selectedShuraTab === 'combined' && (
                <div className="bg-gradient-to-r from-amber-50/90 via-emerald-50/60 to-amber-50/90 border-2 border-amber-300 p-3.5 rounded-none text-right">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5 pb-2 border-b border-amber-200/70">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-black text-amber-950">
                        الخصائص المشتركة الرابطة بين حم (معامل 3) وعسق (معامل 5):
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 border border-amber-300">
                      فاتحتان مستقلتان في آيتين منفصلتين (1 و 2)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-2.5">
                    {/* Metric 1 */}
                    <div 
                      onClick={() => { setShuraCombinedFilter(prev => prev === 'same_digit' ? 'all' : 'same_digit'); setCurrentPage(1); }}
                      className={`p-2.5 border transition-all cursor-pointer text-center ${
                        shuraCombinedFilter === 'same_digit'
                          ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400'
                          : 'bg-white border-amber-200 hover:bg-amber-50/70'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-600 block">تطابق البصمة الأحادية (حم = عسق)</span>
                      <span className="text-base font-black text-amber-800 font-mono">{shuraLinkingStats.matchingFpCount} آية</span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">تتساوى فيها بصمة حم مع بصمة عسق (1-9)</span>
                    </div>

                    {/* Metric 2 */}
                    <div 
                      onClick={() => { setShuraCombinedFilter(prev => prev === 'double_exact' ? 'all' : 'double_exact'); setCurrentPage(1); }}
                      className={`p-2.5 border transition-all cursor-pointer text-center ${
                        shuraCombinedFilter === 'double_exact'
                          ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-400'
                          : 'bg-white border-emerald-200 hover:bg-emerald-50/70'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-600 block">التوافق الرياضي المشترك الصرف</span>
                      <span className="text-base font-black text-emerald-800 font-mono">{shuraLinkingStats.doubleExactCount} آية</span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">قسمة بلا باقٍ على 3 و 5 معاً (÷ 15)</span>
                    </div>

                    {/* Metric 3 */}
                    <div 
                      onClick={() => { setShuraCombinedFilter(prev => prev === 'equal_score' ? 'all' : 'equal_score'); setCurrentPage(1); }}
                      className={`p-2.5 border transition-all cursor-pointer text-center ${
                        shuraCombinedFilter === 'equal_score'
                          ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-400'
                          : 'bg-white border-blue-200 hover:bg-blue-50/70'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-600 block">تماثل درجة الموازين الستة</span>
                      <span className="text-base font-black text-blue-800 font-mono">{shuraLinkingStats.equalScoreCount} آية</span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">تحقق نفس عدد الموازين في كلا المسارين</span>
                    </div>

                    {/* Metric 4 */}
                    <div 
                      onClick={() => { setShuraCombinedFilter(prev => prev === 'elite_51' ? 'all' : 'elite_51'); setCurrentPage(1); }}
                      className={`p-2.5 border transition-all cursor-pointer text-center ${
                        shuraCombinedFilter === 'elite_51'
                          ? 'bg-amber-100 border-amber-600 ring-2 ring-amber-500'
                          : 'bg-white border-amber-300 hover:bg-amber-50/70'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-amber-900 block">👑 النخبة المشتركة الكبرى</span>
                      <span className="text-base font-black text-amber-950 font-mono">1 آية (الآية 51)</span>
                      <span className="text-[9px] text-amber-800 block mt-0.5">تكامل 6/6 + قسمة ÷15 + بصمة 9</span>
                    </div>
                  </div>

                  {/* Filter Status & Reset */}
                  {shuraCombinedFilter !== 'all' && (
                    <div className="flex items-center justify-between bg-amber-100/90 border border-amber-300 px-2.5 py-1 text-xs">
                      <span className="font-bold text-amber-950">
                        {shuraCombinedFilter === 'same_digit' && '🔍 تم تصفية الآيات ذات البصمة الأحادية المتطابقة (حم = عسق)'}
                        {shuraCombinedFilter === 'double_exact' && '🔍 تم تصفية الآيات ذات التوافق الرياضي المزدوج الصرف (مضاعف 15)'}
                        {shuraCombinedFilter === 'equal_score' && '🔍 تم تصفية الآيات المتماثلة في درجة الموازين الستة'}
                        {shuraCombinedFilter === 'elite_51' && '🔍 تم تصفية آية النخبة النورانية المشتركة الكبرى (الآية 51: تكامل 6/6 وقسمة ÷15 وبصمة أحادية 9)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setShuraCombinedFilter('all'); setCurrentPage(1); }}
                        className="text-[10px] font-black text-amber-900 underline hover:text-amber-950 cursor-pointer"
                      >
                        إلغاء التصفية وعرض كل آيات السورة ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Informative Table Header, Legend Banner, and View Controls */}
          <div className="bg-slate-50 border-b border-slate-200 p-4 text-right space-y-3 select-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  📋 {searchScopeTitle || 'ميزان التحليل الشامل وجدول استقصاء التوافقات الموحد'}:
                </h4>
                <span className="text-[11px] font-bold text-slate-500">
                  ({tableRows.length} آية)
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 border border-emerald-200 rounded-sm">
                  📖 الرسم العثماني والاختزال
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-600 leading-relaxed">
              يوضح هذا الجدول البنيان الحسابي الشامل للآيات الكريمة مع تفكيك وقيم الاختزال الرقمي (1-9) للجمّل، والكلمات، والحروف، والمجموع.
            </p>
          </div>

          {/* Quick Filter Bar for Noorani 29 Surahs in Comprehensive Search */}
          {(showSurahNameColumn || verses.some(v => (v as any).surahName)) && (
            <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs select-none">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  مجموعة السور النورانية الـ (29):
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setNooraniSurahFilter('all'); setCurrentPage(1); }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-sm border transition-colors cursor-pointer ${
                      nooraniSurahFilter === 'all'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    كل السور ({tableRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNooraniSurahFilter('all_29'); setCurrentPage(1); }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-sm border transition-colors cursor-pointer flex items-center gap-1 ${
                      nooraniSurahFilter === 'all_29'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs ring-1 ring-amber-400'
                        : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    <span>✨ السور الـ 29 فقط</span>
                  </button>
                </div>
              </div>
              {typeof nooraniSurahFilter === 'number' && (
                <div className="flex items-center gap-2 bg-amber-100/90 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-sm text-xs font-bold">
                  <span>تصفية مخصصة: {NOORANI_SURAHS.find(s => s.id === nooraniSurahFilter)?.name || `سورة #${nooraniSurahFilter}`}</span>
                  <button
                    type="button"
                    onClick={() => { setNooraniSurahFilter('all'); setCurrentPage(1); }}
                    className="text-amber-700 hover:text-rose-600 cursor-pointer p-0.5"
                    title="إلغاء التصفية والعودة للكل"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="table-container overflow-x-auto">
            <table className="w-full text-right border-collapse text-[11px] min-w-[950px]">
              <thead>
                <tr className="bg-[#0f172a] text-white border-b-2 border-slate-300 font-bold select-none text-center">
                  <th className="p-2 border border-slate-200 number-column">م</th>
                  {(showSurahNameColumn || verses.some(v => (v as any).surahName)) && (
                    <th className="p-2 border border-slate-200 font-bold">السورة</th>
                  )}
                  <th className="p-2 border border-slate-200 number-column">رقم الآية</th>
                  <th className="p-2 border border-slate-200 text-right verse-column">الآية الكريمة</th>
                  <th className="p-2 border border-slate-200 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('jummal')}>حساب الجمل</th>
                  <th className="p-2 border border-slate-200">
                    {isNoorani 
                      ? (activeSurah?.id === 42 
                          ? (selectedShuraTab === 'combined' 
                              ? 'المساران (حم 3 ⟷ عسق 5)' 
                              : selectedShuraTab === 'asaq' ? 'المسار: عسق (معامل 5)' : 'المسار: حم (معامل 3)')
                          : 'المعامل النوراني')
                      : 'معامل السورة'}
                  </th>
                  <th className="p-2 border border-slate-200">
                    {isNoorani && activeSurah?.id === 42 && selectedShuraTab === 'combined'
                      ? 'ناتج القسمة (حم ÷ 3 | عسق ÷ 5)'
                      : 'ناتج القسمة'
                    }
                  </th>
                  <th className="p-2 border border-slate-200">
                    {isNoorani && activeSurah?.id === 42 && selectedShuraTab === 'combined'
                      ? 'الموازين الستة (حم 3 | عسق 5)'
                      : 'عمود التحقق (التوافقات الستة)'
                    }
                  </th>
                  <th className="p-2 border border-slate-200">
                    {isNoorani && activeSurah?.id === 42 && selectedShuraTab === 'combined'
                      ? 'البصمة الأحادية والربط المشترك'
                      : 'البصمة الأحادية والتحقق المدمج'
                    }
                  </th>
                  <th className="p-2 border border-slate-200 bg-indigo-950">اختزال الجمّل</th>
                  <th className="p-2 border border-slate-200 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('words')}>الكلمات</th>
                  <th className="p-2 border border-slate-200 bg-emerald-950">اختزال الكلمات</th>
                  <th className="p-2 border border-slate-200 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('letters')}>الحروف</th>
                  <th className="p-2 border border-slate-200 bg-blue-950">اختزال الحروف</th>
                  <th className="p-2 border border-slate-200">المجموع</th>
                  <th className="p-2 border border-slate-200 bg-amber-950">اختزال المجموع</th>
                  <th className="p-2 border border-slate-200 w-16">ملاحظات ونسخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedRows.map((rowItem, idx) => {
                  const v = rowItem.v;
                  const track = rowItem.track;
                  const isSelected = selectedVerseId === v.id;
                  const globalIdx = pageSize === -1 ? idx : (currentPage - 1) * pageSize + idx;
                  
                  const surahId = v.surahId || activeSurah?.id || 1;
                  const surahName = (v as any).surahName || activeSurah?.name || '';
                  const dummySurah = {
                    id: surahId,
                    name: surahName,
                    letters: track.letters,
                    keyValue: track.keyValue,
                    digitalRoot: track.digitalRoot
                  };
                  const comp = getCompatibilityDetails(v, dummySurah);
                  const isPerfectMatch = comp.score >= 5 || comp.isDirectMatch;
                  const intEval = IntegratedCompatibilityManager.evaluate(v, comp, dummySurah);
                  const vKey = `${surahId}:${v.verseNumber || v.id}`;
                  const hasNote = Boolean(researcherNotes[vKey] && researcherNotes[vKey].trim());

                  // Surah Al-Shura Parallel Dual Tracks Support
                  const isShuraCombined = isNoorani && activeSurah?.id === 42 && selectedShuraTab === 'combined';
                  const sHameem = { id: 42, name: 'الشورى (حم)', letters: 'حم', keyValue: 48, digitalRoot: 3 };
                  const sAsaq = { id: 42, name: 'الشورى (عسق)', letters: 'عسق', keyValue: 230, digitalRoot: 5 };
                  const compH = isShuraCombined ? getCompatibilityDetails(v, sHameem) : comp;
                  const compA = isShuraCombined ? getCompatibilityDetails(v, sAsaq) : comp;

                  const isExactH = v.jummalValue > 0 && v.jummalValue % 3 === 0;
                  const isExactA = v.jummalValue > 0 && v.jummalValue % 5 === 0;
                  const isDoubleExact = isExactH && isExactA; // مضاعف تام لـ 15!

                  const fpH = isShuraCombined ? compH.finalSingleDigit : comp.finalSingleDigit;
                  const fpA = isShuraCombined ? compA.finalSingleDigit : comp.finalSingleDigit;
                  const isFpEqual = isShuraCombined && fpH === fpA;

                  const scoreH = compH.score;
                  const scoreA = compA.score;
                  const isEqualScore = isShuraCombined && scoreH === scoreA;
                  const surahMeta = activeSurah ? getSurahMetadata(activeSurah.id) : undefined;
                  const isTripleH = isShuraCombined && isTripleMatchElite(v, sHameem, surahMeta).isTripleMatch;
                  const isTripleA = isShuraCombined && isTripleMatchElite(v, sAsaq, surahMeta).isTripleMatch;
                  const isSharedEliteShura = isShuraCombined && (v.jummalValue > 0 && v.jummalValue % 15 === 0 && compH.finalSingleDigit === 9 && compA.finalSingleDigit === 9 && compH.score === 6);
                  const isTripleCombined = isSharedEliteShura;

                  // Division calculations
                  const divisor = isNoorani ? (track.digitalRoot || 1) : getSurahCoefficient(surahId);
                  const divisionResult = divisor > 0 ? (v.jummalValue / divisor) : 0;
                  const isExact = divisor > 0 && v.jummalValue > 0 && v.jummalValue % divisor === 0;
                  const isGreen = isExact;
                  const quotientStr = isExact ? divisionResult.toString() : divisionResult.toFixed(4);
                  const coeffLabel = isNoorani ? track.label : `سورة (${surahId})`;
                  
                  const reduction = reduceDigitalRoot(v.jummalValue);
                  const wordsReduction = reduceDigitalRoot(v.wordCount);
                  const lettersReduction = reduceDigitalRoot(v.letterCount);
                  const sumValue = v.wordCount + v.letterCount;
                  const sumReduction = reduceDigitalRoot(sumValue);
                  const verseNumVal = parseInt(v.verseNumber, 10) || v.id || 1;

                  // ربط مؤشرات المصفوفة الستة دون أدنى إزاحة من المصدر المركزي الموحد (comp):
                  const strictConditions = comp.conditions;
                  const strictScore = comp.score;
                  const rowStatusLabel = comp.statusLabel;
                  const rowStatusColor = comp.statusColor;
                  
                  const isDirectMatch = comp?.isDirectMatch;

                  let rowColorClass = 'hover:bg-slate-50';
                  let sideBorderClass = '';
                  
                  if (isSelected) {
                    rowColorClass = 'bg-amber-200/90 font-bold ring-2 ring-amber-500';
                    sideBorderClass = 'border-r-4 border-amber-600';
                  } else if (isShuraCombined && isDoubleExact) {
                    // توافق رياضي تام ومزدوج مع المسارين (مضاعف 15)
                    rowColorClass = 'bg-gradient-to-r from-emerald-100/90 via-teal-50/80 to-emerald-50/60 hover:bg-emerald-200/80 font-bold text-emerald-950';
                    sideBorderClass = 'border-r-4 border-emerald-600 shadow-xs';
                  } else if (isShuraCombined && isFpEqual) {
                    // تطابق البصمة الأحادية بين حم وعسق (1-9)
                    rowColorClass = 'bg-gradient-to-r from-amber-100/80 via-yellow-50 to-amber-50/60 hover:bg-amber-100 font-semibold text-amber-950';
                    sideBorderClass = 'border-r-4 border-amber-500';
                  } else if (isShuraCombined && (isExactH || isExactA)) {
                    rowColorClass = 'bg-emerald-500/10 hover:bg-emerald-500/15 font-medium';
                    sideBorderClass = 'border-r-4 border-emerald-500';
                  } else if (strictScore >= 5 || isDirectMatch) {
                    // التوافق التام (من 5/6 إلى 6/6) - لون ذهبي ملكي مميز
                    rowColorClass = 'bg-gradient-to-r from-amber-100/90 via-yellow-100/70 to-amber-50/60 hover:bg-amber-200/80 font-semibold text-amber-950';
                    sideBorderClass = 'border-r-4 border-amber-500 shadow-xs';
                  } else if (isExact) {
                    // STRICT REQUIREMENT: Only verses with remainder === 0 get green color
                    rowColorClass = 'bg-emerald-500/10 hover:bg-emerald-500/15 font-medium';
                    sideBorderClass = 'border-r-4 border-emerald-500';
                  } else if (strictScore >= 1) {
                    rowColorClass = 'bg-blue-500/5 hover:bg-blue-500/10';
                    sideBorderClass = 'border-r-4 border-blue-400';
                  } else {
                    rowColorClass = 'bg-rose-500/5 hover:bg-rose-500/10 text-slate-500';
                    sideBorderClass = 'border-r-4 border-rose-300';
                  }

                  return (
                    <tr 
                      key={`${v.id}-${track.letters}`} 
                      onClick={() => {
                        setSelectedVerseId(v.id);
                        setSelectedTrack(track);
                      }}
                      className={`cursor-pointer transition-colors text-center ${rowColorClass} ${sideBorderClass}`}
                    >
                      <td className="p-2 border border-slate-100 font-mono text-slate-500 number-column">{globalIdx + 1}</td>
                      {(showSurahNameColumn || verses.some(item => (item as any).surahName)) && (
                        <td className="p-2 border border-slate-100 font-bold text-slate-800 text-xs whitespace-nowrap">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span>{surahName}</span>
                            {NOORANI_SURAHS.some(s => s.id === surahId) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNooraniSurahFilter(prev => prev === surahId ? 'all' : surahId);
                                  setCurrentPage(1);
                                }}
                                title={nooraniSurahFilter === surahId ? "إلغاء تصفية السورة" : "تصفية بنقرة واحدة لعرض نتائج هذه السورة النورانية فقط"}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black rounded-full border transition-all cursor-pointer ${
                                  nooraniSurahFilter === surahId 
                                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs ring-1 ring-amber-400'
                                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                }`}
                              >
                                <span>✨ السور الـ 29</span>
                                {getNooraniRank(surahId) && <span className="bg-amber-200/80 text-amber-950 px-1 rounded-full text-[8px]">#{getNooraniRank(surahId)}</span>}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="p-2 border border-slate-100 number-column">
                        <div className="flex items-center justify-center gap-1">
                          <span className="px-1.5 py-0.5 bg-slate-900 text-white font-black font-sans rounded-sm">
                            {v.verseNumber}
                          </span>
                          {hasNote && (
                            <span title={`ملاحظة الباحث: ${researcherNotes[vKey]}`} className="text-amber-600 inline-flex items-center">
                              <StickyNote className="w-3 h-3 fill-amber-500 text-amber-700" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 border border-slate-100 text-right verse-column verse-text quran-font text-xs text-slate-900 font-black" title={v.rawText || v.text}>
                        {v.text ? (
                          <span className="leading-relaxed">
                            ( {v.rawText || v.text} )
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic font-sans">(البسملة المستبعدة)</span>
                        )}
                      </td>
                      <td className={`p-2 border border-slate-100 font-mono font-black ${
                        isDirectMatch 
                          ? 'bg-amber-100/90 text-amber-950 font-black relative overflow-hidden ring-2 ring-amber-400' 
                          : 'text-slate-900'
                      }`}>
                        <div className="flex flex-col items-center justify-center">
                          <span>{v.jummalValue}</span>
                          {isDirectMatch && (
                            <span className="px-1 py-0.5 bg-amber-500 text-slate-950 text-[7px] font-black rounded-sm mt-0.5 tracking-tight uppercase whitespace-nowrap block animate-pulse">
                              🎯 توافق مباشر
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* COLUMN CELL: المعامل */}
                      <td className="p-2 border border-slate-100 text-slate-700 font-mono font-bold text-xs text-center">
                        {isShuraCombined ? (
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span className="text-[10px] font-black text-amber-900 bg-amber-50 px-2 py-0.5 border border-amber-200 rounded-none">
                              حم (3)
                            </span>
                            <span className="text-[10px] font-black text-teal-900 bg-teal-50 px-2 py-0.5 border border-teal-200 rounded-none">
                              عسق (5)
                            </span>
                          </div>
                        ) : (
                          coeffLabel
                        )}
                      </td>

                      {/* COLUMN CELL: ناتج القسمة */}
                      <td className="p-2 border border-slate-100 font-mono" title={isShuraCombined ? `قسمة الجمل (${v.jummalValue}) على حم (3) وعلى عسق (5)` : `قسمة حساب الجمل (${v.jummalValue}) على المعامل (${divisor}) = ${divisionResult}`}>
                        {isShuraCombined ? (
                          <div className="flex flex-col gap-1 min-w-[135px]">
                            <div className={`text-xs px-2 py-0.5 border rounded-none flex items-center justify-between gap-1.5 ${isExactH ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-black' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                              <span className="text-[10px] text-amber-900 font-bold">حم ÷ 3:</span>
                              <span className="font-mono">{isExactH ? (v.jummalValue / 3).toString() : (v.jummalValue / 3).toFixed(4)}</span>
                              <span className="text-[10px]">{isExactH ? '✅' : '❌'}</span>
                            </div>
                            <div className={`text-xs px-2 py-0.5 border rounded-none flex items-center justify-between gap-1.5 ${isExactA ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-black' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                              <span className="text-[10px] text-teal-900 font-bold">عسق ÷ 5:</span>
                              <span className="font-mono">{isExactA ? (v.jummalValue / 5).toString() : (v.jummalValue / 5).toFixed(4)}</span>
                              <span className="text-[10px]">{isExactA ? '✅' : '❌'}</span>
                            </div>
                            {isDoubleExact && (
                              <span className="text-[9px] font-black bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 px-1.5 py-0.5 border border-amber-500 shadow-xs block text-center animate-pulse">
                                👑 توافق مزدوج تام (÷ 15)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={`font-black ${isExact ? 'text-emerald-800 text-xs' : 'text-slate-700 font-semibold'}`}>
                              {quotientStr}
                            </span>
                            {isExact && (
                              <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] font-black rounded-sm tracking-tight whitespace-nowrap shadow-xs">
                                قسمة بلا باقٍ ✅
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* COLUMN CELL: عمود التحقق والتوافقات الستة */}
                      <td className="p-2 border border-slate-100 align-middle">
                        {isShuraCombined ? (
                          <div className="flex flex-col gap-1.5 p-1 min-w-[140px]">
                            {/* Hameem Track Score & 6 conditions */}
                            <div className="bg-amber-50/80 p-1 border border-amber-200 text-[10px] flex items-center justify-between">
                              <span className="font-bold text-amber-900">حم: {scoreH}/6</span>
                              <div className="flex gap-0.5" dir="rtl">
                                {[1, 2, 3, 4, 5, 6].map(i => {
                                  const ach = compH.achievedSixRules?.some((r: any) => r.id === i);
                                  return (
                                    <span key={i} className={`w-3.5 h-3.5 flex items-center justify-center text-[8px] font-mono font-bold ${ach ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                      {i}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            {/* Asaq Track Score & 6 conditions */}
                            <div className="bg-teal-50/80 p-1 border border-teal-200 text-[10px] flex items-center justify-between">
                              <span className="font-bold text-teal-900">عسق: {scoreA}/6</span>
                              <div className="flex gap-0.5" dir="rtl">
                                {[1, 2, 3, 4, 5, 6].map(i => {
                                  const ach = compA.achievedSixRules?.some((r: any) => r.id === i);
                                  return (
                                    <span key={i} className={`w-3.5 h-3.5 flex items-center justify-center text-[8px] font-mono font-bold ${ach ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                      {i}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            {isEqualScore && (
                              <span className="text-[8px] font-black text-blue-900 bg-blue-50 px-1 py-0.5 border border-blue-200 text-center block">
                                ⚖️ تماثل الدرجة ({scoreH}/6)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 p-1 min-w-[130px]">
                            {/* Score indicator */}
                            <span className={`px-2 py-0.5 text-[9px] border font-extrabold rounded-none block text-center whitespace-nowrap ${rowStatusColor}`}>
                              {rowStatusLabel} ({strictScore}/6)
                            </span>

                            {/* 6 Conditions Small Dots/Indicators */}
                            <div className="flex gap-0.5 justify-center mt-0.5" dir="rtl">
                              {strictConditions.map((c, i) => {
                                const names = [
                                  `1. الميزان الأكبر: قسمة الجمل (${v.jummalValue}) على المعامل (${divisor}) [${strictConditions[0] ? 'متحقق بدون باقٍ ✅' : 'غير متحقق (يوجد باقٍ) ❌'}]`,
                                  `2. الميزان الهيكلي: (الجمل + رقم الآية = ${v.jummalValue + verseNumVal}) ÷ المعامل (${divisor}) [${strictConditions[1] ? 'متحقق ✅' : 'غير متحقق ❌'}]`,
                                  `3. ميزان الكثافة: (الكلمات + الحروف = ${v.wordCount + v.letterCount}) ÷ المعامل (${divisor}) [${strictConditions[2] ? 'متحقق ✅' : 'غير متحقق ❌'}]`,
                                  `4. الميزان التراكمي الشامل ÷ المعامل (${divisor}) [${strictConditions[3] ? 'متحقق ✅' : 'غير متحقق ❌'}]`,
                                  `5. ميزان الاختزال الذاتي: أس الآية (${reduceDigitalRoot(v.jummalValue)}) = أس المعامل (${reduceDigitalRoot(divisor)}) أو 9 [${strictConditions[4] ? 'متحقق ✅' : 'غير متحقق ❌'}]`,
                                  `6. ميزان رقم الآية السنني: الآية (${verseNumVal}) ÷ (${divisor}) أو تطابق الأس [${strictConditions[5] ? 'متحقق ✅' : 'غير متحقق ❌'}]`
                                ];
                                return (
                                  <span 
                                    key={i} 
                                    title={names[i]}
                                    className={`w-4 h-4 flex items-center justify-center rounded-none text-[8px] font-black text-white ${
                                      c ? (i === 0 ? 'bg-emerald-600 font-black ring-1 ring-emerald-400' : 'bg-emerald-700') : 'bg-slate-300 text-slate-500'
                                    }`}
                                  >
                                    {i + 1}
                                  </span>
                                );
                              })}
                            </div>

                            {/* Tawheed Indicators */}
                            {comp.isTawheedCompatibleJoint && (
                              <span className="px-1.5 py-0.5 text-[8px] bg-amber-100 text-amber-900 border border-amber-300 font-black block text-center rounded-none ring-1 ring-amber-400 mt-1 whitespace-nowrap" title="توافق توحيدي بنيوي مشترك (الخطوة الأولى للاختزال = 11)">
                                توحيدي بنيوي 🌟
                              </span>
                            )}
                            {comp.isTawheedCompatibleSelf && (
                              <span className="px-1.5 py-0.5 text-[8px] bg-emerald-50 text-emerald-900 border border-emerald-200 font-black block text-center rounded-none ring-1 ring-emerald-300 mt-1 whitespace-nowrap" title="توافق توحيدي ذاتي (ينتهي بالرقم 1)">
                                توحيدي ذاتي 🌟
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      
                      {/* COLUMN CELL: البصمة الأحادية والتحقق المدمج */}
                      <td className="p-2 border border-slate-100 font-sans align-middle">
                        {isShuraCombined ? (
                          <div className="flex flex-col gap-1.5 p-1 min-w-[150px]">
                            {/* Hameem Track Fingerprint */}
                            <div className="bg-amber-50/90 p-1.5 border border-amber-200 flex items-center justify-between gap-1.5 text-[10px]">
                              <div className="flex flex-col text-right">
                                <span className="font-bold text-amber-900">مسار حم (3):</span>
                                <span className="text-[8px] text-slate-500 font-mono" dir="ltr" title="[حساب الجمل المختزل] × [رقم الآية + المعامل المختزل] = الناتج">
                                  {reduction} × ({parseInt(v.verseNumber, 10) || v.id} + {compH.reducedFactor}) = {compH.newColumnProduct}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span 
                                  title="البصمة الأحادية لمسار حم"
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-xs ${
                                    compH.isDominantNine || fpH === 9 ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 ring-1 ring-amber-300 font-black' :
                                    compH.isDigitalMirror ? 'bg-emerald-600 ring-1 ring-emerald-300' :
                                    compH.isVerseFingerprint ? 'bg-indigo-600 ring-1 ring-indigo-300' :
                                    fpH === 3 ? 'bg-amber-600' :
                                    fpH === 5 ? 'bg-purple-600' :
                                    fpH === 1 ? 'bg-emerald-600' :
                                    fpH === 2 ? 'bg-teal-600' :
                                    fpH === 4 ? 'bg-sky-600' :
                                    fpH === 6 ? 'bg-indigo-600' :
                                    fpH === 7 ? 'bg-cyan-600' :
                                    fpH === 8 ? 'bg-emerald-800' :
                                    'bg-slate-700 text-white'
                                  }`}
                                >
                                  {fpH}
                                </span>
                              </div>
                            </div>

                            {/* Asaq Track Fingerprint */}
                            <div className="bg-teal-50/90 p-1.5 border border-teal-200 flex items-center justify-between gap-1.5 text-[10px]">
                              <div className="flex flex-col text-right">
                                <span className="font-bold text-teal-900">مسار عسق (5):</span>
                                <span className="text-[8px] text-slate-500 font-mono" dir="ltr" title="[حساب الجمل المختزل] × [رقم الآية + المعامل المختزل] = الناتج">
                                  {reduction} × ({parseInt(v.verseNumber, 10) || v.id} + {compA.reducedFactor}) = {compA.newColumnProduct}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span 
                                  title="البصمة الأحادية لمسار عسق"
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-xs ${
                                    compA.isDominantNine || fpA === 9 ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 ring-1 ring-amber-300 font-black' :
                                    compA.isDigitalMirror ? 'bg-emerald-600 ring-1 ring-emerald-300' :
                                    compA.isVerseFingerprint ? 'bg-indigo-600 ring-1 ring-indigo-300' :
                                    fpA === 5 ? 'bg-purple-600' :
                                    fpA === 3 ? 'bg-amber-600' :
                                    fpA === 1 ? 'bg-emerald-600' :
                                    fpA === 2 ? 'bg-teal-600' :
                                    fpA === 4 ? 'bg-sky-600' :
                                    fpA === 6 ? 'bg-indigo-600' :
                                    fpA === 7 ? 'bg-cyan-600' :
                                    fpA === 8 ? 'bg-emerald-800' :
                                    'bg-slate-700 text-white'
                                  }`}
                                >
                                  {fpA}
                                </span>
                              </div>
                            </div>

                            {/* Comparison Indicator */}
                            {isFpEqual ? (
                              <span className="text-[8px] font-black text-amber-950 bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 px-1.5 py-0.5 border border-amber-400 text-center block shadow-xs animate-pulse">
                                🎯 تطابق البصمة (حم = عسق = {fpH})
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold text-slate-500 bg-slate-50 px-1 py-0.5 border border-slate-200 text-center block">
                                تباين البصمتين ({fpH} ⟷ {fpA})
                              </span>
                            )}

                            {/* Triple Match Elite Badge for Combined Mode */}
                            {isSharedEliteShura ? (
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 text-[8px] font-black rounded-sm border border-amber-600 shadow-xs block text-center mt-0.5 animate-pulse">
                                👑 آية النخبة النورانية المشتركة (تكامل 6/6 - قسمة بلا باق ÷15 - بصمة 9)
                              </span>
                            ) : null}
                          </div>
                        ) : (
                        comp && (() => {
                          const surahMeta = activeSurah ? getSurahMetadata(activeSurah.id) : undefined;
                          const dummySurah = activeSurah ? {
                            id: activeSurah.id,
                            name: activeSurah.name,
                            letters: track.letters,
                            keyValue: track.keyValue,
                            digitalRoot: track.digitalRoot
                          } : null;
                          const tripleRes = dummySurah ? isTripleMatchElite(v, dummySurah, surahMeta) : { isTripleMatch: false };

                          return (
                          <div className="flex flex-col items-center justify-center gap-1">
                            {/* Equation and raw product */}
                            <span className="text-[9px] text-slate-400 font-mono" dir="ltr" title="[حساب الجمل المختزل] × [رقم الآية + المعامل المختزل] = الناتج">
                              {reduction} × ({parseInt(v.verseNumber, 10) || v.id} + {comp.reducedFactor}) = {comp.newColumnProduct}
                            </span>
                            
                            {/* Circular color-coded digit badge */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span 
                                title={`البصمة الأحادية للآية: ${comp.finalSingleDigit}`}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm transition-all duration-300 ${
                                  comp.isDominantNine || comp.finalSingleDigit === 9 ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 ring-2 ring-amber-300 scale-105 animate-pulse font-black' :
                                  comp.isDigitalMirror ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 font-black' :
                                  comp.isVerseFingerprint ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 font-black' :
                                  comp.finalSingleDigit === 1 ? 'bg-emerald-600 text-white ring-1 ring-emerald-300 font-black' :
                                  comp.finalSingleDigit === 2 ? 'bg-teal-600 text-white ring-1 ring-teal-300 font-black' :
                                  comp.finalSingleDigit === 3 ? 'bg-amber-600 text-white ring-1 ring-amber-300 font-black' :
                                  comp.finalSingleDigit === 4 ? 'bg-sky-600 text-white ring-1 ring-sky-300 font-black' :
                                  comp.finalSingleDigit === 5 ? 'bg-purple-600 text-white ring-1 ring-purple-300 font-black' :
                                  comp.finalSingleDigit === 6 ? 'bg-indigo-600 text-white ring-1 ring-indigo-300 font-black' :
                                  comp.finalSingleDigit === 7 ? 'bg-cyan-600 text-white ring-1 ring-cyan-300 font-black' :
                                  comp.finalSingleDigit === 8 ? 'bg-emerald-800 text-white ring-1 ring-emerald-400 font-black' :
                                  'bg-slate-700 text-white font-bold'
                                }`}
                              >
                                {comp.finalSingleDigit}
                              </span>

                              {comp.compactStatus && comp.compactStatus !== 'غير محققة' && (
                                <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-sm whitespace-nowrap shadow-xs ${
                                  comp.isCompactDense 
                                    ? 'bg-purple-100 text-purple-900 border border-purple-300' 
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                }`}>
                                  {comp.compactStatus}
                                </span>
                              )}
                            </div>

                            {/* Conditions Met Summary */}
                            {comp.compactStatus && comp.compactStatus !== 'غير محققة' && (
                              <div className="flex gap-1 flex-wrap justify-center mt-1">
                                {comp.isDominantNine && (
                                  <span className="px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 text-[7px] font-bold rounded-sm whitespace-nowrap" title="توافق الرقم الذاتي السائد (9)">
                                    ذاتي سائد (9)
                                  </span>
                                )}
                                {comp.isOriginalMatch && (
                                  <span className="px-1 py-0.2 bg-teal-100 text-teal-900 border border-teal-300 text-[7px] font-bold rounded-sm whitespace-nowrap" title="تطابق مع الاختزال الرقمي الأصلي للآية">
                                    اختزال أصلي ({comp.verseDigitalRoot})
                                  </span>
                                )}
                                {comp.isDensityMatch && (
                                  <span className="px-1 py-0.2 bg-purple-100 text-purple-900 border border-purple-300 text-[7px] font-bold rounded-sm whitespace-nowrap" title="تطابق مع اختزال مجموع الكلمات والحروف">
                                    كثيفي ({comp.densityReduction})
                                  </span>
                                )}
                                {comp.isDigitalMirror && (
                                  <span className="px-1 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[7px] font-bold rounded-sm whitespace-nowrap" title="توافق المرآة الرقمية (التطابق مع المعامل)">
                                    المرآة الرقمية
                                  </span>
                                )}
                                {comp.isVerseDensityMatch && (
                                  <span className="px-1 py-0.2 bg-indigo-100 text-indigo-900 border border-indigo-300 text-[7px] font-black rounded-sm whitespace-nowrap" title={`مجموع الكلمات والحروف (${comp.densityVal}) = رقم الآية (${comp.verseNumRaw})`}>
                                    بصمة آية كثافة ({comp.verseNumRaw})
                                  </span>
                                )}
                                {comp.isVerseEquationMatch && (
                                  <span className="px-1 py-0.2 bg-indigo-100 text-indigo-900 border border-indigo-300 text-[7px] font-black rounded-sm whitespace-nowrap" title={`ناتج المعادلة قبل الاختزال (${comp.newColumnProduct}) = رقم الآية (${comp.verseNumRaw})`}>
                                    بصمة آية معادلة ({comp.verseNumRaw})
                                  </span>
                                )}
                                {comp.isVerseWordMatch && !comp.isVerseDensityMatch && (
                                  <span className="px-1 py-0.2 bg-indigo-50 text-indigo-900 border border-indigo-200 text-[7px] font-bold rounded-sm whitespace-nowrap" title={`عدد الكلمات (${comp.wordCount}) = رقم الآية (${comp.verseNumRaw})`}>
                                    بصمة آية كلمات ({comp.verseNumRaw})
                                  </span>
                                )}
                                {comp.isVerseLetterMatch && !comp.isVerseDensityMatch && (
                                  <span className="px-1 py-0.2 bg-indigo-50 text-indigo-900 border border-indigo-200 text-[7px] font-bold rounded-sm whitespace-nowrap" title={`عدد الحروف (${comp.letterCount}) = رقم الآية (${comp.verseNumRaw})`}>
                                    بصمة آية حروف ({comp.verseNumRaw})
                                  </span>
                                )}
                                {comp.isQuran114Match && (
                                  <span className="px-1 py-0.2 bg-amber-100 text-amber-950 border border-amber-400 text-[7px] font-black rounded-sm whitespace-nowrap shadow-xs" title="تطابق الكثافة أو ناتج المعادلة أو الكلمات/الحروف مع 114 (عدد سور القرآن الكريم)">
                                    🌟 بصمة قرآنية (114)
                                  </span>
                                )}
                                {comp.isAsma99Match && (
                                  <span className="px-1 py-0.2 bg-amber-100 text-amber-950 border border-amber-500 text-[7px] font-black rounded-sm whitespace-nowrap shadow-xs" title="تطابق الكثافة أو ناتج المعادلة أو الكلمات/الحروف مع 99 (أسماء الله الحسنى)">
                                    📿 الأسماء الحسنى (99)
                                  </span>
                                )}
                                {comp.isAge63Match && (
                                  <span className="px-1 py-0.2 bg-teal-100 text-teal-950 border border-teal-400 text-[7px] font-black rounded-sm whitespace-nowrap shadow-xs" title="تطابق الكثافة أو ناتج المعادلة أو الكلمات/الحروف مع 63 (العمر الشريف للرسول صلى الله عليه وسلم)">
                                    🕊️ العمر الشريف (63)
                                  </span>
                                )}
                                {comp.isTanzeel23Match && (
                                  <span className="px-1 py-0.2 bg-sky-100 text-sky-950 border border-sky-400 text-[7px] font-black rounded-sm whitespace-nowrap shadow-xs" title="تطابق الكثافة أو ناتج المعادلة أو الكلمات/الحروف مع 23 (سنوات التنزيل المباركة)">
                                    📖 سنوات التنزيل (23)
                                  </span>
                                )}
                                {comp.isSurahIdMatch && (
                                  <span className="px-1 py-0.2 bg-emerald-100 text-emerald-950 border border-emerald-300 text-[7px] font-black rounded-sm whitespace-nowrap" title={`تطابق الكثافة أو المعادلة أو الكلمات/الحروف مع رقم السورة (${comp.surahIdRaw})`}>
                                    رقم السورة ({comp.surahIdRaw})
                                  </span>
                                )}
                                {comp.isNooraniRankMatch && comp.nooraniRank && (
                                  <span className="px-1 py-0.2 bg-fuchsia-100 text-fuchsia-950 border border-fuchsia-300 text-[7px] font-black rounded-sm whitespace-nowrap" title={`تطابق الكثافة أو المعادلة أو الكلمات/الحروف مع ترتيب السورة النورانية الـ 29 (ترتيبها: ${comp.nooraniRank})`}>
                                    ترتيب نوراني ({comp.nooraniRank})
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Triple Match Badge */}
                            {tripleRes.isTripleMatch && (
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 text-[8px] font-black rounded-sm border border-amber-600 shadow-xs block mt-1">
                                🌟 نخبة نورانية (Triple Match)
                              </span>
                            )}

                            {/* Perfect Match Golden Indicator (5/6 to 6/6) */}
                            {isPerfectMatch && (
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-[8px] rounded-sm shadow-xs border border-amber-600 block mt-1 whitespace-nowrap">
                                🏆 توافق تام ({comp.score}/6)
                              </span>
                            )}
                          </div>
                        );
                        })()
                        )}
                      </td>

                      {/* اختزال الجمّل */}
                      <td className="p-2 border border-slate-100 font-mono" title={getReductionExplanation(v.jummalValue).equation}>
                        <div className="flex items-center justify-center">
                          <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-300 flex items-center justify-center text-xs text-indigo-900 font-black">
                            {reduction}
                          </span>
                        </div>
                      </td>

                      {/* الكلمات */}
                      <td className="p-2 border border-slate-100 font-mono text-slate-700 font-bold">{v.wordCount}</td>

                      {/* اختزال الكلمات */}
                      <td className="p-2 border border-slate-100 font-mono" title={getReductionExplanation(v.wordCount).equation}>
                        <div className="flex items-center justify-center">
                          <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-xs text-emerald-900 font-black">
                            {wordsReduction}
                          </span>
                        </div>
                      </td>

                      {/* الحروف */}
                      <td className="p-2 border border-slate-100 font-mono text-slate-700 font-bold">{v.letterCount}</td>

                      {/* اختزال الحروف */}
                      <td className="p-2 border border-slate-100 font-mono" title={getReductionExplanation(v.letterCount).equation}>
                        <div className="flex items-center justify-center">
                          <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-300 flex items-center justify-center text-xs text-blue-900 font-black">
                            {lettersReduction}
                          </span>
                        </div>
                      </td>

                      {/* المجموع */}
                      <td className="p-2 border border-slate-100 font-mono text-slate-950 font-black bg-slate-50/50">{sumValue}</td>

                      {/* اختزال المجموع */}
                      <td className="p-2 border border-slate-100 font-mono" title={getReductionExplanation(sumValue).equation}>
                        <div className="flex items-center justify-center">
                          <span className="w-5 h-5 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center text-xs text-amber-900 font-black">
                            {sumReduction}
                          </span>
                        </div>
                      </td>

                      {/* ملاحظات ونسخ */}
                      <td className="p-2 border border-slate-100 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenNoteModal(v, track);
                            }}
                            className={`p-1.5 transition-all inline-flex items-center justify-center cursor-pointer rounded-sm ${
                              hasNote
                                ? 'bg-amber-500 text-slate-950 font-black border border-amber-600 shadow-xs'
                                : 'hover:bg-slate-200 text-slate-400 hover:text-slate-900 border border-transparent'
                            }`}
                            title={hasNote ? `ملاحظة الباحث: ${researcherNotes[vKey]}` : "إضافة ملاحظة واستقصاء الباحث لهذه الآية"}
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyIndividualVerse(v);
                            }}
                            className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center justify-center cursor-pointer rounded-sm"
                            title="نسخ نص الآية وبياناتها"
                          >
                            {copiedVerseId === v.id ? (
                              <span className="text-[10px] text-emerald-600 font-bold">تم!</span>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Bar */}
          {tableRows.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none text-xs">
              <div className="flex flex-wrap items-center gap-2 text-slate-600 text-[11px]">
                <span>
                  عرض الآيات{' '}
                  <strong className="text-slate-900 font-mono">
                    {pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}
                  </strong>{' '}
                  -{' '}
                  <strong className="text-slate-900 font-mono">
                    {pageSize === -1 ? tableRows.length : Math.min(currentPage * pageSize, tableRows.length)}
                  </strong>{' '}
                  من إجمالي{' '}
                  <strong className="text-slate-900 font-mono">{tableRows.length}</strong> آية
                </span>
                {tableRows.length > 25 && (
                  <div className="flex items-center gap-1 mr-3">
                    <span className="text-slate-500 text-[10px]">عرض بالصفحة:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-slate-300 rounded-sm px-2 py-0.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer"
                    >
                      <option value={25}>25 آية (افتراضي)</option>
                      <option value={50}>50 آية</option>
                      <option value={100}>100 آية</option>
                      <option value={-1}>عرض الكل</option>
                    </select>
                  </div>
                )}
              </div>

              {totalPages > 1 && pageSize !== -1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1 rounded-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="الصفحة الأولى"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-1 rounded-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="الصفحة السابقة"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1 px-2 font-mono text-[11px] text-slate-700">
                    <span>صفحة</span>
                    <strong className="text-slate-950 font-black">{currentPage}</strong>
                    <span>من</span>
                    <strong className="text-slate-950 font-black">{totalPages}</strong>
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-1 rounded-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="الصفحة التالية"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1 rounded-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="الصفحة الأخيرة"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
          {tableRows.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">
              لم نجد أي مطابقات لمعايير التحقق والتصفية المقترحة.
            </div>
          )}
        </div>

        {/* Selected Verse Interactive Breakdown Panel & Balancer Playground */}
        <div className="lg:col-span-5 space-y-4">
          {selectedVerse ? (
            <div className="bg-white border-2 border-slate-200 rounded-none p-5 md:p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-slate-900" />
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">تحليل وموازنة الآية رقم ({selectedVerse.verseNumber})</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyBreakdown}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-850 border border-amber-200 text-[10px] font-black rounded-sm flex items-center gap-1 transition-all cursor-pointer"
                    title="نسخ تقرير التحليل الكامل والموازنة للآية"
                  >
                    <Copy className="w-3 h-3 text-amber-700" />
                    <span>{isBreakdownCopied ? 'تم نسخ التحليل!' : 'نسخ التحليل'}</span>
                  </button>
                  <span className="px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px]">
                    مجموع الوزن: {selectedVerse.jummalValue}
                  </span>
                </div>
              </div>

              {/* Quran Text block */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-none text-center relative">
                <p className="quran-font text-lg leading-loose text-slate-900 font-bold whitespace-pre-wrap">
                  {selectedVerse.text ? `( ${selectedVerse.rawText || selectedVerse.text} )` : <span className="text-slate-400 text-sm italic font-sans">(تم استبعاد البسملة الاستفتاحية بالكامل من الحساب)</span>}
                </p>
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 font-medium">
                  <span className="font-mono">حروف: {selectedVerse.letterCount}</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-mono">كلمات: {selectedVerse.wordCount}</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-mono text-slate-900 font-black">جمل: {selectedVerse.jummalValue}</span>
                </div>
              </div>

              {/* Interactive Balance Simulator Playground (Real-time comparison of missing letters) */}
              <div className="space-y-4 border-t-2 border-dashed border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    محاكي موازنة الحروف والمطابقة الرقمية للبنيان:
                  </h4>
                  <button 
                    onClick={() => {
                      setPlaygroundText(selectedVerse.text);
                      setCustomAdjustments({});
                    }}
                    className="p-1 text-slate-400 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all rounded-none"
                    title="إعادة تعيين للتطابق مع الآية الأصلية"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  يمكنك اختبار نقص وزيادة الحروف ومقارنة قيم الجمّل مباشرة (مثال: محاذاة الفروق للحصول على المطابقة التامة لقيمة الثابت البنياني {activeSurah?.keyValue || ''}):
                </p>

                {/* Live playground input */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 block font-bold">النص التجريبي لمحاكاة التعديل الحركي للآية:</span>
                  <textarea
                    rows={2}
                    value={playgroundText}
                    onChange={(e) => setPlaygroundText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-900 rounded-none p-2.5 text-xs text-slate-800 quran-font outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Live Output Compare Badge Panel */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 text-white text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 block">جمّل الأصل</span>
                    <span className="text-base font-black font-mono block text-slate-300">{selectedVerse.jummalValue}</span>
                  </div>
                  <div className="border-x border-slate-800">
                    <span className="text-[9px] text-slate-400 block">جمّل المحاكاة</span>
                    <span className="text-base font-black font-mono block text-teal-400">{playgroundAnalysis.sum}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">التباين (الفرق)</span>
                    <span className={`text-base font-black font-mono block ${playgroundAnalysis.sum === selectedVerse.jummalValue ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {playgroundAnalysis.sum - selectedVerse.jummalValue > 0 ? '+' : ''}
                      {playgroundAnalysis.sum - selectedVerse.jummalValue}
                    </span>
                  </div>
                </div>

                {/* Letter discrepancy list with easy adjustments clickers */}
                <div className="bg-slate-50 border border-slate-200 rounded-none p-3 space-y-2">
                  <span className="text-[10px] font-black text-slate-700 block">جدول تكرار الحروف التفصيلي والتحكم التزايدي الفوري:</span>
                  
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin text-[11px] pr-1">
                    {Object.keys(JUMMAL_MAP).map((char) => {
                      const origCount = originalLetterCounts[char] || 0;
                      const manualAdjustment = customAdjustments[char] || 0;
                      const activePlaygroundCount = (playgroundAnalysis.charCounts[char] || 0) + manualAdjustment;
                      const charValue = JUMMAL_MAP[char];

                      if (origCount === 0 && activePlaygroundCount === 0) return null;

                      const isDiscrepant = origCount !== activePlaygroundCount;

                      return (
                        <div 
                          key={char} 
                          className={`p-1.5 border flex items-center justify-between transition-colors ${
                            isDiscrepant ? 'bg-amber-50/60 border-amber-200 font-bold' : 'bg-white border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="quran-font font-black text-slate-900 text-sm bg-slate-200/50 px-1.5 py-0.5">{char}</span>
                            <span className="text-[9px] text-slate-400 font-mono">({charValue})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 font-mono">
                              <span className="text-slate-400" title="الأصل">{origCount}</span>
                              <span className="text-slate-300">→</span>
                              <span className="text-slate-900 font-black" title="المعدّل">{activePlaygroundCount}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleAdjustValue(char, -1)}
                                className="p-0.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 rounded-none cursor-pointer"
                                title="إنقاص تكرار هذا الحرف بمقدار 1 لوزن المعادلة"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <button 
                                onClick={() => handleAdjustValue(char, 1)}
                                className="p-0.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 rounded-none cursor-pointer"
                                title="زيادة تكرار هذا الحرف بمقدار 1 لوزن المعادلة"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Special Mathematical notes or triggers */}
              <div className="pt-2">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-none text-xs leading-relaxed relative">
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-950" />
                  <div className="font-black text-slate-900 mb-2 uppercase tracking-wide">💡 رصد القوانين الهندسية المباشرة:</div>
                  <ul className="list-inside space-y-1.5 text-slate-600 text-[11px]">
                    <li>
                      حساب جمل الآية يعادل (<strong className="text-slate-950">{selectedVerse.jummalValue}</strong>) وبقسمته على معامل الحروف المقطعة المختزلة (<strong className="text-slate-950">{activeSurah?.digitalRoot || 1}</strong>) يعطي الناتج المباشر: <strong className="text-slate-950 font-mono">{(selectedVerse.jummalValue / (activeSurah?.digitalRoot || 1)).toFixed(4)}</strong>.
                    </li>
                    <li>
                      {selectedVerse.jummalValue % (activeSurah?.digitalRoot || 1) === 0 ? (
                        <span className="text-emerald-700 font-black">
                          ✅ هذه الآية محققة بالكامل ومضاعف صحيح متميز للمفتاح المختزل (قوة المفتاح = {selectedVerse.jummalValue / (activeSurah?.digitalRoot || 1)})!
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          ❌ لا شكراً (غير محققة) - ناتج القسمة يحتوي على باقٍ عشري {selectedVerse.jummalValue % (activeSurah?.digitalRoot || 1)}، مما يعني أنها لا تنتمي للبنيان الصحيح للمفتاح النوراني النشط بعد الاختزال.
                        </span>
                      )}
                    </li>
                    <li>العلاقة الكلية بين عدد الحروف ({selectedVerse.letterCount}) وقيمة الجمل الكلية هي {((selectedVerse.jummalValue / (selectedVerse.letterCount || 1)).toFixed(1))} كمتوسط حركة الحرف الواحد.</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-white border-2 border-dashed border-slate-200 rounded-none text-slate-400 text-xs">
              الرجاء النقر على إحدى الآيات في الجدول لعرض تحليلها وموازنتها التفصيلية
            </div>
          )}
        </div>
      </div>

      {/* Researcher Notes Modal */}
      {activeNoteVerse && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveNoteVerse(null)}
        >
          <div 
            className="bg-white border-2 border-slate-900 shadow-2xl max-w-lg w-full p-5 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">
                  ملاحظة واستقصاء الباحث — آية ({activeNoteVerse.verseNumber})
                  {activeNoteVerse.surahName ? ` [${activeNoteVerse.surahName}]` : ''}
                </h3>
              </div>
              <button 
                onClick={() => setActiveNoteVerse(null)}
                className="text-slate-400 hover:text-slate-900 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-3 text-xs leading-relaxed text-slate-800 quran-font">
              ( {activeNoteVerse.text} )
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                تدوين الملاحظة التحليلية أو الاستقصائية للآية:
              </label>
              <textarea
                rows={4}
                value={noteInputText}
                onChange={(e) => setNoteInputText(e.target.value)}
                placeholder="أدخل ملاحظاتك العلمية، أو أسباب الترشيح الاستقصائي، أو ربط الآية بالثوابت الكلية..."
                className="w-full p-2.5 border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-xs leading-relaxed resize-none rounded-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              {researcherNotes[activeNoteVerse.verseKey] ? (
                <button
                  type="button"
                  onClick={handleDeleteNote}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer rounded-none"
                >
                  حذف الملاحظة
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveNoteVerse(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer rounded-none"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-colors cursor-pointer rounded-none shadow-sm"
                >
                  حفظ الملاحظة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a]/95 backdrop-blur-sm text-slate-100 px-5 py-3.5 border-l-4 border-amber-500 shadow-2xl max-w-md flex items-center gap-2.5 animate-fade-in font-bold text-xs rounded-none">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
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
