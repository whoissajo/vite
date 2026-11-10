import { useMemo, useState } from 'react';
import { Braces, ChevronRight } from 'lucide-react';
import { Alert, Button, CodeBox, Panel, Seg, TextArea, Toggle } from '../../components/ui/index.jsx';
import { formatBytes } from '../../lib/common/format.js';

function locate(text, e) {
  const m = String(e.message);
  let pos = (m.match(/position (\d+)/) || [])[1];
  let line, col;
  const lc = m.match(/line (\d+) column (\d+)/);
  if (lc) { line = +lc[1]; col = +lc[2]; }
  else if (pos != null) { const before = text.slice(0, +pos); line = before.split('\n').length; col = pos - before.lastIndexOf('\n'); }
  const lines = text.split('\n');
  return { msg: m.replace(/ in JSON at position \d+.*/, ''), line, col, excerpt: line ? lines[line - 1]?.slice(0, 200) : '' };
}
export function tryFix(src) {
  let s = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'\\])\/\/.*$/gm, '$1');
  s = s.replace(/'([^'\\\n]*(?:\\.[^'\\\n]*)*)'/g, (_, g) => `"${g.replace(/"/g, '\\"')}"`);
  s = s.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":');
  s = s.replace(/,\s*([}\]])/g, '$1');
  return s;
}
const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v);
function stats(v) {
  let keys = 0, depth = 0;
  const walk = (x, d) => { depth = Math.max(depth, d); if (Array.isArray(x)) x.forEach((y) => walk(y, d + 1)); else if (x && typeof x === 'object') { for (const k in x) { keys++; walk(x[k], d + 1); } } };
  walk(v, 1); return { keys, depth };
}

function Node({ k, v, open = false }) {
  const [o, setO] = useState(open);
  const isObj = v && typeof v === 'object';
  if (!isObj) return <div className="jt-row"><span className="jt-k">{k !== undefined && `${k}: `}</span><span className={`jt-v jt-${v === null ? 'null' : typeof v}`}>{JSON.stringify(v)}</span></div>;
  const entries = Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.entries(v);
  return (
    <div>
      <button className="jt-toggle" onClick={() => setO(!o)} aria-expanded={o}><ChevronRight size={14} style={{ transform: o ? 'rotate(90deg)' : 'none' }} /> <span className="jt-k">{k !== undefined && `${k}: `}</span><span className="faint">{Array.isArray(v) ? `[${entries.length}]` : `{${entries.length}}`}</span></button>
      {o && <div className="jt-children">{entries.slice(0, 500).map(([kk, vv]) => <Node key={kk} k={kk} v={vv} />)}{entries.length > 500 && <div className="faint small">… {entries.length - 500} more</div>}</div>}
    </div>
  );
}

export default function JsonFormat() {
  const [src, setSrc] = useState('{"name":"OffKit","tools":[{"id":"json","ok":true},{"id":"qr","ok":true}],"offline":true}');
  const [indent, setIndent] = useState('2');
  const [mode, setMode] = useState('format');
  const [sort, setSort] = useState(false);
  const [view, setView] = useState('text');
  const r = useMemo(() => {
    if (!src.trim()) return { empty: true };
    try {
      let v = JSON.parse(src);
      if (sort) v = sortKeys(v);
      const text = mode === 'minify' ? JSON.stringify(v) : JSON.stringify(v, null, indent === 'tab' ? '\t' : +indent);
      return { v, text, ...stats(v) };
    } catch (e) { return { err: locate(src, e) }; }
  }, [src, indent, mode, sort]);

  return (
    <div className="stack">
      <div className="two-col">
        <Panel title="Input" actions={<>
          <Button size="sm" onClick={() => setSrc('')}>Clear</Button>
          <Button size="sm" onClick={async () => { try { setSrc(await navigator.clipboard.readText()); } catch { /* denied */ } }}>Paste</Button></>}>
          <div className="stack">
            <TextArea value={src} onChange={setSrc} rows={16} mono placeholder="Paste JSON here…" />
            <div className="row">
              <Seg value={mode} onChange={setMode} options={[{ value: 'format', label: 'Format' }, { value: 'minify', label: 'Minify' }]} />
              {mode === 'format' && <Seg value={indent} onChange={setIndent} options={[{ value: '2', label: '2 sp' }, { value: '4', label: '4 sp' }, { value: 'tab', label: 'Tab' }]} />}
            </div>
            <Toggle checked={sort} onChange={setSort} label="Sort keys A→Z" />
          </div>
        </Panel>
        <Panel title="Output" actions={<Seg value={view} onChange={setView} options={[{ value: 'text', label: 'Text' }, { value: 'tree', label: 'Tree' }]} />}>
          {r.err ? (
            <div className="stack">
              <Alert kind="error" title="Invalid JSON.">{r.err.msg}{r.err.line ? ` — line ${r.err.line}, column ${r.err.col}` : ''}</Alert>
              {r.err.excerpt && <pre className="err-excerpt">{r.err.excerpt}{'\n'}{' '.repeat(Math.max(0, (r.err.col || 1) - 1))}^</pre>}
              <Button size="sm" onClick={() => { const f = tryFix(src); try { JSON.parse(f); setSrc(f); } catch { setSrc(f); } }}>Try to fix (quotes, commas, comments)</Button>
            </div>
          ) : r.empty ? <p className="muted">Paste JSON to format, validate or minify it.</p> : (
            <div className="stack">
              <Alert kind="ok">Valid JSON · {r.keys} keys · depth {r.depth} · {formatBytes(new Blob([r.text]).size)}</Alert>
              {view === 'text' ? <CodeBox value={r.text} rows={14} filename="data.json" /> : <div className="jt"><Node v={r.v} open /></div>}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
