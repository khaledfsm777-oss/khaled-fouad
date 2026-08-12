import React, { useState } from 'react';
import { ARABIC_LETTERS_METADATA } from '../utils/jummal';
import BonyanLogo from './BonyanLogo';
import { 
  BookOpen, Star, HelpCircle, Shield, Key, Compass, ChevronDown, ChevronUp, 
  Layers, Filter, Sparkles, LogOut, Brain, Info, Mail, Calculator, Search, CheckCircle2,
  Sliders, Award
} from 'lucide-react';

export default function HelpSection() {
  // Accordion state management for interactive lightweight reading
  const [openSection, setOpenSection] = useState<string | null>('intro');

  const toggleSection = (id: string) => {
    setOpenSection(prev => (prev === id ? null : id));
  };

  const expandAll = () => setOpenSection('ALL');
  const collapseAll = () => setOpenSection(null);

  const isOpen = (id: string) => openSection === 'ALL' || openSection === id;

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      
      {/* Welcome Banner & Founder Introduction */}
      <div className="relative overflow-hidden bg-white border-2 border-amber-300/80 p-6 md:p-8 rounded-2xl shadow-sm">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-emerald-800 via-amber-500 to-emerald-950" />
        
        <div className="relative space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100 pb-4">
            <div className="flex items-center gap-4">
              <BonyanLogo size={64} />
              <div>
                <h2 className="text-xl md:text-2xl font-black text-emerald-950 tracking-tight flex items-center gap-2">
                  <span>منصة البنيان للتحرير والاستقصاء العددي</span>
                  <span className="text-xs bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md font-mono">
                    V2.5
                  </span>
                </h2>
                <div className="text-xs text-amber-700 font-black mt-1">
                  الدراسة والتأصيل الهيكلي لعلوم القرآن الكريم والحروف المقطعة
                </div>
              </div>
            </div>

            {/* Quick Expand / Collapse Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                توسيع كل الأقسام 📖
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                طَي الشرح ✖️
              </button>
            </div>
          </div>

          <div className="bg-[#fcfbf7] border border-amber-200/80 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-950">
              <span className="text-lg">🎙️</span>
              <span>كلمة المطور وتأصيل المنهج العلمي:</span>
            </div>
            <p className="text-slate-700 leading-relaxed text-xs md:text-sm font-semibold">
              ابتكار وإعداد النموذج البحثي: <strong className="text-emerald-900 font-black text-sm">الأستاذ خالد فؤاد السيد</strong>.
              تستهدف منظومة <strong>«البنيان»</strong> استكشاف الميزان الهيكلي والتوازن الرياضي لسور القرآن الكريم اعتـماداً على خوارزميات المعايرة الرقمية المزدوجة والنظام الأبجدي التاريخي. تدمج المنظومة بين حساب الجُمَّل والترتيب الزمني والمعاملات النورانية للسور الـ 29 ذات الفواتح لاستخراج التوافقات المحورية والبصمات الرقمية للآيات بدقة متناهية ودون تدخل يدوي.
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-800 bg-white border border-amber-200 px-3 py-1.5 rounded-lg font-bold">
                <Mail className="w-4 h-4 text-amber-600" />
                <span>البريد الإلكتروني المعتمد للتواصل العلمي مع الباحث:</span>
                <a href="mailto:k.bonyan7@gmail.com" className="text-amber-700 hover:text-amber-800 font-black font-mono underline underline-offset-2 dir-ltr">
                  k.bonyan7@gmail.com
                </a>
              </div>
              <span className="text-[11px] text-slate-500 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                مرجع موجه للمستخدمين ولجان المراجعة والتدقيق العلمي
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion 1: Screens & Core Functions Guide */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button
          type="button"
          onClick={() => toggleSection('screens')}
          className="w-full p-5 bg-slate-50 hover:bg-amber-50/50 flex items-center justify-between text-right border-b border-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900 text-amber-300 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">1️⃣ دليل الشاشات الرئيسية ووظائفها بالتفصيل</h3>
              <p className="text-xs text-slate-500 font-medium">الشاشة الرئيسية، المدخلات والمخرجات، ومنصة المعايرة الثنائية</p>
            </div>
          </div>
          {isOpen('screens') ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
        </button>

        {isOpen('screens') && (
          <div className="p-6 space-y-6 text-xs leading-relaxed text-slate-700 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Screen 1 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-700 rounded-t-xl" />
                <h4 className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-700" />
                  شاشة الدليل وتأصيل المنظومة
                </h4>
                <p className="text-slate-600 font-medium">
                  تتيح للمستخدم ولجنه المراجعة الاطلاع على ميثاق العمل، وقواعد المعالجة الحرفية، وأبجدية الجُمل المعتمدة، مع شرح كامل لشفرات الألوان والمعادلات.
                </p>
              </div>

              {/* Screen 2 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500 rounded-t-xl" />
                <h4 className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-amber-600" />
                  شاشة المدخلات والمخرجات
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 font-medium">
                  <li><strong>تحديد السورة:</strong> اختيار السورة محل الدراسة (مثل سورة الشورى أو العنكبوت).</li>
                  <li><strong>إدخال المعامل النوراني:</strong> تثبيت الوزن الحسابي المخصص للفواتح (مثلاً المعامل 3 لـ حم).</li>
                  <li><strong>مصفوفة الجُمل:</strong> عرض الحسابات التلقائية لأرقام الآيات وعدد الكلمات والحروف.</li>
                </ul>
              </div>

              {/* Screen 3 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-indigo-600 rounded-t-xl" />
                <h4 className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  شاشة المعايرة الثنائية (Dual Normalization)
                </h4>
                <p className="text-slate-600 font-medium">
                  الشاشة المخصصة لتطبيق معادلات المعايرة النسبية والمطلقة في وقت واحد، وتوليد جداول المقارنة التفاعلية، ورصد نقاط الاتزان الموجي عبر الآيات.
                </p>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Accordion 2: Button & Control Guide */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button
          type="button"
          onClick={() => toggleSection('buttons')}
          className="w-full p-5 bg-slate-50 hover:bg-amber-50/50 flex items-center justify-between text-right border-b border-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">2️⃣ شرح أزرار التحكم ومكونات الواجهة (Button & Control Guide)</h3>
              <p className="text-xs text-slate-500 font-medium">وظائف الأزرار التفاعلية والتحكم بالفلاتر واستخراج التقارير</p>
            </div>
          </div>
          {isOpen('buttons') ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
        </button>

        {isOpen('buttons') && (
          <div className="p-6 space-y-4 text-xs leading-relaxed text-slate-700 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="font-black text-emerald-950 text-sm flex items-center gap-2">
                  <span className="p-1 bg-emerald-800 text-white rounded text-[11px]">📖</span>
                  <span>زر [شاشة المدخلات/المخرجات]</span>
                </div>
                <p className="text-slate-600 text-[11px] font-semibold">
                  للانتقال الفوري لإدخال المعاملات النورانية وتحديد نطاق الآيات واستعراض جدول الجمل الكامل.
                </p>
              </div>

              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1.5">
                <div className="font-black text-indigo-950 text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-700" />
                  <span>زر [المستشار الذكي 🧠]</span>
                </div>
                <p className="text-slate-600 text-[11px] font-semibold">
                  لعرض التوجيهات والاستنتاجات المساعدة والتحليلات الآلية الاسترشادية أثناء الاستقصاء.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                <div className="font-black text-amber-950 text-sm flex items-center gap-2">
                  <span className="p-1 bg-amber-600 text-white rounded text-[11px]">📚</span>
                  <span>زر [منهج العمل العلمي]</span>
                </div>
                <p className="text-slate-600 text-[11px] font-semibold">
                  للعودة إلى شاشة التأصيل والدليل المنهجي الشامل واستعراض قواعد معالجة الحروف.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-900 text-white border border-amber-400 rounded-xl space-y-1.5 shadow-sm">
                <div className="font-black text-amber-300 text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4 text-amber-400" />
                  <span>زر [الفلترة الحسمية 🎯]</span>
                </div>
                <p className="text-slate-200 text-[11px] font-semibold">
                  الزر المحوري في نتائج البحث؛ يقوم بالتصفية الآلية الفورية لإبراز الآيات التي حققت توافقاً مزدوجاً محققاً وإخفاء غير المتوافق.
                </p>
              </div>

              <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-xl space-y-1.5">
                <div className="font-black text-sky-950 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>زر [المجموعات التدبرية النورانية 💡]</span>
                </div>
                <p className="text-slate-600 text-[11px] font-semibold">
                  لعرض واستدعاء قوائم الآيات المستنبطة بالتدبر والربط المباشر مع المعامل النوراني النشط.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1.5">
                <div className="font-black text-rose-950 text-sm flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-rose-700" />
                  <span>زر [خروج / إنهاء الجلسة 🚪]</span>
                </div>
                <p className="text-slate-600 text-[11px] font-semibold">
                  لتصفير النصوص المسجلة، إغلاق الجلسة بأمان، واستخراج تقارير التحليل المطبوعة بصيغة PDF/HTML.
                </p>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Accordion 3: Normalization Algorithms & Equations */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button
          type="button"
          onClick={() => toggleSection('equations')}
          className="w-full p-5 bg-slate-50 hover:bg-amber-50/50 flex items-center justify-between text-right border-b border-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-900 text-white rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">3️⃣ شرح خوارزمية المعايرة الرقمية المزدوجة (Dual Normalization Algorithm)</h3>
              <p className="text-xs text-slate-500 font-medium">الميزان الموجي النسبي، البصمة التوافقية المطلقة، ومفهوم التوافق المزدوج</p>
            </div>
          </div>
          {isOpen('equations') ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
        </button>

        {isOpen('equations') && (
          <div className="p-6 space-y-5 text-xs leading-relaxed text-slate-700 bg-white">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Equation 1 */}
              <div className="bg-slate-50 border-2 border-emerald-200 p-5 rounded-xl space-y-3 relative">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <span className="font-black text-emerald-950 text-sm">المعادلة الأولى: الميزان الموجي النسبي</span>
                  <span className="px-2 py-0.5 bg-emerald-700 text-white font-mono text-[10px] font-bold rounded">Eq. 1</span>
                </div>
                <div className="p-3 bg-white border border-slate-300 font-mono text-center text-sm font-black text-emerald-900 rounded-lg shadow-inner dir-ltr">
                  (الجُمَّل + رقم الآية) ÷ المعامل النوراني
                </div>
                <p className="text-slate-600 font-medium">
                  <strong>الدور الرياضي:</strong> تحسب هذه المعادلة الوزن الهيكلي للآية مضافاً إليه تسلسلها النصي مقسوماً على وزن الفواتح النورانية للسورة. في حال كان ناتج القسمة عدداً صحافاً بدون باقٍ، يُثبت الاستواء الموجي للآية.
                </p>
              </div>

              {/* Equation 2 */}
              <div className="bg-slate-50 border-2 border-amber-200 p-5 rounded-xl space-y-3 relative">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="font-black text-amber-950 text-sm">المعادلة الثانية: البصمة التوافقية المطلقة</span>
                  <span className="px-2 py-0.5 bg-amber-600 text-white font-mono text-[10px] font-bold rounded">Eq. 2</span>
                </div>
                <div className="p-3 bg-white border border-slate-300 font-mono text-center text-sm font-black text-amber-900 rounded-lg shadow-inner dir-ltr">
                  الجُمَّل × (رقم الآية + المعامل النوراني)
                </div>
                <p className="text-slate-600 font-medium">
                  <strong>الدور الرياضي:</strong> تقيس هذه المعادلة القيمة المطلقة المدمجة الناتجة عن ضرب حساب الجُمل في مجموع تسلسل الآية والمعامل، وتخضع لعملية الاختزال الرقمي المتتابع لاستخراج <strong>البصمة الأحادية المغلقة (1 - 9)</strong>.
                </p>
              </div>

            </div>

            {/* Logical Intersection Concept */}
            <div className="bg-emerald-950 text-white p-5 rounded-xl space-y-2 relative overflow-hidden">
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                <Award className="w-5 h-5 text-amber-400" />
                <span>مفهوم التوافق المزدوج والهدف الرياضي:</span>
              </div>
              <p className="text-slate-200 leading-relaxed font-semibold text-xs">
                يقوم المحرك الرياضي بإجراء <strong>تقاطع منطقي حاسم</strong> بين مخرجات المعادلة الأولى (القسمة النسبية) والمعادلة الثانية (الضرب المدمج والبصمة الأحادية). إثبات التوافق عبر هذين المسارين المستقلين برهانٌ رياضي قاطع ينفي العشوائية والمصادفة، ويُثبت الاتزان البنيوي المحكم للنص القرآني.
              </p>
            </div>

          </div>
        )}
      </div>

      {/* Accordion 4: The 6 Compatibility Conditions & Single-Digit Fingerprint */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button
          type="button"
          onClick={() => toggleSection('conditions')}
          className="w-full p-5 bg-slate-50 hover:bg-amber-50/50 flex items-center justify-between text-right border-b border-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 text-white rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">4️⃣ شرح التوافقات الستة وتوافق البصمة الأحادية والمدمجة</h3>
              <p className="text-xs text-slate-500 font-medium">بيان وظيفي ومباشر لكل نوع من التوافقات الستة المعتمدة بالبرنامج</p>
            </div>
          </div>
          {isOpen('conditions') ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
        </button>

        {isOpen('conditions') && (
          <div className="p-6 space-y-4 text-xs leading-relaxed text-slate-700 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-black text-emerald-900 text-xs flex items-center justify-between">
                  <span>1. توافق الجُمل المباشر:</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono">الجُمَّل % N == 0</span>
                </div>
                <p className="text-slate-600 text-[11px] font-medium">
                  قابلية انقسام قيمة حساب الجمل الصريح للآية مباشرة على المعامل النوراني N أو اختزاله R بدون باقٍ.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-black text-sky-900 text-xs flex items-center justify-between">
                  <span>2. التوافق الهيكلي:</span>
                  <span className="text-[10px] bg-sky-100 text-sky-900 px-2 py-0.5 rounded font-mono">(الجُمَّل + رقم الآية) % N == 0</span>
                </div>
                <p className="text-slate-600 text-[11px] font-medium">
                  قابلية انقسام الميزان الهيكلي المكون من الجُمل ورقم الآية على المعامل النوراني للسورة بدون باقٍ.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-black text-amber-900 text-xs flex items-center justify-between">
                  <span>3. التوافق الكثيفي (الكلمات والحروف):</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono">(الكلمات + الحروف) % N == 0</span>
                </div>
                <p className="text-slate-600 text-[11px] font-medium">
                  انقسام الكثافة النصية للآية (مجموع عدد كلمات الآية + عدد حروفها) على المعامل النوراني بدون باقٍ.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-black text-yellow-900 text-xs flex items-center justify-between">
                  <span>4. التوافق التراكمي الشامل:</span>
                  <span className="text-[10px] bg-yellow-100 text-yellow-900 px-2 py-0.5 rounded font-mono">الميزان الشامل % N == 0</span>
                </div>
                <p className="text-slate-600 text-[11px] font-medium">
                  انقسام مجموع (الجُمل + الميزان الهيكلي + الكثافة النصية) كاملاً على المعامل النوراني بدون باقٍ.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-black text-teal-900 text-xs flex items-center justify-between">
                  <span>5. توافق الحواميم والشورى (حم / عسق):</span>
                  <span className="text-[10px] bg-teal-100 text-teal-900 px-2 py-0.5 rounded font-mono">الجُمَّل % 3 == 0 || % 5 == 0</span>
                </div>
                <p className="text-slate-600 text-[11px] font-medium">
                  خاص بسور الحواميم وسورة الشورى؛ انقسام الجمل على 3 (المعامل الأول حم) أو 5 (المعامل الثاني عسق).
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-black text-orange-900 text-xs flex items-center justify-between">
                  <span>6. التوافق التوحيدي (الذاتي والمشترك):</span>
                  <span className="text-[10px] bg-orange-100 text-orange-900 px-2 py-0.5 rounded font-mono">شفرة التوحيد 11 أو اختزال 1</span>
                </div>
                <p className="text-slate-600 text-[11px] font-medium">
                  تحقيق مجموع الكثافة المباشر أو المجموع مع رقم الآية لشفرة التوحيد الأولى 11 أو الاختزال الأحادي للرقم 1.
                </p>
              </div>

            </div>

            <div className="p-4 bg-[#fcfbf7] border border-amber-300 rounded-xl space-y-2">
              <span className="font-black text-emerald-950 text-xs block">✨ توافق البصمة الأحادية والتوافق المدمج:</span>
              <p className="text-slate-700 text-[11px] leading-relaxed font-semibold">
                يتحقق التوافق المدمج عند تطبيق معادلة البصمة العمودية: <strong className="font-mono text-amber-900">[اختزال الجمل] × [رقم الآية + اختزال المعامل]</strong>. 
                في حال كان الناتج يعطي الرقم (9) الذاتي السائد، أو يطابق اختزال الآية، أو اختزال الكثافة، أو الترتيب النوراني للسورة (من الـ 29)، فإن المنظومة تمنح الآية وسام <strong>«[✨ توافق مدمج محقق]»</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 5: Color Code Legend */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button
          type="button"
          onClick={() => toggleSection('legend')}
          className="w-full p-5 bg-slate-50 hover:bg-amber-50/50 flex items-center justify-between text-right border-b border-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 text-white rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">5️⃣ دليل الألوان التمييزية والشفرات البصرية (Color Code Legend)</h3>
              <p className="text-xs text-slate-500 font-medium">دليل بصري لسبب ظهور كل لون في جداول المخرجات والنتائج</p>
            </div>
          </div>
          {isOpen('legend') ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
        </button>

        {isOpen('legend') && (
          <div className="p-6 space-y-4 text-xs leading-relaxed text-slate-700 bg-white">
            <p className="text-slate-600 font-medium">
              ربط كل نوع توافق باللون المخصص له فعلياً في الشاشة والجداول ليعرف الفاحص واللجنة سبب ظهور هذا اللون المحدد للخلية أو الآية:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* Color 1 */}
              <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <span className="font-black text-emerald-950 block text-xs">🟢 الأخضر الزمردي</span>
                  <span className="text-[11px] text-emerald-800 font-semibold">توافق الجُمل المباشر مع المعامل النوراني</span>
                </div>
              </div>

              {/* Color 2 */}
              <div className="p-3 bg-sky-50 border-2 border-sky-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <span className="font-black text-sky-950 block text-xs">🔵 الأزرق السماوي</span>
                  <span className="text-[11px] text-sky-800 font-semibold">التوافق الهيكلي (الجمل + رقم الآية)</span>
                </div>
              </div>

              {/* Color 3 */}
              <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <span className="font-black text-amber-950 block text-xs">🟣 العنبري / الأرجواني</span>
                  <span className="text-[11px] text-amber-800 font-semibold">التوافق الكثيفي (الكلمات + الحروف)</span>
                </div>
              </div>

              {/* Color 4 */}
              <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-yellow-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </div>
                <div>
                  <span className="font-black text-yellow-950 block text-xs">🟡 الذهبي / الأصفر</span>
                  <span className="text-[11px] text-yellow-800 font-semibold">التوافق التراكمي الشامل للمواصفات</span>
                </div>
              </div>

              {/* Color 5 */}
              <div className="p-3 bg-teal-50 border-2 border-teal-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  5
                </div>
                <div>
                  <span className="font-black text-teal-950 block text-xs">🩵 التيل / الكحلي المائي</span>
                  <span className="text-[11px] text-teal-800 font-semibold">توافق شفرة حم / عسق الحواميم</span>
                </div>
              </div>

              {/* Color 6 */}
              <div className="p-3 bg-orange-50 border-2 border-orange-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  6
                </div>
                <div>
                  <span className="font-black text-orange-950 block text-xs">🟠 البرتقالي المشرق</span>
                  <span className="text-[11px] text-orange-800 font-semibold">التوافق التوحيدي (شفرة 11 أو 1)</span>
                </div>
              </div>

              {/* Color 7 */}
              <div className="p-3 bg-[#092b22] text-amber-300 border-2 border-amber-400 rounded-xl flex items-center gap-3 col-span-1 sm:col-span-2 lg:col-span-3">
                <div className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                  ✨
                </div>
                <div>
                  <span className="font-black text-amber-300 block text-xs">✨ الزمردي الداكن المطرز بالذهبي (التوافق المدمج البراق)</span>
                  <span className="text-[11px] text-slate-200 font-semibold">تحقق البصمة الأحادية وتطابق معادلة الضرب المدمجة العمودية</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Grid of Abjad Letters Metadata */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-600" />
          <span>أوزان الحروف الأبجدية المعتمدة في حساب الجُمَّل الكبير بالمنظومة</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          أبجد هوز حطي كلمن صعفض قرست ثخذ ضظغ — أوزان تاريخية مستقرة لكل حرف من الحروف الـ 28:
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {ARABIC_LETTERS_METADATA.map((item) => (
            <div 
              key={item.char} 
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-amber-50 hover:border-amber-400 transition-all cursor-default"
            >
              <span className="quran-font text-lg font-bold text-slate-900">{item.char}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-medium">{item.name}</span>
              <span className="text-sm font-black text-emerald-900 mt-1 font-mono">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#fcfbf7] border border-amber-200 p-4 rounded-xl space-y-2 relative mt-4">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500 rounded-r-xl" />
          <h4 className="text-xs font-black text-emerald-950">📌 قواعد المعالجة والتوحيد الحرفي في منظومة «البنيان»</h4>
          <ul className="text-xs text-slate-700 list-disc list-inside space-y-1 font-medium leading-relaxed">
            <li><strong>الألف والهمزات:</strong> تُحسب الهمزات بأنواعها (أ، إ، آ، ٱ، ء) بقيمة الألف الأساسية (1).</li>
            <li><strong>الهاء والتاء المربوطة:</strong> تُعامل التاء المربوطة (ة) والهاء (ه) بقيمة موحدة (5) لحفظ اتزان الجُمل.</li>
            <li><strong>الياء والألف المقصورة:</strong> تُحسب الياء (ي) والألف المقصورة (ى) والهمزة على ياء (ئ) بقيمة (10).</li>
            <li><strong>التشكيل والعلامات:</strong> يُستبعد التشكيل في الحساب عدا الألف الخنجرية اللاحقة "ٰ" التي تُحسب ألفاً بقيمة (1).</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
