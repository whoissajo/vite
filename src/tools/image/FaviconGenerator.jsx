import { useEffect, useMemo, useState } from 'react';
import { Globe } from 'lucide-react';
import { Button, CodeBox, Dropzone, Panel, Seg, TaskBar, ToolGrid, Toggle } from '../../components/ui/index.jsx';
import { useTask } from '../../lib/common/hooks.js';
import { canvasToBlob, createCanvas, loadImage } from '../../lib/common/files.js';
import { downloadBlob, downloadZip } from '../../lib/common/download.js';
import { scaleBitmap } from '../../lib/image/codec.js';
import { formatBytes } from '../../lib/common/format.js';

const ICO_SIZES = [16, 32, 48, 64, 128, 256];
const PNGS = [[16, 'favicon-16x16.png'], [32, 'favicon-32x32.png'], [48, 'favicon-48x48.png'], [180, 'apple-touch-icon.png'], [192, 'android-chrome-192x192.png'], [512, 'android-chrome-512x512.png']];

/** Container for PNG-compressed icons (Vista+ / all modern browsers). */
export async function buildIco(pngBlobs, sizes) {
  const bufs = await Promise.all(pngBlobs.map((b) => b.arrayBuffer()));
  const head = 6 + 16 * bufs.length;
  const total = head + bufs.reduce((s, b) => s + b.byteLength, 0);
  const out = new ArrayBuffer(total), dv = new DataView(out), u8 = new Uint8Array(out);
  dv.setUint16(2, 1, true); dv.setUint16(4, bufs.length, true);
  let off = head;
  bufs.forEach((b, i) => {
    const e = 6 + i * 16, s = sizes[i];
    dv.setUint8(e, s >= 256 ? 0 : s); dv.setUint8(e + 1, s >= 256 ? 0 : s);
    dv.setUint16(e + 4, 1, true); dv.setUint16(e + 6, 32, true);
    dv.setUint32(e + 8, b.byteLength, true); dv.setUint32(e + 12, off, true);
    u8.set(new Uint8Array(b), off); off += b.byteLength;
  });
  return new Blob([out], { type: 'image/x-icon' });
}

function square(bmp, size, mode) {
  const c = createCanvas(size, size);
  const x = c.getContext('2d');
  const s = mode === 'cover' ? Math.max(size / bmp.width, size / bmp.height) : Math.min(size / bmp.width, size / bmp.height);
  const w = bmp.width * s, h = bmp.height * s;
  const tmp = scaleBitmap(bmp, Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  x.drawImage(tmp, (size - tmp.width) / 2, (size - tmp.height) / 2);
  return c;
}

export default function FaviconGenerator() {
  const [file, setFile] = useState(null);
  const [bmp, setBmp] = useState(null);
  const [mode, setMode] = useState('contain');
  const [res, setRes] = useState(null);
  const task = useTask();

  useEffect(() => { if (!file) { setBmp(null); return undefined; } let d = false; loadImage(file).then((b) => !d && setBmp(b)); return () => { d = true; }; }, [file]);
  useEffect(() => {
    if (!bmp) { setRes(null); return; }
    task.run(async ({ onProgress }) => {
      const files = [];
      const pngFor = async (s) => canvasToBlob(square(bmp, s, mode), 'image/png');
      const icoBlobs = [];
      for (const s of ICO_SIZES) icoBlobs.push(await pngFor(s));
      const ico = await buildIco(icoBlobs, ICO_SIZES);
      files.push({ name: 'favicon.ico', blob: ico });
      let i = 0;
      for (const [s, name] of PNGS) { onProgress(++i / PNGS.length); files.push({ name, blob: await pngFor(s) }); }
      files.push({ name: 'site.webmanifest', blob: new Blob([JSON.stringify({ name: '', short_name: '', icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }, { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }], theme_color: '#ffffff', background_color: '#ffffff', display: 'standalone' }, null, 2)], { type: 'application/manifest+json' }) });
      setRes({ files, ico });
    });
  }, [bmp, mode]); // eslint-disable-line

  const snippet = `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;
  const previews = useMemo(() => (res ? res.files.filter((f) => f.blob.type === 'image/png') : []), [res]);

  if (!file) return <Dropzone accept="image/*,.svg" onFiles={(f) => setFile(f[0])} icon={Globe} title="Drop a logo or icon" hint="Square works best, 512×512 or larger. We generate favicon.ico, PNG sizes, Apple touch icon and a manifest." formats="PNG · SVG · JPG · WebP" />;
  return (
    <ToolGrid side={
      <Panel title="Options" icon={Globe}>
        <div className="stack">
          <Seg label="Non-square images" value={mode} onChange={setMode} block options={[{ value: 'contain', label: 'Pad (keep all)' }, { value: 'cover', label: 'Crop to square' }]} />
          <Button variant="primary" size="lg" disabled={!res} onClick={() => downloadZip(res.files, 'favicons.zip')} block>Download all (.zip)</Button>
          <Button disabled={!res} onClick={() => downloadBlob(res.ico, 'favicon.ico')} block>Just favicon.ico{res ? ` · ${formatBytes(res.ico.size)}` : ''}</Button>
          <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Choose another image</Button>
        </div>
      </Panel>
    }>
      <TaskBar task={task} cancelable={false} />
      {res && (
        <>
          <Panel title="Generated icons">
            <div className="thumb-grid">{previews.map((f) => <Thumb key={f.name} f={f} />)}</div>
            <p className="small muted" style={{ marginTop: 10 }}>favicon.ico contains {ICO_SIZES.join(', ')} px images.</p>
          </Panel>
          <CodeBox label="Paste into <head>" value={snippet} rows={6} />
        </>
      )}
    </ToolGrid>
  );
}
function Thumb({ f }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const u = URL.createObjectURL(f.blob); setUrl(u); return () => URL.revokeObjectURL(u); }, [f]);
  return <figure className="checker"><img src={url} alt={f.name} style={{ objectFit: 'contain', padding: 8, aspectRatio: '1' }} /><figcaption><span className="truncate">{f.name}</span></figcaption></figure>;
}
