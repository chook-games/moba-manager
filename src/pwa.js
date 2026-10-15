// PWA wiring: offline support + Android "Add to Home screen" install prompt.

export function registerPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }

  let deferredPrompt = null;
  const installBtn = document.getElementById('btn-install');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn?.classList.remove('hidden');
  });

  installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (_) { /* ignore */ }
    deferredPrompt = null;
    installBtn.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    installBtn?.classList.add('hidden');
  });
}

// Prevent accidental pinch-zoom / double-tap zoom on the app shell (mobile game feel).
export function lockViewportGestures() {
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
}
