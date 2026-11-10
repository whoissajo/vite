import { useMemo, useState } from 'react';
import { CopyButton, Panel, TextArea } from '../../components/ui/index.jsx';

const words = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const SMALL = new Set('a an and as at but by for in nor of on or the to up via'.split(' '));
export const CASES = [
  ['UPPER CASE', (s) => s.toUpperCase()], ['lower case', (s) => s.toLowerCase()],
  ['Title Case', (s) => s.toLowerCase().replace(/[\p{L}\p{N}']+/gu, (w, i) => (i > 0 && SMALL.has(w) ? w : cap(w)))],
  ['Sentence case', (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (m, a, b) => a + b.toUpperCase())],
  ['camelCase', (s) => { const w = words(s); return w.map((x, i) => (i ? cap(x) : x.toLowerCase())).join(''); }],
  ['PascalCase', (s) => words(s).map(cap).join('')],
  ['snake_case', (s) => words(s).map((x) => x.toLowerCase()).join('_')],
  ['CONSTANT_CASE', (s) => words(s).map((x) => x.toUpperCase()).join('_')],
  ['kebab-case', (s) => words(s).map((x) => x.toLowerCase()).join('-')],
  ['dot.case', (s) => words(s).map((x) => x.toLowerCase()).join('.')],
  ['aLtErNaTiNg', (s) => [...s].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join('')],
  ['iNVERT cASE', (s) => [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('')],
];
export default function TextCase() {
  const [t, setT] = useState('The quick brown fox jumps over the lazy dog');
  const out = useMemo(() => CASES.map(([n, f]) => [n, f(t)]), [t]);
  return (
    <div className="stack">
      <TextArea label="Text" value={t} onChange={setT} rows={4} />
      <Panel title="Results"><div className="out-list">{out.map(([n, v]) => <div className="out-item" key={n} style={{ alignItems: 'flex-start' }}><b style={{ width: 130, flex: 'none' }}>{n}</b><span className="mono" style={{ flex: 1, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{v}</span><CopyButton text={v} /></div>)}</div></Panel>
    </div>
  );
}
