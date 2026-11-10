import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, CopyButton, NumberField, Panel, Seg, TextField, Toggle } from '../../components/ui/index.jsx';
import { downloadText } from '../../lib/common/download.js';

const rnd = (n) => crypto.getRandomValues(new Uint8Array(n));
const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
export function uuid4() { return crypto.randomUUID(); }
export function uuid7(ts = Date.now()) {
  const b = rnd(16);
  const t = BigInt(ts);
  for (let i = 0; i < 6; i++) b[i] = Number((t >> BigInt(8 * (5 - i))) & 0xffn);
  b[6] = (b[6] & 0x0f) | 0x70; b[8] = (b[8] & 0x3f) | 0x80;
  const h = hex(b); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export function ulid(ts = Date.now()) {
  let t = ts, time = ''; for (let i = 0; i < 10; i++) { time = CROCKFORD[t % 32] + time; t = Math.floor(t / 32); }
  const r = rnd(10); let big = 0n; r.forEach((x) => { big = (big << 8n) | BigInt(x); });
  let rs = ''; for (let i = 0; i < 16; i++) { rs = CROCKFORD[Number(big & 31n)] + rs; big >>= 5n; }
  return time + rs;
}
export function nano(alphabet, len) {
  const n = alphabet.length, limit = 256 - (256 % n); let out = '';
  while (out.length < len) for (const b of rnd(len * 2)) { if (b < limit && out.length < len) out += alphabet[b % n]; }
  return out;
}

export default function UuidGenerator() {
  const [kind, setKind] = useState('v4');
  const [count, setCount] = useState(5);
  const [upper, setUpper] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [alphabet, setAlphabet] = useState('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-');
  const [len, setLen] = useState(21);
  const [seed, setSeed] = useState(0);
  const list = useMemo(() => {
    const n = Math.min(1000, Math.max(1, Math.round(count) || 1)); const a = [];
    for (let i = 0; i < n; i++) {
      let s = kind === 'v4' ? uuid4() : kind === 'v7' ? uuid7() : kind === 'ulid' ? ulid() : nano(alphabet.length > 1 ? [...new Set(alphabet)].join('') : 'ab', Math.max(1, Math.round(len) || 1));
      if ((kind === 'v4' || kind === 'v7') && !hyphens) s = s.replace(/-/g, '');
      a.push(upper ? s.toUpperCase() : s);
    }
    return kind === 'v7' ? a.sort() : a;
  }, [kind, count, upper, hyphens, alphabet, len, seed]); // eslint-disable-line

  return (
    <div className="tool-grid">
      <div className="tool-main"><Panel title={`${list.length} generated`} actions={<><CopyButton text={list.join('\n')} label="Copy all" /><Button size="sm" onClick={() => downloadText(list.join('\n'), 'ids.txt')}>Save .txt</Button></>}>
        <div className="out-list">{list.slice(0, 100).map((s, i) => <div className="out-item" key={i}><span>{s}</span><CopyButton text={s} /></div>)}{list.length > 100 && <p className="small muted">Showing 100 of {list.length}. “Copy all” includes everything.</p>}</div>
      </Panel></div>
      <aside className="tool-side"><Panel title="Options"><div className="stack">
        <Seg value={kind} onChange={setKind} block options={[{ value: 'v4', label: 'UUID v4' }, { value: 'v7', label: 'UUID v7' }, { value: 'ulid', label: 'ULID' }, { value: 'nano', label: 'Nano' }]} />
        <NumberField label="How many" value={count} onChange={setCount} min={1} max={1000} />
        {(kind === 'v4' || kind === 'v7') && <Toggle checked={hyphens} onChange={setHyphens} label="Hyphens" />}
        {kind !== 'nano' && <Toggle checked={upper} onChange={setUpper} label="Uppercase" />}
        {kind === 'nano' && <><TextField label="Alphabet" mono value={alphabet} onChange={setAlphabet} /><NumberField label="Length" value={len} onChange={setLen} min={1} max={128} /></>}
        <p className="small muted">{kind === 'v7' ? 'v7 = 48-bit millisecond timestamp + random; sorts by creation time.' : kind === 'ulid' ? 'ULID = 48-bit time + 80 random bits, Crockford base32.' : 'Generated with crypto.getRandomValues.'}</p>
        <Button variant="primary" icon={RefreshCw} onClick={() => setSeed((s) => s + 1)} block>Regenerate</Button>
      </div></Panel></aside>
    </div>
  );
}
