import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { GROUPS, TOOLS, searchTools } from '../registry/index.js';
import ToolCard from '../components/ToolCard.jsx';

export default function ToolsPage({ group: initial }) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState(initial || 'all');
  const inputRef = useRef(null);
  useEffect(() => { setGroup(initial || 'all'); }, [initial]);
  useEffect(() => { document.title = 'All tools — OffKit'; }, []);

  const list = useMemo(() => {
    const base = group === 'all' ? TOOLS : TOOLS.filter((t) => t.group === group);
    return searchTools(q, base);
  }, [q, group]);
  const sections = group === 'all' && !q ? GROUPS.map((g) => ({ g, items: TOOLS.filter((t) => t.group === g.id) })).filter((s) => s.items.length) : null;

  return (
    <div className="container page-pad">
      <div className="page-head">
        <h1>All tools</h1>
        <p className="muted">{TOOLS.length} tools, zero uploads. Everything below runs on your device and keeps working offline.</p>
      </div>
      <div className="directory-bar">
        <label className="search-field">
          <Search size={18} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools — try “compress”, “json”, “qr”…" aria-label="Search tools" />
        </label>
        <div className="chips" role="tablist" aria-label="Categories">
          <button className="chip" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>All <span className="chip-count">{TOOLS.length}</span></button>
          {GROUPS.map((g) => {
            const n = TOOLS.filter((t) => t.group === g.id).length;
            return n ? <button key={g.id} className="chip" aria-pressed={group === g.id} onClick={() => setGroup(g.id)}><g.icon size={14} /> {g.name} <span className="chip-count">{n}</span></button> : null;
          })}
        </div>
      </div>
      {sections ? (
        sections.map(({ g, items }) => (
          <section key={g.id} className="dir-section" style={{ '--hue': g.hue }}>
            <h2><g.icon size={20} /> {g.name} <span className="muted small">{g.blurb}</span></h2>
            <div className="tool-cards">{items.map((t) => <ToolCard key={t.id} tool={t} />)}</div>
          </section>
        ))
      ) : list.length ? (
        <div className="tool-cards" style={{ marginTop: 24 }}>{list.map((t) => <ToolCard key={t.id} tool={t} />)}</div>
      ) : (
        <div className="empty"><b>No tools match “{q}”.</b><span className="small">Try a broader word, like “image” or “text”.</span></div>
      )}
    </div>
  );
}
