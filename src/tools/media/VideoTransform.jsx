import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { Button, Panel, Seg, Toggle } from '../../components/ui/index.jsx';
import { transcode } from '../../lib/media/core.js';
import MediaShell from './MediaShell.jsx';
import MediaResult from './MediaResult.jsx';

export default function VideoTransform() {
  const [o, setO] = useState({ rotate: 0, flip: false, scale: 100 }); const [res, setRes] = useState(null);
  const set = (k) => (v) => { setO((x) => ({ ...x, [k]: v })); setRes(null); };
  return (
    <MediaShell kind="video" title="Drop a video to rotate, flip or resize">
      {({ file, info, task }) => {
        const run = () => task.run(async ({ signal, onProgress }) => {
          const turned = o.rotate % 180 !== 0; const sw = Math.max(2, Math.round((info.width * o.scale) / 100 / 2) * 2), sh = Math.max(2, Math.round((info.height * o.scale) / 100 / 2) * 2);
          const video = { rotate: o.rotate, flip: o.flip, ...(o.scale !== 100 ? { width: turned ? sh : sw, height: turned ? sw : sh, fit: 'fill' } : {}), forceTranscode: true, allowRotationMetadata: false };
          setRes(await transcode(file, { fmt: /webm/i.test(info.format) ? 'webm' : 'mp4', video, onProgress, signal }));
        }, { label: 'Transforming…' });
        return (<>
          <Panel title="Transform"><div className="stack">
            <Seg label="Rotate" value={o.rotate} onChange={set('rotate')} options={[{ value: 0, label: '0°' }, { value: 90, label: '90°' }, { value: 180, label: '180°' }, { value: 270, label: '270°' }]} />
            <Seg label="Scale" value={o.scale} onChange={set('scale')} options={[{ value: 100, label: '100%' }, { value: 75, label: '75%' }, { value: 50, label: '50%' }, { value: 25, label: '25%' }]} />
            <Toggle label="Flip horizontally" checked={o.flip} onChange={set('flip')} />
            <Button variant="primary" icon={RotateCw} onClick={run} disabled={task.running}>Apply</Button>
          </div></Panel>
          <MediaResult res={res} file={file} suffix="-edited" compare={false} />
        </>);
      }}
    </MediaShell>
  );
}
