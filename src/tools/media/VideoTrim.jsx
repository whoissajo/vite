import { useEffect, useState } from 'react';
import { Scissors } from 'lucide-react';
import { Button, NumberField, Panel, Seg } from '../../components/ui/index.jsx';
import { formatDuration } from '../../lib/common/format.js';
import { transcode } from '../../lib/media/core.js';
import MediaShell from './MediaShell.jsx';
import MediaResult from './MediaResult.jsx';

function Inner({ file, info, task }) {
  const [start, setStart] = useState(0); const [end, setEnd] = useState(Math.round(info.duration * 10) / 10); const [fmt, setFmt] = useState('mp4'); const [res, setRes] = useState(null);
  useEffect(() => setRes(null), [start, end, fmt]);
  const run = () => task.run(async ({ signal, onProgress }) => setRes(await transcode(file, { fmt, trim: { start, end }, video: { forceTranscode: true }, onProgress, signal })), { label: 'Trimming…' });
  const bad = !(end > start) || end > info.duration + 0.05;
  return (<>
    <Panel title="Keep this section"><div className="stack">
      <div className="grid-2"><NumberField label="Start (seconds)" value={start} onChange={setStart} min={0} max={info.duration} step={0.1} /><NumberField label="End (seconds)" value={end} onChange={setEnd} min={0} max={info.duration} step={0.1} /></div>
      <p className="small muted">Keeping {formatDuration(Math.max(0, end - start), true)} of {formatDuration(info.duration)}. Frame-accurate: the clip is re-encoded.</p>
      <Seg label="Output" value={fmt} onChange={setFmt} options={[{ value: 'mp4', label: 'MP4' }, { value: 'webm', label: 'WebM' }]} />
      <Button variant="primary" icon={Scissors} onClick={run} disabled={task.running || bad}>Trim video</Button>
    </div></Panel>
    <MediaResult res={res} file={file} suffix="-trimmed" compare={false} />
  </>);
}
export default function VideoTrim() { return <MediaShell kind="video" title="Drop a video to trim">{(p) => <Inner key={p.file.name + p.file.size} {...p} />}</MediaShell>; }
