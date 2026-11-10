import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, QrCode, X } from 'lucide-react';
import { Alert, Button, CopyButton, Dropzone, Panel } from '../../components/ui/index.jsx';

function scanCanvas(ctx, w, h) { const d = ctx.getImageData(0, 0, w, h); return jsQR(d.data, w, h, { inversionAttempts: 'attemptBoth' }); }
export async function scanBlob(file) {
  const bmp = await createImageBitmap(file);
  for (const scale of [1, 0.5, 0.25]) {
    const w = Math.max(64, Math.round(bmp.width * scale)), h = Math.max(64, Math.round(bmp.height * scale));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(bmp, 0, 0, w, h);
    const r = scanCanvas(ctx, w, h); if (r) return r;
  }
  return null;
}
const kind = (t) => /^https?:\/\//i.test(t) ? 'URL' : /^WIFI:/i.test(t) ? 'Wi-Fi' : /^mailto:/i.test(t) ? 'Email' : /^BEGIN:VCARD/i.test(t) ? 'Contact' : /^geo:/i.test(t) ? 'Location' : 'Text';

export default function QrScanner() {
  const [results, setResults] = useState([]); const [err, setErr] = useState(''); const [cam, setCam] = useState(false);
  const video = useRef(null), stream = useRef(null), raf = useRef(0);
  const add = (text) => setResults((r) => (r[0]?.text === text ? r : [{ text, at: new Date().toLocaleTimeString() }, ...r]));
  const stop = () => { cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; setCam(false); };
  useEffect(() => stop, []);

  const onFiles = async (files) => {
    setErr('');
    for (const f of files) { try { const r = await scanBlob(f); if (r) add(r.data); else setErr(`No QR code found in ${f.name}. Try a sharper, closer image.`); } catch { setErr(`Could not read ${f.name} as an image.`); } }
  };
  const start = async () => {
    setErr('');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); setCam(true);
      await new Promise((r) => setTimeout(r, 50)); const v = video.current; v.srcObject = stream.current; await v.play();
      const c = document.createElement('canvas'), ctx = c.getContext('2d', { willReadFrequently: true });
      const tick = () => { if (!stream.current) return; if (v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; ctx.drawImage(v, 0, 0); const r = scanCanvas(ctx, c.width, c.height); if (r) { add(r.data); } } raf.current = requestAnimationFrame(tick); };
      tick();
    } catch (e) { stop(); setErr(e?.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'No camera available — upload an image instead.'); }
  };
  return (
    <div className="stack">
      <div className="two-col">
        <Panel title="Scan an image"><Dropzone accept="image/*" multiple onFiles={onFiles} icon={QrCode} title="Drop a QR code image" hint="Screenshots and photos work. Decoding happens on your device." formats="PNG · JPG · WebP" /></Panel>
        <Panel title="Scan with camera"><div className="stack">
          {cam ? <><video ref={video} muted playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }} /><Button icon={X} onClick={stop}>Stop camera</Button></> : <Button variant="primary" icon={Camera} onClick={start}>Start camera</Button>}
          <p className="small muted">Video never leaves your device. Needs camera permission and a secure context.</p>
        </div></Panel>
      </div>
      {err && <Alert kind="error">{err}</Alert>}
      {results.length > 0 && <Panel title="Results"><div className="out-list">{results.map((r, i) => (
        <div className="out-item" key={i} style={{ alignItems: 'flex-start' }}><span className="chip">{kind(r.text)}</span><span style={{ flex: 1, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }} data-testid="qr-result">{r.text}</span><CopyButton text={r.text} />{/^https?:\/\//i.test(r.text) && <a className="btn" href={r.text} target="_blank" rel="noopener noreferrer">Open</a>}</div>))}</div></Panel>}
    </div>
  );
}
