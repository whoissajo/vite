import { useEffect, useState } from 'react';

let deferred = null;
const subs = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; subs.forEach((f) => f()); });
  window.addEventListener('appinstalled', () => { deferred = null; subs.forEach((f) => f()); });
}

/** Install-as-app support (Chrome/Edge/Android). `install()` shows the native prompt. */
export function usePwaInstall() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force((n) => n + 1); subs.add(f); return () => subs.delete(f); }, []);
  const standalone = typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches;
  return { canInstall: !!deferred, installed: standalone, install: async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; force((n) => n + 1); } };
}

/** True once a service worker controls the page, i.e. the app is cached for offline use. */
export function useOfflineReady() {
  const [ready, setReady] = useState(typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller);
  useEffect(() => {
    if (!navigator.serviceWorker) return undefined;
    const on = () => setReady(!!navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange', on);
    navigator.serviceWorker.ready.then(() => on()).catch(() => {});
    return () => navigator.serviceWorker.removeEventListener('controllerchange', on);
  }, []);
  return ready;
}
