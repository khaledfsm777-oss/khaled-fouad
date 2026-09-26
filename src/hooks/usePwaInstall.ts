import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if running inside an iframe (like AI Studio preview)
    const insideIframe = typeof window !== 'undefined' && window.self !== window.top;
    setIsInIframe(insideIframe);

    // Detect mobile devices
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    const mobileDevice = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
    setIsMobile(mobileDevice);

    // Check if already running in standalone mode (installed)
    if (
      window.matchMedia('(display-mode: standalone)').matches || 
      Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)
    ) {
      setIsInstalled(true);
    }

    // Proactively update any existing service workers for clean cache synchronization
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.update().catch(() => {});
        }
      }).catch(() => {});
    }

    // Check if prompt was already captured by early HTML script
    const earlyPrompt = (window as unknown as { deferredInstallPrompt?: BeforeInstallPromptEvent }).deferredInstallPrompt;
    if (earlyPrompt) {
      setDeferredPrompt(earlyPrompt);
      setIsInstallable(true);
    }

    const handleEarlyReady = () => {
      const p = (window as unknown as { deferredInstallPrompt?: BeforeInstallPromptEvent }).deferredInstallPrompt;
      if (p) {
        setDeferredPrompt(p);
        setIsInstallable(true);
      }
    };

    window.addEventListener('app-installable-ready', handleEarlyReady);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as unknown as { deferredInstallPrompt?: Event }).deferredInstallPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      (window as unknown as { deferredInstallPrompt?: null }).deferredInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('app-installable-ready', handleEarlyReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<'accepted' | 'dismissed' | 'manual' | 'iframe'> => {
    if (isInIframe) {
      return 'iframe';
    }

    const activePrompt = deferredPrompt || (window as unknown as { deferredInstallPrompt?: BeforeInstallPromptEvent }).deferredInstallPrompt;

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
        }
        setDeferredPrompt(null);
        (window as unknown as { deferredInstallPrompt?: null }).deferredInstallPrompt = null;
        return choice.outcome;
      } catch (err) {
        console.warn('Install prompt error:', err);
        return 'manual';
      }
    }

    return 'manual';
  };

  const resetInstallState = async () => {
    setIsInstalled(false);
    setIsInstallable(false);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  const cleanOldCaches = resetInstallState;

  return { isInstallable, isInstalled, isInIframe, isMobile, triggerInstall, cleanOldCaches, resetInstallState };
}
