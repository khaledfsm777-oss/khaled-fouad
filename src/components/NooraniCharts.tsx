import React, { useState, useMemo } from 'react';
import { Verse } from '../types';
import { reduceDigitalRoot, NooraniSurah } from '../utils/jummal';
import { TrendingUp, BarChart2, Activity, Info } from 'lucide-react';

interface NooraniChartsProps {
  verses: Verse[];
  activeSurah: NooraniSurah | null;
  previewChartInOutput: boolean;
  setPreviewChartInOutput: (val: boolean) => void;
}

export default function NooraniCharts({ 
  verses, 
  activeSurah, 
  previewChartInOutput, 
  setPreviewChartInOutput 
}: NooraniChartsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Convert digital root summing helper
  const getCleanArabicName = (name: string) => {
    return name.replace(/\s*\([^)]*\)/g, '').trim();
  };

  // Export Wave coordinate data to Excel (CSV with UTF-8 BOM)
  const handleExportWaveExcel = () => {
    if (points.length === 0) return;

    const BOM = '\uFEFF';
    const cleanSurahName = getCleanArabicName(activeSurah.name);
    
    // CSV Metas at the top so the Excel file identifies the selected Surah
    const metaHeader = [
      `"تقرير البنيان البياني والموجي لآيات سورة: ${cleanSurahName}"`,
      `"المفتاح النوراني: ${activeSurah.letters}"`,
      `"قيمة المفتاح بعد الاختزال: ${activeSurah.digitalRoot} (الأصل: ${activeSurah.keyValue})"`,
      `"متوسط ثقل الجمل للسورة: ${avgGematria.toFixed(2)}"`
    ].join(',');
    
    const headers = [
      'م',
      'رقم الآية',
      'حساب الجُمّل (Y)',
      'الإحداثي الأفقي (X_px)',
      'الإحداثي الرأسي (Y_px)',
      'الانحراف عن المتوسط الموجي',
      'حالة التوافق مع ثابت السورة بعد الاختزال'
    ];

    const rows = points.map((p, idx) => {
      const deviation = p.verse.jummalValue - avgGematria;
      const isCompatible = p.verse.jummalValue % activeSurah.digitalRoot === 0;
      const statusText = isCompatible ? 'متوافق تموجياً' : 'موجة اعتيادية';

      return [
        idx + 1,
        p.verse.verseNumber,
        p.verse.jummalValue,
        p.x.toFixed(2),
        p.y.toFixed(2),
        deviation.toFixed(2),
        statusText
      ];
    });

    const csvContent = BOM + [metaHeader, '', headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `إحداثيات_موجة_سورة_${cleanSurahName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Wave drawing + coordinate tables to Word (.doc)
  const handleExportWaveWord = () => {
    if (points.length === 0) return;

    const BOM = '\uFEFF';
    const cleanSurahName = getCleanArabicName(activeSurah.name);

    // Prepare Word HTML structure with stylesheet for styling
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"><title>تصدير موجات سورة ${cleanSurahName}</title>`;
    html += `<style>`;
    html += `body { font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; text-align: right; margin: 30px; }`;
    html += `h2 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }`;
    html += `table { width: 100%; border-collapse: collapse; margin-top: 20px; direction: rtl; }`;
    html += `th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; }`;
    html += `th { background-color: #f1f5f9; color: #1e293b; font-weight: bold; }`;
    html += `.avg-line { color: #4f46e5; font-weight: bold; }`;
    html += `.compatible { color: #10b981; font-weight: bold; }`;
    html += `svg { border: 1px dashed #cbd5e1; display: block; margin: 25px auto; }`;
    html += `</style></head><body>`;

    html += `<h2>📊 تقرير المخطط الموجي والهندسي لسورة: ${cleanSurahName}</h2>`;
    html += `<p>تم تصدير هذا المخطط الموجي الرقمي من <strong>«برنامج البنيان للقرآن الكريم»</strong> للدراسات العددية والاستقصائية الإعجازية.</p>`;

    // Add Wave description
    html += `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0;">`;
    html += `<h3 style="margin-top:0; color:#1e293b;">📋 مشخصات ومقاييس الموجة:</h3>`;
    html += `• المفتاح النوراني للسورة بعد الاختزال: <strong>${activeSurah.letters}</strong> (قيمة الاختزال: <strong>${activeSurah.digitalRoot}</strong> | القيمة الأصلية: <strong>${activeSurah.keyValue}</strong>)<br>`;
    html += `• عدد آيات السورة: <strong>${verses.length}</strong> آية<br>`;
    html += `• متوسط ثقل الجمل الكبير: <strong>${avgGematria.toFixed(2)}</strong> وحدة موجية<br>`;
    html += `• الحد الأقصى للجمل المسجل: <strong>${maxJummalValue}</strong>`;
    html += `</div>`;

    // Embed the SVG Vector Graph directly
    html += `<h3>📈 المخطط الموجي الهندسي (منحنى تذبذب قيم الآيات):</h3>`;
    html += `<svg width="600" height="210" viewBox="0 0 ${width} ${height}" style="border: 1px solid #cbd5e1; background: #ffffff;">`;
    
    // Background Average Gematria line
    html += `<line x1="${padding}" y1="${avgY}" x2="${width - padding}" y2="${avgY}" stroke="#4f46e5" stroke-dasharray="8 4" stroke-width="2" />`;
    // The Wave curve area
    html += `<path d="${areaPathData}" fill="#4f46e5" fill-opacity="0.15" />`;
    // The Main Wave stroke
    html += `<path d="${pathData}" fill="none" stroke="#4f46e5" stroke-width="3" />`;
    
    // Render the grid lines and axes lines
    html += `<line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#1e293b" stroke-width="2" />`;
    html += `<line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#1e293b" stroke-width="2" />`;

    // Add dots for each coordinate point
    points.forEach((p) => {
      const isComp = p.verse.jummalValue % activeSurah.digitalRoot === 0;
      html += `<circle cx="${p.x}" cy="${p.y}" r="${isComp ? '5' : '3'}" fill="${isComp ? '#10b981' : '#1e1b4b'}" />`;
    });
    
    html += `</svg>`;
    html += `<p style="text-align: center; font-size: 11px; color: #64748b; margin-top: -15px;">* الخط المتقطع الأزرق يمثل متوسط الوزن الرقمي للسورة (${avgGematria.toFixed(0)}) | النقاط البيانية الخضراء تمثل قممة التناغم النوراني.</p>`;

    // Add Coordinates Table
    html += `<h3>📍 جدول النقاط الإحداثية للموجة البيانية:</h3>`;
    html += `<table>`;
    html += `<thead><tr><th>م</th><th>رقم الآية</th><th>حساب الجمل (Y)</th><th>الإحداثي الأفقي (X_px)</th><th>الإحداثي الرأسي (Y_px)</th><th>حالة التوافق النوراني بعد الاختزال</th></tr></thead><tbody>`;
    
    points.forEach((p, idx) => {
      const isComp = p.verse.jummalValue % activeSurah.digitalRoot === 0;
      html += `<tr>`;
      html += `<td>${idx + 1}</td>`;
      html += `<td style="font-weight: bold;">( ${p.verse.verseNumber} )</td>`;
      html += `<td style="font-weight: bold;">${p.verse.jummalValue}</td>`;
      html += `<td>${p.x.toFixed(2)}</td>`;
      html += `<td>${p.y.toFixed(2)}</td>`;
      html += `<td class="${isComp ? 'compatible' : ''}">${isComp ? '✓ متطابق تموجياً' : 'موجة اعتيادية'}</td>`;
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    html += `<p style="margin-top: 300px; font-size:11px; text-align:center; color:#94a3b8;">«برنامج البنيان للقرآن الكريم» • تم التصدير بنجاح</p>`;
    html += `</body></html>`;

    const blob = new Blob([BOM + html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تقرير_موجة_سورة_${cleanSurahName}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Wave Chart SVG directly as high-resolution PNG image
  const handleExportChartPNG = () => {
    if (points.length === 0 || !activeSurah) return;
    const cleanSurahName = getCleanArabicName(activeSurah.name);

    const svgElement = document.querySelector('.wave-chart-svg') as SVGSVGElement | null;
    if (!svgElement) {
      alert('لم يتم العثور على عنصر الرسم البياني للتصدير.');
      return;
    }

    try {
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('width', '1000');
      clonedSvg.setAttribute('height', '380');

      // Add a solid white background rect to avoid transparent PNG issues
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', '100%');
      bgRect.setAttribute('height', '100%');
      bgRect.setAttribute('fill', '#ffffff');
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

      // Header title on the image
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
        const scale = 2; // High DPI output
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
      console.error('Error exporting chart PNG:', err);
    }
  };

  // If no verses loaded or no active surah chosen, show a clear warning
  if (verses.length === 0 || !activeSurah) {
    return (
      <div className="bg-white border-2 border-slate-200 p-8 text-center text-slate-500 text-xs text-right space-y-3" dir="rtl">
        <p className="font-black text-slate-700">لا يوجد بيانات نشطة لعرض المنحنيات والموجات!</p>
        <p className="font-semibold text-slate-400">
          الرجاء التوجّه إلى شاشة <span className="text-slate-800 font-extrabold">المدخلات والمخرجات</span> واختيار سورة من القائمة المنسدلة لمعالجة آياتها واستخلاص موجاتها العددية والبيانية.
        </p>
      </div>
    );
  }

  // Wave Chart Dimensions & Scaling Math
  const width = 800;
  const height = 280;
  const padding = 40;

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

  // Construct SVG Path Definition string
  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Curve smoothing calculation simple bezier
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

  // Construct SVG Fill/Gradient Path
  const areaPathData = useMemo(() => {
    if (points.length === 0) return '';
    const start = `M ${points[0].x} ${height - padding}`;
    const rest = pathData.substring(1); // skip M of pathData
    const end = ` L ${points[points.length - 1].x} ${height - padding} Z`;
    return `${start} L ${points[0].x} ${points[0].y} ${rest} ${end}`;
  }, [points, pathData]);

  // Digital Roots 1-9 count
  const digitalRootDistribution = useMemo(() => {
    const counts: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 };
    verses.forEach(v => {
      const root = reduceDigitalRoot(v.jummalValue);
      if (root >= 1 && root <= 9) {
        counts[root] = (counts[root] || 0) + 1;
      }
    });
    return counts;
  }, [verses]);

  const maxRootCount = useMemo(() => {
    const counts = Object.values(digitalRootDistribution) as number[];
    return Math.max(...counts, 1);
  }, [digitalRootDistribution]);

  // Average line calculation
  const totalGematria = verses.reduce((sum, v) => sum + v.jummalValue, 0);
  const avgGematria = totalGematria / verses.length;
  const avgY = height - padding - (avgGematria / maxJummalValue) * (height - padding * 2);

  return (
    <div className="bg-white border-2 border-slate-250 p-6 md:p-8 space-y-8 text-right relative" dir="rtl">
      {/* Premium indigo color accent bar */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-indigo-600" />

      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 justify-start">
            <Activity className="w-5 h-5 text-indigo-600" />
            منصة موازنة الأنماط والموجات العددية للنص القرآني 📊
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            تخطيط هندسي يعتمد على إحداثيات الآيات واستباط دبدبات وزنيّة لحساب الجُمّل الكبير.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPreviewChartInOutput(!previewChartInOutput)}
            className={`px-3 py-1.5 font-black text-[11px] rounded-none transition-all cursor-pointer border ${
              previewChartInOutput 
                ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-450'
            }`}
          >
            {previewChartInOutput ? '✓ معاينة الرسم نشطة بالمخرجات' : '👁 معاينة الرسم في شاشة المخرجات'}
          </button>
          <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 font-bold text-indigo-800 text-xs">
            ثابت السورة بعد الاختزال: {activeSurah.letters} ({activeSurah.digitalRoot})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* WAVE CARD (The main Gematria Wave Chart) */}
        <div className="lg:col-span-8 bg-slate-50 border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600 animate-pulse" />
              المخطط الموجي المتكامل لثقل الجمل (تذبذب قيم الآيات):
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportChartPNG}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-none transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              >
                🖼 تصدير المخطط البياني كصورة (PNG)
              </button>
              <span className="text-[10px] text-slate-400 font-bold font-mono">X: الآية | Y: جمل الآية</span>
            </div>
          </div>

          {/* SVG Vector Drawing of Gematria Wave */}
          <div className="relative border border-slate-200 bg-white p-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="wave-chart-svg w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="waveStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#312e81" />
                  <stop offset="50%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Average Line */}
              <line 
                x1={padding} 
                y1={avgY} 
                x2={width - padding} 
                y2={avgY} 
                stroke="#64748b" 
                strokeDasharray="4 4" 
                strokeWidth="1" 
                title="متوسط حساب الجمل"
              />

              {/* Wave Area Fill */}
              <path d={areaPathData} fill="url(#waveGrad)" />

              {/* Wave Line Stroke */}
              <path d={pathData} fill="none" stroke="url(#waveStroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* X and Y Labels */}
              <text x={padding - 10} y={padding + 5} textAnchor="end" className="fill-slate-400 text-[10px] font-sans font-medium">{maxJummalValue}</text>
              <text x={padding - 10} y={avgY + 3} textAnchor="end" className="fill-slate-500 text-[9px] font-sans font-bold">المتوسط: {Math.round(avgGematria)}</text>
              <text x={padding - 10} y={height - padding + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-sans font-medium">0</text>

              {/* Draw interactive points for each verse */}
              {points.map((p, idx) => {
                const isHovered = hoveredIndex === idx;
                const isCompatible = p.verse.jummalValue % activeSurah.digitalRoot === 0;

                return (
                  <g key={idx}>
                    {/* Invisible larger hover zone */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="10" 
                      fill="transparent" 
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                    {/* Visual dot */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={isHovered ? "6" : "3.5"} 
                      fill={isCompatible ? "#10b981" : "#4f46e5"} 
                      stroke="#ffffff"
                      strokeWidth={isHovered ? "2" : "1"}
                      className="transition-all cursor-pointer"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Custom Tooltip shown beneath or on hover */}
            <div className="min-h-12 bg-slate-900 text-white p-3.5 mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {hoveredIndex !== null ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold font-sans">
                      آية ({points[hoveredIndex].verse.verseNumber})
                    </span>
                    <span className="quran-font font-semibold text-slate-200">
                      "{points[hoveredIndex].verse.text.slice(0, 45)}..."
                    </span>
                  </div>
                  <div className="flex gap-4 font-mono font-medium text-amber-300">
                    <span>الجُمّل: {points[hoveredIndex].verse.jummalValue}</span>
                    <span>الكلمات: {points[hoveredIndex].verse.wordCount}</span>
                    <span>الحروف: {points[hoveredIndex].verse.letterCount}</span>
                    <span className={points[hoveredIndex].verse.jummalValue % activeSurah.digitalRoot === 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {points[hoveredIndex].verse.jummalValue % activeSurah.digitalRoot === 0 ? '✅ متوافقة' : 'غير متوافقة'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-center w-full select-none flex items-center justify-center gap-1">
                  <span>💡 مرر مؤشر الماوس فوق النقاط الملونة على المخطط الموجي لمعاينة بيانات الآيات إحصائياً.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DIGITAL ROOTS CHART CARD (1-9 distribution) */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 p-5 space-y-4">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              ميزان الاختزال الرقمي المجموعي (من 1 إلى 9):
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-1">توزيع تكرار قيم الآيات بعد اختزال الجُمّل إلى خانة فردية.</p>
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const count = digitalRootDistribution[num] || 0;
              const percentage = verses.length > 0 ? (count / verses.length) * 100 : 0;
              const isMatchWithActiveSurahRoot = num === activeSurah.digitalRoot;

              return (
                <div key={num} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-sans">
                    <span className="flex items-center gap-1">
                      <strong className="text-slate-800">قيمة الاختزال ({num}):</strong>
                      {isMatchWithActiveSurahRoot && (
                        <span className="px-1 py-0.5 bg-indigo-100 text-indigo-900 text-[8px] font-semibold">تطابق المفتاح النوراني</span>
                      )}
                    </span>
                    <span className="font-mono text-slate-500 font-black">{count} {count === 1 ? 'آية' : 'آيات'} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-none overflow-hidden relative">
                    <div 
                      className={`h-full rounded-none transition-all ${isMatchWithActiveSurahRoot ? 'bg-indigo-600' : 'bg-slate-700'}`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Mathematical Points and Coordinates Table for Al-Bunyan */}
      <div className="bg-slate-50 border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1">
            📍 النقاط والإحصاء الإحداثي الدقيق لتصميم الموجات العدديّة:
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold ml-2">
              العقد النشطة: {points.length}
            </span>
            <button
              onClick={handleExportChartPNG}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-none transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            >
              🖼 تصدير المخطط البياني (PNG)
            </button>
            <button
              onClick={handleExportWaveExcel}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:border-slate-500 text-slate-800 hover:text-slate-950 font-black text-[10px] rounded-none transition-all cursor-pointer flex items-center gap-1"
            >
              📥 تصدير الرسمة لإكسيل (Excel)
            </button>
            <button
              onClick={handleExportWaveWord}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:border-slate-500 text-slate-800 hover:text-slate-950 font-black text-[10px] rounded-none transition-all cursor-pointer flex items-center gap-1"
            >
              📝 تصدير الرسمة لوورد (Word)
            </button>
          </div>
        </div>
        <div className="table-container overflow-y-auto max-h-[220px] border border-slate-200 bg-white">
          <table className="w-full text-right border-collapse text-xs min-w-[750px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-center select-none">
                <th className="p-2.5 border-l border-slate-200 number-column text-center">م</th>
                <th className="p-2.5 text-center number-column">رقم الآية</th>
                <th className="p-2.5 text-center">حساب الجُمّل (Y)</th>
                <th className="p-2.5 text-center">الإحداثي الأفقي (X)</th>
                <th className="p-2.5 text-center">الإحداثي الرأسي (Y)</th>
                <th className="p-2.5 text-center bg-indigo-50 text-indigo-950">التوافق مع ثابت السورة بعد الاختزال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-center">
              {points.map((p, idx) => {
                const isCompatible = p.verse.jummalValue % activeSurah.digitalRoot === 0;
                return (
                  <tr key={idx} className="hover:bg-indigo-50/10 transition-colors">
                    <td className="p-2 border-l border-slate-200 text-slate-450 font-normal text-center number-column">{idx + 1}</td>
                    <td className="p-2 font-bold text-slate-800 text-center font-sans number-column">
                      <span className="px-2 py-0.5 bg-slate-900 text-white font-extrabold text-[10px]">
                        {p.verse.verseNumber}
                      </span>
                    </td>
                    <td className="p-2 font-black text-slate-950 font-sans">{p.verse.jummalValue}</td>
                    <td className="p-2 text-indigo-600 font-bold">{p.x.toFixed(2)} px</td>
                    <td className="p-2 text-indigo-600 font-bold">{p.y.toFixed(2)} px</td>
                    <td className="p-2 text-center">
                      {isCompatible ? (
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-sans font-bold text-[9px]">
                          ✓ متطابق تموجياً
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-400 font-sans text-[9px]">
                          موجة اعتيادية
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Numerical statistics and coordinates summary */}
      <div className="bg-slate-50 p-5 border border-slate-200 text-xs leading-relaxed space-y-3">
        <h5 className="font-bold text-slate-800 flex items-center gap-1">
          <Info className="w-4 h-4 text-slate-600" />
          تفسير النماذج والموجات البيانية القرآنية المستخلصة:
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600 font-medium">
          <ul className="list-inside space-y-1.5 list-disc">
            <li><strong>تذبذب الموجة الحرفية:</strong> يوضح المخطط انسياب وتدريج "كتلة الجمل" من بداية تلاوة السورة المباركة ونهايتها، وهو ما يشكل نموذج موجي دلالي يكرر نفسه في موازين أخرى.</li>
            <li><strong>الاختزال الأبجدي:</strong> يعتمد منهج البنيان وحساب الجمل الكبير على تصفية كل آية للوصول لجذرها الزهيد (مجموع القيمة مكرراً لخانة واحدة) والذي يساعد على مراجعة التوزيع الإحصائي.</li>
          </ul>
          <ul className="list-inside space-y-1.5 list-disc">
            <li><strong>مؤشر المطابقة والتطابق ({activeSurah.letters}):</strong> الآيات التي تضاء باللون الأخضر على المخطط هي آيات متوافقة كلياً (Gematria divisible by {activeSurah.digitalRoot}) وتعتبر قمم تناغم الأجسام النورانية مع المفتاح بعد الاختزال.</li>
            <li><strong>الإنتاجية البيانية:</strong> بناء هذه النماذج الموجية يمثل أصل البنية الهندسية الكونية للنص القرآني لتثبيتها وعرضها أو طباعتها للدراسات الاستقصائية الدقيقة.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
