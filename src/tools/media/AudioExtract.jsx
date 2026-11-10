import MediaShell from './MediaShell.jsx';
import { AudioConvertInner } from './AudioConvert.jsx';
export default function AudioExtract() { return <MediaShell kind="video" title="Drop a video to pull the audio out">{(p) => <AudioConvertInner key={p.file.name + p.file.size} extract {...p} />}</MediaShell>; }
