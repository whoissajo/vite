import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, CopyButton, NumberField, Panel, Seg, Slider, TextField, Toggle } from '../../components/ui/index.jsx';
import { WORDS } from '../../lib/dev/wordlist.js';

/** Unbiased random int in [0, n) via rejection sampling. */
export function randInt(n) {
  const max = Math.floor(0x100000000 / n) * n; const a = new Uint32Array(1);
  do { crypto.getRandomValues(a); } while (a[0] >= max);
  return a[0] % n;
}
const SETS = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{};:,.?/' };
const AMBIG = /[Il1O0o|`'"]/g;

function strength(bits) {
  if (bits < 40) return ['Weak', 'var(--danger)', 20]; if (bits < 60) return ['Fair', 'var(--warn)', 45];
  if (bits < 80) return ['Good', 'var(--accent-2)', 70]; return ['Excellent', 'var(--ok)', 100];
}

export default function PasswordGenerator() {
  const [mode, setMode] = useState('password');
  const [len, setLen] = useState(20);
  const [sets, setSets] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [noAmbig, setNoAmbig] = useState(false);
  const [words, setWords] = useState(5);
  const [sep, setSep] = useState('-');
  const [cap, setCap] = useState(true);
  const [addNum, setAddNum] = useState(true);
  const [count, setCount] = useState(5);
  const [seed, setSeed] = useState(0);

  const { list, bits } = useMemo(() => {
    const out = []; let b = 0;
    for (let i = 0; i < Math.max(1, Math.min(50, count)); i++) {
      if (mode === 'password') {
        const active = Object.entries(sets).filter(([, v]) => v).map(([k]) => (noAmbig ? SETS[k].replace(AMBIG, '') : SETS[k]));
        if (!active.length) return { list: [], bits: 0 };
        const pool = active.join('');
        const chars = active.map((s) => s[randInt(s.length)]); // guarantee one of each class
        while (chars.length < len) chars.push(pool[randInt(pool.length)]);
        for (let j = chars.length - 1; j > 0; j--) { const k = randInt(j + 1); [chars[j], chars[k]] = [chars[k], chars[j]]; }
        out.push(chars.slice(0, Math.max(len, active.length)).join('')); b = len * Math.log2(pool.length);
      } else {
        const w = Array.from({ length: words }, () => { const x = WORDS[randInt(WORDS.length)]; return cap ? x[0].toUpperCase() + x.slice(1) : x; });
        let s = w.join(sep); b = words * Math.log2(WORDS.length);
        if (addNum) { s += sep + randInt(100); b += Math.log2(100); }
        out.push(s);
      }
    }
    return { list: out, bits: b };
  }, [mode, len, sets, noAmbig, words, sep, cap, addNum, count, seed]); // eslint-disable-line
  const [label, color, pct] = strength(bits);

  return (
    <div className="tool-grid">
      <div className="tool-main">
        <Panel title="Generated" actions={<Button size="sm" icon={RefreshCw} onClick={() => setSeed((s) => s + 1)}>Regenerate</Button>}>
          <div className="stack">
            <div className="out-list">{list.map((p, i) => <div className="out-item" key={i}><span>{p}</span><CopyButton text={p} /></div>)}</div>
            {!list.length && <p className="muted">Select at least one character type.</p>}
            <div><div className="row-nowrap small"><b style={{ color }}>{label}</b><span className="spacer" /><span className="muted">≈ {Math.round(bits)} bits of entropy</span></div><div className="meter" style={{ marginTop: 6 }}><i style={{ width: `${pct}%`, background: color }} /></div></div>
            <p className="small muted">Created with your browser’s secure random generator (crypto.getRandomValues) and never stored or sent anywhere. Entropy assumes an attacker knows your settings.</p>
          </div>
        </Panel>
      </div>
      <aside className="tool-side"><Panel title="Options"><div className="stack">
        <Seg value={mode} onChange={setMode} block options={[{ value: 'password', label: 'Password' }, { value: 'phrase', label: 'Passphrase' }]} />
        {mode === 'password' ? <>
          <Slider label="Length" value={len} onChange={setLen} min={8} max={128} />
          {Object.keys(SETS).map((k) => <Toggle key={k} checked={sets[k]} onChange={(v) => setSets({ ...sets, [k]: v })} label={{ lower: 'Lowercase a–z', upper: 'Uppercase A–Z', digits: 'Digits 0–9', symbols: 'Symbols !@#…' }[k]} />)}
          <Toggle checked={noAmbig} onChange={setNoAmbig} label="Avoid look-alikes" hint="I l 1 O 0 o …" />
        </> : <>
          <Slider label="Words" value={words} onChange={setWords} min={3} max={10} />
          <TextField label="Separator" value={sep} onChange={setSep} mono />
          <Toggle checked={cap} onChange={setCap} label="Capitalise words" /><Toggle checked={addNum} onChange={setAddNum} label="Add a number" />
          <p className="small muted">{WORDS.length} words → {Math.log2(WORDS.length).toFixed(1)} bits per word.</p>
        </>}
        <NumberField label="How many" value={count} onChange={setCount} min={1} max={50} />
      </div></Panel></aside>
    </div>
  );
}
