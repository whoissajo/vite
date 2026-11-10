import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Run a long async job with progress + cancellation.
 *
 *   const task = useTask();
 *   const out = await task.run(async ({ onProgress, signal, throwIfAborted }) => {
 *     onProgress(0.3, 'Encoding…');   // 0..1 (omit / null = indeterminate)
 *     throwIfAborted();
 *     return result;
 *   }, { label: 'Compressing…' });
 *
 * task.running / task.progress / task.label / task.error / task.cancel() / task.reset()
 * `run` resolves to the job's return value, or undefined if it failed or was cancelled.
 */
export function useTask() {
  const [state, setState] = useState({ running: false, progress: null, label: '', error: null, cancelled: false });
  const abortRef = useRef(null);

  const run = useCallback(async (fn, { label = '' } = {}) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setState({ running: true, progress: null, label, error: null, cancelled: false });
    const ctx = {
      signal: ac.signal,
      onProgress: (p, l) => {
        if (ac.signal.aborted) return;
        setState((s) => ({ ...s, progress: p == null ? null : Math.max(0, Math.min(1, p)), label: l ?? s.label }));
      },
      throwIfAborted: () => {
        if (ac.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      },
    };
    try {
      const out = await fn(ctx);
      if (ac.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      setState({ running: false, progress: 1, label: '', error: null, cancelled: false });
      return out;
    } catch (e) {
      if (e?.name === 'AbortError' || ac.signal.aborted || /cancel/i.test(e?.constructor?.name || '')) {
        setState({ running: false, progress: null, label: '', error: null, cancelled: true });
        return undefined;
      }
      console.error(e);
      setState({ running: false, progress: null, label: '', error: e?.message || String(e), cancelled: false });
      return undefined;
    }
  }, []);

  const cancel = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => setState({ running: false, progress: null, label: '', error: null, cancelled: false }), []);
  useEffect(() => () => abortRef.current?.abort(), []);

  return { ...state, run, cancel, reset };
}

/** Object URL for a Blob/File that is revoked automatically. */
export function useObjectUrl(blob) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blob) { setUrl(null); return undefined; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

/** Debounced value. */
export function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** useState persisted in localStorage (safe if storage is unavailable). */
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initial : JSON.parse(raw);
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }, [key, value]);
  return [value, setValue];
}

export function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}
