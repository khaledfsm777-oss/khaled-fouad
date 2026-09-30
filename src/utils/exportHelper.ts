// Export Helper for dynamic file naming, duplicate prevention, and exception-safe export

// Session export registry to track sequential counter for duplicate exports
const exportHistoryCounter: Record<string, number> = {};

/**
 * Generate standard dynamic file name based on Surah and Verse range
 * Format: البنيان_${surahName}_آية_${fromVerse}-${toVerse}
 */
export function generateDefaultExportFileName(
  surahName: string | undefined,
  fromVerse: number | string | undefined,
  toVerse: number | string | undefined,
  prefix = 'البنيان'
): string {
  const cleanSurah = (surahName || 'القرآن')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const cleanFrom = String(fromVerse ?? 1).trim();
  const cleanTo = String(toVerse ?? cleanFrom).trim();

  if (!cleanFrom || cleanFrom === '0') {
    return `${prefix}_${cleanSurah}`;
  }

  if (cleanFrom === cleanTo) {
    return `${prefix}_${cleanSurah}_آية_${cleanFrom}`;
  }
  return `${prefix}_${cleanSurah}_آية_${cleanFrom}-${cleanTo}`;
}

/**
 * Sanitize base filename and strip all known trailing extensions
 * to prevent duplicate extensions like (.xls.xlsx or .xlsx.xlsx)
 */
export function sanitizeBaseFileName(baseName: string): string {
  let clean = (baseName || '').trim();
  // Strip ALL known trailing extensions repeatedly (.xlsx, .xls, .csv, .docx, .doc, .png, etc.)
  clean = clean.replace(/(\.(xlsx|xls|csv|docx|doc|json|png|pdf|txt))+$/gi, '').trim();
  // Remove Windows and filesystem invalid characters: \ / : * ? " < > |
  clean = clean.replace(/[\\/:*?"<>|]/g, '_').trim();
  // Remove leading and trailing dots/underscores
  clean = clean.replace(/^[._]+|[._]+$/g, '').trim();
  return clean || 'تقرير_البنيان';
}

/**
 * Get unique filename with sequential counter if already exported in current session
 * e.g. "البنيان_الفاتحة_آية_1-7.xlsx" or "البنيان_الفاتحة_آية_1-7_(1).xlsx"
 */
export function getUniqueExportFileName(
  baseName: string,
  extension: string
): string {
  const ext = extension.startsWith('.') ? extension.slice(1).toLowerCase() : extension.toLowerCase();
  
  // Clean base name: remove trailing extension if user typed it in the modal
  const cleanBase = sanitizeBaseFileName(baseName);

  const key = `${cleanBase}.${ext}`;
  const currentCount = exportHistoryCounter[key] || 0;
  exportHistoryCounter[key] = currentCount + 1;

  if (currentCount === 0) {
    return `${cleanBase}.${ext}`;
  } else {
    return `${cleanBase}_(${currentCount}).${ext}`;
  }
}

/**
 * Convert arbitrary data or string to Blob based on requested format
 */
export async function generateExportBlob(
  data: any,
  format: string
): Promise<Blob> {
  if (data instanceof Blob) {
    return data;
  }

  const BOM = '\uFEFF';
  const ext = format.toLowerCase().replace(/^\./, '');

  if (ext === 'csv') {
    const content = typeof data === 'string' ? (data.startsWith(BOM) ? data : BOM + data) : String(data);
    return new Blob([content], { type: 'text/csv;charset=utf-8;' });
  }

  if (ext === 'xlsx' || ext === 'xls') {
    if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
      return new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
    // If an HTML table string or text was passed, convert to genuine XLSX workbook using SheetJS
    try {
      const XLSX = await import('xlsx');
      if (typeof data === 'string' && (data.includes('<table') || data.includes('<html'))) {
        const wb = XLSX.read(data, { type: 'string' });
        const firstSheet = wb.SheetNames[0];
        if (firstSheet && wb.Sheets[firstSheet]) {
          wb.Sheets[firstSheet]['!views'] = [{ rightToLeft: true }];
        }
        if (!wb.Workbook) wb.Workbook = {};
        wb.Workbook.Views = [{ RTL: true }];
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      }
    } catch (parseErr) {
      console.warn('XLSX conversion fallback:', parseErr);
    }

    const content = typeof data === 'string' ? (data.startsWith(BOM) ? data : BOM + data) : String(data);
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  if (ext === 'docx') {
    const content = typeof data === 'string' ? (data.startsWith(BOM) ? data : BOM + data) : String(data);
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  if (ext === 'doc') {
    const content = typeof data === 'string' ? (data.startsWith(BOM) ? data : BOM + data) : String(data);
    return new Blob([content], { type: 'application/msword;charset=utf-8;' });
  }

  if (ext === 'json') {
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return new Blob([content], { type: 'application/json;charset=utf-8;' });
  }

  return new Blob([typeof data === 'string' ? data : String(data)], { type: 'application/octet-stream' });
}

/**
 * Prompt user for custom export file name
 */
export function promptExportFileName(
  defaultName: string,
  message = 'يرجى إدخال أو تعديل اسم الملف المراد حفظه:'
): string | null {
  if (typeof window === 'undefined') {
    return defaultName;
  }
  try {
    if (typeof window.prompt !== 'function') {
      return defaultName;
    }
    const userInput = window.prompt(message, defaultName);
    if (userInput === null) {
      return null; // User clicked Cancel
    }
    const trimmed = userInput.trim();
    return trimmed || defaultName;
  } catch (promptErr) {
    console.warn('prompt() failed or blocked, proceeding with default name:', promptErr);
    return defaultName;
  }
}

/**
 * Exception-safe export function handling Blob URLs, Data URIs, msSaveBlob, Capacitor, and safe download fallbacks.
 */
export const handleSafeExport = async (
  data: any,
  defaultFileName: string,
  format: 'xlsx' | 'docx' | 'csv' | 'xls' | 'doc' | 'png' | 'pdf' | string,
  showNamePrompt: boolean = false
): Promise<boolean> => {
  try {
    const cleanExt = format.toLowerCase().replace(/^\./, '');
    let cleanBase = sanitizeBaseFileName(defaultFileName);

    // في حال تفعيل طلب الاسم، يتم سؤال المستخدم مع حماية كاملة من تعليق الـ iframe
    if (showNamePrompt && typeof window !== 'undefined' && typeof window.prompt === 'function') {
      try {
        const prompted = window.prompt(
          `يرجى كتابة أو تعديل اسم ملف (${cleanExt.toUpperCase()}) المراد حفظه:`,
          cleanBase
        );
        if (prompted && prompted.trim()) {
          cleanBase = sanitizeBaseFileName(prompted);
        }
      } catch {
        // إذا كان المتصفح يحظر الـ prompt في الـ iframe نستمر بالاسم الافتراضي دون توقف
      }
    }

    // 1. توليد الملف كـ Blob
    const blob = await generateExportBlob(data, cleanExt);
    const finalFullName = getUniqueExportFileName(cleanBase, cleanExt);

    // 2. التحقق من بيئة Capacitor / Native App
    const capacitorObj = typeof window !== 'undefined' ? (window as any).Capacitor : null;
    if (capacitorObj?.Plugins?.Filesystem && capacitorObj?.Plugins?.Share) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            const base64 = res.includes(',') ? res.split(',')[1] : res;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const base64Data = await base64Promise;
        const result = await capacitorObj.Plugins.Filesystem.writeFile({
          path: finalFullName,
          data: base64Data,
          directory: 'CACHE'
        });
        if (result?.uri) {
          await capacitorObj.Plugins.Share.share({
            title: finalFullName,
            url: result.uri,
            dialogTitle: `حفظ ${finalFullName}`
          });
          return true;
        }
      } catch (capErr) {
        console.warn('Capacitor native export fallback:', capErr);
      }
    }

    // 3. دعم متصفحات قديمة إن وجدت (msSaveOrOpenBlob)
    if (typeof window !== 'undefined' && typeof (window.navigator as any)?.msSaveOrOpenBlob === 'function') {
      try {
        (window.navigator as any).msSaveOrOpenBlob(blob, finalFullName);
        return true;
      } catch (msErr) {
        console.warn('msSaveOrOpenBlob fallback:', msErr);
      }
    }

    // 4. التنزيل المباشر القياسي الفوري المضمون لجميع أجهزة الكمبيوتر واللابتوب والمتصفحات
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFullName;
      a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        try {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
          URL.revokeObjectURL(url);
        } catch {
          // ignore cleanup errors
        }
      }, 1500);

      return true;
    } catch (blobErr) {
      console.warn('Standard Blob URL download failed, fallback to Data URL:', blobErr);
      // مسار بديل Data URI
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const dataUrl = reader.result as string;
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = finalFullName;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            if (document.body.contains(a)) {
              document.body.removeChild(a);
            }
          }, 1500);
        } catch (dataUrlErr) {
          console.error('Data URL download error:', dataUrlErr);
        }
      };
      reader.readAsDataURL(blob);
      return true;
    }
  } catch (err: any) {
    console.error('Export Error:', err);
    return false;
  }
};

