/**
 * Safely copy text to clipboard across all browser environments,
 * including sandboxed iframes where navigator.clipboard permissions may be restricted.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Primary method: document.execCommand('copy') with temporary textarea
  // This is synchronous and supported across all browsers without triggering iframe permission-denied errors
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      // Prevent zooming on iOS
      textarea.style.fontSize = '12pt';
      textarea.style.border = '0';
      textarea.style.padding = '0';
      textarea.style.margin = '0';
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      textarea.setAttribute('readonly', '');

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (successful) {
        return true;
      }
    } catch {
      // Fall through to navigator.clipboard if execCommand fails
    }
  }

  // 2. Secondary fallback: modern navigator.clipboard API if execCommand didn't succeed
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fail silently without crashing or logging unhandled rejections
      return false;
    }
  }

  return false;
}

