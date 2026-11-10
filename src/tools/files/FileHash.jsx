import { useState } from 'react';
import SparkMD5 from 'spark-md5';
import { Fingerprint } from 'lucide-react';
import { Alert, CopyButton, Dropzone, Panel, TextArea, TextField } from '../../components/ui/index.jsx';
import { formatBytes } from '../../lib/common/format.js';

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export async function hashBuffer(buf) {
  const out = { MD5: SparkMD5.ArrayBuffer.hash(buf) };
  for (const a of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) out[a] = hex(await crypto.subtle.digest(a, buf));
  return out;
}
const MAX = 1.5 * 1024 ** 3;
export default function FileHash() {
  const [rows, setRows] = useState([]); const [text, setText] = useState(''); const [textH, setTextH] = useState(null); const [cmp, setCmp] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const onFiles = async (files) => {
    setErr(''); setBusy(true);
    for (const f of files) {
      if (f.size > MAX) { setErr(`${f.name} is larger than 1.5 GB — too big to hash in the browser.`); continue; }
      try { const h = await hashBuffer(await f.arrayBuffer()); setRows((r) => [{ name: f.name, size: f.size, h }, ...r]); } catch { setErr(`Could not read ${f.name}.`); }
    }
    setBusy(false);
  };
  const onText = async (v) => { setText(v); setTextH(v ? await hashBuffer(new TextEncoder().encode(v)) : null); };
  const c = cmp.trim().toLowerCase().replace(/\s/g, '');
  const match = (h) => c && Object.values(h).includes(c);
  const Table = ({ h }) => <div className="out-list">{Object.entries(h).map(([k, v]) => <div className="out-item" key={k} style={match(h) && v === c ? { outline: '2px solid var(--ok)' } : undefined}><b style={{ width: 70 }}>{k}</b><span className="mono small" style={{ flex: 1, wordBreak: 'break-all' }} data-testid={`hash-${k}`}>{v}</span><CopyButton text={v} /></div>)}</div>;
  return (
    <div className="stack">
      <Dropzone multiple onFiles={onFiles} icon={Fingerprint} title="Drop files to hash" hint="MD5, SHA-1, SHA-256, SHA-384 and SHA-512 computed on your device." disabled={busy} />
      <TextField label="Compare against a known checksum (optional)" value={cmp} onChange={setCmp} mono placeholder="Paste an expected hash — matches are highlighted" />
      {err && <Alert kind="error">{err}</Alert>}
      {rows.some((r) => match(r.h)) && <Alert kind="success">Checksum matches.</Alert>}
      {rows.map((r, i) => <Panel key={i} title={`${r.name} · ${formatBytes(r.size)}`}><Table h={r.h} /></Panel>)}
      <Panel title="Hash text"><div className="stack"><TextArea label="Text" value={text} onChange={onText} rows={3} />{textH && <Table h={textH} />}</div></Panel>
    </div>
  );
}
