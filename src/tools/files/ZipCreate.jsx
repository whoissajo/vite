import { useState } from 'react';
import { Archive, Download } from 'lucide-react';
import { Alert, Button, Dropzone, FileRow, Panel, Result, Slider, TextField } from '../../components/ui/index.jsx';
import { useFiles } from '../../lib/common/useFiles.js';
import { downloadBlob, zipFiles } from '../../lib/common/download.js';
import { formatBytes, percentSaved } from '../../lib/common/format.js';

export default function ZipCreate() {
  const f = useFiles({ multiple: true }); const [name, setName] = useState('archive'); const [level, setLevel] = useState(6); const [res, setRes] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const total = f.files.reduce((n, x) => n + x.size, 0);
  const run = async () => {
    setBusy(true); setErr(''); setRes(null);
    try {
      const blob = await zipFiles(f.files.map((file) => ({ name: file.webkitRelativePath || file.name, blob: file })), { level });
      setRes({ blob, size: blob.size });
    } catch (e) { setErr('Could not create the zip: ' + e.message); } finally { setBusy(false); }
  };
  const fname = `${name.trim().replace(/\.zip$/i, '') || 'archive'}.zip`;
  return (
    <div className="stack">
      <Dropzone multiple onFiles={(x) => { f.add(x, { replace: false }); setRes(null); }} icon={Archive} title="Drop files to zip" hint="Add as many files as you like — they never leave your device." />
      {f.items.length > 0 && <>
        <Panel title={`${f.items.length} file${f.items.length === 1 ? '' : 's'} · ${formatBytes(total)}`}><div className="file-list">{f.items.map((x) => <FileRow key={x.id} file={x.file} onRemove={() => { f.remove(x.id); setRes(null); }} />)}</div></Panel>
        <Panel title="Options"><div className="grid-2"><TextField label="Archive name" value={name} onChange={setName} /><Slider label="Compression" value={level} onChange={setLevel} min={0} max={9} format={(v) => (v === 0 ? 'Store' : `Level ${v}`)} /></div></Panel>
        <div className="row"><Button variant="primary" icon={Archive} onClick={run} disabled={busy}>{busy ? 'Zipping…' : 'Create ZIP'}</Button><Button onClick={() => { f.clear(); setRes(null); }}>Clear</Button></div>
      </>}
      {err && <Alert kind="error">{err}</Alert>}
      {res && <Result title="ZIP ready" name={fname} stats={[{ label: 'Original', value: formatBytes(total) }, { label: 'ZIP', value: formatBytes(res.size) }, { label: 'Saved', value: `${Math.max(0, percentSaved(total, res.size))}%` }]}><Button variant="primary" icon={Download} onClick={() => downloadBlob(res.blob, fname)}>Download</Button></Result>}
    </div>
  );
}
