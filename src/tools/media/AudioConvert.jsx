import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Alert, Button, Panel, Seg, Select } from '../../components/ui/index.jsx';
import { canEncodeAudio } from 'mediabunny';
import { ensureMp3, transcode } from '../../lib/media/core.js';
import MediaShell from './MediaShell.jsx';
import MediaResult from './MediaResult.jsx';

const FMTS = [{ value: 'mp3', label: 'MP3' }, { value: 'wav', label: 'WAV' }, { value: 'ogg', label: 'OGG' }, { value: 'flac', label: 'FLAC' }, { value: 'm4a', label: 'M4A' }];
export function AudioConvertInner({ file, info, task, extract }) {
  const [o, setO] = useState({ fmt: 'mp3', br: 192, sr: 'orig', ch: 'orig' }); const [res, setRes] = useState(null); const [warn, setWarn] = useState('');
  const set = (k) => (v) => { setO((x) => ({ ...x, [k]: v })); setRes(null); setWarn(''); };
  const lossy = ['mp3', 'ogg', 'm4a'].includes(o.fmt);
  const run = () => task.run(async ({ signal, onProgress }) => {
    setWarn('');
    if (o.fmt === 'flac' && !(await canEncodeAudio('flac'))) throw new Error('This browser cannot encode FLAC. Try MP3, WAV or OGG.');
    if (o.fmt === 'm4a' && !(await canEncodeAudio('aac'))) throw new Error('This browser has no AAC encoder. Use MP3, OGG or WAV instead.');
    if (o.fmt === 'mp3') await ensureMp3();
    const audio = { ...(lossy ? { bitrate: o.br * 1000 } : {}), ...(o.sr !== 'orig' ? { sampleRate: Number(o.sr) } : {}), ...(o.ch !== 'orig' ? { numberOfChannels: Number(o.ch) } : {}) };
    setRes(await transcode(file, { fmt: o.fmt, video: false, audio, onProgress, signal }));
  }, { label: 'Converting…' });
  return (<>
    {!info.hasAudio && <Alert kind="error">This file has no audio track.</Alert>}
    <Panel title={extract ? 'Extract audio as' : 'Convert to'}><div className="stack">
      <Seg value={o.fmt} onChange={set('fmt')} options={FMTS} />
      <div className="grid-3">
        {lossy && <Select label="Bitrate" value={o.br} onChange={(v) => set('br')(Number(v))} options={[64, 96, 128, 160, 192, 256, 320].map((v) => ({ value: v, label: `${v} kbps` }))} />}
        <Select label="Sample rate" value={o.sr} onChange={set('sr')} options={[{ value: 'orig', label: `Keep (${info.sampleRate} Hz)` }, { value: '48000', label: '48 kHz' }, { value: '44100', label: '44.1 kHz' }, { value: '22050', label: '22.05 kHz' }, { value: '16000', label: '16 kHz' }]} />
        <Select label="Channels" value={o.ch} onChange={set('ch')} options={[{ value: 'orig', label: `Keep (${info.channels})` }, { value: '1', label: 'Mono' }, { value: '2', label: 'Stereo' }]} />
      </div>
      <Button variant="primary" icon={RefreshCw} onClick={run} disabled={task.running || !info.hasAudio}>{extract ? 'Extract audio' : 'Convert audio'}</Button>
    </div></Panel>
    {warn && <Alert kind="warn">{warn}</Alert>}
    <MediaResult res={res} file={file} compare={!extract} video={false} />
  </>);
}
export default function AudioConvert() { return <MediaShell kind="audio" title="Drop audio to convert">{(p) => <AudioConvertInner key={p.file.name + p.file.size} {...p} />}</MediaShell>; }
