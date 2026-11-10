import { useMemo, useState } from 'react';
import { CopyButton, Panel, Seg, TextArea, Toggle } from '../../components/ui/index.jsx';

export function process(text, o) {
  let l = text.split(/\r?\n/);
  if (o.trim) l = l.map((x) => x.trim());
  if (o.dropEmpty) l = l.filter((x) => x.length);
  if (o.dedupe) { const seen = new Set(); l = l.filter((x) => { const k = o.ci ? x.toLowerCase() : x; if (seen.has(k)) return false; seen.add(k); return true; }); }
  const cmp = (x, y) => (o.ci ? x.toLowerCase().localeCompare(y.toLowerCase()) : x.localeCompare(y));
  if (o.sort === 'asc') l.sort(cmp); else if (o.sort === 'desc') l.sort((x, y) => cmp(y, x)); else if (o.sort === 'len') l.sort((x, y) => x.length - y.length); else if (o.sort === 'num') l.sort((x, y) => parseFloat(x) - parseFloat(y)); else if (o.sort === 'reverse') l.reverse();
  else if (o.sort === 'shuffle') for (let i = l.length - 1; i > 0; i--) { const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1); [l[i], l[j]] = [l[j], l[i]]; }
  if (o.number) l = l.map((x, i) => `${i + 1}. ${x}`);
  return l.join('\n');
}
export default function TextLines() {
  const [t, setT] = useState('banana\napple\nCherry\napple\n\nbanana');
  const [o, setO] = useState({ trim: true, dropEmpty: true, dedupe: true, ci: false, number: false, sort: 'asc' });
  const set = (k) => (v) => setO((x) => ({ ...x, [k]: v }));
  const out = useMemo(() => process(t, o), [t, o]);
  return (
    <div className="stack">
      <Panel title="Options"><div className="stack"><div className="row" style={{ flexWrap: 'wrap' }}><Toggle label="Trim lines" checked={o.trim} onChange={set('trim')} /><Toggle label="Remove empty" checked={o.dropEmpty} onChange={set('dropEmpty')} /><Toggle label="Remove duplicates" checked={o.dedupe} onChange={set('dedupe')} /><Toggle label="Ignore case" checked={o.ci} onChange={set('ci')} /><Toggle label="Number lines" checked={o.number} onChange={set('number')} /></div>
        <Seg label="Order" value={o.sort} onChange={set('sort')} options={[{ value: 'none', label: 'Keep' }, { value: 'asc', label: 'A→Z' }, { value: 'desc', label: 'Z→A' }, { value: 'len', label: 'Length' }, { value: 'num', label: 'Numeric' }, { value: 'reverse', label: 'Reverse' }, { value: 'shuffle', label: 'Shuffle' }]} /></div></Panel>
      <div className="two-col"><TextArea label="Input (one item per line)" value={t} onChange={setT} rows={12} mono /><div><TextArea label={`Output — ${out ? out.split('\n').length : 0} lines`} value={out} onChange={() => {}} readOnly rows={12} mono /><div style={{ marginTop: 8 }}><CopyButton text={out} /></div></div></div>
    </div>
  );
}
