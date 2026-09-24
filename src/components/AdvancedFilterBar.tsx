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

      {/* 3. Essential Tools Bar: Single-Digit Fingerprints (1..9), Elite, Compact & Colors */}
      <div className="space-y-3 bg-white border border-slate-200 p-4">
        {/* Single-Digit Fingerprint Strip (1 to 9) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-amber-950 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
              <span>أزرار البصمة الأحادية للناتج (1 إلى 9):</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {REDUCED_NUMBERS.map(num => {
                const isSelected = filters.selectedDigitalRoot === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onFilterChange({ ...filters, selectedDigitalRoot: isSelected ? null : num })}
                    className={`w-9 h-9 rounded-none text-sm font-black font-mono transition-all cursor-pointer flex items-center justify-center border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-sm ring-2 ring-amber-300'
                        : 'bg-amber-50/60 text-amber-950 border-amber-200 hover:bg-amber-100'
                    }`}
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
                className="text-[11px] text-rose-600 hover:underline font-bold mr-1"
              >
                إلغاء البصمة ✕
              </button>
            )}
          </div>

          {/* Elite & Compact Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Perfect Match (5/6 to 6/6) */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, perfectMatchOnly: !filters.perfectMatchOnly })}
              className={`px-3 py-1.5 text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 rounded-none ${
                filters.perfectMatchOnly
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-100/60 text-amber-950 border-amber-300 hover:bg-amber-200'
              }`}
              title="عرض الآيات ذات التوافق التام (من 5/6 إلى 6/6)"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>التوافق التام (5/6 - 6/6) 🏆</span>
              {filterCounts?.perfect_matches !== undefined && (
                <span className="text-[10px] px-1 bg-amber-900 text-white rounded-xs">
                  {filterCounts.perfect_matches}
                </span>
              )}
            </button>

            {/* Triple Match Elite */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, tripleMatchOnly: !filters.tripleMatchOnly })}
              className={`px-3 py-1.5 text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 rounded-none ${
                filters.tripleMatchOnly
                  ? 'bg-amber-600 text-white border-amber-800 shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
              }`}
              title="عرض آيات النخبة النورانية المحققة للشروط الثلاثية الكاملة"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>آيات النخبة النورانية المطلقة 👑</span>
              {filterCounts && <span className="text-[10px] opacity-80">({filterCounts.triple_match})</span>}
            </button>

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

            {/* Unregistered Matches Button */}
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, unregisteredOnly: !filters.unregisteredOnly })}
              className={`px-3 py-1.5 text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 rounded-none ${
                filters.unregisteredOnly
                  ? 'bg-orange-600 text-white border-orange-800 shadow-md ring-2 ring-orange-300'
                  : 'bg-orange-50 text-orange-950 border-orange-300 hover:bg-orange-100'
              }`}
              title="عرض التوافقات غير المسجلة مسبقاً (قيد التحقيق والتوثيق المنهجي)"
            >
              <span className="text-xs">⚠️</span>
              <span>غير مسجلة مسبقاً</span>
              {filterCounts?.unregistered_matches !== undefined && (
                <span className="text-[10px] px-1 bg-orange-900 text-white rounded-xs">
                  {filterCounts.unregistered_matches}
                </span>
              )}
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
              title="تصفية وعرض الآيات التي تحوي ملاحظات الباحث المخصصة"
            >
              <span className="text-xs">📝</span>
              <span>ملاحظات الباحث</span>
              {filterCounts?.researcher_notes !== undefined && (
                <span className="text-[10px] px-1 bg-purple-900 text-white rounded-xs">
                  {filterCounts.researcher_notes}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mizan Colors Classifications */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-black text-slate-800">تصنيفات التوافق الميزاني:</span>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: 'all' })}
              className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer border rounded-none ${
                filters.mizanColor === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              الكل ({filterCounts?.all || totalCount})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: 'golden' })}
              className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer border rounded-none ${
                filters.mizanColor === 'golden'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-300 font-black'
                  : 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
              }`}
            >
              الذهبي 🌟 ({filterCounts?.golden || 0})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: 'exact' })}
              className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer border rounded-none ${
                filters.mizanColor === 'exact'
                  ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300 font-black'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
              }`}
            >
              الأخضر 🟢 ({filterCounts?.exact || 0})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: 'structural' })}
              className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer border rounded-none ${
                filters.mizanColor === 'structural'
                  ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 font-black'
                  : 'bg-blue-50 border-blue-300 text-blue-950 hover:bg-blue-100'
              }`}
            >
              الأزرق 🔵 ({filterCounts?.structural || 0})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: 'tawheed' })}
              className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer border rounded-none ${
                filters.mizanColor === 'tawheed'
                  ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300 font-black'
                  : 'bg-indigo-50 border-indigo-300 text-indigo-950 hover:bg-indigo-100'
              }`}
            >
              التوحيدي 💛 ({filterCounts?.tawheed || 0})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, mizanColor: 'not_compatible' })}
              className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer border rounded-none ${
                filters.mizanColor === 'not_compatible'
                  ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-300 font-black'
                  : 'bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100'
              }`}
            >
              الأحمر 🔴 ({filterCounts?.not_compatible || 0})
            </button>
          </div>

          {/* Toggle for Reduced 1..9 Sub-Strips */}
          <button
            type="button"
            onClick={() => setShowReducedDetails(!showReducedDetails)}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showReducedDetails ? 'إخفاء أشرطة الاختزال 1-9 ▲' : 'أشرطة اختزال الأرقام (1-9) ▼'}</span>
          </button>
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
