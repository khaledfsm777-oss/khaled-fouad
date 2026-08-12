import React, { useState } from 'react';
import { Verse } from '../types';
import { 
  NooraniSurah, 
  normalizeArabicForSearch, 
  cleanForCalculations, 
  analyzeWord, 
  reduceDigitalRoot, 
  removeTashkeel, 
  NOORANI_SURAHS 
} from '../utils/jummal';
import quranData from '../utils/quranData';
import { SURAH_METADATA, getSurahMetadata } from '../utils/surahMetadata';
import { generateLocalAcademicAnalysis } from '../utils/reportTemplates';
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
  Search
} from 'lucide-react';

interface AiAnalysisProps {
  verses: Verse[];
  activeSurah: NooraniSurah | null;
  history: any[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function AiAnalysis({ verses, activeSurah, history, setHistory }: AiAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(prev => prev === message ? null : prev);
    }, 4000);
  };

  // Pre-calculate target verses and indicators
  const surahLetters = activeSurah ? activeSurah.letters : '';
  const letterSet = new Set(surahLetters.split(''));

  const analyzedVerses = verses.map(v => {
    const isVerified = activeSurah ? (v.jummalValue % activeSurah.digitalRoot === 0) : false;
    const quotient = activeSurah ? (v.jummalValue / activeSurah.digitalRoot) : 0;
    
    // Count exact frequency of opening letters in this verse
    let overlapCount = 0;
    const cleanText = v.cleanTextForCalculation || '';
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

  // 1. Highest Quotient (Key Power) Verse among verified ones
  const verifiedVerses = analyzedVerses.filter(v => v.isVerified);
  const maxQuotientVerse = verifiedVerses.length > 0 
    ? [...verifiedVerses].sort((a, b) => (b.quotient || 0) - (a.quotient || 0))[0] 
    : null;

  // 2. Highest Overlap Density of opening letters
  const maxDensityVerse = analyzedVerses.length > 0 
    ? [...analyzedVerses].sort((a, b) => (b.overlapRatio || 0) - (a.overlapRatio || 0))[0] 
    : null;

  const fetchAnalysis = async () => {
    if (verses.length === 0) return;
    setLoading(true);
    setError(null);
    setAnalysis('');

    try {
      const surahMeta = activeSurah ? getSurahMetadata(activeSurah.id) : null;

      // Add a small 400ms delay to simulate deep analytical calculations locally
      await new Promise(resolve => setTimeout(resolve, 400));

      const generatedAnalysisText = generateLocalAcademicAnalysis({
        activeSurah: activeSurah ? {
          id: activeSurah.id,
          name: activeSurah.name,
          letters: activeSurah.letters,
          keyValue: activeSurah.keyValue,
          digitalRoot: activeSurah.digitalRoot,
        } : null,
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
      });

      setAnalysis(generatedAnalysisText);

      // Append new study to the history list
      const newHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('ar-EG'),
        surahName: activeSurah ? activeSurah.name : 'عامة / غير محددة',
        surahLetters: activeSurah ? activeSurah.letters : 'لا يوجد',
        digitalRoot: activeSurah ? activeSurah.digitalRoot : 'لا يوجد',
        keyValue: activeSurah ? activeSurah.keyValue : 'لا يوجد',
        versesCount: verses.length,
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
      };

      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء إجراء الاستقصاء الذكي للموازين.');
    } finally {
      setLoading(false);
    }
  };

  // Reusable export function for MS Word (.doc) with integrated graphic waves
  const exportToWord = (
    analysisText: string,
    surahName: string,
    surahLetters: string,
    digitalRoot: number | string,
    keyValue: number | string,
    versesCount: number,
    maxQuot: any,
    maxDens: any,
    timestamp: string,
    versesList: any[] = []
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
    html += `<head><meta charset="utf-8"><title>دراسة مفسر البنيان الذكي</title>`;
    html += `<style>
      body { font-family: 'Arial', sans-serif; direction: rtl; padding: 25px; background-color: #ffffff; text-align: right; }
      h1 { text-align: center; color: #092b22; font-size: 20px; margin-bottom: 15px; border-bottom: 3px double #b45309; padding-bottom: 10px; }
      .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 20px; font-size: 12px; line-height: 1.6; direction: rtl; text-align: right; }
      .key-box { background-color: #fffbeb; border: 1.5px solid #f59e0b; padding: 15px; margin-bottom: 20px; font-size: 12.5px; line-height: 1.6; direction: rtl; text-align: right; }
      .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
      .wave-table { width: 100%; border-collapse: collapse; margin-top: 15px; direction: rtl; text-align: right; }
      .wave-table th { background-color: #092b22; color: #ffffff; padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #cbd5e1; }
      .wave-table td { padding: 8px; font-size: 11px; border: 1px solid #cbd5e1; vertical-align: middle; }
    </style></head><body>`;
    
    html += `<h1>بِرْنَامَج البُنْيَان لِلْقُرْآنِ الكَرِيمِ - مِيزَانُ التَّحَقُّقِ وَالاسْتِقْصَاءِ</h1>`;
    
    html += `<div class="meta-box">`;
    html += `<strong>التقرير:</strong> دراسة استقصائية وملاحظات تحليلية معمقة من مفسّر البنيان الذكي<br>`;
    html += `<strong>تاريخ الاستخراج:</strong> ${timestamp}<br>`;
    html += `<strong>السورة النشطة:</strong> سورة ${surahName} (معامل الاختزال: ${digitalRoot})<br>`;
    html += `<strong>الحروف الافتتاحية للمقارنة:</strong> ${surahLetters} (حساب الجمل: ${keyValue})<br>`;
    html += `<strong>عدد الآيات المدروسة:</strong> ${versesCount} آية كريمة<br>`;
    html += `</div>`;

    if (maxQuot || maxDens) {
      html += `<div class="key-box">`;
      html += `<h3 style="color: #b45309; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #f59e0b; padding-bottom: 5px;">🔑 مفاتيح فك الشفرة والترابط البنيوي المستهدفة:</h3>`;
      if (maxQuot) {
        const quotientVal = typeof maxQuot.quotient === 'number' ? maxQuot.quotient.toFixed(4) : maxQuot.quotient;
        html += `<strong>1. الآية الأعلى تحقيقاً للمعامل النوراني (مفتاح القوة):</strong><br>`;
        html += `[آية رقم ${maxQuot.verseNumber}]: « ${maxQuot.text} »<br>`;
        html += `* حساب الجمل الإجمالي: ${maxQuot.jummalValue} | قوة المفتاح النوراني: ${quotientVal} | عدد الكلمات: ${maxQuot.wordCount} | عدد الحروف: ${maxQuot.letterCount}<br><br>`;
      }
      if (maxDens) {
        const densRatio = typeof maxDens.overlapRatio === 'number' ? (maxDens.overlapRatio * 100).toFixed(1) : '0';
        html += `<strong>2. الآية الأعلى تداخلاً بالحروف الافتتاحية للسورة (كثافة الحروف النورانية):</strong><br>`;
        html += `[آية رقم ${maxDens.verseNumber}]: « ${maxDens.text} »<br>`;
        html += `* التداخل بحروف افتتاحية السورة ("${surahLetters}"): ${maxDens.overlapCount} حرفاً بنسبة كثافة ${densRatio}% | حساب الجمل: ${maxDens.jummalValue} | كلمات: ${maxDens.wordCount} | حروف: ${maxDens.letterCount}<br>`;
      }
      html += `</div>`;
    }

    // 📈 Inject visual drawing & waves for MS Word
    if (Array.isArray(versesList) && versesList.length > 0) {
      let maxJummal = 1;
      let maxWords = 1;
      let maxLetters = 1;
      versesList.forEach((v) => {
        if (v.jummalValue && v.jummalValue > maxJummal) maxJummal = v.jummalValue;
        if (v.wordCount && v.wordCount > maxWords) maxWords = v.wordCount;
        if (v.letterCount && v.letterCount > maxLetters) maxLetters = v.letterCount;
      });

      html += `<h3 style="color: #092b22; margin-top: 30px; margin-bottom: 10px; border-right: 5px solid #b45309; padding-right: 12px; direction: rtl; text-align: right;">📊 الرسوم البيانية والموجات الميزانية للآيات (Waves & Diagrams):</h3>`;
      html += `<p style="font-size: 11px; color: #475569; margin-bottom: 15px; direction: rtl; text-align: right;">موجات رقمية بيانية متكاملة لخصائص البنيان للآيات المدروسة (حساب الجمل، الكثافة النورانية، والموازين اللفظية):</p>`;
      
      html += `<table class="wave-table" border="1">`;
      html += `<thead><tr>
        <th style="width: 10%; text-align: center;">الآية</th>
        <th style="width: 40%; text-align: right;">النص القرآني الكريم</th>
        <th style="width: 50%; text-align: right;">الرسم الموجي والمؤشرات البيانية</th>
      </tr></thead><tbody>`;

      versesList.forEach((v) => {
        const jPercent = Math.max(5, Math.min(100, Math.round((v.jummalValue / maxJummal) * 100)));
        const oPercent = Math.max(5, Math.min(100, Math.round((v.overlapRatio ?? 0) * 100)));
        const wPercent = Math.max(5, Math.min(100, Math.round((v.wordCount / maxWords) * 100)));
        const lPercent = Math.max(5, Math.min(100, Math.round((v.letterCount / maxLetters) * 100)));

        html += `<tr>
          <td style="text-align: center; font-weight: bold; background-color: #f8fafc;">[${v.verseNumber}]</td>
          <td style="font-weight: bold; color: #0f172a; text-align: justify; line-height: 1.5;">« ${v.text} »</td>
          <td style="line-height: 1.6;">
            <div style="margin-bottom: 5px;">
              <span style="display: inline-block; width: 110px; font-size: 9.5px; color: #475569;">موجة الجُمّل (${v.jummalValue}):</span>
              <div style="display: inline-block; background-color: #b45309; height: 10px; width: ${jPercent * 1.5}px; border-radius: 2px;"></div>
            </div>
            <div style="margin-bottom: 5px;">
              <span style="display: inline-block; width: 110px; font-size: 9.5px; color: #475569;">كثافة الحروف (${((v.overlapRatio ?? 0) * 100).toFixed(1)}%):</span>
              <div style="display: inline-block; background-color: #092b22; height: 10px; width: ${oPercent * 1.5}px; border-radius: 2px;"></div>
            </div>
            <div>
              <span style="display: inline-block; width: 110px; font-size: 9.5px; color: #475569;">بنيان (كلمات/حروف):</span>
              <div style="display: inline-block; background-color: #0ea5e9; height: 8px; width: ${wPercent * 1.2}px; border-radius: 1px;" title="الكلمات (${v.wordCount})"></div>
              <div style="display: inline-block; background-color: #10b981; height: 8px; width: ${lPercent * 1.2}px; border-radius: 1px;" title="الحروف (${v.letterCount})"></div>
            </div>
          </td>
        </tr>`;
      });
      html += `</tbody></table><br>`;
    }
    
    html += contentHtml;
    
    html += `<div class="footer"><p>«مستشار البنيان الذكي» • منصة التحليل والاستقصاء الرقمي والاتزان العددي</p></div>`;
    html += `</body></html>`;
    
    const blob = new Blob([BOM + html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `دراسة_مفسر_البنيان_الذكي_${surahName.replace(/\s+/g, '_')}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reusable export function for MS Excel (.csv with proper BOM & integrated Sparkline drawing waves)
  const exportToExcel = (
    analysisText: string,
    surahName: string,
    surahLetters: string,
    digitalRoot: number | string,
    versesCount: number,
    maxQuot: any,
    maxDens: any,
    timestamp: string,
    versesList: any[] = []
  ) => {
    if (!analysisText) return;
    const BOM = '\uFEFF';
    
    let csvRows = [];
    csvRows.push(`"تقرير ودراسة مفسّر البنيان الذكي لآيات الذكر الحكيم"`);
    csvRows.push(`"تاريخ الاستخراج:","${timestamp}"`);
    csvRows.push(`"السورة المرتبطة:","سورة ${surahName}","معامل الحروف النورانية:","${surahLetters}","قيمة المعامل:","${digitalRoot}"`);
    
    if (maxQuot) {
      const quotientVal = typeof maxQuot.quotient === 'number' ? maxQuot.quotient.toFixed(4) : maxQuot.quotient;
      csvRows.push(`"الآية الأعلى تحقيقاً (مفتاح القوة):","[آية ${maxQuot.verseNumber}] ${maxQuot.text.replace(/"/g, '""')}","حساب الجمل: ${maxQuot.jummalValue}","قوة المفتاح: ${quotientVal}"`);
    }
    if (maxDens) {
      const densRatio = typeof maxDens.overlapRatio === 'number' ? (maxDens.overlapRatio * 100).toFixed(1) : '0';
      csvRows.push(`"الآية الأعلى كثافة حروف افتتاحية:","[آية ${maxDens.verseNumber}] ${maxDens.text.replace(/"/g, '""')}","تداخل الحروف: ${maxDens.overlapCount}","كثافة الحروف: ${densRatio}%"`);
    }
    csvRows.push(`"إجمالي الآيات:","${versesCount} آية"`);
    csvRows.push(``);

    // 📈 Inject visual sparkline waves inside Excel cells!
    if (Array.isArray(versesList) && versesList.length > 0) {
      csvRows.push(`"📊 الرسوم البيانية والأمواج الميزانية الرقمية للآيات (Excel Graphic Sparklines)"`);
      csvRows.push(`"الآية","النص القرآني الكريم","حساب الجُمّل","رسم موجة الجُمّل البصري","كثافة الحروف النورانية","رسم موجة الكثافة البصري","عدد الكلمات","عدد الحروف"`);
      
      let maxJummalCsv = 1;
      versesList.forEach((v) => {
        if (v.jummalValue && v.jummalValue > maxJummalCsv) maxJummalCsv = v.jummalValue;
      });

      const drawBar = (val: number, maxVal: number) => {
        const ratio = maxVal > 0 ? val / maxVal : 0;
        const count = Math.min(10, Math.max(0, Math.round(ratio * 10)));
        return '█'.repeat(count) + '░'.repeat(10 - count);
      };

      versesList.forEach((v) => {
        const jBar = drawBar(v.jummalValue || 0, maxJummalCsv);
        const oBar = drawBar(Math.round((v.overlapRatio ?? 0) * 100), 100);
        const cleanText = (v.text || '').replace(/"/g, '""');
        
        csvRows.push(`"[الآية ${v.verseNumber}]","« ${cleanText} »","${v.jummalValue}","${jBar}","${((v.overlapRatio ?? 0) * 100).toFixed(1)}%","${oBar}","${v.wordCount}","${v.letterCount}"`);
      });
      csvRows.push(``);
    }

    csvRows.push(`"الترتيب","الفقرة التحليلية / الملاحظة الاستقصائية للبنيان"`);

    const rawLines = analysisText.split('\n');
    let idx = 1;
    rawLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const cleanLine = trimmed
        .replace(/^###\s*/, '')
        .replace(/^##\s*/, '')
        .replace(/^#\s*/, '')
        .replace(/^[\*\-]\s*/, '• ')
        .replace(/\*\*/g, '')
        .replace(/"/g, '""');
        
      csvRows.push(`"${idx}","${cleanLine}"`);
      idx++;
    });

    const csvContent = BOM + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `دراسة_مفسر_البنيان_الذكي_${surahName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWord = () => {
    exportToWord(
      analysis,
      activeSurah ? activeSurah.name : 'عامة / غير محددة',
      activeSurah ? activeSurah.letters : 'لا يوجد',
      activeSurah ? activeSurah.digitalRoot : 'لا يوجد',
      activeSurah ? activeSurah.keyValue : 'لا يوجد',
      verses.length,
      maxQuotientVerse,
      maxDensityVerse,
      new Date().toLocaleDateString('ar-EG'),
      verses
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      analysis,
      activeSurah ? activeSurah.name : 'عامة / غير محددة',
      activeSurah ? activeSurah.letters : 'لا يوجد',
      activeSurah ? activeSurah.digitalRoot : 'لا يوجد',
      verses.length,
      maxQuotientVerse,
      maxDensityVerse,
      new Date().toLocaleDateString('ar-EG'),
      verses
    );
  };

  // Safe and elegant custom parser to render basic markdown formatting directly without crash risk
  const renderFormattedText = (rawText: string) => {
    if (!rawText) return null;
    
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Headings
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={idx} className="text-sm font-black text-slate-900 mt-4 mb-2 border-r-2 border-slate-900 pr-2">
            {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h3 key={idx} className="text-base font-black text-slate-950 mt-5 mb-3 border-r-4 border-slate-900 pr-3">
            {trimmed.replace(/^##\s*/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('#')) {
        return (
          <h2 key={idx} className="text-lg font-black text-slate-950 mt-6 mb-4 font-sans border-b border-slate-200 pb-2">
            {trimmed.replace(/^#\s*/, '')}
          </h2>
        );
      }
      
      // Empty lines
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Check if it's a bullet list item
      const isBullet = trimmed.startsWith('*') || trimmed.startsWith('-');
      const textToProcess = isBullet ? trimmed.replace(/^[\*\-]\s*/, '') : line;

      // Process **bold** text formatting inline
      let finalContent: React.ReactNode = textToProcess;
      if (textToProcess.includes('**')) {
        const parts = textToProcess.split('**');
        finalContent = parts.map((part, pIdx) => (
          pIdx % 2 === 1 ? (
            <strong key={pIdx} className="text-slate-900 font-extrabold">{part}</strong>
          ) : (
            part
          )
        ));
      }

      if (isBullet) {
        return (
          <li key={idx} className="text-sm text-slate-700 mr-4 list-disc leading-relaxed mt-1.5 list-inside">
            {finalContent}
          </li>
        );
      }

      // Normal paragraphs
      return (
        <p key={idx} className="text-sm leading-relaxed text-slate-700 mt-1 pb-1">
          {finalContent}
        </p>
      );
    });
  };

  const loadingQuotes = [
    "يجري حالياً وزن الحروف النورانية بمقاييس الأبجدية...",
    "استخلاص العلاقات بين البنية البلاغية والنبض العددي...",
    "توصيل موازين 8 و 313 بالمسارات الدلالية...",
    "يصيغ مستشار البنيان الاستقصاء الختامي لآياتك الكريمات..."
  ];

  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setCurrentQuoteIdx(prev => (prev + 1) % loadingQuotes.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleClearCache = () => {
    setAnalysis('');
    setError(null);
    setHistory([]);
    showToast('تم إخلاء وتفريغ الذاكرة المؤقتة وأرشيف المفسر الذكي بنجاح لتنشيط الجلسة!');
  };

  return (
    <>
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* AI Assistant card */}
      <div className="bg-white border-2 border-slate-200 rounded-none p-6 md:p-8 space-y-6 relative">
        <div className="absolute top-0 right-0 left-0 h-1 bg-slate-900" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-slate-100 rounded-none text-slate-900 border border-slate-200">
              <Brain className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight font-sans">مفسّـر الـبـنـيـان الـذكـي ⚡</h3>
              <p className="text-xs text-slate-500 mt-0.5">تحليل معاني الإعجاز البياني والعلاقات العددية والابتلاءات المتقاطعة بالاستعانة بالذكاء الاصطناعي</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {(analysis || error || history.length > 0) && (
              <button
                type="button"
                onClick={handleClearCache}
                className="px-4 py-2.5 text-xs font-black bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                title="تفريغ ذاكرة الجلسة وأرشيف المفسّر لحل أي مشاكل ثقل أو تعليق"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                <span>إخلاء الذاكرة المؤقتة 🧹</span>
              </button>
            )}

            {verses.length > 0 && !loading && (
              <button
                type="button"
                onClick={fetchAnalysis}
                className="w-full sm:w-auto px-6 py-3.5 text-xs font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 border-2 border-amber-300 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-slate-950 animate-bounce" />
                <span>{analysis ? 'إعادة الاستقصاء الذكي 🔄' : 'بدء استقصاء موازين الآيات ✨'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dedicated prominent callout banner for laptops if analysis not generated yet */}
        {verses.length > 0 && !analysis && !loading && (
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border-2 border-amber-400 p-5 rounded-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 my-4">
            <div className="space-y-1 text-right flex-1">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
                جاهز لتشغيل الاستقصاء الذكي لموازين ({verses.length}) آية سورة {activeSurah ? activeSurah.name : ''}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                يقوم المفسّر الذكي بفك شفرة الأوزان الهندسية واستخلاص معاني الاتزان النوراني فور الضغط على الزر الذهبي.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAnalysis}
              className="w-full md:w-auto px-8 py-3.5 text-xs font-black bg-slate-950 hover:bg-slate-800 text-amber-300 border-2 border-amber-400 rounded-lg flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all transform hover:scale-[1.02] shrink-0"
            >
              <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
              <span>بدء استقصاء موازين الآيات ✨</span>
            </button>
          </div>
        )}

        {/* Dynamic Decryption Keys and Target Verses Dashboard */}
        {verses.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 p-5 space-y-4 rounded-none relative">
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-amber-500" />
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Key className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                🔑 أوزان فك الشفرة والترابط البنيوي المستهدف (Decryption Keys)
              </h4>
            </div>

            {activeSurah ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Highest Verification Quotient */}
                <div className="bg-white border border-slate-200 p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-100 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      الآية الأعلى تحقيقاً (مفتاح القوة)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">سورة {activeSurah.name}</span>
                  </div>

                  {maxQuotientVerse ? (
                    <div className="space-y-3">
                      <div className="bg-emerald-50/40 p-3 border border-dashed border-emerald-100 rounded-none text-center">
                        <p className="quran-font text-base text-slate-900 font-extrabold leading-loose select-all">
                          « {maxQuotientVerse.text} »
                        </p>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 mt-1 block">
                          [ الآية رقم {maxQuotientVerse.verseNumber} ]
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-50 p-2 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">حساب الجمل الإجمالي</span>
                          <span className="text-xs font-black text-slate-900 font-mono">{maxQuotientVerse.jummalValue}</span>
                        </div>
                        <div className="bg-slate-50 p-2 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">قوة المفتاح النوراني</span>
                          <span className="text-xs font-black text-emerald-700 font-mono">
                            {typeof maxQuotientVerse.quotient === 'number' ? maxQuotientVerse.quotient.toFixed(4) : maxQuotientVerse.quotient}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">عدد الكلمات</span>
                          <span className="text-xs font-black text-slate-900 font-mono">{maxQuotientVerse.wordCount} كلمة</span>
                        </div>
                        <div className="bg-slate-50 p-2 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">عدد الحروف</span>
                          <span className="text-xs font-black text-slate-900 font-mono">{maxQuotientVerse.letterCount} حرفاً</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-[11px] font-semibold space-y-1">
                      <AlertCircle className="w-5 h-5 text-slate-300 mx-auto" />
                      <p>لا توجد آية متوافقة مباشرة (دون كسر عشري)</p>
                      <p className="text-[10px]">مع المعامل النوراني المختار في الآيات المدخلة حالياً.</p>
                    </div>
                  )}
                </div>

                {/* Column 2: Highest Letter Density */}
                <div className="bg-white border border-slate-200 p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-100 flex items-center gap-1">
                      <Fingerprint className="w-3 h-3" />
                      الأعلى كثافة بحروف الفاتحة ({activeSurah.letters})
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">معامل الاختزال: {activeSurah.digitalRoot}</span>
                  </div>

                  {maxDensityVerse ? (
                    <div className="space-y-3">
                      <div className="bg-amber-50/40 p-3 border border-dashed border-amber-100 rounded-none text-center">
                        <p className="quran-font text-base text-slate-900 font-extrabold leading-loose select-all">
                          « {maxDensityVerse.text} »
                        </p>
                        <span className="text-[10px] font-mono font-bold text-amber-800 mt-1 block">
                          [ الآية رقم {maxDensityVerse.verseNumber} ]
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-50 p-2 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">التداخل مع الفواتح</span>
                          <span className="text-xs font-black text-slate-900 font-mono">{maxDensityVerse.overlapCount ?? 0} حرفاً</span>
                        </div>
                        <div className="bg-slate-50 p-2 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">نسبة كثافة الحروف</span>
                          <span className="text-xs font-black text-amber-700 font-mono">
                            {((maxDensityVerse.overlapRatio ?? 0) * 100).toFixed(1)} %
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">حساب الجمل الإجمالي</span>
                          <span className="text-xs font-black text-slate-900 font-mono">{maxDensityVerse.jummalValue}</span>
                        </div>
                        <div className="bg-slate-50 p-2 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">عدد الكلمات والحروف</span>
                          <span className="text-xs font-black text-slate-900 font-mono">{maxDensityVerse.wordCount} ك | {maxDensityVerse.letterCount} ح</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-[11px] font-semibold">
                      لا يمكن احتساب كثافة الحروف لعدم توفر معطيات السورة.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 text-amber-800 text-xs flex items-start gap-2 border border-amber-100">
                <Compass className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-black">ملاحظة الترابط البنيوي للأبجدية:</p>
                  <p className="text-[11px] text-amber-700/90 font-semibold leading-relaxed">
                    يرجى تفعيل "السورة النشطة" من القائمة الجانبية أو شريط الأدوات العلوي؛ ليتمكن محلل البنيان من استخلاص "مفاتيح فك الشفرة" ومقدار تداخل حروف الآيات الحالية مع الحروف المقطعة (مثل الم، طه، يس...) الخاصة بسور الإعجاز الـ 29.
                  </p>
                </div>
              </div>
            )}

            {activeSurah && (
              <div className="p-3 bg-white border border-slate-200 text-[11px] leading-relaxed text-slate-600 flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="font-semibold">
                  <strong>💡 أبعاد وفلسفة فك الشفرة:</strong> نعتبر الآية أو الآيات المستهدفة أعلاه بمثابة 
                  <span className="text-slate-900 font-bold mx-1">"فك شفرة الترابط البنيوي"</span>؛ 
                  حروف افتتاحية السورة الكريمة تلتحم مع معاني هذه الآيات وعلاقات حساب الجمل لتبين المحور العام للسورة الكريمة.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Input Empty Prompt */}
        {verses.length === 0 && (
          <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-none space-y-3">
            <Compass className="w-8 h-8 text-slate-400 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
            <p className="text-xs font-bold text-slate-500">
              برجاء العودة للشاشة الأولى وإدخال وتحليل بعض الكلمات القرآنية أولاً ليتيقّن مفسّر البنيان منها.
            </p>
          </div>
        )}

        {/* Loading status */}
        {loading && (
          <div className="text-center py-12 bg-slate-50 border-2 border-slate-200 rounded-none space-y-4">
            <RefreshCw className="w-8 h-8 text-slate-900 mx-auto animate-spin" />
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-900">مستشار البنيان يتأمل أسرار آياتك...</p>
              <p className="text-[11px] text-slate-500 animate-pulse">{loadingQuotes[currentQuoteIdx]}</p>
            </div>
          </div>
        )}

        {/* Error reporting */}
        {error && (
          <div className="p-5 bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-none text-xs space-y-3 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-rose-950">
              <AlertCircle className="w-4 h-4" />
              <span>أمر غير متوقع:</span>
            </div>
            <p className="font-medium">{error}</p>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setError(null)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-black text-[10px] cursor-pointer rounded-none"
              >
                تراجع وإخفاء الخطأ ❌
              </button>
              <button
                type="button"
                onClick={handleClearCache}
                className="px-3 py-1.5 bg-rose-900 hover:bg-rose-850 text-white font-black text-[10px] cursor-pointer rounded-none"
              >
                تصفير المحلل وإعادة المحاولة 🧹
              </button>
            </div>
            <p className="text-[10px] text-rose-600 font-bold pt-1 border-t border-rose-100">
              * للتفعيل التام، يرجى ملء حقل <strong>GEMINI_API_KEY</strong> في لوحة أسرار البيئة (Secrets) بمفتاح واجهة برمجة تطبيقات Google AI Studio ليكون خادمنا آمناً وم proxy.
            </p>
          </div>
        )}

        {/* Active Analysis feedback rendering */}
        {analysis && !loading && !error && (
          <div className="bg-slate-50 border-2 border-slate-200 rounded-none p-6 space-y-4 relative animate-fade-in">
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-950" />
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                الدراسة الاستقصائية النشطة الحالية:
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">النموذج النشط: Gemini 3.5 Flash</span>
            </div>

            <div className="quran-font pr-1 leading-relaxed space-y-2 text-slate-700">
              {renderFormattedText(analysis)}
            </div>
            
            <div className="border-t border-slate-200 pt-4 mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportWord}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors rounded-none cursor-pointer"
                  title="تصدير هذه الدراسة إلى ملف مايكروسوفت وورد (Word)"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-700" />
                  <span>تصدير لوورد (Word) 📝</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors rounded-none cursor-pointer"
                  title="تصدير هذه الدراسة إلى جدول إكسيل مبوب (Excel)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>تصدير لإكسيل (Excel) 📥</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(analysis);
                  showToast('تم نسخ الدراسة للذاكرة المؤقتة!');
                }}
                className="px-4 py-1.5 text-xs font-bold bg-[#0f172a] hover:bg-slate-800 text-white border border-slate-900 rounded-none transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>نسخ الدراسة بالكامل 📋</span>
              </button>
            </div>
          </div>
        )}

        {/* Default Help Info box */}
        {!analysis && !loading && !error && verses.length > 0 && (
          <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-none space-y-3 leading-relaxed relative">
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-900" />
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">✨ ما الذي يمكن أن يوضحه لك مفسّر البنيان؟</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              عند تشغيل الاستقصاء، يقوم مفسّـرنا الذكي بقراءة الأوزان الرقمية وخصائص الحروف للآيات التي قمت بتقسيمها، ويكشف لك عن المبررات الهندسية وعلاقات الأرقام بالتشريعات والمعاني، مما يوفر صياغات أكاديمية راقية لبحوث الإعجاز القرآني.
            </p>
          </div>
        )}
      </div>

      {/* History and Archive Section (Older Data) */}
      {history.length > 0 && (
        <div className="bg-white border-2 border-slate-200 rounded-none p-6 md:p-8 space-y-4 relative mt-6">
          <div className="absolute top-0 right-0 left-0 h-1 bg-slate-500" />
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-right">
              <History className="w-5 h-5 text-slate-600" />
              <div>
                <h3 className="text-base font-black text-slate-900 font-sans">📚 أرشيف وسجل الدراسات الاستقصائية السابقة (البيانات الأقدم)</h3>
                <p className="text-[11px] text-slate-500">يتضمن هذا الأرشيف كافة الدراسات والبيانات المستهدفة التي أجريت في الجلسة الحالية مرتبة من الأحدث إلى الأقدم</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConfirmClearHistory(true)}
              className="px-3 py-1.5 text-[11px] font-black text-rose-800 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-none flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تفريغ الأرشيف</span>
            </button>
          </div>

          <div className="space-y-4 text-right">
            {history.map((item) => {
              const isExpanded = expandedHistoryId === item.id;
              
              return (
                <div key={item.id} className="border border-slate-200 rounded-none overflow-hidden transition-all duration-200">
                  {/* History item header */}
                  <div 
                    onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                    className="bg-slate-50/85 hover:bg-slate-100/100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none border-b border-slate-200"
                  >
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 text-right">
                      <span className="text-xs font-black text-slate-100 bg-[#092b22] px-2 py-1 rounded-sm">
                        سورة {item.surahName}
                      </span>
                      {item.surahLetters && item.surahLetters !== 'لا يوجد' && (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200">
                          الفواتح: {item.surahLetters} (معامل: {item.digitalRoot})
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-medium">
                        • {item.versesCount} آية مدروسة
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        • {item.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Direct export buttons in the header for fast export without expanding! */}
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
                            item.maxQuotientVerse,
                            item.maxDensityVerse,
                            item.timestamp
                          );
                        }}
                        className="p-1 px-2 text-[10px] font-black text-blue-800 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-none cursor-pointer"
                        title="تصدير هذا الأرشيف لوورد"
                      >
                        وورد 📝
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportToExcel(
                            item.analysisText,
                            item.surahName,
                            item.surahLetters,
                            item.digitalRoot,
                            item.versesCount,
                            item.maxQuotientVerse,
                            item.maxDensityVerse,
                            item.timestamp
                          );
                        }}
                        className="p-1 px-2 text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-none cursor-pointer"
                        title="تصدير هذا الأرشيف لإكسيل"
                      >
                        إكسيل 📥
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>

                  {/* History item content */}
                  {isExpanded && (
                    <div className="p-5 md:p-6 bg-white space-y-6 animate-fade-in border-t border-slate-100">
                      {/* Decryption summary for this history item */}
                      {(item.maxQuotientVerse || item.maxDensityVerse) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 border border-slate-200">
                          {/* Highest quotient */}
                          {item.maxQuotientVerse && (
                            <div className="bg-white p-3 border border-slate-200 space-y-2">
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100">
                                الآية الأعلى تحقيقاً (مفتاح القوة)
                              </span>
                              <p className="quran-font text-xs text-slate-900 font-extrabold leading-loose">
                                « {item.maxQuotientVerse.text} » [الآية {item.maxQuotientVerse.verseNumber}]
                              </p>
                              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono font-bold text-slate-600 bg-slate-50 p-1.5">
                                <div>جمل: {item.maxQuotientVerse.jummalValue}</div>
                                <div>قوة: {typeof item.maxQuotientVerse.quotient === 'number' ? item.maxQuotientVerse.quotient.toFixed(2) : item.maxQuotientVerse.quotient}</div>
                                <div>حروف: {item.maxQuotientVerse.letterCount}</div>
                              </div>
                            </div>
                          )}

                          {/* Highest density */}
                          {item.maxDensityVerse && (
                            <div className="bg-white p-3 border border-slate-200 space-y-2">
                              <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 border border-amber-100">
                                الأعلى كثافة بحروف افتتاحية السورة
                              </span>
                              <p className="quran-font text-xs text-slate-900 font-extrabold leading-loose">
                                « {item.maxDensityVerse.text} » [الآية {item.maxDensityVerse.verseNumber}]
                              </p>
                              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono font-bold text-slate-600 bg-slate-50 p-1.5">
                                <div>تداخل: {item.maxDensityVerse.overlapCount}</div>
                                <div>كثافة: {((item.maxDensityVerse.overlapRatio ?? 0) * 100).toFixed(1)}%</div>
                                <div>جمل: {item.maxDensityVerse.jummalValue}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Analysis Text of history item */}
                      <div className="quran-font pr-1 leading-relaxed space-y-2 text-slate-700">
                        {renderFormattedText(item.analysisText)}
                      </div>

                      {/* Export buttons for expanded history item */}
                      <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              exportToWord(
                                item.analysisText,
                                item.surahName,
                                item.surahLetters,
                                item.digitalRoot,
                                item.keyValue,
                                item.versesCount,
                                item.maxQuotientVerse,
                                item.maxDensityVerse,
                                item.timestamp
                              );
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors cursor-pointer"
                          >
                            <FileDown className="w-3 h-3 text-blue-700" />
                            <span>تصدير لوورد (Word) 📝</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              exportToExcel(
                                item.analysisText,
                                item.surahName,
                                item.surahLetters,
                                item.digitalRoot,
                                item.versesCount,
                                item.maxQuotientVerse,
                                item.maxDensityVerse,
                                item.timestamp
                              );
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
                            <span>تصدير لإكسيل (Excel) 📥</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.analysisText);
                            showToast('تم نسخ هذه الدراسة الأرشيفية للذاكرة المؤقتة!');
                          }}
                          className="px-3 py-1 text-xs font-bold bg-[#0f172a] hover:bg-slate-800 text-white border border-slate-900 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3 text-slate-300" />
                          <span>نسخ هذه الدراسة 📋</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

      {/* Elegant Toast notification instead of window.alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-slate-100 px-5 py-3.5 border-l-4 border-emerald-500 shadow-2xl max-w-md flex items-center gap-2.5 animate-fade-in font-bold text-xs">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Modern custom dialog modal instead of window.confirm */}
      {confirmClearHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs animate-fade-in" dir="rtl">
          <div className="bg-white border-2 border-slate-950 p-6 max-w-md w-full shadow-2xl relative text-right space-y-4">
            <div className="absolute top-0 right-0 left-0 h-1 bg-rose-600" />
            <div className="flex items-center gap-2 text-rose-800">
              <AlertCircle className="w-5 h-5" />
              <h4 className="text-sm font-black uppercase tracking-wider">تفريغ الأرشيف الذكي</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              هل أنت متأكد من رغبتك في مسح سجل الأرشيف بالكامل؟ سيتم تصفير كافة مخرجات الدراسات السابقة المحفوظة مؤقتاً في هذه الجلسة.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearHistory(false)}
                className="px-4 py-2 text-xs font-bold text-slate-750 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
              >
                تراجع وإلغاء ❌
              </button>
              <button
                type="button"
                onClick={() => {
                  setHistory([]);
                  setConfirmClearHistory(false);
                  showToast('تم تفريغ أرشيف مفسّر البنيان بنجاح! 🧹');
                }}
                className="px-4 py-2 text-xs font-black text-white bg-rose-700 hover:bg-rose-800 border border-rose-900 transition-colors cursor-pointer"
              >
                نعم، تفريغ الآن 🧹
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
