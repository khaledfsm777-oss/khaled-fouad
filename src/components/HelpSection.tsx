import React, { useState } from 'react';
import { ARABIC_LETTERS_METADATA } from '../utils/arabicAlphabet';
import BonyanLogo from './BonyanLogo';
import { 
  BookOpen, Star, HelpCircle, Shield, Key, Compass, ChevronDown, ChevronUp, 
  Layers, Filter, Sparkles, LogOut, Brain, Info, Mail, Calculator, Search, CheckCircle2,
  Sliders, Award, FileSpreadsheet, FileText, Hash, SlidersHorizontal, BarChart2
} from 'lucide-react';

export default function HelpSection() {
  // Accordion state management for interactive lightweight reading
  const [openSection, setOpenSection] = useState<string | null>('search');

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
                  <span>منظومة البنيان للقرآن الكريم • المنهج العلمي والدليل التشغيلي</span>
                  <span className="text-xs bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md font-mono">
                    v3.0.1
                  </span>
                </h2>
                <div className="text-xs text-amber-700 font-black mt-1">
                  الدراسة والتأصيل الهيكلي لعلوم الاستقصاء الرقمي والتحليل النوراني للسور والفواتح
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
              <span>تأصيل المنهج العلمي للمنظومة:</span>
            </div>
            <p className="text-slate-700 leading-relaxed text-xs md:text-sm font-semibold">
              ابتكار وإعداد النموذج البحثي: <strong className="text-emerald-900 font-black text-sm">الأستاذ خالد فؤاد السيد</strong>.
              تستهدف منظومة <strong>«البنيان»</strong> الكشف عن الميزان الإحصائي والاتزان الرقمي البنياني لآيات وسور الذكر الحكيم اعتماداً على خوارزميات الاستقصاء المزدوج والنظام الأبجدي التاريخي المستقر. توحد المنظومة بين حساب الجُمَّل، إحداثيات السور، والمعاملات النورانية للـ 29 سورة ذات الفواتح المقطعة، وتتيح منظومة بحث وتحليل رياضي فائقة الدقة والسرعة في شاشة متكاملة مترابطة.
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
                مرجع موجه للباحثين والدارسين ولجان المراجعة والتدقيق العلمي
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion 1: The Unified Search Screen & Advanced Engine (HIGHLIGHTED) */}
      <div className="bg-white border-2 border-emerald-600 rounded-2xl overflow-hidden shadow-md transition-all">
        <button
          type="button"
          onClick={() => toggleSection('search')}
          className="w-full p-5 bg-gradient-to-r from-emerald-900 to-[#0a2f24] hover:from-emerald-800 hover:to-[#0d3b2e] flex items-center justify-between text-right transition-colors cursor-pointer text-white"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-black shadow-sm">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-amber-300">1️⃣ شاشة ومنظومة البحث والتحليل البنياني الموحد (شرح تفصيلي)</h3>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">ميزة متقدمة</span>
              </div>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                صندوق البحث الشامل، المعاملات الرياضية، الفلاتر الثابتة (114/99/63/28/23)، واختزالات الجذور 1-9
              </p>
            </div>
          </div>
          {isOpen('search') ? <ChevronUp className="w-5 h-5 text-amber-300" /> : <ChevronDown className="w-5 h-5 text-amber-300" />}
        </button>

        {isOpen('search') && (
          <div className="p-6 space-y-6 text-xs leading-relaxed text-slate-700 bg-white">
            
            {/* Introductory Overview */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 space-y-1.5">
              <h4 className="text-sm font-black flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                <span>فلسفة منظومة البحث الموحد:</span>
              </h4>
              <p className="text-xs leading-relaxed text-slate-700 font-semibold">
                تم دمج محرك البحث المتقدم مباشرة في أعلى شاشة المخرجات ليعمل كـ <strong>«لوحة تحكم وتحليل فورية»</strong> تُطبق الفلاتر الرياضية والمعجمية في الوقت الحقيقي على آيات السورة دون الحاجة للتنقل بين صفحات منفصلة.
              </p>
            </div>

            {/* Grid of Core Search Capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Feature 1: Unified Search Box */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-2 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500 rounded-t-xl" />
                <h5 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-600" />
                  <span>1. صندوق البحث الموحد (Unified Search Box):</span>
                </h5>
                <p className="text-slate-600 font-medium">
                  يقبل كافة صيغ الاستعلام بمرونة كاملة:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium pt-1">
                  <li><strong>البحث النصي:</strong> كتابة كلمات أو مقاطع من الآيات مع التسامح التام مع التشكيل والهمزات.</li>
                  <li><strong>البحث الرقمي المباشر:</strong> كتابة رقم محدد للبحث عن مطابقته في المعيار المختار (مثل: <code className="bg-slate-200 px-1 rounded font-bold">114</code> أو <code className="bg-slate-200 px-1 rounded font-bold">500</code>).</li>
                  <li><strong>البحث بنطاق الأرقام:</strong> كتابة مدى رقمي مثل <code className="bg-slate-200 px-1 rounded font-bold">100-200</code> لجلب كل الآيات الواقعة ضمن هذا النطاق.</li>
                  <li><strong>الصيغ الرياضية والمتراجحات:</strong> كتابة تعبير مقارنة مثل <code className="bg-slate-200 px-1 rounded font-bold">&gt;= 500</code> أو <code className="bg-slate-200 px-1 rounded font-bold">&lt;= 19</code> أو <code className="bg-slate-200 px-1 rounded font-bold">= 63</code>.</li>
                </ul>
              </div>

              {/* Feature 2: Comparison Operators */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-2 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-600 rounded-t-xl" />
                <h5 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>2. رموز المقارنة الرياضية السريعة:</span>
                </h5>
                <p className="text-slate-600 font-medium">
                  أزرار واضحة ومباشرة (<strong className="font-mono text-emerald-900">= ، &gt; ، &lt; ، &gt;= ، &lt;=</strong>) بمجرد النقر عليها يتم إدراج المعامل في بداية صندوق البحث فوراً لتسريع المقارنة دون عناء كتابة الرموز من لوحة المفاتيح.
                </p>
                <div className="flex gap-1.5 pt-2">
                  {['=', '>', '<', '>=', '<='].map(sym => (
                    <span key={sym} className="px-2.5 py-1 bg-white border border-slate-300 font-mono font-black text-xs text-slate-800 rounded shadow-xs">
                      {sym}
                    </span>
                  ))}
                </div>
              </div>

              {/* Feature 3: Target Testing Criteria */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-2 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-indigo-600 rounded-t-xl" />
                <h5 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>3. المعيار المستهدف للاختبار (Target Criteria):</span>
                </h5>
                <p className="text-slate-600 font-medium">
                  يتيح تحديد البُعد الرياضي الذي يُطبق عليه البحث الرقمي والمتراجحات بنقرة واحدة:
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-bold">
                  <span className="p-1.5 bg-white border border-slate-200 rounded text-slate-800">• حساب الجُمّل</span>
                  <span className="p-1.5 bg-white border border-slate-200 rounded text-slate-800">• عدد الكلمات</span>
                  <span className="p-1.5 bg-white border border-slate-200 rounded text-slate-800">• عدد الحروف</span>
                  <span className="p-1.5 bg-white border border-slate-200 rounded text-slate-800">• رقم الآية</span>
                  <span className="p-1.5 bg-white border border-slate-200 rounded text-slate-800 col-span-2">• المجموع الكلي (الكلمات + الحروف)</span>
                </div>
              </div>

              {/* Feature 4: High-Visibility Stats Counter */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-2 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-teal-600 rounded-t-xl" />
                <h5 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Hash className="w-4 h-4 text-teal-600" />
                  <span>4. عداد إجمالي الآيات المطابقة:</span>
                </h5>
                <p className="text-slate-600 font-medium">
                  شريط إحصائي مركزي يوضح لحظياً عدد الآيات الناتجة عن شروط البحث من إجمالي آيات السورة، مع إمكانية تفريغ جميع الفلاتر بضغطة زر واحدة <strong>[تفريغ المدخلات ✕]</strong>.
                </p>
              </div>

            </div>

            {/* Universal Constants Section */}
            <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-3">
              <h5 className="font-black text-amber-950 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>5. فلاتر الثوابت القرآنية الكبرى والتوافقات الخاصة:</span>
              </h5>
              <p className="text-xs text-slate-700 font-medium">
                فلاتر استراتيجية فورية تفحص تطابق مقادير الآيات (في حساب الجمل، الكلمات، الحروف، أو المجموع) مع المقامات الشريفة التالية:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1 font-bold text-[11px]">
                <div className="bg-white p-2 border border-amber-200 rounded-lg text-emerald-950">
                  <span className="block text-amber-700">سور المصحف (114)</span>
                  تطابق الجمل أو المضاعفات مع 114
                </div>
                <div className="bg-white p-2 border border-amber-200 rounded-lg text-emerald-950">
                  <span className="block text-amber-700">أسماء الله الحسنى (99)</span>
                  تطابق الكثافة أو الجمل مع 99
                </div>
                <div className="bg-white p-2 border border-amber-200 rounded-lg text-emerald-950">
                  <span className="block text-amber-700">العمر النبوي الشريف (63)</span>
                  تطابق المقادير مع 63
                </div>
                <div className="bg-white p-2 border border-amber-200 rounded-lg text-emerald-950">
                  <span className="block text-amber-700">حروف الهجاء (28)</span>
                  تطابق الحروف والثوابت مع 28
                </div>
                <div className="bg-white p-2 border border-amber-200 rounded-lg text-emerald-950">
                  <span className="block text-amber-700">سنوات التنزيل (23)</span>
                  تطابق فترات الوحي مع 23
                </div>
                <div className="bg-white p-2 border border-amber-200 rounded-lg text-emerald-950">
                  <span className="block text-amber-700">السور النورانية (29)</span>
                  تطابق المقادير أو الكثافة مع عدد السور النورانية (29)
                </div>
                <div className="bg-white p-2 border border-amber-200 rounded-lg text-emerald-950">
                  <span className="block text-amber-700">الحروف النورانية (14)</span>
                  تطابق المقادير أو الكثافة مع الحروف المقطعة الفريدة (14)
                </div>
                <div className="bg-white p-2 border border-amber-200 rounded-lg text-emerald-950">
                  <span className="block text-amber-700">رقم السورة النشطة</span>
                  تطابق مقادير الآية مع ترتيب السورة بالمصحف
                </div>
                <div className="bg-white p-2 border border-amber-200 rounded-lg text-emerald-950">
                  <span className="block text-amber-700">الترتيب النوراني</span>
                  تطابق مع تسلسل السورة بين الـ 29
                </div>
                <div className="bg-white p-2 border border-amber-200 rounded-lg text-emerald-950">
                  <span className="block text-amber-700">التوافق الثلاثي الماسي</span>
                  تحقق الجمل والكلمات والحروف معاً
                </div>
              </div>
            </div>

            {/* Digital Roots 1-9 Breakdown */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
              <h5 className="font-black text-amber-300 text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>6. فلاتر الاختزال الرقمي الأحادي (الجذور الأحادية 1 - 9):</span>
              </h5>
              <p className="text-xs text-slate-300 font-medium">
                تتيح المنظومة تصفية الآيات بناءً على الجذر الأحادي المغلق (Digital Root) لأي من الأعمدة الحسابية الخمسة:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center pt-1 text-[11px] font-bold">
                <div className="bg-slate-800 p-2 border border-slate-700 rounded-lg text-amber-300">
                  اختزال الجُمَّل (1..9)
                </div>
                <div className="bg-slate-800 p-2 border border-slate-700 rounded-lg text-emerald-300">
                  اختزال الكلمات (1..9)
                </div>
                <div className="bg-slate-800 p-2 border border-slate-700 rounded-lg text-sky-300">
                  اختزال الحروف (1..9)
                </div>
                <div className="bg-slate-800 p-2 border border-slate-700 rounded-lg text-purple-300">
                  اختزال المجموع (1..9)
                </div>
                <div className="bg-slate-800 p-2 border border-slate-700 rounded-lg text-teal-300">
                  اختزال ناتج القسمة (1..9)
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Accordion 2: Screens & Architecture Guide */}
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
              <h3 className="text-base font-black text-slate-900">2️⃣ دليل شاشات المنظومة المتكاملة</h3>
              <p className="text-xs text-slate-500 font-medium">الشاشة المتكاملة، الرسوم البيانية، بطاقات السور، والحاسبة المفتوحة</p>
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
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  الشاشة المتكاملة (المدخلات + البحث + المخرجات)
                </h4>
                <p className="text-slate-600 font-medium">
                  الواجهة المركزية الموحدة؛ تضم تفكيك نصوص السور، الفلاتر والبحث الرياضي المتقدم، وعرض مصفوفة الجُمَّل والتحقق النوراني في بيئة عمل واحدة وسلسة.
                </p>
              </div>

              {/* Screen 2 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-indigo-600 rounded-t-xl" />
                <h4 className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  منصة الرسوم والموجات النورانية
                </h4>
                <p className="text-slate-600 font-medium">
                  توليد المنحنيات البيانية والموجات الرياضية لتتبع التذبذب العددي، ونقاط الاستواء والاتزان بين الآيات والفواتح.
                </p>
              </div>

              {/* Screen 3 */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500 rounded-t-xl" />
                <h4 className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  بطاقة تعريف وإحصائيات السور الـ 29
                </h4>
                <p className="text-slate-600 font-medium">
                  سجل متكامل لكل سورة من السور ذات الفواتح المقطعة يعرض ترتيب النزول، عدد الآيات والكلمات والحروف، ومعامل المفتاح النوراني.
                </p>
              </div>

              {/* Screen 4: Noorani Words Explorer */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 relative md:col-span-3">
                <div className="absolute top-0 right-0 left-0 h-1 bg-amber-400 rounded-t-xl" />
                <h4 className="font-black text-amber-950 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  مستكشف الكلمات النورانية في السور الـ 29 (شاشة مخصصة)
                </h4>
                <p className="text-slate-600 font-medium">
                  شاشة بحث واستكشاف حصرية تستخرج كافة كلمات السور الـ 29 النورانية التي تشتمل على الأحرف النورانية (الـ 14 حرفاً: نص حكيم قاطع له سر)، مع تحديد حروف الفاتحة الخاصة بكل سورة، ونسبة الحروف النورانية، وحساب الجُمَّل، والجذر الرقمي لكل كلمة.
                </p>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Accordion: Noorani Words Explorer Dedicated Guide */}
      <div className="bg-white border-2 border-amber-400 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button
          type="button"
          onClick={() => toggleSection('noorani_words')}
          className="w-full p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-white hover:bg-amber-100/40 flex items-center justify-between text-right border-b border-amber-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-amber-950">✨ دليل شاشة مستكشف الكلمات النورانية (السور الـ 29)</h3>
                <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded">جديد</span>
              </div>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                طريقة استخراج وفلترة الكلمات المشتملة على الحروف النورانية وفواتح السور الـ 29
              </p>
            </div>
          </div>
          {isOpen('noorani_words') ? <ChevronUp className="w-5 h-5 text-amber-800" /> : <ChevronDown className="w-5 h-5 text-amber-800" />}
        </button>

        {isOpen('noorani_words') && (
          <div className="p-6 space-y-5 text-xs leading-relaxed text-slate-700 bg-white">
            
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-950 space-y-2">
              <h4 className="text-sm font-black flex items-center gap-1.5">
                <span>🎯 الهدف من شاشة الكلمات النورانية:</span>
              </h4>
              <p className="font-semibold text-xs leading-relaxed text-slate-800">
                بناءً على طلب الباحث، تم تخصيص هذه الشاشة لاستخراج ودراسة الكلمات القرآنية التي تشتمل على <strong>الحروف النورانية الـ 14</strong> المكونة للفواتح المقطعة (<span className="text-emerald-900 font-bold">ن ص ح ك ي م ق ط ع س خ ر غ هـ</span> / جملة: <em>«نص حكيم قاطع له سر»</em>)، أو المطابقة لحروف فاتحة سورة محددة من السور الـ 29 (مثل: أ-ل-م، أ-ل-ر، ط-س-م، ك-هـ-ي-ع-ص، ح-م، ق، ن).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Feature 1 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-black text-emerald-950 text-xs flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-emerald-700" />
                  1. تحديد السورة النورانية أو البحث الشامل:
                </span>
                <p className="text-slate-600 font-medium text-[11px]">
                  يمكنك اختيار سورة محددة من قائمة السور الـ 29 النورانية، أو تفعيل خيار <strong>«كافة السور النورانية الـ 29»</strong> للبحث في مجموع ألفاظ هذه السور دفعة واحدة.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-black text-amber-950 text-xs flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-700" />
                  2. فلترة مطابقة حروف الفاتحة الخاصة:
                </span>
                <p className="text-slate-600 font-medium text-[11px]">
                  عند تفعيل خيار <strong>«مطابقة حروف الفاتحة الخاصة بالسورة فقط»</strong>، يستبعد البرنامج الكلمات التي تحتوي على حروف نورانية عامة ويركز فقط على الكلمات التي تحوي أحرف افتتاح السورة ذاتها (مثال: في سورة مريم يركز على ك، هـ، ي، ع، ص).
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-black text-indigo-950 text-xs flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-indigo-700" />
                  3. الإحصاءات والأوزان الرقمية لكل كلمة:
                </span>
                <p className="text-slate-600 font-medium text-[11px]">
                  لكل كلمة مستخرجة، يُحسب: عدد حروف الكلمة الكلي، عدد الحروف النورانية بها، نسبة الكثافة النورانية، قيمة حساب الجُمَّل الصافي للكلمة، والجذر الرقمي الأحادي (1-9).
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-black text-cyan-950 text-xs flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-700" />
                  4. التصدير المباشر للجداول:
                </span>
                <p className="text-slate-600 font-medium text-[11px]">
                  تصدير قائمة الكلمات النورانية المفلترة مباشرة بصيغ Excel أو Word أو CSV مع إمكانية تسمية الملف يدوياً لتوثيق نتائج الاستقصاء.
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
              <h3 className="text-base font-black text-slate-900">3️⃣ شرح خوارزمية المعايرة الرقمية المزدوجة والتوافقات الستة</h3>
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
                  <strong>الدور الرياضي:</strong> تحسب هذه المعادلة الوزن الهيكلي للآية مضافاً إليه تسلسلها النصي مقسوماً على وزن الفواتح النورانية للسورة. في حال كان ناتج القسمة عدداً صحيحاً بدون باقٍ، يُثبت الاستواء الموجي للآية.
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

            {/* The 6 Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-black text-emerald-900 text-xs flex items-center justify-between">
                  <span>1. توافق الجُمل المباشر:</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono">الجُمَّل % N == 0</span>
                </div>
                <p className="text-slate-600 text-[11px] font-medium">
                  قابلية انقسام قيمة حساب الجمل الصريح للآية مباشرة على المعامل النوراني N بدون باقٍ.
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

          </div>
        )}
      </div>

      {/* Accordion 4: Export Operations & Manual Naming */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button
          type="button"
          onClick={() => toggleSection('export')}
          className="w-full p-5 bg-slate-50 hover:bg-amber-50/50 flex items-center justify-between text-right border-b border-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 text-white rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">4️⃣ دليل تصدير التقارير وتسمية الملفات يدوياً</h3>
              <p className="text-xs text-slate-500 font-medium">حفظ الجداول بصيغ Excel و Word و CSV ورسوم بيانية مع خيار التسمية المباشرة</p>
            </div>
          </div>
          {isOpen('export') ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
        </button>

        {isOpen('export') && (
          <div className="p-6 space-y-4 text-xs leading-relaxed text-slate-700 bg-white">
            <p className="text-slate-600 font-medium">
              يدعم البرنامج تصدير نتائج التحليل وفلاتر البحث النشطة بصيغ احترافية متعددة:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1 text-emerald-950">
                <span className="font-black text-xs block">📊 تصدير Excel (XLSX)</span>
                <p className="text-[11px] text-slate-600">ملف جداول إلكترونية متكامل جاهز للعمليات الإحصائية المتقدمة وتنسيق الخلايا التلقائي.</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl space-y-1 text-blue-950">
                <span className="font-black text-xs block">📝 تصدير Word (DOCX)</span>
                <p className="text-[11px] text-slate-600">تقرير مكتوب ومنسق بالخطوط والألوان الرسمية مناسب للطباعة والمراجعة الورقية.</p>
              </div>
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl space-y-1 text-slate-950">
                <span className="font-black text-xs block">📑 تصدير CSV المفتوح</span>
                <p className="text-[11px] text-slate-600">ملف بيانات خام بتشفير UTF-8 للاستيراد في البرمجيات الإحصائية وقواعد البيانات.</p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-300 rounded-xl space-y-1 text-purple-950">
                <span className="font-black text-xs block">🖼️ تصدير صورة المخطط (PNG)</span>
                <p className="text-[11px] text-slate-600">حفظ المنحنى البياني بدقة فائقة كصورة عالية الجودة للنشر والتوثيق.</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-semibold flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span>
                <strong>ميزة التسمية اليدوية للملف:</strong> عند النقر على أي من أزرار التصدير، تظهر لك نافذة إدخال فورية (Prompt) تمكنك من كتابة وتعديل اسم الملف بحرية تامة قبل الحفظ على جهازك.
              </span>
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
              <h3 className="text-base font-black text-slate-900">5️⃣ دليل الألوان التمييزية والشفرات البصرية في الجداول</h3>
              <p className="text-xs text-slate-500 font-medium">سبب ظهور كل لون في جداول المخرجات والنتائج الإحصائية</p>
            </div>
          </div>
          {isOpen('legend') ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
        </button>

        {isOpen('legend') && (
          <div className="p-6 space-y-4 text-xs leading-relaxed text-slate-700 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <span className="font-black text-emerald-950 block text-xs">🟢 الأخضر الزمردي</span>
                  <span className="text-[11px] text-emerald-800 font-semibold">توافق الجُمل المباشر مع المعامل النوراني</span>
                </div>
              </div>

              <div className="p-3 bg-sky-50 border-2 border-sky-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <span className="font-black text-sky-950 block text-xs">🔵 الأزرق السماوي</span>
                  <span className="text-[11px] text-sky-800 font-semibold">التوافق الهيكلي (الجمل + رقم الآية)</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <span className="font-black text-amber-950 block text-xs">🟣 العنبري / الأرجواني</span>
                  <span className="text-[11px] text-amber-800 font-semibold">التوافق الكثيفي (الكلمات + الحروف)</span>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-yellow-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </div>
                <div>
                  <span className="font-black text-yellow-950 block text-xs">🟡 الذهبي / الأصفر</span>
                  <span className="text-[11px] text-yellow-800 font-semibold">التوافق التراكمي الشامل للمواصفات</span>
                </div>
              </div>

              <div className="p-3 bg-teal-50 border-2 border-teal-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  5
                </div>
                <div>
                  <span className="font-black text-teal-950 block text-xs">🩵 التيل / الكحلي المائي</span>
                  <span className="text-[11px] text-teal-800 font-semibold">توافق شفرة حم / عسق الحواميم</span>
                </div>
              </div>

              <div className="p-3 bg-orange-50 border-2 border-orange-300 rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  6
                </div>
                <div>
                  <span className="font-black text-orange-950 block text-xs">🟠 البرتقالي المشرق</span>
                  <span className="text-[11px] text-orange-800 font-semibold">التوافق التوحيدي (شفرة 11 أو 1)</span>
                </div>
              </div>

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

      {/* Grid of Abjad Letters Metadata & Uthmani Script Rules */}
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

        <div className="bg-[#fcfbf7] border-2 border-amber-300 p-5 rounded-xl space-y-3 relative mt-4 shadow-sm">
          <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-r-xl" />
          <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
            <span>📌 قواعد المعالجة والتوحيد الحرفي في منظومة «البنيان»</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">الميثاق الأبجدي المعتمد</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            
            {/* Rule Group 1: Cleaning and Stripping */}
            <div className="p-3.5 bg-white border border-amber-200/90 rounded-xl space-y-2">
              <span className="font-black text-emerald-900 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                1. تجريد التشكيل وضبط الرسم القرآني:
              </span>
              <ul className="text-xs text-slate-700 space-y-1.5 font-medium leading-relaxed list-disc list-inside">
                <li><strong>إزالة كافة علامات التشكيل والحركات:</strong> الفتحة، الضمة، الكسرة، والسكون.</li>
                <li><strong>إزالة التنوين بأنواعه:</strong> تنوين الضم، تنوين الفتح، وتنوين الكسر.</li>
                <li><strong>إزالة الشدّة وعلامات المد:</strong> إزالة علامة الشدة (<code className="text-amber-900 font-mono text-[11px]">\u0651</code>) وعلامات المد والصلة دون المساس بالأصل الحرفي.</li>
                <li><strong>إزالة التطويل (الكشيدة ـ):</strong> إزالة الكشيدة (<code className="text-amber-900 font-mono text-[11px]">\u0640</code>) وتوحيد الامتدادات.</li>
                <li><strong>إزالة علامات الوقف والضبط والرموز غير الأبجدية:</strong> استبعاد كافة علامات الوقف والوصل ورؤوس الآيات والزخارف (مثل: ۭ, ۢ, ۥ, , ۖ, ۚ, ۗ, ۘ, ۙ, ۜ, ۞, ۩) قبل حساب الجُمل وعدّ الحروف.</li>
              </ul>
            </div>

            {/* Rule Group 2: Uthmani Script Rule for Written Letters */}
            <div className="p-3.5 bg-white border border-amber-200/90 rounded-xl space-y-2">
              <span className="font-black text-emerald-900 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                2. اعتماد الرسم العثماني للأحرف المكتوبة فقط:
              </span>
              <ul className="text-xs text-slate-700 space-y-1.5 font-medium leading-relaxed list-disc list-inside">
                <li><strong>تثبيت الألف الخنجرية (<code className="text-emerald-900 font-mono text-[11px]">\u0670 / ٰ</code>):</strong> تُحسب ألفاً صريحة بقيمة عددية <strong className="text-emerald-900 font-black">(1)</strong> في حساب الجُمَّل وتُعد حرفاً مستقلاً لكونها ثابتة كتابةً في النص العثماني.</li>
                <li><strong>احتساب الحرف المشدد:</strong> يُحتسب الحرف المشدد كحرف واحد فقط دون مضاعفة، وفق الرسم العثماني المكتوب وليس المنطوق الصوتي.</li>
                <li><strong>الألف والهمزات:</strong> توحيد كافة صور الألف والهمزات (أ، إ، آ، ٱ، ء) بقيمة الألف الأساسية <strong className="text-emerald-900 font-black">(1)</strong>.</li>
                <li><strong>التاء والتاء المربوطة:</strong> احتساب التاء المفتوحة (ت) والتاء المربوطة (ة) بقيمة <strong className="text-emerald-900 font-black">(400)</strong>، والهاء (هـ / ه) بقيمة <strong className="text-emerald-900 font-black">(5)</strong>.</li>
                <li><strong>الياء والألف المقصورة:</strong> احتساب الياء (ي)، الألف المقصورة (ى)، والهمزة على نبرة (ئ) بقيمة <strong className="text-emerald-900 font-black">(10)</strong>، والواو والهمزة على واو (و، ؤ) بقيمة <strong className="text-emerald-900 font-black">(6)</strong>.</li>
              </ul>
            </div>

          </div>

          {/* Rule Group 3: Verified Exact Overrides */}
          <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl text-xs text-slate-800 space-y-1.5">
            <div className="font-black text-amber-950 flex items-center justify-between">
              <span>🎯 الضبط الحسابي التوثيقي للآيات الخاصة (تصحيح مضاعفة الشدة في المراجع):</span>
              <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-mono font-bold">5 آيات موثقة</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
              تم تدقيق وتثبيت حساب الجُمَّل الصافي وفق قاعدة الحرف المكتوب الصارم دون مضاعفة الشدة في الآيات التالية:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center pt-1 font-mono text-[11px] font-bold">
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <span className="block text-slate-500 text-[10px] font-sans">يونس (15)</span>
                <span className="text-emerald-900 font-black">11885</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <span className="block text-slate-500 text-[10px] font-sans">هود (37)</span>
                <span className="text-emerald-900 font-black">5096</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <span className="block text-slate-500 text-[10px] font-sans">الكهف (110)</span>
                <span className="text-emerald-900 font-black">4317</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <span className="block text-slate-500 text-[10px] font-sans">طه (114)</span>
                <span className="text-emerald-900 font-black">3674</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <span className="block text-slate-500 text-[10px] font-sans">الأنبياء (45)</span>
                <span className="text-emerald-900 font-black">3434</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
