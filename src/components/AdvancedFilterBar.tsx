import React, { useState } from 'react';
import { 
  Search, Filter, X, RotateCcw, Hash, Sparkles, SlidersHorizontal, 
  Check, Sliders, Crown, Award, BookOpen, Layers
} from 'lucide-react';
import { NooraniSurah } from '../utils/jummal';

export interface AdvancedFilterState {
  textQuery: string;
  verseNumber: string;
  numericalTarget: 'jummal' | 'words' | 'letters' | 'verseNumber' | 'sum';
  selectedDigitalRoot: number | null; // Single-digit fingerprint 1..9
  reducedJummal: number | null;
  reducedWords: number | null;
  reducedLetters: number | null;
  reducedSum: number | null;
  reducedQuotient: number | null;
  mizanColor: 'all' | 'golden' | 'exact' | 'structural' | 'not_compatible' | 'tawheed' | 'triple_match';
  compactOnly: boolean;
  tripleMatchOnly: boolean;
  verseFingerprintOnly: boolean;
  quranFingerprintOnly: boolean;
  asma99Only: boolean;
  age63Only: boolean;
  alphabet28Only: boolean; // 28 - حروف الهجاء والثوابت
  tanzeel23Only: boolean;
  nooraniSurahs29Only: boolean; // 29 - عدد السور النورانية
  nooraniLetters14Only: boolean; // 14 - عدد الحروف النورانية الفريدة
  surahMatchOnly: boolean;
  nooraniRankOnly: boolean;
  perfectMatchOnly?: boolean; // التوافق التام 5/6 إلى 6/6
  unregisteredOnly?: boolean; // توافقات غير مسجلة مسبقاً
  withNotesOnly?: boolean;    // آيات مدوّن بها ملاحظات الباحث
}

export const initialFilterState: AdvancedFilterState = {
  textQuery: '',
  verseNumber: '',
  numericalTarget: 'jummal',
  selectedDigitalRoot: null,
  reducedJummal: null,
  reducedWords: null,
  reducedLetters: null,
  reducedSum: null,
  reducedQuotient: null,
  mizanColor: 'all',
  compactOnly: false,
  tripleMatchOnly: false,
  verseFingerprintOnly: false,
  quranFingerprintOnly: false,
  asma99Only: false,
  age63Only: false,
  alphabet28Only: false,
  tanzeel23Only: false,
  nooraniSurahs29Only: false,
  nooraniLetters14Only: false,
  surahMatchOnly: false,
  nooraniRankOnly: false,
  perfectMatchOnly: false,
  unregisteredOnly: false,
  withNotesOnly: false
};

export interface FilterCounts {
  all: number;
  verified_exact: number;
  golden: number;
  exact: number;
  structural: number;
  not_compatible: number;
  tawheed: number;
  triple_match: number;
  verse_fingerprint: number;
  quran_fingerprint: number;
  asma_99: number;
  age_63: number;
  alphabet_28: number;
  tanzeel_23: number;
  noorani_surahs_29?: number;
  noorani_letters_14?: number;
  surah_match: number;
  noorani_rank: number;
  perfect_matches?: number;
  unregistered_matches?: number;
  researcher_notes?: number;
}

interface AdvancedFilterBarProps {
  filters: AdvancedFilterState;
  onFilterChange: (newFilters: AdvancedFilterState) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  isNoorani?: boolean;
  surahName?: string;
  surahCoeff?: number;
  activeSurah?: NooraniSurah | null;
  filterCounts?: FilterCounts;
}

const REDUCED_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function AdvancedFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  isNoorani = true,
  surahName,
  surahCoeff = 1,
  activeSurah = null,
  filterCounts
}: AdvancedFilterBarProps) {
  const [showReducedDetails, setShowReducedDetails] = useState(false);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.textQuery.trim()) count++;
    if (filters.verseNumber.trim()) count++;
    if (filters.selectedDigitalRoot !== null) count++;
    if (filters.reducedJummal !== null) count++;
    if (filters.reducedWords !== null) count++;
    if (filters.reducedLetters !== null) count++;
    if (filters.reducedSum !== null) count++;
    if (filters.reducedQuotient !== null) count++;
    if (filters.mizanColor !== 'all') count++;
    if (filters.compactOnly) count++;
    if (filters.tripleMatchOnly) count++;
    if (filters.verseFingerprintOnly) count++;
    if (filters.quranFingerprintOnly) count++;
    if (filters.asma99Only) count++;
    if (filters.age63Only) count++;
    if (filters.alphabet28Only) count++;
    if (filters.tanzeel23Only) count++;
    if (filters.nooraniSurahs29Only) count++;
    if (filters.nooraniLetters14Only) count++;
    if (filters.surahMatchOnly) count++;
    if (filters.nooraniRankOnly) count++;
    return count;
  }, [filters]);

  const handleNumberToggle = (field: 'reducedJummal' | 'reducedWords' | 'reducedLetters' | 'reducedSum' | 'reducedQuotient', num: number) => {
    const current = filters[field];
    onFilterChange({
      ...filters,
      [field]: current === num ? null : num
    });
  };

  const handleAppendSymbol = (symbol: string) => {
    const current = filters.textQuery.trim();
    let nextQuery = '';
    if (!current) {
      nextQuery = `${symbol} `;
    } else {
      // If already starts with an operator, replace operator or append
      const opMatch = current.match(/^(>=|<=|=>|=<|>|<|=)\s*/);
      if (opMatch) {
        nextQuery = current.replace(/^(>=|<=|=>|=<|>|<|=)\s*/, `${symbol} `);
      } else {
        nextQuery = `${symbol} ${current}`;
      }
    }
    onFilterChange({
      ...filters,
      textQuery: nextQuery
    });
  };

  const handlePresetClick = (presetQuery: string) => {
    onFilterChange({
      ...filters,
      textQuery: presetQuery
    });
  };

  return (
    <div className="bg-white border-2 border-slate-300 rounded-none shadow-sm space-y-4 p-4 sm:p-5" dir="rtl">
      {/* 1. Master Header & High-Visibility Stats Counter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 text-white p-3.5 sm:p-4 rounded-none">
        <div className="flex flex-wrap items-center gap-2.5">
          <SlidersHorizontal className="w-5 h-5 text-amber-400 shrink-0" />
          <h3 className="text-sm sm:text-base font-black text-white">
            مـنـظـومـة الـبـحـث والـتـحـلـيـل الـبـنـيـانـي الـمـوحّـد
          </h3>
          {activeFiltersCount > 0 && (
            <span className="bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-black">
              {activeFiltersCount} فلاتر نشطة
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Main Primary Verse Count Statistic */}
          <div className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-none text-xs font-bold flex items-center gap-2">
            <span className="text-slate-300">إجمالي الآيات المطابقة:</span>
            <strong className="text-amber-400 font-black text-sm sm:text-base">{filteredCount}</strong>
            <span className="text-slate-400 text-[11px]">من أصل {totalCount} آية</span>
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-none flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تفريغ المدخلات ✕</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Unified Search Box, Math Comparison Operators & Target Criteria */}
      <div className="bg-slate-50 border border-slate-200 p-5 space-y-4">
        {/* Search Inputs Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {/* Unified Search Input (Text / Math Formula / Numbers) */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-sm md:text-base font-black text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Search className="w-4 h-4 text-slate-800" />
                <span>صندوق البحث الموحد (نص قرآني، رقم، أو صيغة رياضية):</span>
              </span>
              <span className="text-xs text-slate-600 font-semibold">
                يدعم: نص، رقم، = 114، &gt;= 500، &lt;= 19
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.textQuery}
                onChange={(e) => onFilterChange({ ...filters, textQuery: e.target.value })}
                placeholder="اكتب كلمة، رقماً، أو تعبيراً (مثال: كتب عليكم، >= 313، = 114، 10-20)..."
                className="w-full bg-white border-2 border-slate-300 focus:border-slate-900 rounded-none px-4 py-3 text-sm sm:text-base md:text-lg text-slate-900 outline-none font-bold pl-10 shadow-inner"
              />
              {filters.textQuery && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, textQuery: '' })}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Exact Verse Number / Range Search */}
          <div className="space-y-1.5">
            <label className="text-sm md:text-base font-black text-slate-900 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-slate-800" />
              <span>رقم الآية (قيمة مباشرة أو نطاق):</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.verseNumber}
                onChange={(e) => onFilterChange({ ...filters, verseNumber: e.target.value })}
                placeholder="مثال: 255 أو 10-20 أو 1,5,7"
                className="w-full bg-white border-2 border-slate-300 focus:border-slate-900 rounded-none px-3.5 py-3 text-sm sm:text-base text-slate-900 outline-none font-bold text-center font-mono pl-10 shadow-inner"
              />
              {filters.verseNumber && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, verseNumber: '' })}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Math Operators, Target Criterion, and Quick Presets */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 pt-2.5 border-t border-slate-200">
          {/* Math Comparison Operators (Large & Clear Buttons) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-slate-900">رموز المقارنة الرياضية:</span>
            <div className="flex items-center gap-1.5">
              {['=', '>', '<', '>=', '<='].map(sym => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleAppendSymbol(sym)}
                  className="min-w-[48px] min-h-[42px] text-base font-black px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-900 hover:text-white border-2 border-slate-300 hover:border-slate-900 rounded-none shadow-sm transition-all font-mono cursor-pointer flex items-center justify-center"
                  title={`إدراج معامل المقارنة ${sym}`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Target Testing Criteria */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-black text-slate-900">المعيار المستهدف للاختبار:</span>
            {(['jummal', 'words', 'letters', 'verseNumber', 'sum'] as const).map(target => {
              const label = target === 'jummal' ? 'حساب الجمل' : target === 'words' ? 'الكلمات' : target === 'letters' ? 'الحروف' : target === 'verseNumber' ? 'رقم الآية' : 'المجموع الكلي';
              const isSelected = filters.numericalTarget === target;
              return (
                <button
                  key={target}
                  type="button"
                  onClick={() => onFilterChange({ ...filters, numericalTarget: target })}
                  className={`px-3 py-2 text-xs md:text-sm font-black transition-all rounded-none cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-600 font-bold">اختصارات:</span>
            {activeSurah && (
              <button
                type="button"
                onClick={() => handlePresetClick(`= ${activeSurah.keyValue}`)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-600 text-xs font-bold text-slate-800 rounded-none"
              >
                المعامل {activeSurah.keyValue}
              </button>
            )}
            <button
              type="button"
              onClick={() => handlePresetClick('>= 313')}
              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-600 text-xs font-bold text-slate-800 rounded-none"
            >
              بنيان الرسل (313)
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick('<= 19')}
              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-600 text-xs font-bold text-slate-800 rounded-none"
            >
              أحرف قصيرة (19)
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick('>= 500')}
              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-600 text-xs font-bold text-slate-800 rounded-none"
            >
              آيات طويلة (&ge;500)
            </button>
          </div>
        </div>
      </div>

      {/* 3. Essential Tools Bar: Single-Digit Fingerprints (1..9), Mizan Classifications & Noorani Elite */}
      <div className="space-y-4 bg-white border border-slate-200 p-4">
        {/* Single-Digit Fingerprint Strip (1 to 9) with distinctive color coding */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shrink-0 shadow-xs"></span>
              <span>أزرار البصمة الأحادية للناتج (1 إلى 9) بألوانها المعتمدة:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {REDUCED_NUMBERS.map(num => {
                const isSelected = filters.selectedDigitalRoot === num;
                // Specific distinctive colors for each fingerprint digit 1..9
                let colorClass = '';
                switch (num) {
                  case 1:
                    colorClass = isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400 scale-105'
                      : 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100';
                    break;
                  case 2:
                    colorClass = isSelected
                      ? 'bg-teal-600 text-white border-teal-700 ring-2 ring-teal-400 scale-105'
                      : 'bg-teal-50 text-teal-950 border-teal-300 hover:bg-teal-100';
                    break;
                  case 3:
                    colorClass = isSelected
                      ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400 scale-105'
                      : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100';
                    break;
                  case 4:
                    colorClass = isSelected
                      ? 'bg-sky-600 text-white border-sky-700 ring-2 ring-sky-400 scale-105'
                      : 'bg-sky-50 text-sky-950 border-sky-300 hover:bg-sky-100';
                    break;
                  case 5:
                    colorClass = isSelected
                      ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-400 scale-105'
                      : 'bg-purple-50 text-purple-950 border-purple-300 hover:bg-purple-100';
                    break;
                  case 6:
                    colorClass = isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400 scale-105'
                      : 'bg-indigo-50 text-indigo-950 border-indigo-300 hover:bg-indigo-100';
                    break;
                  case 7:
                    colorClass = isSelected
                      ? 'bg-cyan-600 text-white border-cyan-700 ring-2 ring-cyan-400 scale-105'
                      : 'bg-cyan-50 text-cyan-950 border-cyan-300 hover:bg-cyan-100';
                    break;
                  case 8:
                    colorClass = isSelected
                      ? 'bg-emerald-800 text-white border-emerald-900 ring-2 ring-emerald-500 scale-105'
                      : 'bg-emerald-100/90 text-emerald-950 border-emerald-400 hover:bg-emerald-200';
                    break;
                  case 9:
                    colorClass = isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-600 ring-2 ring-amber-400 font-black scale-105'
                      : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-950 border-amber-300 hover:from-amber-200 hover:to-yellow-200 font-black';
                    break;
                  default:
                    colorClass = 'bg-slate-100 text-slate-900 border-slate-300';
                }

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onFilterChange({ ...filters, selectedDigitalRoot: isSelected ? null : num })}
                    className={`w-9 h-9 rounded-none text-sm font-black font-mono transition-all cursor-pointer flex items-center justify-center border shadow-xs ${colorClass}`}
                    title={`فلترة بالبصمة الأحادية = ${num}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            {filters.selectedDigitalRoot !== null && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, selectedDigitalRoot: null })}
                className="text-[11px] text-rose-600 hover:underline font-black mr-1 cursor-pointer"
              >
                إلغاء البصمة ✕
              </button>
            )}
          </div>

          {/* Quick Actions (Compact & Notes & Sub-Strips Toggle) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Compact Matches */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, compactOnly: !filters.compactOnly })}
              className={`px-3 py-1.5 text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 rounded-none ${
                filters.compactOnly
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-300'
                  : 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200'
              }`}
              title="عرض الآيات المحققة للتوافق المدمج"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>التوافقات المدمجة ✨</span>
            </button>

            {/* Researcher Notes Button */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, withNotesOnly: !filters.withNotesOnly })}
              className={`px-3 py-1.5 text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 rounded-none ${
                filters.withNotesOnly
                  ? 'bg-purple-700 text-white border-purple-900 shadow-md ring-2 ring-purple-300'
                  : 'bg-purple-50 text-purple-950 border-purple-300 hover:bg-purple-100'
              }`}
              title="تصفية وععرض الآيات التي تحوي ملاحظات الباحث المخصصة"
            >
              <span className="text-xs">📝</span>
              <span>ملاحظات الباحث</span>
              {filterCounts?.researcher_notes !== undefined && (
                <span className="text-[10px] px-1 bg-purple-900 text-white rounded-xs">
                  {filterCounts.researcher_notes}
                </span>
              )}
            </button>

            {/* Toggle for Reduced 1..9 Sub-Strips */}
            <button
              type="button"
              onClick={() => setShowReducedDetails(!showReducedDetails)}
              className="text-xs font-black text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer whitespace-nowrap bg-white border border-indigo-200 px-2.5 py-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showReducedDetails ? 'إخفاء أشرطة الاختزال ▲' : 'أشرطة اختزال الأرقام ▼'}</span>
            </button>
          </div>
        </div>

        {/* Master Mizan & Noorani Elite Color Classifications (Unified, non-duplicated) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span className="text-base">🎨</span>
              <span>تصنيفات التوافق الميزاني وآيات النخبة النورانية المطلقة (ألوان المنظومة المعتمدة):</span>
            </span>
            {(filters.mizanColor !== 'all' || filters.tripleMatchOnly) && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, mizanColor: 'all', tripleMatchOnly: false })}
                className="text-[11px] text-rose-600 hover:underline font-black cursor-pointer"
              >
                عرض كل التصنيفات ✕
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {/* 1. All */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: 'all', tripleMatchOnly: false })}
              className={`p-2.5 rounded-none border text-center transition-all cursor-pointer ${
                filters.mizanColor === 'all' && !filters.tripleMatchOnly && !filters.compactOnly
                  ? 'bg-slate-900 text-white border-slate-900 font-black shadow-sm ring-2 ring-slate-400'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 font-bold'
              }`}
            >
              <span className="text-xs font-black block">كل الآيات</span>
              <span className="text-[11px] font-mono mt-0.5 block opacity-90">{filterCounts?.all ?? totalCount} آية</span>
            </button>

            {/* 2. Elite Triple Match */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, tripleMatchOnly: !filters.tripleMatchOnly, mizanColor: filters.tripleMatchOnly ? 'all' : 'triple_match' })}
              className={`p-2.5 rounded-none border text-center transition-all cursor-pointer ${
                filters.tripleMatchOnly || filters.mizanColor === 'triple_match'
                  ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 border-amber-700 font-black shadow-md ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-950 border-amber-300 hover:from-amber-100 hover:to-yellow-100 font-black'
              }`}
              title="آيات النخبة النورانية المطلقة المحققة للتوافق الثلاثي المتزامن (Triple Match)"
            >
              <span className="text-xs font-black flex items-center justify-center gap-1">👑 النخبة المطلقة</span>
              <span className="text-[11px] font-mono mt-0.5 block font-black text-slate-950">
                {filterCounts?.triple_match ?? 0} آية
              </span>
            </button>

            {/* 3. Golden / Perfect Match 5-6 */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: filters.mizanColor === 'golden' ? 'all' : 'golden', tripleMatchOnly: false })}
              className={`p-2.5 rounded-none border text-center transition-all cursor-pointer ${
                filters.mizanColor === 'golden'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-600 font-black shadow-md ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100 font-bold'
              }`}
              title="تحقيق 5 من 6 أو 6 من 6 في موازين التوافق أو توافق مباشر"
            >
              <span className="text-xs font-black flex items-center justify-center gap-1">🌟 التوافق التام (5-6)</span>
              <span className="text-[11px] font-mono mt-0.5 block font-black">{filterCounts?.golden ?? 0} آية</span>
            </button>

            {/* 4. Exact Green R=0 */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: filters.mizanColor === 'exact' ? 'all' : 'exact', tripleMatchOnly: false })}
              className={`p-2.5 rounded-none border text-center transition-all cursor-pointer ${
                filters.mizanColor === 'exact'
                  ? 'bg-emerald-600 text-white border-emerald-800 font-black shadow-md ring-2 ring-emerald-300 scale-[1.02]'
                  : 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 font-bold'
              }`}
              title="قسمة الجمل على المعامل بدون باقٍ حصراً (R=0)"
            >
              <span className="text-xs font-black flex items-center justify-center gap-1">🟢 الرياضي الصرف (R=0)</span>
              <span className="text-[11px] font-mono mt-0.5 block font-black">{filterCounts?.exact ?? 0} آية</span>
            </button>

            {/* 5. Structural Blue */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: filters.mizanColor === 'structural' ? 'all' : 'structural', tripleMatchOnly: false })}
              className={`p-2.5 rounded-none border text-center transition-all cursor-pointer ${
                filters.mizanColor === 'structural'
                  ? 'bg-blue-600 text-white border-blue-800 font-black shadow-md ring-2 ring-blue-300 scale-[1.02]'
                  : 'bg-blue-50 text-blue-950 border-blue-300 hover:bg-blue-100 font-bold'
              }`}
              title="انقسام الميزان الهيكلي أو الكثافة على المعامل بلا باقٍ"
            >
              <span className="text-xs font-black flex items-center justify-center gap-1">🔵 الأزرق الهيكلي</span>
              <span className="text-[11px] font-mono mt-0.5 block font-black">{filterCounts?.structural ?? 0} آية</span>
            </button>

            {/* 6. Tawheed Yellow/Indigo */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: filters.mizanColor === 'tawheed' ? 'all' : 'tawheed', tripleMatchOnly: false })}
              className={`p-2.5 rounded-none border text-center transition-all cursor-pointer ${
                filters.mizanColor === 'tawheed'
                  ? 'bg-indigo-700 text-white border-indigo-900 font-black shadow-md ring-2 ring-indigo-300 scale-[1.02]'
                  : 'bg-indigo-50 text-indigo-950 border-indigo-300 hover:bg-indigo-100 font-bold'
              }`}
              title="تحقيق شفرة التوحيد المشترك (11) في الكثافة أو الاختزال الذاتي للرقم (1)"
            >
              <span className="text-xs font-black flex items-center justify-center gap-1">💛 التوحيدي المشع</span>
              <span className="text-[11px] font-mono mt-0.5 block font-black">{filterCounts?.tawheed ?? 0} آية</span>
            </button>

            {/* 7. Not Compatible Pink */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: filters.mizanColor === 'not_compatible' ? 'all' : 'not_compatible', tripleMatchOnly: false })}
              className={`p-2.5 rounded-none border text-center transition-all cursor-pointer ${
                filters.mizanColor === 'not_compatible'
                  ? 'bg-rose-600 text-white border-rose-800 font-black shadow-md ring-2 ring-rose-300 scale-[1.02]'
                  : 'bg-rose-50 text-rose-950 border-rose-200 hover:bg-rose-100 font-bold'
              }`}
              title="آيات ذات كسر بنياني لم تُحقق شروط التوافق الحالية"
            >
              <span className="text-xs font-black flex items-center justify-center gap-1">🔴 كسر بنياني</span>
              <span className="text-[11px] font-mono mt-0.5 block font-black">{filterCounts?.not_compatible ?? 0} آية</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Constants & Special Fingerprints Bar (114, 99, 63, 28, 23, Surah, Noorani Rank) */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>استخراج الآيات حسب الثوابت والبصمات الرقمية (كثافة، معادلة، كلمات، حروف):</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
            * تطابق الكثافة أو المعادلة أو الكلمات أو الحروف مع الأرقام الثابتة
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 text-right">
          {/* 1. Verse Fingerprint */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, verseFingerprintOnly: !filters.verseFingerprintOnly })}
            className={`p-2 rounded-none border text-right transition-all cursor-pointer ${
              filters.verseFingerprintOnly
                ? 'bg-indigo-700 text-white border-indigo-900 shadow-sm font-black ring-2 ring-indigo-300'
                : 'bg-white text-indigo-950 border-slate-300 hover:bg-indigo-50'
            }`}
          >
            <div className="text-xs font-black flex items-center gap-1">🎯 بصمة الآية</div>
            <div className="text-[9px] opacity-80 mt-0.5">رقم الآية ({filterCounts?.verse_fingerprint || 0})</div>
          </button>

          {/* 2. Quran 114 */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, quranFingerprintOnly: !filters.quranFingerprintOnly })}
            className={`p-2 rounded-none border text-right transition-all cursor-pointer ${
              filters.quranFingerprintOnly
                ? 'bg-amber-600 text-white border-amber-800 shadow-sm font-black ring-2 ring-amber-300'
                : 'bg-white text-amber-950 border-slate-300 hover:bg-amber-50'
            }`}
          >
            <div className="text-xs font-black flex items-center gap-1">🌟 القرآن (114)</div>
            <div className="text-[9px] opacity-80 mt-0.5">سور القرآن ({filterCounts?.quran_fingerprint || 0})</div>
          </button>

          {/* 3. Asma Allah 99 */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, asma99Only: !filters.asma99Only })}
            className={`p-2 rounded-none border text-right transition-all cursor-pointer ${
              filters.asma99Only
                ? 'bg-amber-700 text-white border-amber-900 shadow-sm font-black ring-2 ring-amber-300'
                : 'bg-white text-amber-950 border-slate-300 hover:bg-amber-50'
            }`}
          >
            <div className="text-xs font-black flex items-center gap-1">📿 الأسماء (99)</div>
            <div className="text-[9px] opacity-80 mt-0.5">الأسماء الحسنى ({filterCounts?.asma_99 || 0})</div>
          </button>

          {/* 4. Age 63 */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, age63Only: !filters.age63Only })}
            className={`p-2 rounded-none border text-right transition-all cursor-pointer ${
              filters.age63Only
                ? 'bg-teal-700 text-white border-teal-900 shadow-sm font-black ring-2 ring-teal-300'
                : 'bg-white text-teal-950 border-slate-300 hover:bg-teal-50'
            }`}
          >
            <div className="text-xs font-black flex items-center gap-1">🕊️ العمر (63)</div>
            <div className="text-[9px] opacity-80 mt-0.5">العمر الشريف ({filterCounts?.age_63 || 0})</div>
          </button>

          {/* 5. Alphabet 28 (NEW!) */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, alphabet28Only: !filters.alphabet28Only })}
            className={`p-2 rounded-none border text-right transition-all cursor-pointer ${
              filters.alphabet28Only
                ? 'bg-cyan-700 text-white border-cyan-900 shadow-sm font-black ring-2 ring-cyan-300'
                : 'bg-white text-cyan-950 border-slate-300 hover:bg-cyan-50'
            }`}
          >
            <div className="text-xs font-black flex items-center gap-1">📜 الهجاء (28)</div>
            <div className="text-[9px] opacity-80 mt-0.5">حروف الهجاء ({filterCounts?.alphabet_28 || 0})</div>
          </button>

          {/* 6. Tanzeel 23 */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, tanzeel23Only: !filters.tanzeel23Only })}
            className={`p-2 rounded-none border text-right transition-all cursor-pointer ${
              filters.tanzeel23Only
                ? 'bg-sky-700 text-white border-sky-900 shadow-sm font-black ring-2 ring-sky-300'
                : 'bg-white text-sky-950 border-slate-300 hover:bg-sky-50'
            }`}
          >
            <div className="text-xs font-black flex items-center gap-1">📖 التنزيل (23)</div>
            <div className="text-[9px] opacity-80 mt-0.5">سنوات البعثة ({filterCounts?.tanzeel_23 || 0})</div>
          </button>

          {/* 6b. Noorani Surahs 29 */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, nooraniSurahs29Only: !filters.nooraniSurahs29Only })}
            className={`p-2 rounded-none border text-right transition-all cursor-pointer ${
              filters.nooraniSurahs29Only
                ? 'bg-amber-700 text-white border-amber-900 shadow-sm font-black ring-2 ring-amber-300'
                : 'bg-white text-amber-950 border-slate-300 hover:bg-amber-50'
            }`}
          >
            <div className="text-xs font-black flex items-center gap-1">🌟 النورانية (29)</div>
            <div className="text-[9px] opacity-80 mt-0.5">السور النورانية ({filterCounts?.noorani_surahs_29 || 0})</div>
          </button>

          {/* 6c. Noorani Letters 14 */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, nooraniLetters14Only: !filters.nooraniLetters14Only })}
            className={`p-2 rounded-none border text-right transition-all cursor-pointer ${
              filters.nooraniLetters14Only
                ? 'bg-teal-700 text-white border-teal-900 shadow-sm font-black ring-2 ring-teal-300'
                : 'bg-white text-teal-950 border-slate-300 hover:bg-teal-50'
            }`}
          >
            <div className="text-xs font-black flex items-center gap-1">🔠 الحروف (14)</div>
            <div className="text-[9px] opacity-80 mt-0.5">الحروف المقطعة ({filterCounts?.noorani_letters_14 || 0})</div>
          </button>

          {/* 7. Surah Match */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, surahMatchOnly: !filters.surahMatchOnly })}
            className={`p-2 rounded-none border text-right transition-all cursor-pointer ${
              filters.surahMatchOnly
                ? 'bg-emerald-700 text-white border-emerald-900 shadow-sm font-black ring-2 ring-emerald-300'
                : 'bg-white text-emerald-950 border-slate-300 hover:bg-emerald-50'
            }`}
          >
            <div className="text-xs font-black flex items-center gap-1">🔢 رقم السورة</div>
            <div className="text-[9px] opacity-80 mt-0.5">رقم السورة ({filterCounts?.surah_match || 0})</div>
          </button>

          {/* 8. Noorani Rank */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, nooraniRankOnly: !filters.nooraniRankOnly })}
            className={`p-2 rounded-none border text-right transition-all cursor-pointer ${
              filters.nooraniRankOnly
                ? 'bg-fuchsia-800 text-white border-fuchsia-950 shadow-sm font-black ring-2 ring-fuchsia-300'
                : 'bg-white text-fuchsia-950 border-slate-300 hover:bg-fuchsia-50'
            }`}
          >
            <div className="text-xs font-black flex items-center gap-1">💠 النوراني</div>
            <div className="text-[9px] opacity-80 mt-0.5">الترتيب 1-29 ({filterCounts?.noorani_rank || 0})</div>
          </button>
        </div>
      </div>

      {/* 5. Reduced Number Strips (1..9) (Shown on demand) */}
      {showReducedDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 animate-fade-in">
          {/* 1. Reduced Jummal */}
          <div className="bg-white border border-slate-200 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-950">اختزال حساب الجُمّل:</span>
              {filters.reducedJummal !== null && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, reducedJummal: null })}
                  className="text-[10px] text-rose-600 font-bold hover:underline"
                >
                  إلغاء
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {REDUCED_NUMBERS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberToggle('reducedJummal', num)}
                  className={`w-7 h-7 text-xs font-black transition-all cursor-pointer font-mono flex items-center justify-center border ${
                    filters.reducedJummal === num
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                      : 'bg-indigo-50/70 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Reduced Words */}
          <div className="bg-white border border-slate-200 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950">اختزال عدد الكلمات:</span>
              {filters.reducedWords !== null && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, reducedWords: null })}
                  className="text-[10px] text-rose-600 font-bold hover:underline"
                >
                  إلغاء
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {REDUCED_NUMBERS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberToggle('reducedWords', num)}
                  className={`w-7 h-7 text-xs font-black transition-all cursor-pointer font-mono flex items-center justify-center border ${
                    filters.reducedWords === num
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Reduced Letters */}
          <div className="bg-white border border-slate-200 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-950">اختزال عدد الحروف:</span>
              {filters.reducedLetters !== null && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, reducedLetters: null })}
                  className="text-[10px] text-rose-600 font-bold hover:underline"
                >
                  إلغاء
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {REDUCED_NUMBERS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberToggle('reducedLetters', num)}
                  className={`w-7 h-7 text-xs font-black transition-all cursor-pointer font-mono flex items-center justify-center border ${
                    filters.reducedLetters === num
                      ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                      : 'bg-blue-50/70 text-blue-900 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Reduced Sum */}
          <div className="bg-white border border-slate-200 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-950">اختزال المجموع (كلمات + حروف):</span>
              {filters.reducedSum !== null && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, reducedSum: null })}
                  className="text-[10px] text-rose-600 font-bold hover:underline"
                >
                  إلغاء
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {REDUCED_NUMBERS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberToggle('reducedSum', num)}
                  className={`w-7 h-7 text-xs font-black transition-all cursor-pointer font-mono flex items-center justify-center border ${
                    filters.reducedSum === num
                      ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                      : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Reduced Quotient */}
          <div className="bg-white border border-slate-200 p-2.5 space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-teal-950">
                اختزال ناتج القسمة (الجُمّل ÷ المعامل {surahCoeff}):
              </span>
              {filters.reducedQuotient !== null && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, reducedQuotient: null })}
                  className="text-[10px] text-rose-600 font-bold hover:underline"
                >
                  إلغاء
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {REDUCED_NUMBERS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberToggle('reducedQuotient', num)}
                  className={`w-7 h-7 text-xs font-black transition-all cursor-pointer font-mono flex items-center justify-center border ${
                    filters.reducedQuotient === num
                      ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                      : 'bg-teal-50/70 text-teal-900 border-teal-200 hover:bg-teal-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
