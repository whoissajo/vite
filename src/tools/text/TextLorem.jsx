import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, CopyButton, NumberField, Panel, Seg, TextArea, Toggle } from '../../components/ui/index.jsx';

const W = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
const rnd = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
const sentence = () => { const n = 6 + rnd(10); const w = Array.from({ length: n }, () => W[rnd(W.length)]); w[0] = w[0][0].toUpperCase() + w[0].slice(1); if (n > 9) w[3 + rnd(3)] += ','; return w.join(' ').replace(/,,/g, ',') + '.'; };
const para = () => Array.from({ length: 3 + rnd(4) }, sentence).join(' ');
export function lorem(kind, n, classic) {
  if (kind === 'words') { const o = []; while (o.length < n) o.push(...W.map((_, i) => W[(i + o.length * 7 + rnd(5)) % W.length])); return o.slice(0, n).join(' '); }
  const gen = kind === 'sentences' ? () => sentence() : para; const out = Array.from({ length: n }, gen);
  if (classic) out[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + out[0].split('. ').slice(1).join('. ');
  return out.join(kind === 'sentences' ? ' ' : '\n\n');
}
export default function TextLorem() {
  const [kind, setKind] = useState('paragraphs'); const [n, setN] = useState(3); const [classic, setClassic] = useState(true); const [seed, setSeed] = useState(0);
  const out = useMemo(() => lorem(kind, Math.max(1, n), classic), [kind, n, classic, seed]);
  return (
    <div className="two-col">
      <Panel title="Options"><div className="stack"><Seg label="Generate" value={kind} onChange={setKind} options={['paragraphs', 'sentences', 'words'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} /><NumberField label="Amount" value={n} onChange={setN} min={1} max={kind === 'words' ? 2000 : 100} /><Toggle label='Start with "Lorem ipsum…"' checked={classic} onChange={setClassic} /><Button icon={RefreshCw} onClick={() => setSeed((s) => s + 1)}>Regenerate</Button></div></Panel>
      <Panel title="Output"><div className="stack"><TextArea label="Placeholder text" value={out} onChange={() => {}} readOnly rows={12} /><CopyButton text={out} /></div></Panel>
    </div>
  );
}
