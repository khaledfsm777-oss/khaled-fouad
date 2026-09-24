import React, { useState } from 'react';
import { Download, FileCode, Terminal, Archive, CheckCircle2, X, Sparkles, Laptop, ShieldCheck, Loader2 } from 'lucide-react';
import { downloadStandaloneHtmlFile, downloadStandaloneZipFile } from '../utils/standaloneDownloader';

interface OfflinePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflinePackageModal: React.FC<OfflinePackageModalProps> = ({ isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  if (!isOpen) return null;

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
                  <span>تشغيل تطبيق البنيان أوفلاين (Standalone Single-File)</span>
                  <Sparkles className="w-4 h-4 text-amber-400 inline" />
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 font-semibold">
                  ملف HTML مدمج مستقل بالكامل يعمل على اللابتوب والموبايل دون إنترنت
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
          
          {/* Overview Note */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-950 font-black text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>تقنية الدمج الشامل (100% Inlined Standalone Architecture):</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              تم تجميع ودمج كافة ملفات المشروع: نصوص القرآن الكريم كاملة (6236 آية)، محرك حساب الجمل، خوارزميات السور الـ 29 النورانية، الخطوط العربية (Amiri)، وتنسيقات CSS وأكواد الـ JavaScript <strong>داخل ملف HTML مستقل واحد فقط</strong>، مع أيقونة البرنامج المدمجة.
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
            </div>

            {/* Live Status Feedback */}
            {downloadStatus && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{downloadStatus}</span>
              </div>
            )}
          </div>

          {/* Simple Setup Guide */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5">
            <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>طريقة التشغيل المباشرة:</span>
            </h5>
            <ol className="space-y-2 text-xs text-slate-700 font-medium list-decimal list-inside pr-1 leading-relaxed">
              <li>
                قم بتحميل ملف <code className="bg-white px-1.5 py-0.5 border border-slate-300 font-mono text-emerald-800 rounded font-bold">AlBunyan-Offline.html</code> وحفظه في أي مكان على جهازك أو هاتفك.
              </li>
              <li>
                على الكمبيوتر أو الموبايل: انقر فوق الملف ليفتح مباشرة في المتصفح (Chrome، Edge، Firefox، أو Safari).
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
