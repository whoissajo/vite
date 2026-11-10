import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Alert, Button, Panel, Seg } from '../../components/ui/index.jsx';
import { caps } from '../../lib/common/caps.js';
import { downloadBlob } from '../../lib/common/download.js';
import { useObjectUrl } from '../../lib/common/hooks.js';
import { formatBytes, formatDuration } from '../../lib/common/format.js';
import { ensureMp3, transcode } from '../../lib/media/core.js';

const pickMime = () => ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((m) => MediaRecorder.isTypeSupported?.(m));
export default function VoiceRecorder() {
  const [state, setState] = useState('idle'); const [secs, setSecs] = useState(0); const [rec, setRec] = useState(null); const [err, setErr] = useState(''); const [fmt, setFmt] = useState('orig'); const [busy, setBusy] = useState(false);
  const mr = useRef(null), stream = useRef(null), timer = useRef(0), chunks = useRef([]), canvas = useRef(null), raf = useRef(0);
  const url = useObjectUrl(rec);
  useEffect(() => () => { clearInterval(timer.current); cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach((t) => t.stop()); }, []);
  if (!caps.mediaRecorder || !caps.camera) return <Alert kind="warn">Recording isn't supported in this browser (needs MediaRecorder and a secure page).</Alert>;
  const draw = (analyser) => { const c = canvas.current; if (!c) return; const g = c.getContext('2d'); const buf = new Uint8Array(analyser.fftSize); const loop = () => { analyser.getByteTimeDomainData(buf); g.clearRect(0, 0, c.width, c.height); g.strokeStyle = getComputedStyle(c).color; g.lineWidth = 2; g.beginPath(); buf.forEach((v, i) => { const x = (i / buf.length) * c.width, y = (v / 255) * c.height; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); raf.current = requestAnimationFrame(loop); }; loop(); };
  const start = async () => {
    setErr(''); setRec(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const type = pickMime(); mr.current = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined); chunks.current = [];
      mr.current.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.current.onstop = () => { setRec(new Blob(chunks.current, { type: mr.current.mimeType })); stream.current.getTracks().forEach((t) => t.stop()); cancelAnimationFrame(raf.current); clearInterval(timer.current); setState('idle'); };
      const ac = new AudioContext(); const an = ac.createAnalyser(); ac.createMediaStreamSource(stream.current).connect(an); draw(an);
      mr.current.start(250); setSecs(0); setState('rec'); const t0 = Date.now(); timer.current = setInterval(() => setSecs((Date.now() - t0) / 1000), 200);
    } catch (e) { setErr(e?.name === 'NotAllowedError' ? 'Microphone permission was denied.' : 'No microphone found.'); }
  };
  const stop = () => mr.current?.state !== 'inactive' && mr.current.stop();
  const save = async () => {
    if (fmt === 'orig') return downloadBlob(rec, `recording.${rec.type.includes('mp4') ? 'm4a' : rec.type.includes('ogg') ? 'ogg' : 'webm'}`);
    setBusy(true); setErr('');
    try { if (fmt === 'mp3') await ensureMp3(); const r = await transcode(rec, { fmt, video: false }); downloadBlob(r.blob, `recording.${r.ext}`); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="stack">
      <Panel title="Record"><div className="stack" style={{ alignItems: 'center' }}>
        <canvas ref={canvas} width={600} height={90} style={{ width: '100%', maxWidth: 600, color: 'var(--accent)', borderRadius: 10, background: 'var(--surface-2)' }} aria-hidden="true" />
        <div className="stat-value mono">{formatDuration(secs)}</div>
        {state === 'rec' ? <Button variant="primary" icon={Square} onClick={stop}>Stop</Button> : <Button variant="primary" icon={Mic} onClick={start}>{rec ? 'Record again' : 'Start recording'}</Button>}
        {err && <Alert kind="error">{err}</Alert>}
      </div></Panel>
      {rec && <Panel title={`Recording · ${formatBytes(rec.size)}`}><div className="stack">
        <audio src={url} controls style={{ width: '100%' }} data-testid="rec-audio" />
        <Seg label="Save as" value={fmt} onChange={setFmt} options={[{ value: 'orig', label: 'Original' }, { value: 'wav', label: 'WAV' }, { value: 'mp3', label: 'MP3' }]} />
        <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Converting…' : 'Download'}</Button>
      </div></Panel>}
    </div>
  );
}
