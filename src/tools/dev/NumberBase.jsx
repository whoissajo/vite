import { useMemo, useState } from 'react';
import { Alert, CopyButton, Panel, Seg, TextField } from '../../components/ui/index.jsx';

const DIG = '0123456789abcdefghijklmnopqrstuvwxyz';
export function parseBig(str, base) {
  let s = str.trim().replace(/[\s_]/g, '').toLowerCase(); if (!s) return null;
  let neg = false; if (s[0] === '-') { neg = true; s = s.slice(1); } else if (s[0] === '+') s = s.slice(1);
  const pre = { 16: '0x', 8: '0o', 2: '0b' }[base]; if (pre && s.startsWith(pre)) s = s.slice(2);
  if (!s) return null; let n = 0n; const B = BigInt(base);
  for (const ch of s) { const d = DIG.indexOf(ch); if (d < 0 || d >= base) return undefined; n = n * B + BigInt(d); }
  return neg ? -n : n;
}
export const toBase = (n, base) => n.toString(base);
const group = (s, n) => s.replace(new RegExp(`\\B(?=(\\w{${n}})+(?!\\w))`, 'g'), ' ');
export default function NumberBase() {
  const [base, setBase] = useState(10); const [val, setVal] = useState('255'); const [custom, setCustom] = useState('36');
  const n = useMemo(() => parseBig(val, base), [val, base]);
  const cb = Math.min(36, Math.max(2, parseInt(custom) || 2));
  const rows = n == null || n === undefined ? [] : [['Binary (2)', group(toBase(n, 2), 4)], ['Octal (8)', toBase(n, 8)], ['Decimal (10)', toBase(n, 10)], ['Hex (16)', toBase(n, 16).toUpperCase()], [`Base ${cb}`, toBase(n, cb).toUpperCase()]];
  const bits = n != null && n !== undefined ? (n < 0n ? -n : n).toString(2).length : 0;
  return (
    <div className="two-col">
      <Panel title="Input"><div className="stack">
        <Seg label="Input base" value={base} onChange={setBase} options={[{ value: 2, label: 'BIN' }, { value: 8, label: 'OCT' }, { value: 10, label: 'DEC' }, { value: 16, label: 'HEX' }]} />
        <TextField label="Number" value={val} onChange={setVal} mono hint="Any size — uses arbitrary precision (BigInt). Prefixes 0x/0o/0b allowed." />
        <TextField label="Custom output base (2–36)" value={custom} onChange={setCustom} mono />
        {n === undefined && <Alert kind="error">Contains a digit that isn't valid in base {base}.</Alert>}
      </div></Panel>
      <Panel title="Results"><div className="out-list">{rows.map(([k, v]) => <div className="out-item" key={k}><b style={{ width: 96 }}>{k}</b><span className="mono" style={{ flex: 1, wordBreak: 'break-all' }}>{v}</span><CopyButton text={v.replace(/ /g, '')} /></div>)}</div>{bits > 0 && <p className="small muted" style={{ marginTop: 8 }}>{bits} bit{bits === 1 ? '' : 's'} · {Math.ceil(bits / 8)} byte{Math.ceil(bits / 8) === 1 ? '' : 's'}</p>}</Panel>
    </div>
  );
}
