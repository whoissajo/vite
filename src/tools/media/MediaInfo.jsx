import { Panel } from '../../components/ui/index.jsx';
import { formatBytes, formatDuration } from '../../lib/common/format.js';
import { codecLabel } from '../../lib/media/core.js';
import MediaShell from './MediaShell.jsx';

const kbps = (b) => (b ? `${Math.round(b / 1000)} kbps` : '—');
export default function MediaInfo() {
  return (
    <MediaShell kind="video" title="Drop any audio or video file to inspect it">
      {({ file, info }) => (
        <div className="two-col">
          <Panel title="Container"><dl className="kv"><dt>File</dt><dd>{file.name}</dd><dt>Size</dt><dd>{formatBytes(file.size)}</dd><dt>Format</dt><dd>{info.format}</dd><dt>Duration</dt><dd>{formatDuration(info.duration, true)} ({info.duration.toFixed(3)} s)</dd><dt>Overall bitrate</dt><dd>{kbps((file.size * 8) / info.duration)}</dd></dl></Panel>
          {info.hasVideo && <Panel title="Video"><dl className="kv"><dt>Codec</dt><dd>{codecLabel(info.vcodec)}</dd><dt>Resolution</dt><dd>{info.width}×{info.height}</dd><dt>Frame rate</dt><dd>{info.fps ? `${info.fps} fps` : '—'}</dd><dt>Bitrate</dt><dd>{kbps(info.vbitrate)}</dd><dt>Rotation</dt><dd>{info.rotation}°</dd><dt>Decodable here</dt><dd>{info.decodable === false ? 'No' : 'Yes'}</dd></dl></Panel>}
          {info.hasAudio && <Panel title="Audio"><dl className="kv"><dt>Codec</dt><dd>{codecLabel(info.acodec)}</dd><dt>Channels</dt><dd>{info.channels}</dd><dt>Sample rate</dt><dd>{info.sampleRate} Hz</dd><dt>Bitrate</dt><dd>{kbps(info.abitrate)}</dd></dl></Panel>}
          {info.tags && Object.keys(info.tags).length > 0 && <Panel title="Tags"><dl className="kv">{Object.entries(info.tags).filter(([, v]) => typeof v === 'string' || typeof v === 'number').map(([k, v]) => [<dt key={k}>{k}</dt>, <dd key={k + 'v'}>{String(v)}</dd>])}</dl></Panel>}
        </div>
      )}
    </MediaShell>
  );
}
