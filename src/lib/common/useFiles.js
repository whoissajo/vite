import { useCallback, useState } from 'react';

let uid = 0;
/**
 * Ordered list of user files: [{ id, file }].
 * add(filesOrArray, { replace }) / remove(id) / clear() / move(id, dir) / set(items)
 */
export function useFiles({ multiple = true } = {}) {
  const [items, setItems] = useState([]);
  const add = useCallback((incoming, { replace = !multiple } = {}) => {
    const arr = Array.from(incoming || []).map((file) => ({ id: ++uid, file }));
    if (!arr.length) return;
    setItems((cur) => (replace ? arr.slice(0, 1) : [...cur, ...arr]));
  }, [multiple]);
  const remove = useCallback((id) => setItems((cur) => cur.filter((x) => x.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const move = useCallback((id, dir) => setItems((cur) => {
    const i = cur.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cur.length) return cur;
    const next = cur.slice();
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  }), []);
  return { items, files: items.map((x) => x.file), file: items[0]?.file ?? null, add, remove, clear, move, set: setItems };
}
