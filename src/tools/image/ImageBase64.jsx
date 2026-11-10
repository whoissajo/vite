import { useEffect, useMemo, useState } from 'react';
import { Binary } from 'lucide-react';
import { Alert, Button, CodeBox, Dropzone, Panel, Seg, TextArea } from '../../components/ui/index.jsx';
import { readAsDataURL } from '../../lib/common/files.js';
import { downloadBlob } from '../../lib/common/download.js';
import { extFromMime, formatBytes } from '../../lib/common/format.js';

const MAGIC = [
  ['image/png', [0x89, 0x50, 0x4e, 0x47]], ['image/jpeg', [0xff, 0xd8, 0xff]], ['image/gif', [0x47, 0x49, 0x46, 0x38]], ['image/bmp', [0x42, 0x4d]],
  ['application/pdf', [0x25, 0x50, 0x44, 0x46]], ['image/x-icon', [0, 0, 1, 0]],
];
function sniff(bytes) {
  for (const [m, sig] of MAGIC) if (sig.every((b, i) => bytes[i] === b)) return m;
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) return 'image/webp';
  const head = new TextDecoder().decode(bytes.slice(0, 200)).trimStart();
  if (head.startsWith('<svg') || head.startsWith('<?xml')) return 'image/svg+xml';
  return 'application/octet-stream';
}
function parseInput(text) {
  const t = text.trim();
  if (!t) return null;
  const m = t.match(/^data:([^;,]*)?(;[^,]*)?,(.*)$/s);
  let b64 = m ? m[3] : t;
  let declared = m?.[1];
  if (m && !/;base64/i.test(m[2] || '')) { return { error: 'Only base64 data URIs are supported (…;base64,…).' }; }
  b64 = b64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) return { error: 'That is not valid base64 (unexpected characters).' };
  try {
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const mime = declared || sniff(bytes);
    return { bytes, mime: mime === 'application/octet-stream' ? sniff(bytes) : mime };
  } catch { return { error: 'Could not decode this base64 string.' }; }
}

export default function ImageBase64() {
  const [tab, setTab] = useState('encode');
  const [file, setFile] = useState(null);
  const [uri, setUri] = useState('');
  const [text, setText] = useState('');
  useEffect(() => { if (file) readAsDataURL(file).then(setUri); else setUri(''); }, [file]);
  const raw = uri.split(',')[1] || '';
  const decoded = useMemo(() => (tab === 'decode' ? parseInput(text) : null), [tab, text]);
  const decodedUrl = useMemo(() => (decoded?.bytes ? URL.createObjectURL(new Blob([decoded.bytes], { type: decoded.mime })) : null), [decoded]);
  useEffect(() => () => decodedUrl && URL.revokeObjectURL(decodedUrl), [decodedUrl]);

  return (
    <div className="stack">
      <Seg value={tab} onChange={setTab} options={[{ value: 'encode', label: 'Image → Base64' }, { value: 'decode', label: 'Base64 → Image' }]} />
      {tab === 'encode' ? (
        !file ? <Dropzone accept="image/*,.svg,.ico" onFiles={(f) => setFile(f[0])} icon={Binary} title="Drop an image to encode" hint="Get a data URI you can paste straight into HTML, CSS or JSON." formats="PNG · JPG · WebP · GIF · SVG · ICO" /> : (
          <div className="two-col">
            <Panel title="Preview" actions={<Button size="sm" variant="ghost" onClick={() => setFile(null)}>Change</Button>}>
              <div className="preview-box checker">{uri && <img src={uri} alt="Uploaded preview" />}</div>
              <p className="small muted" style={{ marginTop: 10 }}>{file.name} · {formatBytes(file.size)} → {formatBytes(uri.length)} as text (+{file.size ? Math.round((uri.length / file.size - 1) * 100) : 0}%)</p>
            </Panel>
            <div className="stack">
              <CodeBox label="Data URI" value={uri} rows={5} />
              <CodeBox label="Base64 only" value={raw} rows={3} />
              <CodeBox label="CSS" value={uri ? `background-image: url("${uri}");` : ''} rows={3} />
              <CodeBox label="HTML" value={uri ? `<img src="${uri}" alt="" />` : ''} rows={3} />
            </div>
          </div>
        )
      ) : (
        <div className="two-col">
          <Panel title="Paste base64 or a data URI">
            <TextArea value={text} onChange={setText} rows={12} mono placeholder="data:image/png;base64,iVBORw0KGgo…  or just the base64 text" />
          </Panel>
          <Panel title="Result">
            {!decoded ? <p className="muted small">Paste something to see the decoded file.</p> : decoded.error ? <Alert kind="error">{decoded.error}</Alert> : (
              <div className="stack">
                {decoded.mime.startsWith('image/') ? <div className="preview-box checker"><img src={decodedUrl} alt="Decoded" /></div> : <Alert kind="info">Decoded {formatBytes(decoded.bytes.length)} of {decoded.mime}. No preview for this type.</Alert>}
                <p className="small muted">Detected type: <b>{decoded.mime}</b> · {formatBytes(decoded.bytes.length)}</p>
                <Button variant="primary" onClick={() => downloadBlob(new Blob([decoded.bytes], { type: decoded.mime }), `decoded.${extFromMime(decoded.mime)}`)}>Download file</Button>
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
