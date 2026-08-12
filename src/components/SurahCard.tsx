import React from 'react';
import { SurahMetadata, getSurahMetadata } from '../utils/surahMetadata';
import { NooraniSurah } from '../utils/jummal';
import { BookOpen, Calendar, HelpCircle, Sparkles, Printer, Copy, FileText } from 'lucide-react';

interface SurahCardProps {
  activeSurah: NooraniSurah | null;
}

export default function SurahCard({ activeSurah }: SurahCardProps) {
  if (!activeSurah) {
    return (
      <div className="bg-white border-2 border-slate-200 p-8 text-center space-y-4" dir="rtl">
        <HelpCircle className="w-12 h-12 text-amber-500 mx-auto" strokeWidth={1.5} />
        <h3 className="text-base font-black text-slate-800">لم يتم اختيار أي سورة نشطة لعرض البطاقة التعريفية</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
          الرجاء التوجه أولاً لعلامة تبويب <span className="text-slate-900 font-extrabold">المدخلات والمخرجات</span> واختيار السورة المطلوبة من قائمة السور الكريمة لتفعيل بطاقة المعالم والخصائص.
        </p>
      </div>
    );
  }

  // Retrieve additional academic metadata using helper
  const meta: SurahMetadata = getSurahMetadata(activeSurah.id);

  // Immediate print function triggering browser print dialogue
  const handlePrint = () => {
    // We create a clean styling, isolate the metadata card and execute print.
    const printContent = document.getElementById('printableSurahCard')?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      const printWindow = window.open('', '', 'width=800,height=900');
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl" lang="ar">
            <head>
              <title>بطاقة تعريف السورة الكريمة - برنامج البنيان</title>
              <style>
                body {
                  font-family: 'Inter', system-ui, -apple-system, sans-serif;
                  direction: rtl;
                  padding: 40px;
                  color: #0f172a;
                  line-height: 1.8;
                }
                .header {
                  text-align: center;
                  border-bottom: 3px double #334155;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .title {
                  font-size: 26px;
                  font-weight: 900;
                  margin: 0;
                }
                .subtitle {
                  font-size: 14px;
                  color: #475569;
                  margin-top: 5px;
                }
                .grid {
                  display: grid;
                  grid-template-cols: 1fr 1fr;
                  gap: 15px;
                  margin-bottom: 30px;
                }
                .grid-item {
                  border: 1px solid #cbd5e1;
                  padding: 12px;
                  background: #f8fafc;
                }
                .label {
                  font-size: 11px;
                  font-weight: bold;
                  color: #64748b;
                  display: block;
                }
                .value {
                  font-size: 14px;
                  font-weight: 800;
                  color: #0f172a;
                }
                .block {
                  border: 1px solid #cbd5e1;
                  padding: 15px;
                  margin-bottom: 20px;
                  background: #ffffff;
                }
                .block-title {
                  font-size: 13px;
                  font-weight: 900;
                  border-bottom: 2px solid #0f172a;
                  padding-bottom: 5px;
                  margin-top: 0;
                  margin-bottom: 12px;
                  color: #0f172a;
                }
                .quran-verse {
                  text-align: center;
                  font-size: 18px;
                  font-weight: bold;
                  color: #1e293b;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  font-size: 10px;
                  color: #94a3b8;
                  margin-top: 50px;
                  border-top: 1px solid #e2e8f0;
                  padding-top: 15px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="title">بِطَاقَةُ تَعْرِيفِ سُورَةِ ${meta.name} الكَرِيمَةِ</div>
                <div class="subtitle">صادرة عن برنامج البنيان للتعديل والتحرير والاستقصاء العددي للقرآن الكريم</div>
              </div>
              
              <div class="grid">
                <div class="grid-item">
                  <span class="label">اسم السورة وثابت الحروف:</span>
                  <span class="value">سورة ${meta.name} - الحروف النورانية (${activeSurah.letters || 'لا يوجد'})</span>
                </div>
                <div class="grid-item">
                  <span class="label">حدود السورة وأرقام الأجزاء:</span>
                  <span class="value">${meta.juzStartEnd}</span>
                </div>
                <div class="grid-item">
                  <span class="label">ترتيب السورة ومكان النزول:</span>
                  <span class="value">الترتيب بالمصحف: ${meta.orderInQuran} | مكان النزول: ${meta.revelationPlace}</span>
                </div>
                <div class="grid-item">
                  <span class="label">ترتيب النزول الإلهي:</span>
                  <span class="value">سورة رقم ${meta.revelationOrder} بالنزول</span>
                </div>
                <div class="grid-item">
                  <span class="label">ترتيب السورة بين السور النورانية الـ 29:</span>
                  <span class="value">السورة رقم (${meta.nooraniOrder})</span>
                </div>
                <div class="grid-item">
                  <span class="label">رقم الحزب الإحصائي للشيت:</span>
                  <span class="value">${meta.hizbStartEnd}</span>
                </div>
                <div class="grid-item">
                  <span class="label">إجمالي الكلمات والحروف:</span>
                  <span class="value">كلمات: ${meta.totalWords} | حروف: ${meta.totalLetters} | آيات: ${meta.totalVerses}</span>
                </div>
                <div class="grid-item">
                  <span class="label">القيمة الحسابية الكلية للأصل:</span>
                  <span class="value">قيمة حساب الجمل للمفتاح: ${activeSurah.keyValue} | جذر المفتاح: ${activeSurah.digitalRoot}</span>
                </div>
              </div>

              <div class="block">
                <div class="block-title">أسباب نزول السورة المباركة ومناسبة البعثة:</div>
                <div>${meta.revelationReason}</div>
              </div>

              <div class="block">
                <div class="block-title">عن أي شيء تتحدث السورة (المقاصد والمحاور الموضوعية):</div>
                <div>${meta.briefTopic}</div>
              </div>

              <div class="quran-verse">
                "إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ"
              </div>

              <div class="footer">
                تقرير رسمي مستخرج تلقائياً • برنامج البنيان للقرآن الكريم • حقوق الدراسة مكفولة للباحثين والأكاديميين 2026©
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="bg-white border-2 border-slate-250 p-6 md:p-8 space-y-8 text-right relative" dir="rtl">
      {/* Upper absolute gold accent stripe */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-yellow-600" />

      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-yellow-50 border border-yellow-250 text-yellow-700">
            <FileText className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">بطاقة التعريف والتوثيق الكبرى للسورة الكريمة 📋</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">عرض شامل للمقاييس التاريخية والإحصائية والموضوعية للسورة.</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-black text-xs rounded-none transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 self-start sm:self-center"
        >
          <Printer className="w-4 h-4 text-yellow-105" />
          <span>طباعة بطاقة التعريف فورياً (A4) 🖨️</span>
        </button>
      </div>

      {/* Printable Wrapper */}
      <div id="printableSurahCard" className="space-y-6">
        {/* Top summary grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-200 p-4 text-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">سورة</span>
            <span className="text-xl font-black text-slate-900 block quran-font mt-1">{meta.name}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 text-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">ترتيب المصحف</span>
            <span className="text-xl font-black text-slate-900 block font-mono mt-1">{meta.orderInQuran}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 text-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">ترتيب السور الـ 29</span>
            <span className="text-xs font-black text-yellow-700 block mt-1.5">{meta.nooraniOrder}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 text-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">رقم النزول ومكانه</span>
            <span className="text-sm font-black text-slate-800 block mt-1.5">{meta.revelationPlace} (نزول {meta.revelationOrder})</span>
          </div>
        </div>

        {/* Detailed parameters board */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 p-6">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-950 flex items-center gap-1">
              <span className="w-1.5 h-3 bg-yellow-600 block" />
              المعايير والبيانات الرقمية والموقعية:
            </h4>
            <table className="w-full text-xs text-right border-collapse">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 font-bold text-slate-400">رقم الجزء:</td>
                  <td className="py-2.5 font-black text-slate-900">{meta.juzStartEnd}</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-slate-400">رقم الحزب الإحصائي للشيت:</td>
                  <td className="py-2.5 font-black text-slate-900">{meta.hizbStartEnd}</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-slate-400">عدد الآيات الكلي:</td>
                  <td className="py-2.5 font-black text-slate-900 font-mono">{meta.totalVerses} آية</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-slate-400">عدد كلمات السورة الإجمالي:</td>
                  <td className="py-2.5 font-black text-slate-900 font-mono">{meta.totalWords} كلمة</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-slate-400">عدد حروف السورة الإجمالي:</td>
                  <td className="py-2.5 font-black text-slate-900 font-mono">{meta.totalLetters} حرفاً</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4 md:border-r md:border-slate-200 md:pr-6">
            <h4 className="text-xs font-black text-slate-955 flex items-center gap-1">
              <span className="w-1.5 h-3 bg-yellow-600 block" />
              تعداد موازين الأصل البنياني ({activeSurah.letters}):
            </h4>
            <div className="space-y-3 pt-2">
              <div className="bg-white border border-slate-200 rounded-none p-3 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">الحروف النورانية الافتتاحية:</span>
                <span className="quran-font font-black text-slate-900 text-sm bg-slate-55 px-1.5 py-0.5">{activeSurah.letters}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-none p-3 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">القيمة الحسابية للمفتاح (ن):</span>
                <span className="font-mono font-black text-slate-900">{activeSurah.keyValue}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-none p-3 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">الجذر الاختزالي (البنيان):</span>
                <span className="font-mono font-black text-slate-900">{activeSurah.digitalRoot}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Text descriptions (revelation reasons & topics) */}
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-none space-y-2">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-yellow-600" />
              أسباب النزول والمناسبات التاريخية بمكة/المدينة:
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {meta.revelationReason}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-5 rounded-none space-y-2">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-yellow-600" />
              عن أي شيء تتحدث السورة (المقاصد الكبرى والمحاور والمواضيع):
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {meta.briefTopic}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
