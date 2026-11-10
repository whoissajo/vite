import { useState } from 'react';
import { VolumeX } from 'lucide-react';
import { Alert, Button, Panel } from '../../components/ui/index.jsx';
import { FORMATS, transcode } from '../../lib/media/core.js';
import MediaShell from './MediaShell.jsx';
import MediaResult from './MediaResult.jsx';

export default function VideoMute() {
  const [res, setRes] = useState(null);
  return (
    <MediaShell kind="video" title="Drop a video to remove its sound">
      {({ file, info, task }) => {
        const fmt = /webm|matroska/i.test(info.format) ? 'webm' : /quicktime|mov/i.test(info.format) ? 'mov' : 'mp4';
        const run = () => task.run(async ({ signal, onProgress }) => setRes(await transcode(file, { fmt, audio: false, onProgress, signal })), { label: 'Removing audio…' });
        return (<>
          {!info.hasAudio && <Alert kind="info">This video already has no audio track.</Alert>}
          <Panel title="Remove audio"><div className="stack"><p className="small muted">The video stream is copied untouched when the container allows it — no quality loss, usually seconds. Output: {FORMATS[fmt].label}.</p><Button variant="primary" icon={VolumeX} onClick={run} disabled={task.running}>Remove audio</Button></div></Panel>
          <MediaResult res={res} file={file} suffix="-muted" />
        </>);
      }}
    </MediaShell>
  );
}
