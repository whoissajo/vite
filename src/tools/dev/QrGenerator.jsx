import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import { Alert, Button, ColorField, Panel, Select, Slider, TextArea, TextField, ToolGrid } from '../../components/ui/index.jsx';
import { downloadBlob } from '../../lib/common/download.js';
import { contrast, parseColor } from '../../lib/dev/color.js';

const esc = (s) => s.replace(/([\;,:"])/g, '\\$1');
const BUILD = {
  text: (f) => f.text || '', url: (f) => f.url || '',
  wifi: (f) => `WIFI:T:${f.auth};S:${esc(f.ssid || '')};P:${esc(f.pass || '')};${f.hidden ? 'H:true;' : ''};`,
  email: (f) => `mailto:${f.to || ''}?subject=${encodeURIComponent(f.subject || '')}&body=${encodeURIComponent(f.body || '')}`,
  sms: (f) => `SMSTO:${f.phone || ''}:${f.msg || ''}`, geo: (f) => `geo:${f.lat || 0},${f.lng || 0}`,
  vcard: (f) => `BEGIN:VCARD\nVERSION:3.0\nFN:${f.name || ''}\nORG:${f.org || ''}\nTEL:${f.tel || ''}\nEMAIL:${f.mail || ''}\nURL:${f.site || ''}\nEND:VCARD`,
};
export default function QrGenerator() {
  const [type, setType] = useState('url');
  const [f, setF] = useState({ text: 'Hello from OffKit', url: 'https://example.com', auth: 'WPA', ssid: '', pass: '', lat: '', lng: '' });
  const [ecc, setEcc] = useState('M'); const [size, setSize] = useState(512); const [margin, setMargin] = useState(2);
  const [fg, setFg] = useState('#000000'); const [bg, setBg] = useState('#ffffff'); const [err, setErr] = useState('');
  const canvas = useRef(null);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const data = BUILD[type](f);
  const ratio = (() => { const a = parseColor(fg), b = parseColor(bg); return a && b ? contrast(a, b) : 0; })();

  useEffect(() => {
    if (!data) { setErr('Enter some content.'); const c = canvas.current; c?.getContext('2d').clearRect(0, 0, c.width, c.height); return; }
    QRCode.toCanvas(canvas.current, data, { errorCorrectionLevel: ecc, margin, width: size, color: { dark: fg, light: bg } }).then(() => setErr('')).catch((e) => setErr(e.message.includes('too big') ? 'Too much data for a QR code — shorten it or lower the error correction.' : e.message));
  }, [data, ecc, size, margin, fg, bg]);

  const fields = {
    text: <TextArea label="Text" value={f.text} onChange={set('text')} rows={4} />, url: <TextField label="URL" value={f.url} onChange={set('url')} placeholder="https://…" />,
    wifi: <><TextField label="Network name (SSID)" value={f.ssid} onChange={set('ssid')} /><TextField label="Password" value={f.pass} onChange={set('pass')} /><Select label="Security" value={f.auth} onChange={set('auth')} options={['WPA', 'WEP', 'nopass']} /></>,
    email: <><TextField label="To" value={f.to || ''} onChange={set('to')} /><TextField label="Subject" value={f.subject || ''} onChange={set('subject')} /><TextArea label="Body" value={f.body || ''} onChange={set('body')} rows={3} /></>,
    sms: <><TextField label="Phone" value={f.phone || ''} onChange={set('phone')} /><TextArea label="Message" value={f.msg || ''} onChange={set('msg')} rows={3} /></>,
    geo: <><TextField label="Latitude" value={f.lat} onChange={set('lat')} /><TextField label="Longitude" value={f.lng} onChange={set('lng')} /></>,
    vcard: <><TextField label="Name" value={f.name || ''} onChange={set('name')} /><TextField label="Organisation" value={f.org || ''} onChange={set('org')} /><TextField label="Phone" value={f.tel || ''} onChange={set('tel')} /><TextField label="Email" value={f.mail || ''} onChange={set('mail')} /><TextField label="Website" value={f.site || ''} onChange={set('site')} /></>,
  };
  const png = () => canvas.current.toBlob((b) => downloadBlob(b, 'qrcode.png'), 'image/png');
  const svg = async () => downloadBlob(new Blob([await QRCode.toString(data, { type: 'svg', errorCorrectionLevel: ecc, margin, color: { dark: fg, light: bg } })], { type: 'image/svg+xml' }), 'qrcode.svg');

  return (
    <ToolGrid side={
      <Panel title="Style"><div className="stack">
        <Select label="Error correction" value={ecc} onChange={setEcc} options={[{ value: 'L', label: 'L — 7% (smallest)' }, { value: 'M', label: 'M — 15%' }, { value: 'Q', label: 'Q — 25%' }, { value: 'H', label: 'H — 30% (most robust)' }]} />
        <Slider label="Size" value={size} onChange={setSize} min={128} max={1024} step={32} format={(v) => `${v}px`} />
        <Slider label="Quiet zone" value={margin} onChange={setMargin} min={1} max={8} />
        <div className="grid-2"><ColorField label="Foreground" value={fg} onChange={setFg} /><ColorField label="Background" value={bg} onChange={setBg} /></div>
        {ratio < 3 && <Alert kind="warn">Low contrast ({ratio.toFixed(1)}:1) — scanners may fail. Use a dark foreground on a light background.</Alert>}
        {parseColor(fg) && parseColor(bg) && contrast(parseColor(bg), { r: 255, g: 255, b: 255 }) < 1.2 === false && false}
      </div></Panel>
    }>
      <Panel title="Content"><div className="stack">
        <Select label="Type" value={type} onChange={setType} options={[{ value: 'url', label: 'Website URL' }, { value: 'text', label: 'Plain text' }, { value: 'wifi', label: 'Wi-Fi network' }, { value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }, { value: 'geo', label: 'Location' }, { value: 'vcard', label: 'Contact (vCard)' }]} />
        {fields[type]}
      </div></Panel>
      <Panel title="QR code"><div className="stack" style={{ alignItems: 'center' }}>
        {err && <Alert kind="error">{err}</Alert>}
        <canvas ref={canvas} style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, border: '1px solid var(--border)' }} aria-label="Generated QR code" />
        <div className="row"><Button variant="primary" icon={Download} disabled={!!err} onClick={png}>PNG</Button><Button icon={Download} disabled={!!err} onClick={svg}>SVG</Button></div>
      </div></Panel>
    </ToolGrid>
  );
}
