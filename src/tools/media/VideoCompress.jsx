import { useState } from 'react';
import { Minimize2 } from 'lucide-react';
import { Alert, Button, Panel, Seg, Select, Toggle } from '../../components/ui/index.jsx';
import { QUALITY, transcode } from '../../lib/media/core.js';
import MediaShell from './MediaShell.jsx';
import MediaResult from './MediaResult.jsx';

export default function VideoCompress() {
  const [o, setO] = useState({ res: 'orig', q: 'medium', fps: 'orig', mute: false, fmt: 'mp4' }); const [res, setRes] = useState(null);
  const set = (k) => (v) => { setO((x) => ({ ...x, [k]: v })); setRes(null); };
  return (
    <MediaShell kind="video" title="Drop a video to compress">
      {({ file, info, task }) => {
        const run = () => task.run(async ({ signal, onProgress }) => {
          const h = o.res === 'orig' ? 0 : Number(o.res); const scale = h && info.height > h;
          const landscape = info.width >= info.height; const long = scale ? h : 0;
          const video = { quality: QUALITY[o.q], ...(o.fps !== 'orig' ? { frameRate: Number(o.fps) } : {}), ...(scale ? (landscape ? { height: long } : { width: long }) : {}), forceTranscode: true };
          const r = await transcode(file, { fmt: o.fmt, video, audio: o.mute ? false : { bitrate: QUALITY[o.q] }, onProgress, signal });
          setRes(r);
        }, { label: 'Compressing…' });
        return (<>
          <Panel title="Compression settings"><div className="stack">
            <Seg label="Quality" value={o.q} onChange={set('q')} options={[{ value: 'very-low', label: 'Smallest' }, { value: 'low', label: 'Small' }, { value: 'medium', label: 'Balanced' }, { value: 'high', label: 'High' }]} />
            <div className="grid-2">
              <Select label="Max height" value={o.res} onChange={set('res')} options={[{ value: 'orig', label: `Original (${info.height}p)` }, { value: '1080', label: '1080p' }, { value: '720', label: '720p' }, { value: '480', label: '480p' }, { value: '360', label: '360p' }]} />
              <Select label="Frame rate" value={o.fps} onChange={set('fps')} options={[{ value: 'orig', label: 'Keep original' }, { value: '30', label: '30 fps' }, { value: '24', label: '24 fps' }, { value: '15', label: '15 fps' }]} />
            </div>
            <Seg label="Container" value={o.fmt} onChange={set('fmt')} options={[{ value: 'mp4', label: 'MP4' }, { value: 'webm', label: 'WebM' }]} />
            {info.hasAudio && <Toggle label="Remove audio track" checked={o.mute} onChange={set('mute')} />}
            <Button variant="primary" icon={Minimize2} onClick={run} disabled={task.running}>Compress video</Button>
          </div></Panel>
          {res && res.blob.size >= file.size && <Alert kind="warn">The result isn't smaller — this file is already efficiently compressed. Try a lower quality or resolution, or keep your original.</Alert>}
          <MediaResult res={res} file={file} suffix="-compressed" />
        </>);
      }}
    </MediaShell>
  );
}
