import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Panel, Select, TextArea, TextField, Toggle, CopyButton } from '../../components/ui/index.jsx';
import { useDebounced } from '../../lib/common/hooks.js';

const PATTERNS = [
  ['Email', '[\\w.+-]+@[\\w-]+\\.[\\w.-]+', 'gi'], ['URL', 'https?:\\/\\/[^\\s/$.?#].[^\\s]*', 'gi'], ['IPv4', '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b', 'g'],
  ['Date (YYYY-MM-DD)', '\\b\\d{4}-\\d{2}-\\d{2}\\b', 'g'], ['Hex colour', '#(?:[0-9a-fA-F]{3}){1,2}\\b', 'g'], ['Words', '\\b\\w+\\b', 'g'], ['Named groups', '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})', 'g'],
];
const FLAGS = [['g', 'global'], ['i', 'ignore case'], ['m', 'multiline'], ['s', 'dotAll'], ['u', 'unicode'], ['y', 'sticky']];

export default function RegexTester() {
  const [pattern, setPattern] = useState('(?<word>\\w+)@(\\w+)\\.com');
  const [flags, setFlags] = useState('gi');
  const [text, setText] = useState('Contact ada@example.com or linus@kernel.com for details.');
  const [replace, setReplace] = useState('');
  const [useReplace, setUseReplace] = useState(false);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const worker = useRef(null);
  const dp = useDebounced({ pattern, flags, text, replace: useReplace ? replace : null }, 200);

  useEffect(() => {
    let done = false; setBusy(true);
    const w = new Worker(new URL('./regexWorker.js', import.meta.url), { type: 'module' });
    worker.current = w;
    const timer = setTimeout(() => { if (done) return; done = true; w.terminate(); setBusy(false); setRes({ timeout: true }); }, 1500);
    w.onmessage = (e) => { if (done) return; done = true; clearTimeout(timer); w.terminate(); setBusy(false); setRes(e.data); };
    w.onerror = () => { if (done) return; done = true; clearTimeout(timer); setBusy(false); setRes({ ok: false, error: 'Worker failed to run.' }); };
    if (!dp.pattern) { done = true; clearTimeout(timer); w.terminate(); setBusy(false); setRes({ ok: true, matches: [], replaced: null }); return undefined; }
    w.postMessage(dp);
    return () => { done = true; clearTimeout(timer); w.terminate(); };
  }, [dp]);

  const toggleFlag = (f) => setFlags(flags.includes(f) ? flags.replace(f, '') : flags + f);
  const parts = useMemo(() => {
    if (!res?.ok) return [{ t: text }];
    const out = []; let pos = 0;
    res.matches.forEach((m, i) => { if (m.index > pos) out.push({ t: text.slice(pos, m.index) }); if (m.end > m.index) out.push({ t: text.slice(m.index, m.end), hl: i % 2 }); pos = Math.max(pos, m.end); });
    out.push({ t: text.slice(pos) }); return out;
  }, [res, text]);

  return (
    <div className="stack">
      <Panel title="Pattern"><div className="stack">
        <div className="row-nowrap"><span className="mono faint">/</span><input className="input mono" aria-label="Regex pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} spellCheck={false} /><span className="mono faint">/{flags}</span></div>
        <div className="chips" style={{ flexWrap: 'wrap' }}>{FLAGS.map(([f, n]) => <button key={f} className="chip" aria-pressed={flags.includes(f)} onClick={() => toggleFlag(f)} title={n}>{f} <span className="faint">{n}</span></button>)}</div>
        <Select label="Load an example" value="" onChange={(v) => { const p = PATTERNS.find((x) => x[0] === v); if (p) { setPattern(p[1]); setFlags(p[2]); } }} options={[{ value: '', label: 'Common patterns…' }, ...PATTERNS.map((p) => ({ value: p[0], label: p[0] }))]} />
        {res?.timeout && <Alert kind="error" title="Stopped after 1.5 s.">This pattern is taking exponential time on this text (catastrophic backtracking, e.g. nested quantifiers like (a+)+). Simplify it.</Alert>}
        {res && !res.ok && !res.timeout && <Alert kind="error">{res.error}</Alert>}
      </div></Panel>
      <div className="two-col">
        <Panel title="Test text"><TextArea value={text} onChange={setText} rows={9} mono /></Panel>
        <Panel title={`Matches${res?.ok ? ` (${res.matches.length}${res.matches.length >= 5000 ? '+' : ''})` : ''}`}>
          <div className="preview-pane mono" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: 120 }} aria-label="Highlighted matches">{parts.map((p, i) => (p.hl === undefined ? <span key={i}>{p.t}</span> : <mark key={i} className={`hl${p.hl ? ' alt' : ''}`} style={{ color: 'inherit' }}>{p.t}</mark>))}</div>
          {busy && <p className="small muted">Running…</p>}
        </Panel>
      </div>
      {res?.ok && res.matches.length > 0 && <Panel title="Match details"><div className="table-wrap"><table><thead><tr><th>#</th><th>Match</th><th>Index</th><th>Groups</th></tr></thead><tbody>
        {res.matches.slice(0, 200).map((m, i) => <tr key={i}><td>{i + 1}</td><td className="mono">{m.text}</td><td>{m.index}–{m.end}</td><td className="mono">{m.named ? JSON.stringify(m.named) : m.groups.length ? JSON.stringify(m.groups) : '—'}</td></tr>)}
      </tbody></table></div></Panel>}
      <Panel title="Replace" actions={<Toggle checked={useReplace} onChange={setUseReplace} label="" />}><div className="stack">
        <TextField value={replace} onChange={setReplace} mono placeholder="Replacement — use $1, $<name>, $&" disabled={!useReplace} />
        {useReplace && res?.ok && <div className="out-item"><span>{res.replaced}</span><CopyButton text={res.replaced || ''} /></div>}
      </div></Panel>
    </div>
  );
}
