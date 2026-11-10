import { useMemo, useState } from 'react';
import { CopyButton, Panel, Seg, TextArea } from '../../components/ui/index.jsx';

const HTML = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const MODES = {
  html: { enc: (s) => s.replace(/[&<>"']/g, (c) => HTML[c]), dec: (s) => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; } },
  json: { enc: (s) => JSON.stringify(s).slice(1, -1), dec: (s) => JSON.parse(`"${s.replace(/\n/g, '\\n').replace(/(?<!\\)"/g, '\\"')}"`) },
  js: { enc: (s) => s.replace(/[\\'"`\n\r\t\u2028\u2029]/g, (c) => ({ '\n': '\\n', '\r': '\\r', '\t': '\\t', '\u2028': '\\u2028', '\u2029': '\\u2029' }[c] || '\\' + c)), dec: (s) => s.replace(/\\(u\{[0-9a-f]+\}|u[0-9a-f]{4}|x[0-9a-f]{2}|[\s\S])/gi, (m, g) => g[0] === 'u' ? String.fromCodePoint(parseInt(g.replace(/[u{}]/g, ''), 16)) : g[0] === 'x' ? String.fromCharCode(parseInt(g.slice(1), 16)) : ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', 0: '\0' }[g] ?? g)) },
  unicode: { enc: (s) => [...s].map((c) => (c.codePointAt(0) > 126 ? (c.codePointAt(0) > 0xffff ? `\\u{${c.codePointAt(0).toString(16)}}` : `\\u${c.codePointAt(0).toString(16).padStart(4, '0')}`) : c)).join(''), dec: (s) => s.replace(/\\u\{([0-9a-f]+)\}|\\u([0-9a-f]{4})/gi, (m, a, b) => String.fromCodePoint(parseInt(a || b, 16))) },
  regex: { enc: (s) => s.replace(/[.*+?^${}()|[\]\\\/-]/g, '\\$&'), dec: (s) => s.replace(/\\([.*+?^${}()|[\]\\\/-])/g, '$1') },
  sql: { enc: (s) => s.replace(/'/g, "''"), dec: (s) => s.replace(/''/g, "'") },
};
export default function TextEscape() {
  const [mode, setMode] = useState('html'); const [dir, setDir] = useState('enc'); const [t, setT] = useState('<a href="x">Tom & "Jerry"</a> café ✓');
  const r = useMemo(() => { try { return { out: MODES[mode][dir](t) }; } catch (e) { return { err: 'Could not decode: ' + e.message }; } }, [mode, dir, t]);
  return (
    <div className="stack">
      <div className="row" style={{ flexWrap: 'wrap' }}><Seg label="Format" value={mode} onChange={setMode} options={[{ value: 'html', label: 'HTML' }, { value: 'json', label: 'JSON' }, { value: 'js', label: 'JS string' }, { value: 'unicode', label: '\\uXXXX' }, { value: 'regex', label: 'Regex' }, { value: 'sql', label: 'SQL' }]} /><Seg label="Direction" value={dir} onChange={setDir} options={[{ value: 'enc', label: 'Escape' }, { value: 'dec', label: 'Unescape' }]} /></div>
      <div className="two-col"><TextArea label="Input" value={t} onChange={setT} rows={8} mono /><div><TextArea label={r.err || 'Output'} value={r.out ?? ''} onChange={() => {}} readOnly rows={8} mono /><div style={{ marginTop: 8 }}><CopyButton text={r.out ?? ''} /></div></div></div>
    </div>
  );
}
