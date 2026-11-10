import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

let listeners = new Set();
let nextId = 1;
const push = (kind, message, ms = 4000) => {
  const t = { id: nextId++, kind, message };
  listeners.forEach((l) => l({ type: 'add', t }));
  setTimeout(() => listeners.forEach((l) => l({ type: 'remove', id: t.id })), ms);
};
/** toast.ok('Saved') / toast.error('Nope') / toast.info('FYI') — callable from anywhere. */
export const toast = { ok: (m) => push('ok', m), error: (m) => push('error', m, 6000), info: (m) => push('info', m) };

export function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const l = (e) => setItems((cur) => (e.type === 'add' ? [...cur, e.t] : cur.filter((x) => x.id !== e.id)));
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.kind === 'ok' ? <CheckCircle2 size={18} /> : t.kind === 'error' ? <AlertCircle size={18} /> : <Info size={18} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
