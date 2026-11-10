import { useEffect, useState } from 'react';
import { Scissors } from 'lucide-react';
import { Button, NumberField, Panel, Seg } from '../../components/ui/index.jsx';
import { formatDuration } from '../../lib/common/format.js';
import { ensureMp3, transcode } from '../../lib/media/core.js';
import MediaShell from './MediaShell.jsx';
import MediaResult from './MediaResult.jsx';

function Inner({ file, info, task }) {
  const [start, setStart] = useState(0); const [end, setEnd] = useState(Math.round(info.duration * 10) / 10); const [fmt, setFmt] = useState('wav'); const [res, setRes] = useState(null);
  useEffect(() => setRes(null), [start, end, fmt]);
  const run = () => task.run(async ({ signal, onProgress }) => { if (fmt === 'mp3') await ensureMp3(); setRes(await transcode(file, { fmt, video: false, trim: { start, end }, audio: fmt === 'mp3' ? { bitrate: 192000 } : undefined, onProgress, signal })); }, { label: 'Trimming…' });
  const bad = !(end > start) || end > info.duration + 0.05;
  return (<>
    <Panel title="Keep this section"><div className="stack">
      <div className="grid-2"><NumberField label="Start (seconds)" value={start} onChange={setStart} min={0} max={info.duration} step={0.1} /><NumberField label="End (seconds)" value={end} onChange={setEnd} min={0} max={info.duration} step={0.1} /></div>
      <p className="small muted">Keeping {formatDuration(Math.max(0, end - start), true)} of {formatDuration(info.duration)}.</p>
      <Seg label="Output" value={fmt} onChange={setFmt} options={[{ value: 'wav', label: 'WAV (lossless)' }, { value: 'mp3', label: 'MP3' }, { value: 'ogg', label: 'OGG' }]} />
      <Button variant="primary" icon={Scissors} onClick={run} disabled={task.running || bad}>Trim audio</Button>
    </div></Panel>
    <MediaResult res={res} file={file} suffix="-trimmed" compare={false} video={false} />
  </>);
}
export default function AudioTrim() { return <MediaShell kind="audio" title="Drop audio to trim">{(p) => <Inner key={p.file.name + p.file.size} {...p} />}</MediaShell>; }
