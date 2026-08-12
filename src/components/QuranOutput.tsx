import React, { useState, useMemo, useEffect } from 'react';
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
  isTripleMatchElite
} from '../utils/jummal';
import { 
  FileSpreadsheet, Search, Eye, Download, Copy, Share, ArrowUpDown, 
  Hash, BookOpen, AlertCircle, Sparkles, Filter, CheckCircle2, X, Plus, Minus, RefreshCw
} from 'lucide-react';
import { SURAH_METADATA, getSurahMetadata } from '../utils/surahMetadata';
import { generateLocalAcademicAnalysis, generateTripleMatchEliteReport } from '../utils/reportTemplates';
import QuranFontSizeControl from './QuranFontSizeControl';

interface QuranOutputProps {
  verses: Verse[];
  onReset: () => void;
  activeSurah: NooraniSurah | null;
  setActiveSurah: (surah: NooraniSurah | null) => void;
  previewChartInOutput: boolean;
  setPreviewChartInOutput: (val: boolean) => void;
}

export default function QuranOutput({ 
  verses, 
  onReset, 
  activeSurah, 
  setActiveSurah,
  previewChartInOutput,
  setPreviewChartInOutput
}: QuranOutputProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate occurrences and versesContaining dynamically
  const { occurrenceCount, versesContainingCount } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { occurrenceCount: 0, versesContainingCount: 0 };
    }
    const q = normalizeArabicForSearch(searchQuery.trim());
    let occurrences = 0;
    let containingCount = 0;

    verses.forEach(v => {
      // Find occurrences in normalized v.text or clean text
      let countInText = 0;
      let textNormal = normalizeArabicForSearch(v.text);
      let pos = textNormal.indexOf(q);
      while (pos !== -1) {
        countInText++;
        pos = textNormal.indexOf(q, pos + q.length || 1);
      }

      let countInClean = 0;
      let textClean = normalizeArabicForSearch(v.cleanTextForCalculation || '');
      let posClean = textClean.indexOf(q);
      while (posClean !== -1) {
        countInClean++;
        posClean = textClean.indexOf(q, posClean + q.length || 1);
      }

      const maxCount = Math.max(countInText, countInClean);
      if (maxCount > 0) {
        occurrences += maxCount;
        containingCount++;
      }
    });

    return { occurrenceCount: occurrences, versesContainingCount: containingCount };
  }, [verses, searchQuery]);
  const [selectedVerseId, setSelectedVerseId] = useState<number | null>(verses[0]?.id || null);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [selectedShuraTab, setSelectedShuraTab] = useState<'hameem' | 'asaq'>('hameem');
  const [mizanFilter, setMizanFilter] = useState<'all' | 'verified_exact' | 'golden' | 'exact' | 'structural' | 'not_compatible' | 'tawheed' | 'triple_match'>('all');
  const [sortField, setSortField] = useState<'id' | 'jummal' | 'letters' | 'words'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isCopied, setIsCopied] = useState(false);
  const [isTableCopied, setIsTableCopied] = useState(false);
  const [copiedVerseId, setCopiedVerseId] = useState<number | null>(null);
  const [isCompatibleCopied, setIsCompatibleCopied] = useState(false);
  const [isBreakdownCopied, setIsBreakdownCopied] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportProgress, setReportProgress] = useState<{ current: number; total: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSurah) return;
    const currentKey = `banyan_cache_${activeSurah.id}`;
    // Gather all keys first to avoid modification during iteration issues
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('banyan_cache_') && key !== currentKey) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
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

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `al-bunyan-chart-${cleanSurahName}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error('Error exporting output chart PNG:', err);
    }
  };

  const handleCopyIndividualVerse = (v: Verse) => {
    let textToCopy = `📋 بيانات آية رقم (${v.verseNumber}) من سورة ${activeSurah.name}:\n`;
    textToCopy += `• النص الكريـم: ( ${v.text || 'البسملة'} )\n`;
    textToCopy += `• حساب الجمل الأبجدي الكلي: ${v.jummalValue}\n`;
    textToCopy += `• الاختزال الرقمي: ${reduceDigitalRoot(v.jummalValue)}\n`;
    textToCopy += `• عدد الكلمات: ${v.wordCount}\n`;
    textToCopy += `• عدد الحروف: ${v.letterCount}\n`;
    textToCopy += `• المجموع (الكلمات + الحروف): ${v.wordCount + v.letterCount}\n`;

    const isShurahameem = activeSurah.id === 42 && isNoorani && selectedShuraTab === 'hameem';
    const activeLetters = isNoorani ? (activeSurah.id === 42 ? (selectedShuraTab === 'hameem' ? 'حم' : 'عسق') : activeSurah.letters) : '';
    const activeKeyValue = isNoorani ? (activeSurah.id === 42 ? (selectedShuraTab === 'hameem' ? 48 : 230) : activeSurah.keyValue) : 0;
    const activeDigitalRoot = isNoorani ? (activeSurah.id === 42 ? (selectedShuraTab === 'hameem' ? 3 : 5) : activeSurah.digitalRoot) : 0;

    const dummySurahForCopy = {
      id: activeSurah.id,
      name: activeSurah.name,
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
      if (comp.isVerseFingerprint) matches.push(`بصمة الآية (${comp.verseNumReduced})`);
      textToCopy += `  - حالة التوافق المدمج: ${comp.compactStatus} عبر: ${matches.join(' - ')}\n`;
    } else {
      textToCopy += `  - حالة التوافق المدمج: غير محققة\n`;
    }

    if (comp.isDirectMatch) {
      textToCopy += `• 🎯 [توافق جوهري مباشر]: نعم! حساب الجمل الكلي للآية (${v.jummalValue}) يساوي تماماً قيمة المعامل المرجعي الأصلي لثابت السورة/المسار (${comp.originalFactorValue})\n`;
    }

    if (isNoorani) {
      if (activeSurah.id === 42) {
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
      } else {
        const isExact = v.jummalValue % activeSurah.digitalRoot === 0;
        textToCopy += `• التوافق مع المعامل النوراني (${activeSurah.letters}): ${isExact ? 'متوافقة (مضاعف صحيح) ✅' : 'غير متوافقة ❌'} (القسمة: ${(v.jummalValue / activeSurah.digitalRoot).toFixed(4)})\n`;
        textToCopy += `• درجة التوافق: ${comp.score}/6\n`;
        textToCopy += `• التوافقات الستة المحققة: ${getAchievedCompatibilities(v, activeSurah).join('، ') || 'لا يوجد'}\n`;
      }
    }
    navigator.clipboard.writeText(textToCopy);
    setCopiedVerseId(v.id);
    setTimeout(() => setCopiedVerseId(null), 2000);
  };

  const handleCopyCompatibleVersesList = () => {
    if (compatibleVerses.length === 0) return;
    let textToCopy = `📋 قائمة الآيات المتوافقة والمحققّة بالكامل مع سورة ${activeSurah.name}:\n\n`;
    compatibleVerses.forEach((v) => {
      if (activeSurah.id === 42) {
        const is3 = v.jummalValue % 3 === 0;
        const is5 = v.jummalValue % 5 === 0;
        const parts: string[] = [];
        if (is3) parts.push(`حم (قوة = ${v.jummalValue / 3})`);
        if (is5) parts.push(`عسق (قوة = ${v.jummalValue / 5})`);
        textToCopy += `• آية (${v.verseNumber}): ( ${v.text} ) | الجمل الكلي: ${v.jummalValue} | التوافق: ${parts.join(' | ')}\n`;
      } else {
        const power = Math.round(v.jummalValue / activeSurah.digitalRoot);
        textToCopy += `• آية (${v.verseNumber}): ( ${v.text} ) | الجمل الكلي: ${v.jummalValue} | قوة المفتاح: ${power}\n`;
      }
    });
    navigator.clipboard.writeText(textToCopy);
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

    navigator.clipboard.writeText(textToCopy);
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
      if (selectedShuraTab === 'hameem') {
        return { label: 'حم (معامل 3)', letters: 'حم', keyValue: 48, digitalRoot: 3, id: 42, name: activeSurah.name };
      } else {
        return { label: 'عسق (معامل 5)', letters: 'عسق', keyValue: 230, digitalRoot: 5, id: 42, name: activeSurah.name };
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
    if (!activeSurah || !isNoorani || !currentTrack) return { exactCount };
    
    verses.forEach(v => {
      const remainder = v.jummalValue % currentTrack.digitalRoot;
      if (remainder === 0) {
        exactCount++;
      }
    });

    return { exactCount };
  }, [verses, activeSurah, isNoorani, currentTrack]);

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

    if (activeSurah && isNoorani) {
      allItems.forEach(({ v, track }) => {
        const dummySurah = {
          id: activeSurah.id,
          name: activeSurah.name,
          letters: track.letters,
          keyValue: track.keyValue,
          digitalRoot: track.digitalRoot
        };
        const comp = getCompatibilityDetails(v, dummySurah);
        if (v.jummalValue % track.digitalRoot === 0) {
          verified_exact++;
        }
        if (comp.score === 6) {
          golden++;
        } else if (comp.score >= 3 && comp.score <= 5) {
          exact++;
        } else if (comp.score >= 1 && comp.score <= 2) {
          structural++;
        } else if (comp.score === 0) {
          not_compatible++;
        }
        if (comp.isTawheedCompatible) {
          tawheed++;
        }
        const surahMeta = getSurahMetadata(activeSurah.id);
        const tripleRes = isTripleMatchElite(v, dummySurah, surahMeta);
        if (tripleRes.isTripleMatch) {
          triple_match++;
        }
      });
    } else {
      all = verses.length;
    }

    return { all, verified_exact, golden, exact, structural, not_compatible, tawheed, triple_match };
  }, [verses, activeSurah, isNoorani, selectedShuraTab]);

  // Handle row sorting
  const handleSort = (field: 'id' | 'jummal' | 'letters' | 'words') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort verses (Query and Base Sort only)
  const processedVerses = useMemo(() => {
    let result = [...verses];

    // Search query
    if (searchQuery.trim()) {
      const q = normalizeArabicForSearch(searchQuery.trim());
      result = result.filter(v => {
        const textNormal = normalizeArabicForSearch(v.text);
        const rawTextNormal = normalizeArabicForSearch(v.rawText);
        return (
          textNormal.includes(q) || 
          rawTextNormal.includes(q) ||
          v.verseNumber.includes(searchQuery.trim())
        );
      });
    }

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
  }, [verses, searchQuery, sortField, sortOrder]);

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
        if (selectedShuraTab === 'hameem') {
          rows.push({
            v,
            track: { label: 'حم (معامل 3)', letters: 'حم', keyValue: 48, digitalRoot: 3, isSubTrack: true },
            index: idx
          });
        } else {
          rows.push({
            v,
            track: { label: 'عسق (معامل 5)', letters: 'عسق', keyValue: 230, digitalRoot: 5, isSubTrack: true },
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

    // Apply Mizan filters to the track rows
    let filteredRows = rows;
    if (activeSurah && isNoorani && mizanFilter !== 'all') {
      filteredRows = rows.filter(({ v, track }) => {
        const dummySurah = {
          id: activeSurah.id,
          name: activeSurah.name,
          letters: track.letters,
          keyValue: track.keyValue,
          digitalRoot: track.digitalRoot
        };
        const comp = getCompatibilityDetails(v, dummySurah);
        if (mizanFilter === 'verified_exact') {
          return v.jummalValue % track.digitalRoot === 0;
        } else if (mizanFilter === 'golden') {
          return comp.score === 6;
        } else if (mizanFilter === 'exact') {
          return comp.score >= 3 && comp.score <= 5;
        } else if (mizanFilter === 'structural') {
          return comp.score >= 1 && comp.score <= 2;
        } else if (mizanFilter === 'not_compatible') {
          return comp.score === 0;
        } else if (mizanFilter === 'tawheed') {
          return comp.isTawheedCompatible;
        } else if (mizanFilter === 'triple_match') {
          const surahMeta = getSurahMetadata(activeSurah.id);
          const tripleRes = isTripleMatchElite(v, dummySurah, surahMeta);
          return tripleRes.isTripleMatch;
        }
        return true;
      });
    }

    return filteredRows;
  }, [processedVerses, activeSurah, isNoorani, mizanFilter, selectedShuraTab]);

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

  // Export to Excel-compatible CSV with UTF-8 BOM
  const handleExportExcel = () => {
    if (tableRows.length === 0) return;

    // Excel requirements: UTF-8 BOM so Arabic doesn't corrupt on Windows Excel
    const BOM = '\uFEFF';
    
    // Clean Arabic surah name helper
    const cleanSurahName = activeSurah.name.replace(/\s*\([^)]*\)/g, '').trim();

    // Top meta rows to clearly state the selected Surah and its variables inside Excel
    const metaRow1 = isNoorani
      ? `"تقرير البنيان لنتائج ومخرجات دراسة آيات سورة: ${cleanSurahName}",,,,"ثابت الحروف النورانية بعد الاختزال: ${activeSurah.letters}",,,,"قيمة الاختزال: ${activeSurah.digitalRoot} (الأصل: ${activeSurah.keyValue})"`
      : `"تقرير البنيان لنتائج ومخرجات دراسة آيات سورة: ${cleanSurahName}"`;
    const metaRow2 = `"عدد الآيات المدروسة: ${processedVerses.length}",,,,"إجمالي الحروف: ${processedVerses.reduce((s, v) => s + v.letterCount, 0)}",,,,"إجمالي حساب الجمل: ${processedVerses.reduce((s, v) => s + v.jummalValue, 0)}"`;

    // Headers fully matching the requested ones
    const headers = isNoorani
      ? [
          'م',
          'رقم الآية',
          'الآية الكريمة',
          'حساب الجمل لكل آية',
          'المعامل النوراني النشط',
          'ناتج قيمة حساب الجمل على قيمة الحروف النورانية المختزلة',
          'عمود التحقق',
          'البصمة الأحادية للناتج',
          'معادلة البصمة الأحادية',
          'حالة التوافق المدمج',
          'الاختزال الرقمي للجمّل',
          'عدد كلمات الآية',
          'عدد الحروف',
          'المجموع',
          'التوافقات الستة المحققة'
        ]
      : [
          'م',
          'رقم الآية',
          'الآية الكريمة',
          'حساب الجمل لكل آية',
          'البصمة الأحادية للناتج',
          'معادلة البصمة الأحادية',
          'حالة التوافق المدمج',
          'الاختزال الرقمي للجمّل',
          'عدد كلمات الآية',
          'عدد الحروف',
          'المجموع'
        ];
    
    // Rows using tableRows (matching current filter/search)
    const rows = tableRows.map((rowItem, idx) => {
      const v = rowItem.v;
      const track = rowItem.track;
      const reduction = reduceDigitalRoot(v.jummalValue);
      const sum = v.wordCount + v.letterCount;

      const dummySurah = {
        id: activeSurah.id,
        name: activeSurah.name,
        letters: track.letters,
        keyValue: track.keyValue,
        digitalRoot: track.digitalRoot
      };

      const comp = getCompatibilityDetails(v, dummySurah);
      const equationStr = `"${reduction} * (${parseInt(v.verseNumber, 10) || v.id} + ${comp.reducedFactor}) = ${comp.newColumnProduct}"`;
      const intTawheedStr = comp.isIntegratedTawheed ? 'متوافقة مدمجاً' : 'غير متوافقة مدمجاً';

      if (isNoorani) {
        const divisionResult = v.jummalValue / track.digitalRoot;
        const isExact = v.jummalValue % track.digitalRoot === 0;
        const quotientStr = isExact ? divisionResult.toString() : divisionResult.toFixed(4);
        const checkedText = isExact ? 'متوافقة' : 'غير متوافقة';
        const achieved = getAchievedCompatibilities(v, dummySurah).join(' - ');

        return [
          idx + 1,
          v.verseNumber,
          `"( ${v.text.replace(/"/g, '""')} )"`,
          v.jummalValue,
          `"${track.label}"`,
          quotientStr,
          checkedText,
          comp.finalSingleDigit,
          equationStr,
          intTawheedStr,
          reduction,
          v.wordCount,
          v.letterCount,
          sum,
          `"${achieved || 'لا يوجد'}"`
        ];
      } else {
        return [
          idx + 1,
          v.verseNumber,
          `"( ${v.text.replace(/"/g, '""')} )"`,
          v.jummalValue,
          comp.finalSingleDigit,
          equationStr,
          intTawheedStr,
          reduction,
          v.wordCount,
          v.letterCount,
          sum
        ];
      }
    });

    const csvContent = BOM + [metaRow1, metaRow2, '', headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanPrefix = activeSurah.id === 42 ? 'الشورى_متوازي' : cleanSurahName;
    link.href = url;
    link.setAttribute('download', `جدول_البنيان_سورة_${cleanPrefix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to beautifully formatted MS Word document
  const handleExportWord = () => {
    if (tableRows.length === 0) return;
    const BOM = '\uFEFF';
    
    const cleanSurahName = activeSurah.name.replace(/\s*\([^)]*\ /g, '').trim();

    let html = `<html dir="rtl" xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"><title>تقرير دراسة البنيان - سورة ${cleanSurahName}</title>`;
    html += `<style>
      body { font-family: 'Arial', sans-serif; direction: rtl; padding: 20px; }
      h2 { text-align: center; color: #0f172a; border-bottom: 2px solid #b45309; padding-bottom: 8px; }
      p { margin-bottom: 20px; font-size: 14px; text-align: right; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; direction: rtl; }
      th, td { border: 1px solid #475569; padding: 8px; text-align: center; font-size: 11px; }
      th { background-color: #0f172a; color: #ffffff; font-weight: bold; }
      .compatible { background-color: #d1fae5; color: #065f46; font-weight: bold; }
      .incompatible { color: #94a3b8; }
      .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 40px; border-t: 1px solid #e2e8f0; padding-top: 10px; }
    </style></head><body>`;
    
    html += `<h2>بِرْنَامَج البُنْيَان لِلْقُرْآنِ الكَرِيمِ</h2>`;
    html += `<p style="font-weight: bold;">تقرير المخرجات وجداول البنيان الاستقصائية لآيات سورة: ${cleanSurahName}</p>`;
    html += `<p>الملخص المنهجي للدراسة:<br>`;
    if (isNoorani) {
      if (activeSurah.id === 42) {
        html += `• المنهجية المعتمدة: <strong>منهجية المسارات المتوازية المستقلة (حم - عسق)</strong><br>`;
      } else {
        html += `• المفتاح النشط بعد الاختزال: <strong>${activeSurah.letters}</strong> (قيمة الاختزال: <strong>${activeSurah.digitalRoot}</strong> | القيمة الحسابية الكلية للأصل: <strong>${activeSurah.keyValue}</strong>)<br>`;
      }
    } else {
      html += `• المنهجية المعتمدة: <strong>منهجية السور العادية غير النورانية</strong><br>`;
      html += `• معامل السورة الثابت المختزل (رقم السورة المختزل): <strong>${reduceDigitalRoot(activeSurah.id)}</strong> (رقم السورة: <strong>${activeSurah.id}</strong>)<br>`;
    }
    html += `• إجمالي الصفوف المدروسة: <strong>${tableRows.length}</strong> صفاً<br>`;
    html += `• إجمالي الكلمات للآيات المدروسة: <strong>${processedVerses.reduce((sum, v) => sum + v.wordCount, 0)}</strong> كلمة | إجمالي الحروف: <strong>${processedVerses.reduce((sum, v) => sum + v.letterCount, 0)}</strong> حرف | إجمالي حساب الجمل: <strong>${processedVerses.reduce((sum, v) => sum + v.jummalValue, 0)}</strong></p>`;
    
    html += `<table>`;
    html += `<thead><tr>`;
    if (isNoorani) {
      html += `<th>م</th><th>رقم الآية</th><th>الآية الكريمة</th><th>حساب الجمل لكل آية</th><th>المعامل النشط</th><th>ناتج قيمة حساب الجمل</th><th>عمود التحقق</th><th>البصمة الأحادية والتحقق المدمج</th><th>الاختزال الرقمي</th><th>عدد كلمات الآية</th><th>عدد الحروف</th><th>المجموع</th><th>التوافقات المحققة</th>`;
    } else {
      html += `<th>م</th><th>رقم الآية</th><th>الآية الكريمة</th><th>حساب الجمل لكل آية</th><th>البصمة الأحادية والتحقق المدمج</th><th>الاختزال الرقمي</th><th>عدد كلمات الآية</th><th>عدد الحروف</th><th>المجموع</th>`;
    }
    html += `</tr></thead><tbody>`;
    
    tableRows.forEach((rowItem, idx) => {
      const v = rowItem.v;
      const track = rowItem.track;
      const reduction = reduceDigitalRoot(v.jummalValue);
      const sum = v.wordCount + v.letterCount;
      
      const dummySurah = {
        id: activeSurah.id,
        name: activeSurah.name,
        letters: track.letters,
        keyValue: track.keyValue,
        digitalRoot: track.digitalRoot
      };
      const comp = getCompatibilityDetails(v, dummySurah);
      const formulaText = `${reduction} &times; (${parseInt(v.verseNumber, 10) || v.id} + ${comp.reducedFactor}) = ${comp.newColumnProduct} &rarr; <strong>[${comp.finalSingleDigit}]</strong>`;
      const statusBadge = comp.isIntegratedTawheed ? `<span style="color:#059669; font-weight:bold;">✨ توافق مدمج (${comp.finalSingleDigit})</span>` : `<span>غير مدمج (${comp.finalSingleDigit})</span>`;

      html += `<tr>`;
      html += `<td>${idx + 1}</td>`;
      html += `<td>${v.verseNumber}</td>`;
      html += `<td style="text-align: right; font-weight: bold; font-size: 12px;">( ${v.text} )</td>`;
      
      if (comp.isDirectMatch) {
        html += `<td style="font-weight: bold; background-color: #fef3c7;">${v.jummalValue} (🎯 جوهري مباشر)</td>`;
      } else {
        html += `<td style="font-weight: bold;">${v.jummalValue}</td>`;
      }

      if (isNoorani) {
        const divisionResult = v.jummalValue / track.digitalRoot;
        const isExact = v.jummalValue % track.digitalRoot === 0;
        const quotientStr = isExact ? divisionResult.toString() : divisionResult.toFixed(4);
        const checkedText = isExact ? 'متوافقة' : 'غير متوافقة';
        const achieved = getAchievedCompatibilities(v, dummySurah).join(' - ');

        html += `<td>${track.label}</td>`;
        html += `<td style="font-family: monospace;">${quotientStr}</td>`;
        html += `<td class="${isExact ? 'compatible' : 'incompatible'}">${checkedText}</td>`;
        html += `<td>${formulaText}<br>${statusBadge}</td>`;
        html += `<td>${reduction}</td>`;
        html += `<td>${v.wordCount}</td>`;
        html += `<td>${v.letterCount}</td>`;
        html += `<td>${sum}</td>`;
        html += `<td>${achieved || 'لا يوجد'}</td>`;
      } else {
        html += `<td>${formulaText}<br>${statusBadge}</td>`;
        html += `<td>${reduction}</td>`;
        html += `<td>${v.wordCount}</td>`;
        html += `<td>${v.letterCount}</td>`;
        html += `<td>${sum}</td>`;
      }
      html += `</tr>`;
    });
    
    html += `</tbody></table>`;
    html += `<div class="footer"><p>«برنامج البنيان للقرآن الكريم» • تم إعداد الدراسة الاستقصائية وحفظها بنجاح</p></div>`;
    html += `</body></html>`;
    
    const blob = new Blob([BOM + html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanPrefix = activeSurah.id === 42 ? 'الشورى_متوازي' : cleanSurahName;
    link.href = url;
    link.setAttribute('download', `دراسة_البنيان_سورة_${cleanPrefix}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to match words containing Noorani opening letters
  const getNooraniWordMatches = (verseText: string, letters: string) => {
    const cleanVerse = removeTashkeel(verseText);
    const words = cleanVerse.split(/\s+/);
    const letterSet = new Set(letters.split(''));
    
    const matches: { word: string; matchedLetters: string[]; wordJummal: number; lettersJummal: number }[] = [];
    
    words.forEach(word => {
      const cleanW = word.replace(/[^\u0621-\u064A]/g, '');
      if (!cleanW) return;
      
      const matched: string[] = [];
      let lettersJummalSum = 0;
      const wordCharSet = new Set(cleanW.split(''));
      
      letterSet.forEach(char => {
        if (wordCharSet.has(char)) {
          matched.push(char);
          lettersJummalSum += JUMMAL_MAP[char] || 0;
        }
      });
      
      const minimumMatchCount = Math.min(letters.length, 2);
      if (matched.length >= minimumMatchCount) {
        let wordJummal = 0;
        for (const char of cleanW) {
          wordJummal += JUMMAL_MAP[char] || 0;
        }
        matches.push({
          word: word,
          matchedLetters: matched,
          wordJummal,
          lettersJummal: lettersJummalSum,
        });
      }
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

    // Try to restore previous progress
    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
      try {
        const parsed = JSON.parse(cachedStr);
        if (parsed.surahId === activeSurah.id && parsed.totalVerses === processedVerses.length && parsed.completedChunks) {
          cache = parsed;
          showToast('🔄 تم استئناف تحليل مخرجات البنيان من الحسابات المحفوظة سابقاً...');
        } else {
          localStorage.removeItem(cacheKey);
        }
      } catch (e) {
        console.error('Failed to parse cache', e);
      }
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
        localStorage.setItem(cacheKey, JSON.stringify(cache));
      }

      // Finish progress and assemble everything
      setReportProgress({ current: totalChunks, total: totalChunks });

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
      let textToCopy = `📋 تَقْرِير البُنْيَان الشَّامِل لِلْقُرْآنِ الكَرِيمِ - سُورَة ${activeSurah.name}\n`;
      textToCopy += `========================================================================\n\n`;
      textToCopy += `🏛️ بَيَانَات السُّورَة النَّشِطَة:\n`;
      textToCopy += `• اسم السورة: سورة ${activeSurah.name}\n`;
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
      textToCopy += `✨ القسم الأول: الدراسة الاستقصائية والتحليل البياني والعددي الذكي:\n`;
      textToCopy += `------------------------------------------------------------------------\n\n`;
      textToCopy += `${combinedAnalysis}\n\n`;
      
      textToCopy += `------------------------------------------------------------------------\n`;
      textToCopy += `📊 القسم الثاني: تفصيل الآيات والتحقق من الكسر وموازنة الأوزان:\n`;
      textToCopy += `------------------------------------------------------------------------\n`;
      processedVerses.forEach((v) => {
        const reduction = reduceDigitalRoot(v.jummalValue);
        const sumVal = v.wordCount + v.letterCount;
        if (isNoorani) {
          const remainder = v.jummalValue % activeSurah.digitalRoot;
          const divisionResult = v.jummalValue / activeSurah.digitalRoot;
          let statusText = 'غير متوافقة';
          if (remainder === 0) {
            statusText = '✅ متوافقة تماماً ومحققة';
          }
          textToCopy += `آية (${v.verseNumber}): ( ${v.text} ) | الجُمّل: ${v.jummalValue} | ناتج القسمة: ${remainder === 0 ? divisionResult : divisionResult.toFixed(4)} | الحالة: ${statusText} | كلمات: ${v.wordCount} | حروف: ${v.letterCount} | الاختزال: ${reduction}\n`;
        } else {
          textToCopy += `آية (${v.verseNumber}): ( ${v.text} ) | الجُمّل: ${v.jummalValue} | كلمات: ${v.wordCount} | حروف: ${v.letterCount} | المجموع: ${sumVal} | الاختزال: ${reduction}\n`;
        }
      });

      if (isNoorani) {
        textToCopy += `\n------------------------------------------------------------------------\n`;
        textToCopy += `🔑 القسم الثالث: تفصيل مطابقة الكلمات للحروف الافتتاحية النورانية:\n`;
        textToCopy += `------------------------------------------------------------------------\n`;
        let matchCount = 0;
        processedVerses.forEach(v => {
          const wordMatches = getNooraniWordMatches(v.text, activeSurah.letters);
          if (wordMatches.length > 0) {
            textToCopy += `• آية (${v.verseNumber}): ( ${v.text} )\n`;
            wordMatches.forEach(m => {
              matchCount++;
              textToCopy += `  - الكلمة المطابقة: "${m.word}" | الحروف النورانية المتواجدة فيها: [${m.matchedLetters.join(', ')}] | حساب الجمل للكلمة: ${m.wordJummal} | حساب جمل الحروف النورانية فيها: ${m.lettersJummal}\n`;
            });
          }
        });
        if (matchCount === 0) {
          textToCopy += `لا توجد كلمات تحتوي على تداخل كافٍ مع الحروف الافتتاحية في نطاق الآيات المدخلة حالياً.\n`;
        }
      } else {
        textToCopy += `\n------------------------------------------------------------------------\n`;
        textToCopy += `🔑 القسم الثالث: معادلات التحليل العددي والرقمي والروابط المستنبطة:\n`;
        textToCopy += `------------------------------------------------------------------------\n`;
        const totalJummal = processedVerses.reduce((s, v) => s + v.jummalValue, 0);
        const totalWords = processedVerses.reduce((s, v) => s + v.wordCount, 0);
        const totalLetters = processedVerses.reduce((s, v) => s + v.letterCount, 0);
        textToCopy += `• إجمالي حساب الجمل الكلي: ${totalJummal} (الاختزال الرقمي الإجمالي: ${reduceDigitalRoot(totalJummal)})\n`;
        textToCopy += `• إجمالي الكلمات المدروسة: ${totalWords} كلمة (الاختزال: ${reduceDigitalRoot(totalWords)})\n`;
        textToCopy += `• إجمالي الحروف المدروسة: ${totalLetters} حرفاً (الاختزال: ${reduceDigitalRoot(totalLetters)})\n`;
      }

      // Copy text to Clipboard
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      // Now create and export beautifully formatted MS Word document (.doc)
      const BOM = '\uFEFF';
      const cleanSurahName = activeSurah.name.replace(/\s*\([^)]*\)/g, '').trim();
      let html = `<html dir="rtl" xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">`;
      html += `<head><meta charset="utf-8"><title>تقرير البنيان الشامل - سورة ${cleanSurahName}</title>`;
      html += `<style>
        body { font-family: 'Arial', 'Simplified Arabic', sans-serif; direction: rtl; padding: 25px; background-color: #ffffff; color: #1e293b; }
        .header-container { text-align: center; border: 3px double #b45309; padding: 20px; background-color: #fafaf9; margin-bottom: 25px; }
        h1 { color: #0f172a; font-size: 24px; margin-bottom: 8px; font-weight: 900; text-align: center; }
        h2 { color: #1e293b; font-size: 18px; margin-bottom: 5px; text-align: center; font-weight: bold; }
        .meta-box { border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 15px; margin-bottom: 25px; font-size: 13px; }
        .section-title { background-color: #0f172a; color: #ffffff; padding: 10px 15px; font-weight: bold; font-size: 14px; margin-top: 30px; margin-bottom: 15px; border-right: 5px solid #d97706; text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; direction: rtl; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-size: 12px; }
        th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; border-bottom: 2px solid #94a3b8; }
        .compatible { background-color: #d1fae5; color: #065f46; font-weight: bold; }
        .incompatible { background-color: #f1f5f9; color: #64748b; }
        .keyword-highlight { background-color: #fef3c7; color: #92400e; font-weight: bold; }
        p { margin-bottom: 12px; line-height: 1.6; text-align: justify; font-size: 13px; }
        .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 50px; border-top: 2px solid #e2e8f0; padding-top: 15px; }
      </style></head><body>`;
      
      // Header
      html += `<div class="header-container">`;
      html += `<h1>« تَقْرِيرُ البُنْيَان الشَّامِل لِلْقُرْآنِ الكَرِيمِ »</h1>`;
      html += `<h2>مخرجات دراسة وحساب موازين سورة: ${cleanSurahName}</h2>`;
      html += `<p style="text-align: center; font-size: 11px; color: #64748b; margin-top: 5px;">تم الاستخلاص والتحليل المؤتمت بواسطة مفسر البنيان الأكاديمي الذكي</p>`;
      html += `</div>`;

      // Metadata Box
      html += `<div class="meta-box">`;
      html += `<table style="border: none; margin: 0; width: 100%;">`;
      html += `<tr style="border: none;"><td style="border: none; text-align: right; width: 50%; vertical-align: top;">`;
      html += `<strong>🏛️ سياق وبيانات السورة العامة:</strong><br>`;
      html += `• اسم السورة: سورة <strong>${activeSurah.name}</strong><br>`;
      if (surahMeta) {
        html += `• ترتيبها في المصحف: <strong>${surahMeta.orderInQuran}</strong><br>`;
        html += `• ترتيب النزول: سورة رقم <strong>${surahMeta.revelationOrder}</strong> (${surahMeta.revelationPlace})<br>`;
        html += `• نطاق الأجزاء: جزء <strong>${surahMeta.juzStartEnd}</strong> | الأحزاب: <strong>${surahMeta.hizbStartEnd}</strong><br>`;
      }
      html += `</td><td style="border: none; text-align: right; width: 50%; vertical-align: top;">`;
      html += `<strong>📊 إحصائيات الآيات والمقاييس المستخرجة:</strong><br>`;
      html += `• عدد الآيات المدروسة: <strong>${processedVerses.length}</strong> آية<br>`;
      html += `• إجمالي الكلمات للآيات المدروسة: <strong>${processedVerses.reduce((s, v) => s + v.wordCount, 0)}</strong> كلمة<br>`;
      html += `• إجمالي الحروف للآيات المدروسة: <strong>${processedVerses.reduce((s, v) => s + v.letterCount, 0)}</strong> حرف<br>`;
      html += `• إجمالي حساب الجمل للآيات المدروسة: <strong>${processedVerses.reduce((s, v) => s + v.jummalValue, 0)}</strong><br>`;
      if (isNoorani) {
        html += `• المعامل النوراني النشط: <strong>"${activeSurah.letters}"</strong> (قيمة أصلية: <strong>${activeSurah.keyValue}</strong> | قيمة اختزال: <strong>${activeSurah.digitalRoot}</strong>)<br>`;
      }
      html += `</td></tr></table>`;
      html += `</div>`;

      // Section 1: AI Analysis
      html += `<div class="section-title">القسم الأول: الدراسة الاستقصائية والتحليل البياني والعددي الذكي</div>`;
      html += `<div style="padding: 10px 5px; direction: rtl;">`;
      html += formatMarkdownToHtml(combinedAnalysis);
      html += `</div>`;

      // Section 2: Detailed Balance Table
      html += `<div class="section-title">القسم الثاني: نتائج جدول موازنة البنيان التفصيلي للآيات</div>`;
      html += `<table>`;
      html += `<thead><tr>`;
      if (isNoorani) {
        html += `<th>م</th><th>رقم الآية</th><th style="width: 40%;">الآية الكريمة</th><th>حساب الجمل</th><th>المعامل النوراني</th><th>ناتج القسمة</th><th>حالة الموازنة</th><th>الاختزال الرقمي</th><th>الكلمات</th><th>الحروف</th><th>المجموع</th>`;
      } else {
        html += `<th>م</th><th>رقم الآية</th><th style="width: 50%;">الآية الكريمة</th><th>حساب الجمل</th><th>الاختزال الرقمي</th><th>الكلمات</th><th>الحروف</th><th>المجموع</th>`;
      }
      html += `</tr></thead><tbody>`;
      
      processedVerses.forEach((v, idx) => {
        const reduction = reduceDigitalRoot(v.jummalValue);
        const sum = v.wordCount + v.letterCount;
        
        html += `<tr>`;
        html += `<td>${idx + 1}</td>`;
        html += `<td>${v.verseNumber}</td>`;
        html += `<td style="text-align: right; font-weight: bold; font-size: 13px; font-family: 'Traditional Arabic', 'Simplified Arabic', serif; padding: 12px; background-color: #fafaf9;">( ${v.text} )</td>`;
        html += `<td style="font-weight: bold; color: #1e293b;">${v.jummalValue}</td>`;
        if (isNoorani) {
          const divisionResult = v.jummalValue / activeSurah.digitalRoot;
          const isExact = v.jummalValue % activeSurah.digitalRoot === 0;
          const quotientStr = isExact ? divisionResult.toString() : divisionResult.toFixed(4);
          const checkedText = isExact ? '✅ متوافقة تماماً' : '❌ خارج التوافق';
          html += `<td>${activeSurah.digitalRoot}</td>`;
          html += `<td style="font-family: monospace; font-weight: bold;">${quotientStr}</td>`;
          html += `<td class="${isExact ? 'compatible' : 'incompatible'}">${checkedText}</td>`;
        }
        html += `<td style="font-weight: bold;">${reduction}</td>`;
        html += `<td>${v.wordCount}</td>`;
        html += `<td>${v.letterCount}</td>`;
        html += `<td style="font-weight: bold; background-color: #f8fafc;">${sum}</td>`;
        html += `</tr>`;
      });
      html += `</tbody></table>`;

      // Section 3: Word and Letter Matching Details
      if (isNoorani) {
        html += `<div class="section-title">القسم الثالث: تفصيل مطابقة الكلمات للحروف الافتتاحية النورانية (${activeSurah.letters})</div>`;
        html += `<p>يتناول هذا القسم رصد ومطابقة كافة الكلمات الموجودة في الآيات المدروسة والتي تشتمل على الحروف النورانية الافتتاحية لسورة ${cleanSurahName} (وهي حروف: <strong>${activeSurah.letters}</strong>). يتم حساب قيمة جمل الكلمة الكلي ومقارنته بقيمة الحروف النورانية الموجودة بداخلها لبيان أسرار الترابط البنيوي واللفظي:</p>`;
        
        let matchCount = 0;
        let matchRows = '';
        
        processedVerses.forEach(v => {
          const wordMatches = getNooraniWordMatches(v.text, activeSurah.letters);
          wordMatches.forEach(m => {
            const isWordExact = m.wordJummal % activeSurah.digitalRoot === 0;
            const wordQuotient = m.wordJummal / activeSurah.digitalRoot;
            const wordQuotientStr = isWordExact ? wordQuotient.toString() : wordQuotient.toFixed(2);
            const wordCheckedText = isWordExact ? '✅ متوافقة' : '❌ غير متوافقة';

            matchCount++;
            matchRows += `<tr>`;
            matchRows += `<td>${matchCount}</td>`;
            matchRows += `<td>${v.verseNumber}</td>`;
            matchRows += `<td style="font-weight: bold; font-size: 13px; color: #b45309;" class="keyword-highlight">"${m.word}"</td>`;
            matchRows += `<td style="font-weight: bold;">${m.wordJummal}</td>`;
            matchRows += `<td style="font-size: 13px; letter-spacing: 3px; color: #0f172a; font-weight: 900;">${m.matchedLetters.join(' - ')}</td>`;
            matchRows += `<td style="font-weight: bold; color: #047857;">${m.lettersJummal}</td>`;
            matchRows += `<td style="font-weight: bold; text-align: center; color: ${isWordExact ? '#047857' : '#be123c'};">${wordCheckedText} (${wordQuotientStr})</td>`;
            matchRows += `<td style="text-align: right; font-size: 11px; color: #475569;">تضم الحروف الافتتاحية وبها أصل ميزان الحروف في السورة الكريمة.</td>`;
            matchRows += `</tr>`;
          });
        });
        
        if (matchCount > 0) {
          html += `<table>`;
          html += `<thead><tr>`;
          html += `<th>م</th><th>رقم الآية</th><th>الكلمة المطابقة في الآية</th><th>حساب الجمل للكلمة</th><th>الحروف النورانية المتواجدة</th><th>جمل الحروف النورانية المتواجدة</th><th>التحقيق (القسمة على ${activeSurah.digitalRoot})</th><th style="width: 25%;">الدلالة والربط الميزاني</th>`;
          html += `</tr></thead><tbody>`;
          html += matchRows;
          html += `</tbody></table>`;
        } else {
          html += `<p style="color: #64748b; font-style: italic; text-align: center; border: 1px dashed #cbd5e1; padding: 15px;">لا توجد كلمات تحتوي على تداخل كافٍ مع الحروف الافتتاحية في نطاق الآيات المدخلة حالياً.</p>`;
        }
      } else {
        html += `<div class="section-title">القسم الثالث: معادلات التحليل العددي والرقمي والروابط المستنبطة</div>`;
        html += `<p>يتناول هذا القسم رصد وموازنة العلاقات الرياضية العامة بين كلمات وحروف الآيات المدخلة ومطابقتها مع موازين الإعجاز العددي للقرآن الكريم:</p>`;
        html += `<table>`;
        html += `<thead><tr>`;
        html += `<th>المقياس العام</th><th>القيمة الإجمالية للآيات</th><th>مؤشر الاختزال والترابط</th><th>الشرح الرياضي والدلالي للميزان</th>`;
        html += `</tr></thead><tbody>`;
        
        const totalJummal = processedVerses.reduce((s, v) => s + v.jummalValue, 0);
        const totalWords = processedVerses.reduce((s, v) => s + v.wordCount, 0);
        const totalLetters = processedVerses.reduce((s, v) => s + v.letterCount, 0);
        const overallReduction = reduceDigitalRoot(totalJummal);
        
        html += `<tr>`;
        html += `<td>إجمالي حساب الجمل الكلي</td>`;
        html += `<td style="font-weight: bold;">${totalJummal}</td>`;
        html += `<td style="font-weight: bold; color: #b45309;">الاختزال الكلي: ${overallReduction}</td>`;
        html += `<td style="text-align: right; font-size: 11px;">يمثل الوزن الإجمالي التراكمي لآيات الدراسة الاستقصائية.</td>`;
        html += `</tr>`;
        
        html += `<tr>`;
        html += `<td>إجمالي عدد كلمات الدراسة</td>`;
        html += `<td style="font-weight: bold;">${totalWords} كلمة</td>`;
        html += `<td style="font-weight: bold; color: #047857;">الاختزال الرقمي: ${reduceDigitalRoot(totalWords)}</td>`;
        html += `<td style="text-align: right; font-size: 11px;">المجموع العددي لتعداد الكلمات يربط البنية السردية بأصل البلاغة ومفصل آيات السورة.</td>`;
        html += `</tr>`;
        
        html += `<tr>`;
        html += `<td>إجمالي عدد الحروف المدروسة</td>`;
        html += `<td style="font-weight: bold;">${totalLetters} حرفاً</td>`;
        html += `<td style="font-weight: bold; color: #0369a1;">الاختزال الرقمي: ${reduceDigitalRoot(totalLetters)}</td>`;
        html += `<td style="text-align: right; font-size: 11px;">عدد الحروف يزن التفصيل الصوتي والرسم العثماني الدقيق للمدخلات.</td>`;
        html += `</tr>`;
        
        html += `</tbody></table>`;
      }

      // Footer
      html += `<div class="footer">`;
      html += `<p>«برنامج البنيان للقرآن الكريم» • تم إعداد الدراسة الاستقصائية وتصنيع التقرير الشامل بنجاح</p>`;
      html += `<p style="font-size: 9px; color: #94a3b8; margin-top: 5px;">تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}</p>`;
      html += `</div>`;
      html += `</body></html>`;

      const docBlob = new Blob([BOM + html], { type: 'application/msword;charset=utf-8' });
      const docUrl = URL.createObjectURL(docBlob);
      const docLink = document.createElement('a');
      docLink.href = docUrl;
      docLink.setAttribute('download', `تقرير_البنيان_الشامل_سورة_${cleanSurahName}.doc`);
      document.body.appendChild(docLink);
      docLink.click();
      document.body.removeChild(docLink);

      // Clean the cache upon successful completion
      localStorage.removeItem(cacheKey);
      setReportProgress(null);

      showToast('التقرير جاهز وتم حفظ الملف! 📄✨');
    } catch (err: any) {
      console.error(err);
      showToast('⚠️ توقفت معالجة التقرير مؤقتاً بسبب خطأ. تم حفظ تقدمك، اضغط على الزر للاستكمال.');
    } finally {
      setIsReportLoading(false);
    }
  };

  // Copy entire output table data as Excel/Word pasteable spreadsheet text (TSV)
  const handleCopyTable = () => {
    if (tableRows.length === 0) return;
    
    let headersList = isNoorani 
      ? ['م', 'رقم الآية', 'الآية الكريمة', 'حساب الجمل', 'معامل السورة المختزل', 'ناتج القسمة', 'عمود التحقق', 'الاختزال الرقمي', 'الكلمات', 'الحروف', 'المجموع', 'التوافقات الستة المحققة']
      : ['م', 'رقم الآية', 'الآية الكريمة', 'حساب الجمل', 'الاختزال الرقمي', 'الكلمات', 'الحروف', 'المجموع'];
      
    let textToCopy = headersList.join('\t') + '\n';
    
    tableRows.forEach((rowItem, idx) => {
      const v = rowItem.v;
      const track = rowItem.track;
      const reduction = reduceDigitalRoot(v.jummalValue);
      const sumValue = v.wordCount + v.letterCount;
      const cleanText = v.text || '';
      
      if (isNoorani) {
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
        
        textToCopy += `${idx + 1}\t${v.verseNumber}\t${cleanText}\t${v.jummalValue}\t${track.label}\t${quotientStr}\t${statusText}\t${reduction}\t${v.wordCount}\t${v.letterCount}\t${sumValue}\t${achieved || 'لا يوجد'}\n`;
      } else {
        textToCopy += `${idx + 1}\t${v.verseNumber}\t${cleanText}\t${v.jummalValue}\t${reduction}\t${v.wordCount}\t${v.letterCount}\t${sumValue}\n`;
      }
    });
    
    navigator.clipboard.writeText(textToCopy);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border-2 border-slate-200 rounded-none relative">
        <div className="absolute top-0 right-0 left-0 h-1 bg-slate-900" />
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 justify-start">
            <CheckCircle2 className="w-5 h-5 text-slate-800" />
            شـاشـة المخرجات وجداول البنيان الاستقصائية
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            عُثر على {verses.length} آية/جزئية مستخرجة. اختر المفتاح النوراني المناسب ووازن نتائج الحساب وعلاج انحرافات الحروف أدناه.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QuranFontSizeControl compact={true} />
          
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2 text-xs font-bold bg-[#107c41] hover:bg-[#0e6b37] text-white rounded-none flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>تنزيل إكسيل (XLSX/CSV)</span>
          </button>
          <button
            type="button"
            onClick={handleExportWord}
            className="px-4 py-2 text-xs font-bold bg-[#2b579a] hover:bg-[#244b83] text-white rounded-none flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-white" />
            <span>تنزيل وورد (DOC)</span>
          </button>
          <button
            type="button"
            disabled={isReportLoading}
            onClick={handleCopySummary}
            className={`px-4 py-2 text-xs font-black border-2 rounded-none flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
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
            className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-none flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="نسخ جدول الآيات بالكامل بتنسيق متوافق مع إكسيل ووورد"
          >
            <Copy className="w-4 h-4 text-white" />
            <span>{isTableCopied ? 'تم نسخ الجدول!' : 'نسخ جدول الآيات وبياناتها'}</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-rose-600 border border-slate-200 rounded-none transition-all cursor-pointer"
          >
            إدخال نص جديد
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

      {/* Selector of Noorani Key anchor */}
      {isNoorani && (
        <div className="bg-white border-2 border-slate-200 p-6 rounded-none relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-teal-600" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
                أصل واختيار المفاتيح النورانية الـ 29 (أصل موازنة السور):
              </h4>
              <p className="text-xs text-slate-500">
                قم باختيار السورة المناسبة ذات الحروف المقطعة لتثبيت قيم أصل المفتاح والحساب عليه. (الافتراضي: سورة العنكبوت بقيمة مفتاح 71).
              </p>
            </div>
            <div className="w-full md:w-auto">
              <select
                value={activeSurah.id}
                onChange={(e) => {
                  const found = NOORANI_SURAHS.find(s => s.id === parseInt(e.target.value));
                  if (found) setActiveSurah(found);
                }}
                className="w-full md:w-72 bg-slate-50 border-2 border-slate-200 hover:border-slate-400 focus:border-slate-900 rounded-none px-3 py-2 text-xs text-slate-900 outline-none font-bold"
              >
                {NOORANI_SURAHS.map((s) => (
                  <option key={s.id} value={s.id}>
                    سورة {s.name} - ({s.letters}) | قيمتها = {s.keyValue}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Active Key badge panel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
            <div className="bg-teal-50 border border-teal-100 p-3 text-center">
              <span className="text-[10px] text-teal-600 font-bold block">المفتاح النشط الحالي</span>
              <span className="text-xl font-black text-teal-900 block quran-font mt-1">{activeSurah.letters}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block">قيمة الثابت للأصل (Key)</span>
              <span className="text-xl font-black text-slate-900 font-mono block mt-1">{activeSurah.keyValue}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block">الجذر الرقمي (الاختزال)</span>
              <span className="text-xl font-black text-slate-800 font-mono block mt-1">{activeSurah.digitalRoot}</span>
            </div>
            <div className="bg-slate-900 text-white p-3 text-center flex flex-col justify-center">
              <span className="text-[10px] text-slate-300 font-bold block">مجموع الآيات المحقّقة (متوافرة كلياً)</span>
              <span className="text-sm font-black text-emerald-400 mt-1 block">
                {verificationStats.exactCount} آيات متوافقة
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Aggregate Overview Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-slate-200 rounded-none p-5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-1 bg-slate-400" />
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">إجمالي الآيات</span>
          <span className="text-3xl font-black text-slate-900 font-sans block mt-2">{summary.totalVerses}</span>
          <span className="text-[10px] text-slate-400 mt-1 block font-medium">بنية لغوية كاملة</span>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-none p-5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-1 bg-slate-600" />
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">إجمالي الكلمات</span>
          <span className="text-3xl font-black text-slate-900 font-sans block mt-2">{summary.totalWords}</span>
          <span className="text-[10px] text-slate-400 mt-1 block font-medium">نبضات لغوية متكاملة</span>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-none p-5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-1 bg-slate-800" />
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">إجمالي الحروف</span>
          <span className="text-3xl font-black text-slate-900 font-sans block mt-2">{summary.totalLetters}</span>
          <span className="text-[10px] text-slate-400 mt-1 block font-medium">رسم المصحف المستقصى</span>
        </div>
        <div className="bg-slate-900 border-2 border-slate-900 text-white rounded-none p-5 text-center relative overflow-hidden">
          <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">إجمالي حساب الجمل</span>
          <span className="text-3xl font-black text-white font-sans block mt-2">{summary.totalJummal}</span>
          <span className="text-[10px] text-emerald-400 mt-1 block font-medium">الوزن التشغيلي الأكبر</span>
        </div>
      </div>

      {/* Wave Preview inside Output Screen for Al-Bunyan */}
      {previewChartInOutput && activeSurah && points.length > 0 && (
        <div className="bg-slate-50 border-2 border-slate-300 p-6 rounded-none space-y-4 text-right" dir="rtl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
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

      {/* Modern Filter controls */}
      <div className={`grid grid-cols-1 ${isNoorani ? 'lg:grid-cols-3' : ''} gap-6 bg-white border-2 border-slate-200 p-6 rounded-none relative`}>
        <div className="absolute top-0 right-0 left-0 h-1 bg-slate-300" />
        {/* Search */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500 block uppercase tracking-wider">البحث اللغوي والحسابي في السجل:</label>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchKeyword);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-900 rounded-none pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all"
                placeholder="ابحث عن حرف أو كلمة أو نص..."
              />
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery(searchKeyword)}
              className="px-3 py-2 text-xs font-black bg-slate-900 hover:bg-slate-850 text-white rounded-none transition-all cursor-pointer shrink-0"
            >
              تفعيل البحث
            </button>
            {(searchQuery || searchKeyword) && (
              <button
                type="button"
                onClick={() => {
                  setSearchKeyword('');
                  setSearchQuery('');
                }}
                className="px-2 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-none transition-all cursor-pointer shrink-0"
                title="إعادة تعيين البحث"
              >
                إعادة تعيين
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {isNoorani && (
          <div className="space-y-3 flex flex-col justify-center lg:col-span-2 bg-slate-50 p-4 border border-slate-200 rounded-none">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1 font-sans">
              <Filter className="w-3.5 h-3.5 text-slate-700" />
              تصفية واستعراض درجات التوافق والموازين اللمسية والذهبية للآيات:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setMizanFilter('all')}
                className={`px-3 py-2 text-[10px] font-black rounded-none cursor-pointer border transition-all flex items-center gap-1 ${
                  mizanFilter === 'all' 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>الكل 📑 ({filterCounts.all})</span>
              </button>

              <button
                type="button"
                onClick={() => setMizanFilter('golden')}
                className={`px-3 py-2 text-[10px] font-black rounded-none cursor-pointer border transition-all flex items-center gap-1 ${
                  mizanFilter === 'golden' 
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-md shadow-amber-500/10' 
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80'
                }`}
                title="مفتاح بنياني مطلق (اللون الذهبي) - مستوفٍ لكافة شروط الاتزان الستة"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>المفاتيح المطلقة 🌟 ({filterCounts.golden})</span>
              </button>

              <button
                type="button"
                onClick={() => setMizanFilter('exact')}
                className={`px-3 py-2 text-[10px] font-black rounded-none cursor-pointer border transition-all flex items-center gap-1 ${
                  mizanFilter === 'exact' 
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/10' 
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
                }`}
                title="الآيات المتوافقة تماماً (اللون الأخضر) - مستوفية لـ 3 إلى 5 شروط"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>متوافقة تماماً 🟢 ({filterCounts.exact})</span>
              </button>

              <button
                type="button"
                onClick={() => setMizanFilter('structural')}
                className={`px-3 py-2 text-[10px] font-black rounded-none cursor-pointer border transition-all flex items-center gap-1 ${
                  mizanFilter === 'structural' 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10' 
                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/80'
                }`}
                title="الآيات المتوافقة بنيوياً جزئياً (اللون الأزرق) - مستوفية لشرط أو شرطين"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>متوافقة بنيوياً 🔵 ({filterCounts.structural})</span>
              </button>

              <button
                type="button"
                onClick={() => setMizanFilter('not_compatible')}
                className={`px-3 py-2 text-[10px] font-black rounded-none cursor-pointer border transition-all flex items-center gap-1 ${
                  mizanFilter === 'not_compatible' 
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/10' 
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/80'
                }`}
                title="الآيات غير المتوافقة مباشرة (اللون الأحمر) - لا تحقق شروط الاتزان المباشرة"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>غير متوافقة مباشرة 🔴 ({filterCounts.not_compatible})</span>
              </button>

              <button
                type="button"
                onClick={() => setMizanFilter('tawheed')}
                className={`px-3 py-2 text-[10px] font-black rounded-none cursor-pointer border transition-all flex items-center gap-1 ${
                  mizanFilter === 'tawheed' 
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-700/10' 
                    : 'bg-indigo-50 text-indigo-950 border-indigo-200 hover:bg-indigo-100/80'
                }`}
                title="الآيات المتوافقة مع موازين التوحيد (توحيدي بنيوي مشترك أو توحيدي ذاتي)"
              >
                <span>💛 التوافق التوحيدي ({filterCounts.tawheed})</span>
              </button>

              <button
                type="button"
                onClick={() => setMizanFilter('triple_match')}
                className={`px-3.5 py-2 text-[10px] font-black rounded-lg cursor-pointer border-2 transition-all flex items-center gap-1.5 shadow-sm ${
                  mizanFilter === 'triple_match' 
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 border-amber-600 ring-2 ring-amber-300 font-black' 
                    : 'bg-amber-100/90 text-amber-950 border-amber-300 hover:bg-amber-200/90'
                }`}
                title="تقرير آيات النخبة النورانية المطلقة (Triple Match): الاستيفاء الكامل والتأثر بالمعامل النوراني وبصمة السورة"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                <span>🔘 تقرير آيات النخبة النورانية المطلقة (Triple Match) ({filterCounts.triple_match})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI stats section shown when search is active */}
      {searchQuery.trim() && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 p-4 rounded-none flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-950 font-black text-xs rounded-none">
              🔍 موازين البحث النشط
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">المبحث المستهدف:</span>
              <span className="text-sm font-black text-slate-900 font-bold">" {searchQuery} "</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 items-center">
            <div className="text-center sm:text-right">
              <span className="text-[10px] text-slate-500 block font-bold">إجمالي التكرار في النص الكامل:</span>
              <span className="text-base font-black text-amber-700">{occurrenceCount} مرة</span>
            </div>
            <div className="text-center sm:text-right border-r border-slate-200 pr-6">
              <span className="text-[10px] text-slate-500 block font-bold">عدد الآيات التي تحويه:</span>
              <span className="text-base font-black text-amber-800">{versesContainingCount} آية</span>
            </div>
            {activeSurah && isNoorani && (
              <div className="text-center sm:text-right border-r border-slate-200 pr-6">
                <span className="text-[10px] text-slate-500 block font-bold">بقياس معامل السورة بعد الاختزال:</span>
                <span className="text-xs font-black text-slate-700">ثابت التحقق النوراني بعد الاختزال ({activeSurah.digitalRoot})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verses Table List */}
        <div className="lg:col-span-7 bg-white border-2 border-slate-200 rounded-none overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-slate-900" />
          
          {/* Track Selection Tabs for Surah Al-Shura (42) */}
          {activeSurah?.id === 42 && isNoorani && (
            <div className="bg-slate-50 border-b-2 border-slate-200 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 shrink-0 select-none">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                الدراسة المستقلة لسورة الشورى:
              </span>
              <div className="flex w-full sm:w-auto gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedShuraTab('hameem')}
                  className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black text-center transition-all cursor-pointer rounded-none border-2 ${
                    selectedShuraTab === 'hameem'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/10'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  📈 جدول مسار حم (معامل 3)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShuraTab('asaq')}
                  className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black text-center transition-all cursor-pointer rounded-none border-2 ${
                    selectedShuraTab === 'asaq'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/10'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  ✨ جدول مسار عسق (معامل 5)
                </button>
              </div>
            </div>
          )}

          {/* Informative Table Header and Legend Banner */}
          <div className="bg-slate-50 border-b border-slate-200 p-4 text-right space-y-2 select-none">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              📋 ميزان التحليل الشامل وجدول استقصاء التوافقات:
            </h4>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              يوضح هذا الجدول البنيان الحسابي للآيات الكريمة وفق موازين علم الاستقصاء العددي للقرآن الكريم. تشتمل الدراسة على اختبارين جوهريين:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[9px] pt-1.5 border-t border-slate-200">
              <div className="bg-white p-2 border border-slate-200 rounded-none">
                <span className="font-bold text-amber-700 block mb-1">🎯 التوافق الجوهري المباشر (التطابق التام):</span>
                يحدث عندما يتطابق حساب الجمل للآية مع المعامل الأصلي للسورة (قيمة حروف السورة النورانية أو رقم السورة للسور العادية).
              </div>
              <div className="bg-white p-2 border border-slate-200 rounded-none">
                <span className="font-bold text-indigo-700 block mb-1">🔮 البصمة الأحادية والتحقق المدمج (1-9):</span>
                الاختزال النهائي لمعادلة: <code className="font-mono bg-slate-100 px-1 font-bold">[جمل الآية المختزل] × [رقم الآية + المعامل المختزل]</code>. يتوافق مدمجاً عند مطابقة: <strong>9 (ذاتي سائد)</strong>، <strong>المعامل</strong>، أو <strong>رقم الآية المختزل</strong>.
              </div>
            </div>
          </div>

          <div className="table-container overflow-x-auto">
            <table className="w-full text-right border-collapse text-[11px] min-w-[850px]">
              <thead>
                <tr className="bg-[#0f172a] text-white border-b-2 border-slate-300 font-bold select-none text-center">
                  <th className="p-2 border border-slate-200 number-column">م</th>
                  <th className="p-2 border border-slate-200 number-column">رقم الآية</th>
                  <th className="p-2 border border-slate-200 text-right verse-column">الآية الكريمة</th>
                  <th className="p-2 border border-slate-200 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('jummal')}>حساب الجمل</th>
                  {isNoorani && (
                    <>
                      <th className="p-2 border border-slate-200">
                        {activeSurah?.id === 42 ? 'المسار (المعامل)' : 'قيمة الحروف بعد الاختزال'}
                      </th>
                      <th className="p-2 border border-slate-200">ناتج القسمة</th>
                      <th className="p-2 border border-slate-200">عمود التحقق</th>
                    </>
                  )}
                  <th className="p-2 border border-slate-200">البصمة الأحادية والتحقق المدمج</th>
                  <th className="p-2 border border-slate-200">الكلية</th>
                  <th className="p-2 border border-slate-200">الكلمات</th>
                  <th className="p-2 border border-slate-200 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('letters')}>الحروف</th>
                  <th className="p-2 border border-slate-200">المجموع</th>
                  <th className="p-2 border border-slate-200 w-14">نسخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tableRows.map((rowItem, idx) => {
                  const v = rowItem.v;
                  const track = rowItem.track;
                  const isSelected = selectedVerseId === v.id;
                  
                  // Division calculations
                  const divisionResult = isNoorani ? v.jummalValue / track.digitalRoot : 0;
                  const isExact = isNoorani ? v.jummalValue % track.digitalRoot === 0 : false;
                  const quotientStr = isNoorani ? (isExact ? divisionResult.toString() : divisionResult.toFixed(4)) : '';
                  const reduction = reduceDigitalRoot(v.jummalValue);
                  const sumValue = v.wordCount + v.letterCount;

                  const dummySurah = {
                    id: activeSurah?.id || 1,
                    name: activeSurah?.name || '',
                    letters: track.letters,
                    keyValue: track.keyValue,
                    digitalRoot: track.digitalRoot
                  };
                  const comp = activeSurah ? getCompatibilityDetails(v, dummySurah) : null;
                  
                  let rowColorClass = 'hover:bg-slate-50';
                  let sideBorderClass = '';
                  
                  if (isSelected) {
                    rowColorClass = 'bg-amber-100/70 font-bold';
                    sideBorderClass = 'border-r-4 border-amber-500';
                  } else if (comp && isNoorani) {
                    if (comp.score === 6) {
                      rowColorClass = 'bg-amber-500/10 hover:bg-amber-500/15 font-medium';
                      sideBorderClass = 'border-r-4 border-amber-400';
                    } else if (comp.score >= 3 && comp.score <= 5) {
                      rowColorClass = 'bg-emerald-500/5 hover:bg-emerald-500/10';
                      sideBorderClass = 'border-r-4 border-emerald-400';
                    } else if (comp.score >= 1 && comp.score <= 2) {
                      rowColorClass = 'bg-blue-500/5 hover:bg-blue-500/10';
                      sideBorderClass = 'border-r-4 border-blue-400';
                    } else if (comp.score === 0) {
                      rowColorClass = 'bg-rose-500/5 hover:bg-rose-500/10 text-slate-500';
                      sideBorderClass = 'border-r-4 border-rose-300';
                    }
                  } else if (comp && !isNoorani) {
                    if (comp.isDirectMatch) {
                      rowColorClass = 'bg-amber-500/5 hover:bg-amber-500/10';
                      sideBorderClass = 'border-r-4 border-amber-400';
                    } else if (comp.isIntegratedTawheed) {
                      rowColorClass = 'bg-emerald-500/5 hover:bg-emerald-500/10';
                      sideBorderClass = 'border-r-4 border-emerald-400';
                    }
                  }

                  const isDirectMatch = comp?.isDirectMatch;

                  return (
                    <tr 
                      key={`${v.id}-${track.letters}`} 
                      onClick={() => {
                        setSelectedVerseId(v.id);
                        setSelectedTrack(track);
                      }}
                      className={`cursor-pointer transition-colors text-center ${rowColorClass} ${sideBorderClass}`}
                    >
                      <td className="p-2 border border-slate-100 font-mono text-slate-500 number-column">{idx + 1}</td>
                      <td className="p-2 border border-slate-100 number-column">
                        <span className="px-1.5 py-0.5 bg-slate-900 text-white font-black font-sans rounded-sm">
                          {v.verseNumber}
                        </span>
                      </td>
                      <td className="p-2 border border-slate-100 text-right verse-column verse-text quran-font text-xs text-slate-900 font-black" title={v.text}>
                        {v.text ? `( ${v.text} )` : <span className="text-slate-400 text-[10px] italic font-sans">(البسملة المستبعدة)</span>}
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
                      {isNoorani && (
                        <>
                          <td className="p-2 border border-slate-100 text-slate-600 font-mono font-bold">{track.label}</td>
                          <td className="p-2 border border-slate-100 font-mono text-teal-800 font-bold" title={isNoorani ? divisionResult.toString() : ''}>{quotientStr}</td>
                          <td className="p-2 border border-slate-100 align-middle">
                            {comp && (
                              <div className="flex flex-col items-center justify-center gap-1.5 p-1 min-w-[120px]">
                                {/* Score indicator */}
                                <span className={`px-2 py-0.5 text-[9px] border font-extrabold rounded-none block text-center whitespace-nowrap ${comp.statusColor}`}>
                                  {comp.statusLabel} ({comp.score}/6)
                                </span>

                                {/* 6 Conditions Small Dots/Indicators */}
                                <div className="flex gap-0.5 justify-center mt-0.5">
                                  {comp.conditions.map((c, i) => {
                                    const label = i === 0 ? 'جمل' : i === 1 ? 'هيكل' : i === 2 ? 'كثافة' : i === 3 ? 'مجموع' : i === 4 ? 'أس' : 'رقم';
                                    return (
                                      <span 
                                        key={i} 
                                        title={`الشرط ${i+1}: ${label} (${c ? 'متوافق' : 'غير متوافق'})`}
                                        className={`w-4 h-4 flex items-center justify-center rounded-none text-[8px] font-black text-white ${
                                          c ? 'bg-emerald-600' : 'bg-slate-300 text-slate-500'
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
                        </>
                      )}
                      
                      {/* NEW COLUMN CELL: البصمة الأحادية والتحقق المدمج */}
                      <td className="p-2 border border-slate-100 font-sans align-middle">
                        {comp && (() => {
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
                                title="البصمة الأحادية للآية"
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm transition-all duration-300 ${
                                  comp.isDominantNine ? 'bg-amber-500 ring-2 ring-amber-300 scale-105 animate-pulse' :
                                  comp.isDigitalMirror ? 'bg-emerald-600 ring-2 ring-emerald-300' :
                                  comp.isVerseFingerprint ? 'bg-indigo-600 ring-2 ring-indigo-300' :
                                  'bg-slate-300 text-slate-700 font-bold'
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
                                {comp.isVerseFingerprint && (
                                  <span className="px-1 py-0.2 bg-indigo-100 text-indigo-800 border border-indigo-300 text-[7px] font-bold rounded-sm whitespace-nowrap" title="توافق بصمة الآية (رقم الآية المختزل)">
                                    بصمة الآية
                                  </span>
                                )}
                                {comp.isNooraniRankMatch && (
                                  <span className="px-1 py-0.2 bg-fuchsia-100 text-fuchsia-950 border border-fuchsia-300 text-[7px] font-bold rounded-sm whitespace-nowrap" title={`تطابق البصمة الأحادية مع رقم ترتيب السورة ضمن السور النورانية الـ 29 (ترتيبها: ${comp.nooraniRank})`}>
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
                          </div>
                        );
                        })()}
                      </td>

                      <td className="p-2 border border-slate-100 font-mono text-indigo-700 font-semibold">{reduction}</td>
                      <td className="p-2 border border-slate-100 font-mono text-slate-600">{v.wordCount}</td>
                      <td className="p-2 border border-slate-100 font-mono text-slate-600">{v.letterCount}</td>
                      <td className="p-2 border border-slate-100 font-mono text-slate-950 font-bold bg-slate-50/50">{sumValue}</td>
                      <td className="p-2 border border-slate-100 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyIndividualVerse(v);
                          }}
                          className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="نسخ نص الآية وبياناتها"
                        >
                          {copiedVerseId === v.id ? (
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
          {processedVerses.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">
              لم نجد أي مطابقات لطلب البحث أو معايير التحقق المقترحة.
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
                  {selectedVerse.text ? `( ${selectedVerse.text} )` : <span className="text-slate-400 text-sm italic font-sans">(تم استبعاد البسملة الاستفتاحية بالكامل من الحساب)</span>}
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
                  يمكنك اختبار نقص وزيادة الحروف ومقارنة قيم الجمّل مباشرة (مثال: محاذاة الفروق للحصول على المطابقة التامة لقيمة الثابت البنياني {activeSurah.keyValue}):
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
                      حساب جمل الآية يعادل (<strong className="text-slate-950">{selectedVerse.jummalValue}</strong>) وبقسمته على معامل الحروف المقطعة المختزلة (<strong className="text-slate-950">{activeSurah.digitalRoot}</strong>) يعطي الناتج المباشر: <strong className="text-slate-950 font-mono">{(selectedVerse.jummalValue / activeSurah.digitalRoot).toFixed(4)}</strong>.
                    </li>
                    <li>
                      {selectedVerse.jummalValue % activeSurah.digitalRoot === 0 ? (
                        <span className="text-emerald-700 font-black">
                          ✅ هذه الآية محققة بالكامل ومضاعف صحيح متميز للمفتاح المختزل (قوة المفتاح = {selectedVerse.jummalValue / activeSurah.digitalRoot})!
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          ❌ لا شكراً (غير محققة) - ناتج القسمة يحتوي على باقٍ عشري {selectedVerse.jummalValue % activeSurah.digitalRoot}، مما يعني أنها لا تنتمي للبنيان الصحيح للمفتاح النوراني النشط بعد الاختزال.
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

      {/* Separate Table for Compatible/Verified Verses */}
      <div className="bg-white border-2 border-slate-900 p-6 rounded-none relative mt-8">
        <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-600" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              جدول الآيات المتوافقة والمحققّة بالكامل (قوة المفتاح النوراني)
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              حُصرت هذه الآيات بشكل مستقل لكون نواتج قسمتها أرقام صحيحة تماماً دون أي كسر عشري على الثابت النوراني بعد الاختزال ({activeSurah.letters} بقيمة {activeSurah.digitalRoot}).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCompatibleVersesList}
              className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs rounded-none flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-slate-300" />
              <span>{isCompatibleCopied ? 'تم نسخ القائمة!' : 'نسخ قائمة المتوافق'}</span>
            </button>
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs select-none">
              {compatibleVerses.length} آية متطابقة
            </span>
          </div>
        </div>

        {compatibleVerses.length > 0 ? (
          <div className="table-container overflow-x-auto border-2 border-slate-200">
            <table className="w-full text-right border-collapse text-xs min-w-[750px]">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-700 font-bold select-none text-center">
                  <th className="p-3 text-center border-l border-slate-200 number-column">رقم الآية</th>
                  <th className="p-3 text-right verse-column">نص الآية الكريمة ومضمونها الحسابي</th>
                  <th className="p-3 text-center border-r border-slate-200 w-32 bg-emerald-50 text-emerald-950 font-black">حساب الجمل الأبجدي</th>
                  <th className="p-3 text-center w-40 bg-slate-900 text-white font-black">قوة المفتاح المختزل (ناتج القسمة)</th>
                  <th className="p-3 text-center number-column">نسخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compatibleVerses.map((v) => {
                  const power = Math.round(v.jummalValue / activeSurah.digitalRoot);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center border-l border-slate-200 font-mono font-bold number-column">
                        <span className="px-2 py-0.5 bg-slate-900 text-white text-[11px] font-sans">
                          {v.verseNumber}
                        </span>
                      </td>
                      <td className="p-3 text-right verse-column verse-text quran-font text-sm font-black text-slate-900 leading-relaxed">
                        {v.text}
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 font-mono font-black text-slate-900 bg-emerald-50/20">
                        {v.jummalValue}
                      </td>
                      <td className="p-3 text-center font-mono font-black text-xs bg-slate-50 text-slate-950 border-r border-slate-100">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-900 font-bold">
                          {power}
                        </span>
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 w-16">
                        <button
                          type="button"
                          onClick={() => handleCopyIndividualVerse(v)}
                          className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="نسخ نص الآية وبياناتها"
                        >
                          {copiedVerseId === v.id ? (
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
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs">
            لا توجد آيات متوافقة أو معنية بالقسمة الصحيحة دون كسر عشري حالياً تحت معامل هذا المفتاح.
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a]/95 backdrop-blur-sm text-slate-100 px-5 py-3.5 border-l-4 border-amber-500 shadow-2xl max-w-md flex items-center gap-2.5 animate-fade-in font-bold text-xs rounded-none">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
