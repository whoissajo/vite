import { useState } from 'react';
import { unzip } from 'fflate';
import { Download, FolderArchive } from 'lucide-react';
import { Alert, Button, Dropzone, Panel } from '../../components/ui/index.jsx';
import { downloadBlob, zipFiles } from '../../lib/common/download.js';
import { formatBytes } from '../../lib/common/format.js';

const mime = (n) => { const e = n.split('.').pop().toLowerCase(); return { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf', txt: 'text/plain', json: 'application/json', html: 'text/html', csv: 'text/csv', mp4: 'video/mp4', mp3: 'audio/mpeg' }[e] || 'application/octet-stream'; };
export default function ZipExtract() {
  const [entries, setEntries] = useState(null); const [src, setSrc] = useState(''); const [err, setErr] = useState('');
  const load = async (files) => {
    setErr(''); setEntries(null); setSrc(files[0].name);
    const buf = new Uint8Array(await files[0].arrayBuffer());
    unzip(buf, (e, out) => {
      if (e) return setErr('This does not look like a valid (or supported, non-encrypted) ZIP file.');
      const list = Object.entries(out).filter(([n]) => !n.endsWith('/')).map(([name, data]) => ({ name, data })).sort((a, b) => a.name.localeCompare(b.name));
      if (!list.length) setErr('The archive is empty.'); setEntries(list);
    });
  };
  const one = (x) => downloadBlob(new Blob([x.data], { type: mime(x.name) }), x.name.split('/').pop());
  return (
    <div className="stack">
      <Dropzone accept=".zip,application/zip" onFiles={load} icon={FolderArchive} title="Drop a ZIP file" hint="Browse and extract files without uploading anything." formats="ZIP" />
      {err && <Alert kind="error">{err}</Alert>}
      {entries?.length > 0 && <Panel title={`${src} — ${entries.length} file${entries.length === 1 ? '' : 's'} · ${formatBytes(entries.reduce((n, x) => n + x.data.length, 0))}`}>
        <div className="out-list">{entries.map((x) => <div className="out-item" key={x.name}><span className="truncate" style={{ flex: 1 }} title={x.name}>{x.name}</span><span className="small muted">{formatBytes(x.data.length)}</span><Button size="sm" icon={Download} onClick={() => one(x)} aria-label={`Download ${x.name}`} /></div>)}</div>
        <div style={{ marginTop: 12 }}><Button variant="primary" icon={Download} onClick={async () => downloadBlob(await zipFiles(entries.map((x) => ({ name: x.name, data: x.data }))), src.replace(/\.zip$/i, '') + '-copy.zip')}>Re-zip all</Button></div>
        <p className="small muted" style={{ marginTop: 8 }}>Click the download icon next to a file to save it individually.</p>
      </Panel>}
    </div>
  );
}
