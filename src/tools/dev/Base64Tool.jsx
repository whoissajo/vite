import { useMemo, useState } from 'react';
import { Dropzone, Alert, Button, CodeBox, Panel, Seg, TextArea, Toggle } from '../../components/ui/index.jsx';
import { downloadBlob } from '../../lib/common/download.js';
import { formatBytes } from '../../lib/common/format.js';
import { readAsDataURL } from '../../lib/common/files.js';

const enc = (s, urlSafe, wrap) => {
  const bytes = new TextEncoder().encode(s); let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); });
  let o = btoa(bin); if (urlSafe) o = o.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return wrap ? o.replace(/(.{76})/g, '$1\n').trim() : o;
};
export const b64ToBytes = (s) => {
  const t = s.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(t)) throw new Error('Not valid base64 — it contains characters outside A–Z a–z 0–9 + / =.');
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const MAGIC = [['image/png', [0x89, 0x50, 0x4e, 0x47], 'png'], ['image/jpeg', [0xff, 0xd8, 0xff], 'jpg'], ['image/gif', [0x47, 0x49, 0x46], 'gif'], ['application/pdf', [0x25, 0x50, 0x44, 0x46], 'pdf'], ['application/zip', [0x50, 0x4b, 3, 4], 'zip']];
const sniff = (b) => MAGIC.find(([, sig]) => sig.every((x, i) => b[i] === x)) || ['application/octet-stream', [], 'bin'];

export default function Base64Tool() {
  const [tab, setTab] = useState('text');
  const [dir, setDir] = useState('encode');
  const [text, setText] = useState('héllo ✓ OffKit');
  const [urlSafe, setUrlSafe] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [fileOut, setFileOut] = useState('');
  const [fileName, setFileName] = useState('');
  const [b64in, setB64in] = useState('');

  const r = useMemo(() => {
    try { return dir === 'encode' ? { out: enc(text, urlSafe, wrap) } : { out: new TextDecoder('utf-8', { fatal: true }).decode(b64ToBytes(text)) }; }
    catch (e) { return { err: e.name === 'TypeError' ? 'Decoded bytes are not valid UTF-8 text — this looks like binary data. Use the File tab to save it.' : e.message }; }
  }, [text, dir, urlSafe, wrap]);
  const dec = useMemo(() => { if (!b64in.trim()) return null; try { const b = b64ToBytes(b64in.replace(/^data:[^,]*,/, '')); return { b, type: sniff(b) }; } catch (e) { return { err: e.message }; } }, [b64in]);

  return (
    <div className="stack">
      <Seg value={tab} onChange={setTab} options={[{ value: 'text', label: 'Text' }, { value: 'file', label: 'Files' }]} />
      {tab === 'text' ? (
        <div className="two-col">
          <Panel title="Input">
            <div className="stack">
              <Seg value={dir} onChange={setDir} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
              <TextArea value={text} onChange={setText} rows={10} mono />
              {dir === 'encode' && <><Toggle checked={urlSafe} onChange={setUrlSafe} label="URL-safe alphabet" hint="- and _ instead of + and /, no padding" /><Toggle checked={wrap} onChange={setWrap} label="Wrap at 76 characters" /></>}
            </div>
          </Panel>
          <Panel title="Result">{r.err ? <Alert kind="error">{r.err}</Alert> : <CodeBox value={r.out} rows={10} />}</Panel>
        </div>
      ) : (
        <div className="two-col">
          <Panel title="File → Base64">
            <div className="stack">
              <Dropzone compact onFiles={async (f) => { setFileName(f[0].name); setFileOut((await readAsDataURL(f[0])).split(',')[1]); }} title="Drop any file" hint="Encoded locally, never uploaded." />
              {fileOut && <><p className="small muted">{fileName} → {formatBytes(fileOut.length)} of base64</p><CodeBox value={fileOut} rows={8} /></>}
            </div>
          </Panel>
          <Panel title="Base64 → File">
            <div className="stack">
              <TextArea value={b64in} onChange={setB64in} rows={8} mono placeholder="Paste base64 or a data URI" />
              {dec?.err && <Alert kind="error">{dec.err}</Alert>}
              {dec?.b && <><p className="small muted">{formatBytes(dec.b.length)} · detected {dec.type[0]}</p><Button variant="primary" onClick={() => downloadBlob(new Blob([dec.b], { type: dec.type[0] }), `decoded.${dec.type[2]}`)}>Download file</Button></>}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
