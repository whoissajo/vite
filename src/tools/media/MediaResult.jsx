import { Download } from 'lucide-react';
import { Button, Result, sizeStats } from '../../components/ui/index.jsx';
import { downloadBlob } from '../../lib/common/download.js';
import { useObjectUrl } from '../../lib/common/hooks.js';
import { baseName, formatBytes } from '../../lib/common/format.js';

export default function MediaResult({ res, file, suffix = '', video, compare = true, extra = [] }) {
  const url = useObjectUrl(res?.blob);
  if (!res) return null;
  const name = `${baseName(file.name)}${suffix}.${res.ext}`;
  const isAudio = res.mime.startsWith('audio/');
  return (
    <Result title="Ready" name={name} stats={[...(compare ? sizeStats(file.size, res.blob.size) : [{ label: 'Size', value: formatBytes(res.blob.size) }]), ...extra]}>
      {url && (isAudio ? <audio src={url} controls style={{ width: '100%', marginBottom: 12 }} data-testid="out-media" /> : video !== false && <video src={url} controls muted playsInline style={{ width: '100%', maxHeight: 280, borderRadius: 10, background: '#000', marginBottom: 12 }} data-testid="out-media" />)}
      <Button variant="primary" icon={Download} onClick={() => downloadBlob(res.blob, name)}>Download {res.ext.toUpperCase()}</Button>
    </Result>
  );
}
