import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { GROUPS, groupById, searchTools, TOOLS } from '../../registry/index.js';
import { navigate } from '../../lib/router.js';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName) || e.target?.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);
  return [open, setOpen];
}

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const results = useMemo(() => searchTools(q, TOOLS).slice(0, 40), [q]);

  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);
  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active]);

  if (!open) return null;
  const go = (t) => { onClose(); navigate(`/tool/${t.id}`); };
  return (
    <div className="cmdk-overlay" onMouseDown={onClose} role="presentation">
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Search tools" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cmdk-input">
          <Search size={18} />
          <input
            ref={inputRef} value={q} placeholder={`Search ${TOOLS.length} tools…`} aria-label="Search tools"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              if (e.key === 'Enter' && results[active]) go(results[active]);
            }}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="cmdk-list" ref={listRef} role="listbox">
          {results.length === 0 && <div className="empty">No tool matches “{q}”.</div>}
          {results.map((t, i) => {
            const g = groupById[t.group];
            return (
              <button key={t.id} role="option" aria-selected={i === active} className="cmdk-item" onMouseEnter={() => setActive(i)} onClick={() => go(t)} style={{ '--hue': g.hue }}>
                <span className="cmdk-icon"><t.icon size={17} /></span>
                <span className="cmdk-text"><b>{t.name}</b><span className="truncate">{t.tagline}</span></span>
                <span className="cmdk-group">{g.name}</span>
                {i === active && <CornerDownLeft size={14} />}
              </button>
            );
          })}
        </div>
        <div className="cmdk-foot"><span><span className="kbd">↑</span> <span className="kbd">↓</span> navigate</span><span><span className="kbd">↵</span> open</span><span className="spacer" /><span>{GROUPS.length} categories</span></div>
      </div>
    </div>
  );
}
