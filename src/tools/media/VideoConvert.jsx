import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Alert, Button, Panel, Seg } from '../../components/ui/index.jsx';
import { transcode } from '../../lib/media/core.js';
import MediaShell from './MediaShell.jsx';
import MediaResult from './MediaResult.jsx';

export default function VideoConvert() {
  const [fmt, setFmt] = useState('mp4'); const [res, setRes] = useState(null); const [mode, setMode] = useState('smart');
  return (
    <MediaShell kind="video" title="Drop a video to convert">
      {({ file, info, task }) => {
        const run = () => task.run(async ({ signal, onProgress }) => setRes(await transcode(file, { fmt, video: mode === 'smart' ? undefined : { forceTranscode: true }, audio: mode === 'smart' ? undefined : { forceTranscode: true }, onProgress, signal })), { label: 'Converting…' });
        return (<>
          <Panel title="Convert to"><div className="stack">
            <Seg value={fmt} onChange={(v) => { setFmt(v); setRes(null); }} options={[{ value: 'mp4', label: 'MP4' }, { value: 'webm', label: 'WebM' }, { value: 'mov', label: 'MOV' }]} />
            <Seg label="Method" value={mode} onChange={setMode} options={[{ value: 'smart', label: 'Smart (copy when possible)' }, { value: 'full', label: 'Always re-encode' }]} />
            <p className="small muted">Smart mode re-wraps streams that the new container already supports (fast, lossless) and re-encodes only what it must.</p>
            <Button variant="primary" icon={RefreshCw} onClick={run} disabled={task.running}>Convert</Button>
          </div></Panel>
          <MediaResult res={res} file={file} compare={false} />
        </>);
      }}
    </MediaShell>
  );
}
