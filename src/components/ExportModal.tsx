import React, { useState, useEffect, useRef } from 'react';
import { Download, FileSpreadsheet, BookOpen, FileText, Image as ImageIcon, X, RefreshCw, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  format: 'xlsx' | 'docx' | 'csv' | 'png' | 'doc' | 'json' | string;
  defaultFileName: string;
  onConfirm: (customFileName: string) => void;
  onCancel: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  format,
  defaultFileName,
  onConfirm,
  onCancel,
}) => {
  const cleanExt = (format || 'xlsx').toLowerCase().replace(/^\./, '');
  const cleanInitialName = defaultFileName
    .replace(new RegExp(`\\.${cleanExt}$`, 'i'), '')
    .trim();

  const [fileName, setFileName] = useState(cleanInitialName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial filename when modal opens or defaultFileName changes
  useEffect(() => {
    if (isOpen) {
      const clean = defaultFileName
        .replace(new RegExp(`\\.${cleanExt}$`, 'i'), '')
        .trim();
      setFileName(clean);
      // Auto focus and select input after modal opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, defaultFileName, cleanExt]);

  if (!isOpen) return null;

  const handleSaveCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = fileName.trim() || cleanInitialName;
    onConfirm(finalName);
  };

  const handleSaveDefault = () => {
    onConfirm(cleanInitialName);
  };

  // Determine format badge and icon
  const getFormatDetails = () => {
    switch (cleanExt) {
      case 'xlsx':
      case 'xls':
        return {
          label: 'Excel (.xlsx)',
          icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'docx':
      case 'doc':
        return {
          label: 'Word (.docx)',
          icon: <BookOpen className="w-5 h-5 text-blue-600" />,
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'csv':
        return {
          label: 'CSV (.csv)',
          icon: <FileText className="w-5 h-5 text-slate-700" />,
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        };
      case 'png':
        return {
          label: 'صورة (PNG)',
          icon: <ImageIcon className="w-5 h-5 text-purple-600" />,
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        };
      default:
        return {
          label: `ملف (.${cleanExt})`,
          icon: <Download className="w-5 h-5 text-amber-600" />,
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        };
    }
  };

  const details = getFormatDetails();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={onCancel}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-slate-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              {details.icon}
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>تسمية وحفظ ملف</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                  .{cleanExt}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                يمكنك كتابة وتعديل اسم الملف بحرية تامة قبل الحفظ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="إلغاء"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSaveCustom} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-800">
              اسم الملف المراد حفظه على جهازك:
            </label>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="اكتب اسم الملف هنا..."
                className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all text-right"
                dir="rtl"
              />
              <span className="absolute left-2.5 px-2 py-1 text-[11px] font-mono font-black text-slate-500 bg-slate-200/80 rounded-md border border-slate-300 pointer-events-none select-none">
                .{cleanExt}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <button
              type="button"
              onClick={() => setFileName(cleanInitialName)}
              className="flex items-center gap-1 text-slate-600 hover:text-amber-700 font-bold cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>استعادة الاسم الافتراضي التلقائي</span>
            </button>
            <span className="text-slate-400">يعمل على الموبايل واللابتوب 💻📱</span>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
            💡 <strong>تنبيه:</strong> سيتم تنزيل الملف مباشرة على جهازك بالاسم الذي حددته أعلاه، ويمكنك حفظه في أي مجلد تختاره.
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSaveDefault}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              title="تنزيل الملف فوراً بالاسم التلقائي دون تعديل"
            >
              <span>حفظ فوري سريع ⚡</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-md border border-amber-500 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>تأكيد الحفظ بالاسم المحدد 💾</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
