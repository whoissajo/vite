import { useState } from 'react';
import { Download, Images } from 'lucide-react';
import { Button, NumberField, Panel, Seg } from '../../components/ui/index.jsx';
import { frameAt } from '../../lib/media/core.js';
import { downloadBlob, zipFiles } from '../../lib/common/download.js';
import { baseName } from '../../lib/common/format.js';
import MediaShell from './MediaShell.jsx';

const toBlob = (c, type, q) => (c.convertToBlob ? c.convertToBlob({ type, quality: q }) : new Promise((r) => c.toBlob(r, type, q)));
function Inner({ file, info, task }) {
  const [mode, setMode] = useState('one'); const [t, setT] = useState(0); const [n, setN] = useState(8); const [fmt, setFmt] = useState('image/png'); const [thumbs, setThumbs] = useState([]);
  const ext = fmt === 'image/png' ? 'png' : 'jpg';
  const run = () => task.run(async ({ onProgress, throwIfAborted }) => {
    const times = mode === 'one' ? [Math.min(t, info.duration - 0.01)] : Array.from({ length: n }, (_, i) => (info.duration * (i + 0.5)) / n);
    const files = []; let i = 0;
    for await (const w of frameAt(file, times)) { throwIfAborted(); if (w) files.push({ name: `${baseName(file.name)}-${String(i + 1).padStart(3, '0')}-${w.timestamp.toFixed(2)}s.${ext}`, blob: await toBlob(w.canvas, fmt, 0.92) }); onProgress(++i / times.length); }
    if (!files.length) throw new Error('No frames could be read.');
    setThumbs(files.map((f) => ({ ...f, url: URL.createObjectURL(f.blob) })));
    if (files.length === 1) downloadBlob(files[0].blob, files[0].name); else downloadBlob(await zipFiles(files), `${baseName(file.name)}-frames.zip`);
  }, { label: 'Extracting frames…' });
  return (<>
    <Panel title="Extract frames"><div className="stack">
      <Seg value={mode} onChange={setMode} options={[{ value: 'one', label: 'One frame at a time' }, { value: 'many', label: 'N evenly spaced frames' }]} />
      {mode === 'one' ? <NumberField label="Time (seconds)" value={t} onChange={setT} min={0} max={info.duration} step={0.1} /> : <NumberField label="Number of frames" value={n} onChange={setN} min={2} max={60} />}
      <Seg label="Format" value={fmt} onChange={setFmt} options={[{ value: 'image/png', label: 'PNG (lossless)' }, { value: 'image/jpeg', label: 'JPG' }]} />
      <Button variant="primary" icon={Images} onClick={run} disabled={task.running}>Extract & download</Button>
    </div></Panel>
    {thumbs.length > 0 && <Panel title={`${thumbs.length} frame${thumbs.length === 1 ? '' : 's'} extracted`}><div className="page-grid">{thumbs.map((f) => <figure key={f.name} style={{ margin: 0 }}><img src={f.url} alt={f.name} data-testid="frame-thumb" style={{ width: '100%', borderRadius: 8 }} /><figcaption className="small muted truncate">{f.name.split('-').pop()}</figcaption></figure>)}</div></Panel>}
  </>);
}
export default function VideoFrames() { return <MediaShell kind="video" title="Drop a video to grab frames">{(p) => <Inner key={p.file.name + p.file.size} {...p} />}</MediaShell>; }
