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
    let htmlText = '';
    try {
      const response = await fetch('/api/download-standalone-html', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });

      if (response.ok) {
        htmlText = await response.text();
      }
    } catch (fetchErr) {
      console.warn('Direct fetch failed, falling back to browser navigation download:', fetchErr);
    }

    // Verify it is not an error page or Google Cloud security cookie check page
    if (
      htmlText &&
      (htmlText.includes('Cookie check') || 
       htmlText.includes('Action required to load your app') ||
       htmlText.includes('blocking a required security cookie'))
    ) {
      throw new Error(
        'جلسة متصفح الهاتف غير مصرح لها بتحميل الملف مباشرة من السحابة بسبب حظر الكوكيز.\n' +
        'البرنامج الأصلي على اللابتوب سليم 100%! لتشغيله على الموبايل: أرسل ملف AlBunyan-Standalone.html الذي نزل على اللابتوب إلى هاتفك عبر الواتساب أو البلوتوث وافتحه مباشرة.'
      );
    }

    // If fetch returned valid large HTML (>500KB)
    if (htmlText && htmlText.length >= 500000) {
      if (onProgress) onProgress('جارٍ حفظ الملف في جهازك (AlBunyan-Offline.html)...');

      // Create in-memory Blob to trigger download without any secondary network request
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
    }

    // Fallback: Direct Anchor Download from /api/download-standalone-html
    if (onProgress) onProgress('جارٍ بدء التنزيل المباشر من المتصفح...');
    const a = document.createElement('a');
    a.href = '/api/download-standalone-html';
    a.download = 'AlBunyan-Offline.html';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 1000);

    if (onProgress) onProgress('تم إرسال طلب التنزيل للمتصفح بنجاح!');
    return true;
  } catch (error: any) {
    console.warn('Standalone download handled defensive exception:', error);
    if (onProgress) onProgress(error.message || 'حدث خطأ أثناء تنزيل الملف.');
    return false;
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
