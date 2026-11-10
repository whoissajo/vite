import { useEffect, useRef, useState } from 'react';
import { Film, Music } from 'lucide-react';
import { Alert, Dropzone, Panel, TaskBar } from '../../components/ui/index.jsx';
import { caps } from '../../lib/common/caps.js';
import { useObjectUrl, useTask } from '../../lib/common/hooks.js';
import { formatBytes, formatDuration } from '../../lib/common/format.js';
import { AUDIO_ACCEPT, VIDEO_ACCEPT, codecLabel, probe } from '../../lib/media/core.js';

/** Shared stage: dropzone → probe → preview → children({file, info, task, setResult}) */
export default function MediaShell({ kind = 'video', title, hint, children, autoPreview = true }) {
  const [file, setFile] = useState(null); const [info, setInfo] = useState(null); const [err, setErr] = useState('');
  const task = useTask(); const url = useObjectUrl(file);
  useEffect(() => { setInfo(null); setErr(''); if (!file) return; let dead = false; probe(file).then((i) => !dead && setInfo(i)).catch((e) => !dead && setErr(e.message || 'Could not read this file.')); return () => { dead = true; }; }, [file]);
  if (!caps.webcodecs) return <Alert kind="warn" title="WebCodecs is not available.">This tool needs a recent Chrome, Edge, Safari 16.4+ or Firefox 130+, on a secure (https) page.</Alert>;
  const V = kind === 'video';
  return (
    <div className="stack">
      {!file ? <Dropzone accept={V ? VIDEO_ACCEPT : AUDIO_ACCEPT} onFiles={(f) => setFile(f[0])} icon={V ? Film : Music} title={title || (V ? 'Drop a video' : 'Drop an audio file')} hint={hint || 'Processed on your device with WebCodecs — nothing is uploaded.'} formats={V ? 'MP4 · WebM · MOV · MKV' : 'MP3 · WAV · OGG · FLAC · M4A'} /> : (
        <Panel title={file.name} actions={<button className="btn btn-sm" onClick={() => { setFile(null); task.cancel?.(); }}>Change file</button>}>
          <div className="stack">
            {autoPreview && url && (info?.hasVideo ? <video src={url} controls muted playsInline style={{ width: '100%', maxHeight: 320, borderRadius: 10, background: '#000' }} /> : <audio src={url} controls style={{ width: '100%' }} />)}
            {err && <Alert kind="error">{err}</Alert>}
            {info && <div className="row" style={{ flexWrap: 'wrap' }}>
              <span className="chip">{formatBytes(file.size)}</span><span className="chip">{formatDuration(info.duration)}</span>
              {info.hasVideo && <span className="chip">{info.width}×{info.height}{info.fps ? ` · ${info.fps} fps` : ''} · {codecLabel(info.vcodec)}</span>}
              {info.hasAudio && <span className="chip">{codecLabel(info.acodec)} · {info.channels}ch · {info.sampleRate} Hz</span>}
              {info.hasVideo && info.decodable === false && <span className="chip" style={{ color: 'var(--danger)' }}>codec not decodable here</span>}
            </div>}
          </div>
        </Panel>
      )}
      {file && info && children({ file, info, task })}
      <TaskBar task={task} />
    </div>
  );
}
