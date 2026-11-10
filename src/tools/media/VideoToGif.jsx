import { useState } from 'react';
import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import { Clapperboard } from 'lucide-react';
import { Button, NumberField, Panel, Slider } from '../../components/ui/index.jsx';
import { frameAt } from '../../lib/media/core.js';
import { downloadBlob } from '../../lib/common/download.js';
import { useObjectUrl } from '../../lib/common/hooks.js';
import { baseName, formatBytes } from '../../lib/common/format.js';
import { Result } from '../../components/ui/index.jsx';
import MediaShell from './MediaShell.jsx';

function Inner({ file, info, task }) {
  const [o, setO] = useState({ start: 0, dur: Math.min(5, Math.max(1, Math.floor(info.duration))), fps: 10, width: Math.min(480, info.width), colors: 128 }); const [out, setOut] = useState(null);
  const url = useObjectUrl(out?.blob); const set = (k) => (v) => { setO((x) => ({ ...x, [k]: v })); setOut(null); };
  const dur = Math.max(0.2, Math.min(o.dur, info.duration - o.start)); const n = Math.max(1, Math.round(dur * o.fps));
  const run = () => task.run(async ({ signal, onProgress, throwIfAborted }) => {
    const times = Array.from({ length: n }, (_, i) => o.start + i / o.fps); const gif = GIFEncoder(); let i = 0; const delay = Math.round(1000 / o.fps); let W = 0, H = 0;
    for await (const w of frameAt(file, times, { width: o.width })) {
      throwIfAborted(); if (!w) { i++; continue; }
      const c = w.canvas; W = c.width; H = c.height; const ctx = c.getContext('2d', { willReadFrequently: true }); const { data } = ctx.getImageData(0, 0, W, H);
      const pal = quantize(data, o.colors, { format: 'rgb565' }); gif.writeFrame(applyPalette(data, pal, 'rgb565'), W, H, { palette: pal, delay, repeat: 0 });
      onProgress(++i / n); await new Promise((r) => setTimeout(r)); 
    }
    gif.finish(); setOut({ blob: new Blob([gif.bytes()], { type: 'image/gif' }), W, H, n });
  }, { label: 'Rendering GIF…' });
  return (<>
    <Panel title="GIF settings"><div className="stack">
      <div className="grid-2"><NumberField label="Start (s)" value={o.start} onChange={set('start')} min={0} max={Math.max(0, info.duration - 0.2)} step={0.1} /><NumberField label="Length (s)" value={o.dur} onChange={set('dur')} min={0.2} max={30} step={0.1} /></div>
      <Slider label="Frame rate" value={o.fps} onChange={set('fps')} min={5} max={24} format={(v) => `${v} fps`} />
      <Slider label="Width" value={o.width} onChange={set('width')} min={120} max={Math.max(240, info.width)} step={10} format={(v) => `${v}px`} />
      <Slider label="Colours" value={o.colors} onChange={set('colors')} min={16} max={256} step={16} />
      <p className="small muted">{n} frames. Longer clips, higher fps and wider GIFs make much bigger files.</p>
      <Button variant="primary" icon={Clapperboard} onClick={run} disabled={task.running}>Create GIF</Button>
    </div></Panel>
    {out && <Result title="GIF ready" name={`${baseName(file.name)}.gif`} stats={[{ label: 'Size', value: formatBytes(out.blob.size) }, { label: 'Dimensions', value: `${out.W}×${out.H}` }, { label: 'Frames', value: out.n }]}>
      <img src={url} alt="Generated GIF" data-testid="gif-out" style={{ maxWidth: '100%', borderRadius: 10, marginBottom: 12 }} /><Button variant="primary" onClick={() => downloadBlob(out.blob, `${baseName(file.name)}.gif`)}>Download GIF</Button></Result>}
  </>);
}
export default function VideoToGif() { return <MediaShell kind="video" title="Drop a video to turn into a GIF">{(p) => <Inner key={p.file.name + p.file.size} {...p} />}</MediaShell>; }
