import React, { useState } from 'react';
import { CheckCircle2, X, Sparkles, Laptop, Smartphone, ArrowDownToLine, RefreshCw, ExternalLink } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface OfflinePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflinePackageModal: React.FC<OfflinePackageModalProps> = ({ isOpen, onClose }) => {
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const { isInstallable, isInstalled, isInIframe, isMobile, triggerInstall, resetInstallState } = usePwaInstall();

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleInstallClick = async () => {
    // Trigger native installation prompt immediately within user gesture
    const res = await triggerInstall();
    if (res === 'accepted') {
      setDownloadStatus('🎉 تم تسطيب وتثبيت تطبيق البنيان بنجاح! ستجد أيقونة التطبيق الآن على شاشتك الرئيسية.');
    } else if (res === 'dismissed') {
      setDownloadStatus('تم إلغاء التثبيت من نافذة المتصفح.');
    } else if (res === 'iframe') {
      setDownloadStatus('أنت داخل إطار المعاينة؛ يرجى الضغط على زر «الانتقال إلى صفحة البرنامج المنعزلة» للتسطيب الفوري.');
    } else {
      if (isMobile) {
        setDownloadStatus('لتثبيت التطبيق على الهاتف: اضغط على قائمة متصفح Chrome (الثلاث نقاط ⋮ أعلى الشاشة) ثم اختر «تثبيت التطبيق» (Install app) أو «إضافة إلى الشاشة الرئيسية».');
      } else {
        setDownloadStatus('لتثبيت التطبيق على الكمبيوتر: اضغط على أيقونة التثبيت (💻 أو ➕) في شريط عنوان متصفح Chrome بجوار النجمة، أو من قائمة المتصفح (⋮) اختر «تثبيت البنيان».');
      }
    }
  };

  const handleCleanCache = async () => {
    setIsCleaning(true);
    setDownloadStatus('جارٍ تفريغ وتصفير النسخ السابقة وتنشيط بيئة التثبيت الجديدة...');
    try {
      await resetInstallState();
      setDownloadStatus('تم تفريغ وتصفير النسخ السابقة بنجاح! بيئة التطبيق نظيفة الآن وجاهزة للتسطيب فوراً.');
    } catch {
      setDownloadStatus('تم تحديث الذاكرة.');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in"
      dir="rtl"
    >
      <div className="bg-white border-2 border-emerald-700/80 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative text-right">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-[#05231c] text-white p-5 px-6 relative border-b-2 border-amber-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 border border-amber-400/40 rounded-xl flex items-center justify-center text-amber-300">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
                  <span>تثبيت وتشغيل تطبيق البنيان (الهاتف والحاسوب وأوفلاين)</span>
                  <Sparkles className="w-4 h-4 text-amber-400 inline" />
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 font-semibold">
                  تسطيب وتثبيت مباشر كتطبيق مستقل بأيقونة خاصة
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-emerald-800/50 rounded-lg transition-all cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Main App Direct Install Card */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 border-2 border-amber-400/80 text-white p-5 rounded-2xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-amber-400 text-emerald-950 rounded-xl flex items-center justify-center font-black shadow">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                    <span>📱 تسطيب وتثبيت تطبيق البنيان على جهازك مباشرة</span>
                  </h4>
                  <p className="text-[11px] text-slate-200">
                    يعمل كتطبيق مستقل كامل بأيقونة وشاشة خاصة دون الحاجة لمتصفح ودون أي تعقيدات
                  </p>
                </div>
              </div>
              {isInstalled && (
                <span className="px-2.5 py-1 bg-emerald-500 text-white text-[11px] font-black rounded-lg">
                  مُثبّت مسبقاً ✓
                </span>
              )}
            </div>

            {/* If in iframe: Dedicated Escape Link to Isolated Google App Page */}
            {isInIframe && (
              <div className="bg-emerald-950/90 border-2 border-amber-400/70 p-4 rounded-xl space-y-2 text-slate-200">
                <div className="flex items-center gap-2 text-amber-300 font-black text-xs sm:text-sm">
                  <ExternalLink className="w-4 h-4" />
                  <span>الخطوة الأولى: الانتقال إلى صفحة البرنامج المنعزلة</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  أنت تتصفح حالياً من داخل إطار المعاينة؛ لتتمكن من تسطيب التطبيق بنقرة واحدة، اضغط على الرابط التالي لفتح البرنامج في صفحة مستقلة:
                </p>
                <div className="pt-1">
                  <a
                    href={currentAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>الانتقال لصفحة البرنامج المنعزلة والتسطيب الفوري 🚀</span>
                  </a>
                </div>
              </div>
            )}

            {/* Quick Steps Guide */}
            <div className="bg-emerald-950/70 border border-emerald-700/50 p-3.5 rounded-xl text-xs space-y-2 text-slate-200">
              <div className="font-bold text-amber-200 flex items-center gap-2">
                <span>خطوات التسطيب البسيطة (تفريغ وتصفير + تثبيت فوري):</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-200">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-emerald-950 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>
                    اضغط على زر <strong>«تسطيب وتثبيت تطبيق البنيان (تفريغ وتثبيت فوري)»</strong> أدناه.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-emerald-950 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>
                    يقوم البرنامج تلقائياً بتفريغ وتصفير أي بيانات قديمة، ثم يفتح نافذة التثبيت الرسمية.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-emerald-950 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>
                    اضغط <strong>[تثبيت]</strong> لتنزل أيقونة التطبيق الرسمية فوراً على شاشة هاتفك أو جهازك.
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Unified One-Click Install */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isCleaning}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-emerald-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70"
              >
                <ArrowDownToLine className="w-5 h-5" />
                <span>
                  {isInstallable
                    ? 'تسطيب وتثبيت تطبيق البنيان على جهازك الآن 📲'
                    : '⚡ تسطيب وتثبيت تطبيق البنيان (تثبيت مباشر) 📲'}
                </span>
              </button>

              {/* Optional Cache Reset for Cloned/Previous Versions */}
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-300">
                <span>إذا كانت لديك نسخة سابقة أو مستنسخة وتريد تصفيرها:</span>
                <button
                  type="button"
                  onClick={handleCleanCache}
                  disabled={isCleaning}
                  className="text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCleaning ? 'animate-spin' : ''}`} />
                  <span>تفريغ وتصفير النسخ السابقة (نسخة نظيفة)</span>
                </button>
              </div>
            </div>

            {/* Always-Active Chrome Menu Install Tip */}
            <div className="bg-emerald-950/80 border border-emerald-700/60 p-3 rounded-xl text-xs space-y-1.5 text-slate-200">
              <div className="font-bold text-amber-300 text-[11px] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>طريقة التثبيت المباشرة في حال إلغاء تنشيط الزر بعد التثبيت:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                إذا تم التثبيت مسبقاً وألغى المتصفح تنشيط الزر التلقائي: يمكنك دائماً تنزيل الأيقونة فوراً من متصفح Chrome نفسه:
                اضغط على قائمة الثلاث نقاط (<strong>⋮</strong>) في أعلى زاوية المتصفح ⬅️ ثم اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong> أو <strong>«تثبيت التطبيق»</strong> لتظهر الأيقونة فوراً على شاشتك.
              </p>
            </div>
          </div>

          {/* Live Status Feedback */}
          {downloadStatus && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2 animate-fade-in">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="leading-relaxed">{downloadStatus}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100/90 border-t border-slate-200 p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>متوافق مع الهواتف المحمولة (Android / iPhone) والحواسيب (Windows / Mac / Linux)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-lg cursor-pointer transition-all"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
