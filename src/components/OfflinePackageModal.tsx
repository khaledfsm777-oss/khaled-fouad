import React, { useState } from 'react';
import { Download, FileCode, Archive, CheckCircle2, X, Sparkles, Laptop, ShieldCheck, Loader2, Smartphone, ArrowDownToLine, RefreshCw, ExternalLink } from 'lucide-react';
import { downloadStandaloneHtmlFile, downloadStandaloneZipFile } from '../utils/standaloneDownloader';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface OfflinePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflinePackageModal: React.FC<OfflinePackageModalProps> = ({ isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const { isInstallable, isInstalled, isInIframe, isMobile, triggerInstall, cleanOldCaches, resetInstallState } = usePwaInstall();

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleDownloadHtml = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadStandaloneHtmlFile((msg) => setDownloadStatus(msg));
    } catch (err: any) {
      setDownloadStatus(err.message || 'حدث خطأ أثناء التنزيل.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadStandaloneZipFile((msg) => setDownloadStatus(msg));
    } catch (err: any) {
      setDownloadStatus(err.message || 'حدث خطأ أثناء التنزيل.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInstallClick = async () => {
    // Trigger native installation prompt immediately within user gesture
    const res = await triggerInstall();
    if (res === 'accepted') {
      setDownloadStatus('🎉 تم تسطيب وتثبيت تطبيق البنيان بنجاح! ستجد أيقونة التطبيق الآن على شاشتك الرئيسية.');
    } else if (res === 'dismissed') {
      setDownloadStatus('تم إلغاء التثبيت من نافذة المتصفح.');
    } else if (res === 'iframe') {
      setDownloadStatus('أنت داخل إطار المعاينة؛ يرجى الضغط على زر «الانتقال إلى صفحة البرنامج المنعزلة» أعلاه للتسطيب الفوري.');
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
      <div className="bg-white border-2 border-emerald-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative text-right">
        
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
                  تسطيب وتثبيت مباشر كتطبيق مستقل + تحميل ملف HTML الشامل
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
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
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
                  <span>الخطوة الأولى: الانتقال إلى صفحة البرنامج المنعزلة (Google App)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  أنت تتصفح حالياً من داخل إطار المعاينة؛ لتتمكن من تسطيب التطبيق بنقرة واحدة بدون أي تداخل، اضغط على الرابط التالي لفتح البرنامج في صفحة جوجل المستقلة:
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

          {/* Windows Portable & Flash Drive Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border-2 border-amber-400 text-white p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-black shadow-md">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                    <span>💻 حزمة تشغيل ويندوز المحمولة للفلاش ميموري (USB Portable Package)</span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    تعمل على أي كمبيوتر أو لابتوب من الفلاشة مباشرة بدون تثبيت وبدون إنترنت
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg hidden sm:inline-block shadow-sm">
                نسخة الفلاشة 💾
              </span>
            </div>

            <div className="bg-slate-950/70 border border-amber-400/40 p-3.5 rounded-xl text-xs space-y-2 text-slate-200">
              <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <span>✨ مميزات تشغيل البرنامج من الفلاشة (USB Flash Drive):</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside leading-relaxed">
                <li>لا يحتاج إلى تثبيت (Zero Installation)؛ انقله على أي فلاشة وشغله في أي مكان فوراً.</li>
                <li>يحتوي على مشغل صامت مباشر ومشغل نوافذ مكتبية مستقلة بأيقونة البنيان.</li>
                <li>يحتوي على كافة النصوص القرآنية وخوارزميات الحساب مع الدعم الكامل للتصدير والطباعة.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <a
                href="/api/download-windows-app"
                download="AlBunyan-Windows-Portable.zip"
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>تحميل حزمة الفلاشة المحمولة لويندوز (ZIP فوري خفيف 2 ميجابايت) 🚀</span>
              </a>
            </div>
          </div>

          {/* Overview Note */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-950 font-black text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>خيار التشغيل أوفلاين المستقل (100% Inlined Standalone Architecture):</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              تم تجميع ودمج كافة ملفات المشروع: نصوص القرآن الكريم كاملة (6236 آية)، محرك حساب الجمل، خوارزميات السور الـ 29 النورانية، الخطوط العربية (Amiri)، وتنسيقات CSS وأكواد الـ JavaScript <strong>داخل ملف HTML مستقل واحد فقط</strong>، مع أيقونة البرنامج المدمجة ليعمل بدون إنترنت نهائياً.
            </p>
          </div>

          {/* Download Action Card - Single Direct HTML Button */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              التحميل المباشر للتشغيل على حاسوبك وهاتفك أوفلاين:
            </h4>

            {/* In-Memory Safe Download Trigger */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              disabled={isDownloading}
              className="w-full text-right block p-5 bg-gradient-to-r from-emerald-600/10 via-amber-500/10 to-white border-2 border-emerald-600 hover:border-emerald-700 disabled:opacity-60 rounded-xl transition-all group hover:shadow-lg cursor-pointer text-slate-900"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    {isDownloading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
                    ) : (
                      <FileCode className="w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 group-hover:text-emerald-950 transition-colors">
                        تحميل ملف البنيان المستقل (HTML أوفلاين فوري)
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-black rounded">
                        جاهز ومضمون
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      ملف واحد متكامل (يعمل بالنقر المزدوج على أي متصفح بالكمبيوتر أو الموبايل بدون إنترنت وبدون فك ضغط)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 group-hover:bg-emerald-800 text-white font-black text-xs rounded-lg shrink-0 shadow-md">
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارٍ التنزيل...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>تنزيل ملف HTML الآن</span>
                    </>
                  )}
                </div>
              </div>
            </button>

            {/* Important Tip for opening HTML on Android to avoid Samsung viewer issue */}
            <div className="p-3 bg-emerald-50 border border-emerald-300/80 rounded-xl text-xs space-y-1 text-emerald-950">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span>💡 نصيحة هامة لمستخدمي هواتف أندرويد عند فتح ملف HTML:</span>
              </div>
              <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                إذا قمت بفتح الملف المحمل وظهرت لك شاشة بيضاء تدور فيها دائرة انتظار (عارض المستندات الافتراضي)، اضغط مطولاً على الملف داخل تطبيق الملفات أو التنزيلات واختر: <strong>«فتح باستخدام» ثم اختر متصفح (Google Chrome)</strong>، وسيعمل معك فوراً أوفلاين بكامل مميزاته.
              </p>
            </div>

            {/* Secondary Direct Link for Browsers with Pop-up/Download Restrictions */}
            <div className="flex items-center justify-between px-2 text-[11px] text-slate-500">
              <span>إذا تعذر التنزيل التلقائي في متصفحك:</span>
              <a
                href="/api/download-standalone-html"
                download="AlBunyan-Offline.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer flex items-center gap-1"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>رابط تنزيل مباشر لملف HTML 📥</span>
              </a>
            </div>

            {/* Secondary Option: ZIP Package */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isDownloading}
                className="w-full text-right p-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition-all flex items-center justify-between gap-3 text-xs font-bold text-slate-700 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-emerald-700" />
                  <span>خيار بديل: تحميل كملف مضغوط (ZIP) بحجم 1.8 ميجابايت</span>
                </div>
                <span className="text-emerald-800 underline text-[11px] font-black">تحميل ZIP ⬇️</span>
              </button>
              <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500">
                <span>رابط مباشر للملف المضغوط:</span>
                <a
                  href="/api/download-standalone-zip"
                  download="AlBunyan-Standalone-Offline.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer flex items-center gap-1"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>تنزيل ZIP مباشر 📦</span>
                </a>
              </div>
            </div>
          </div>

          {/* Simple Setup Guide */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5">
            <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>طريقة التشغيل المباشرة لملف HTML:</span>
            </h5>
            <ol className="space-y-2 text-xs text-slate-700 font-medium list-decimal list-inside pr-1 leading-relaxed">
              <li>
                قم بتحميل ملف <code className="bg-white px-1.5 py-0.5 border border-slate-300 font-mono text-emerald-800 rounded font-bold">AlBunyan-Offline.html</code> وحفظه في أي مكان على جهازك أو هاتفك.
              </li>
              <li>
                على الكمبيوتر أو الموبايل: انقر فوق الملف ليفتح في المتصفح (Chrome، Edge، Firefox، أو Safari).
              </li>
              <li>
                يعمل البرنامج بكافة مزاياه الحسابية والقرآنية وشاشاته <strong>أوفلاين بنسبة 100% دون الحاجة لأي اتصال بالإنترنت</strong>.
              </li>
            </ol>
          </div>

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
