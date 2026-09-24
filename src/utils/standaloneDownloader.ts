/**
 * Exception-safe, mobile-compatible standalone downloader for Al-Bunyan
 * Uses active browser session credentials so that Cloud Run/proxy cookies are preserved,
 * avoiding the "Action required to load your app" cookie-check screen on mobile devices.
 */

export async function downloadStandaloneHtmlFile(
  onProgress?: (msg: string) => void
): Promise<boolean> {
  try {
    if (onProgress) onProgress('جارٍ جلب وتجهيز ملف البنيان المستقل (6.5 ميجابايت)...');

    // 1. Fetch file using same-origin credentials to carry active session cookies
    const response = await fetch('/api/download-standalone-html', {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      throw new Error(`تعذر تحميل الملف من الخادم (رمز الحالة: ${response.status})`);
    }

    const htmlText = await response.text();

    // Verify it is not an error page or cookie check page
    if (htmlText.includes('Cookie check') || htmlText.includes('Action required to load your app')) {
      throw new Error('تم حظر التحميل التلقائي بسبب حماية الجلسة. جارٍ فتح رابط التنزيل المباشر...');
    }

    if (htmlText.length < 100000) {
      throw new Error('الملف المستلم غير مكتمل الحجم. يرجى إعادة المحاولة.');
    }

    if (onProgress) onProgress('جارٍ حفظ الملف في جهازك (AlBunyan-Offline.html)...');

    // 2. Create in-memory Blob to trigger download without any secondary network request
    const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = 'AlBunyan-Offline.html';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 60000);

    if (onProgress) onProgress('تم تنزيل ملف البنيان المستقل بنجاح! جاهز للتشغيل أوفلاين.');
    return true;
  } catch (error: any) {
    console.warn('In-memory Blob download encountered issue, attempting fallback:', error);
    // Fallback: direct browser navigation to download endpoint
    try {
      const a = document.createElement('a');
      a.href = '/api/download-standalone-html';
      a.download = 'AlBunyan-Offline.html';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch (fallbackError) {
      console.error('All download mechanisms failed:', fallbackError);
      if (onProgress) onProgress(error.message || 'حدث خطأ أثناء تنزيل الملف.');
      return false;
    }
  }
}

export async function downloadStandaloneZipFile(
  onProgress?: (msg: string) => void
): Promise<boolean> {
  try {
    if (onProgress) onProgress('جارٍ تنزيل الحزمة المضغوطة ZIP...');
    const a = document.createElement('a');
    a.href = '/api/download-standalone-zip';
    a.download = 'AlBunyan-Standalone-Offline.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('Zip download error:', err);
    return false;
  }
}
