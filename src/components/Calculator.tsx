import React, { useState, useMemo } from 'react';
import { getCharJummal, cleanForCalculations, removeTashkeel, JUMMAL_MAP, reduceDigitalRoot } from '../utils/jummal';
import { HelpCircle, Sparkles, Hash, Calculator as CalcIcon, Trash2, ArrowRightLeft } from 'lucide-react';

export default function Calculator() {
  const [inputText, setInputText] = useState('بسم الله');
  
  // Cleaned and analyzed state
  const analysis = useMemo(() => {
    const rawNoTashkeel = removeTashkeel(inputText);
    const cleanStr = cleanForCalculations(inputText);
    
    // Character breakdown
    const charBreakdown = cleanStr.split('').map((char, index) => {
      const val = getCharJummal(char);
      return {
        char,
        val,
        index
      };
    });

    const sum = charBreakdown.reduce((acc, curr) => acc + curr.val, 0);
    const letterCount = charBreakdown.filter(c => c.char !== ' ').length;
    const wordCount = cleanStr.split(/\s+/).filter(w => w.length > 0).length;
    const root = reduceDigitalRoot(sum);

    // Grouping by words
    const words = cleanStr.split(/\s+/).filter(w => w.length > 0).map((word) => {
      let wordSum = 0;
      const letters = word.split('').map((c) => {
        const v = getCharJummal(c);
        wordSum += v;
        return { char: c, value: v };
      });
      return {
        word,
        letters,
        sum: wordSum
      };
    });

    return {
      rawNoTashkeel,
      cleanStr,
      charBreakdown,
      sum,
      letterCount,
      wordCount,
      root,
      words
    };
  }, [inputText]);

  const PRESETS = [
    'بسم الله الرحمن الرحيم',
    'المنهج الرقمي',
    'العنكبوت',
    'الم',
    'يا عبادي الذين آمنوا',
    'النصر الإلهي'
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Container */}
      <div className="bg-white border-2 border-slate-200 rounded-none p-6 md:p-8 space-y-6 relative">
        <div className="absolute top-0 right-0 left-0 h-1 bg-slate-900" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-slate-100 rounded-none text-slate-900 border border-slate-200">
              <CalcIcon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">الحاسبة الفورية لحساب الجُمّل</h3>
              <p className="text-xs text-slate-500 mt-0.5">اكتب أو الصق أي عبارة لحساب قيمتها الإجمالية والتفصيلية فوراً</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setInputText('')} 
            className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-rose-600 transition-colors self-end sm:self-auto font-bold"
            title="مسح الحقل"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح الحقل</span>
          </button>
        </div>

        {/* Input Text Area */}
        <div className="space-y-2">
          <label htmlFor="calculator-input" className="block text-xs font-black text-slate-900 uppercase tracking-widest">العبارة أو الكلمة المراد حسابها:</label>
          <textarea
            id="calculator-input"
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-400 focus:border-slate-900 focus:ring-0 rounded-none p-4 text-base text-slate-900 placeholder-slate-400 outline-none leading-relaxed transition-all resize-none quran-font text-center font-bold"
            placeholder="اكتب العبارة هنا..."
          />
        </div>

        {/* Presets List */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">جرب عبارات سريعة:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setInputText(preset)}
              className="px-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-900 border border-slate-200 hover:border-slate-900 text-slate-700 hover:text-white rounded-none font-bold transition-all cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Live Calculation Output Dashboard */}
        {inputText.trim() ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            
            <div className="bg-slate-50 border border-slate-200 rounded-none p-5 text-center relative overflow-hidden">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">حساب الجمل الكلي</span>
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono block mt-2">
                {analysis.sum}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block font-medium">النبض الرقمي</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-none p-5 text-center relative overflow-hidden">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">عدد الحروف الحقيقية</span>
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono block mt-2">
                {analysis.letterCount}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block font-medium">الغطاء الخارجي</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-none p-5 text-center relative overflow-hidden">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">عدد الكلمات</span>
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono block mt-2">
                {analysis.wordCount}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block font-medium">التركيب اللغوي</span>
            </div>

            <div className="bg-slate-900 text-white rounded-none p-5 text-center relative overflow-hidden">
              <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">الاختزال الرقمي (الجذر)</span>
              <span className="text-3xl font-black text-white tracking-tight font-mono block mt-2">
                {analysis.root}
              </span>
              <span className="text-[10px] text-emerald-400 mt-1 block font-medium">الميزان التراكمي</span>
            </div>

          </div>
        ) : (
          <div className="text-center py-10 bg-white border-2 border-dashed border-slate-200 rounded-none text-slate-400 text-xs">
            يرجى كتابة كلمة أو جملة لعرض لوحة البيانات الحسابية
          </div>
        )}

        {/* Detailed Character Breakdown */}
        {analysis.cleanStr.trim() !== '' && (
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-slate-600" />
              توزيع الحساب على الكلمات والحروف بالتفصيل الهندسي:
            </h4>

            {/* Word by word card boxes */}
            <div className="flex flex-wrap gap-4 items-stretch justify-start">
              {analysis.words.map((w, wIdx) => (
                <div 
                  key={w.word + '-' + wIdx} 
                  className="bg-white border-2 border-slate-200 hover:border-slate-900 rounded-none p-4 flex flex-col justify-between w-64 transition-all relative"
                >
                  <div className="absolute top-0 right-0 w-8 h-1 bg-slate-900" />
                  <div className="flex items-center justify-between gap-6 border-b border-slate-100 pb-2 mb-3">
                    <span className="quran-font text-lg font-bold text-slate-900">{w.word}</span>
                    <span className="bg-slate-900 text-white text-xs px-2.5 py-0.5 rounded-none font-mono font-bold">
                      {w.sum}
                    </span>
                  </div>

                  {/* Letters inside raw word box */}
                  <div className="flex flex-wrap gap-1.5">
                    {w.letters.map((l, lIdx) => (
                      <div 
                        key={lIdx} 
                        className={`flex flex-col items-center justify-center p-2 rounded-none border transition-all ${
                          l.value > 0 
                            ? 'bg-slate-50 border-slate-200 hover:border-slate-400' 
                            : 'bg-rose-50 border-rose-100 text-slate-400'
                        }`}
                      >
                        <span className="quran-font text-base font-bold text-slate-900">{l.char}</span>
                        <span className="text-[10px] text-slate-600 font-mono font-bold mt-1">
                          {l.value > 0 ? l.value : 'صفر'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Math Verification Formula */}
            <div className="bg-slate-50 border border-slate-200 rounded-none p-4 text-xs leading-relaxed space-y-2 relative">
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-950" />
              <div className="text-xs font-black text-slate-900 uppercase tracking-wide">✨ معادلة التحقق الحسابي:</div>
              <div className="font-mono text-slate-700 overflow-x-auto whitespace-nowrap scrollbar-thin py-1 text-sm">
                {analysis.words.map((w, idx) => (
                  <span key={idx}>
                    <span>({w.word}: {w.sum})</span>
                    {idx < analysis.words.length - 1 ? ' + ' : ''}
                  </span>
                ))}
                <span> = <strong className="text-slate-950 font-black">{analysis.sum} ✨</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
