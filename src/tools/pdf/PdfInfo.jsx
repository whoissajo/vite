import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Alert, Button, Dropzone, OutputList, Panel, TaskBar, TextField, ToolGrid } from '../../components/ui/index.jsx';
import { useTask } from '../../lib/common/hooks.js';
import { PDF_ACCEPT, loadPdfLib, pdfBlob } from '../../lib/pdf/core.js';
import { formatBytes, stripExt } from '../../lib/common/format.js';

const fmtDate = (d) => (d ? d.toLocaleString() : '—');
export default function PdfInfo() {
  const [file, setFile] = useState(null);
  const [lib, setLib] = useState(null);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ title: '', author: '', subject: '', keywords: '' });
  const [out, setOut] = useState([]);
  const [version, setVersion] = useState('');
  const task = useTask();

  useEffect(() => {
    if (!file) return;
    setErr(''); setLib(null); setOut([]);
    loadPdfLib(file).then((l) => {
      setLib(l); const d = l.doc;
      setF({ title: d.getTitle() || '', author: d.getAuthor() || '', subject: d.getSubject() || '', keywords: d.getKeywords() || '' });
      setVersion(new TextDecoder().decode(l.bytes.slice(0, 8)).replace(/[^%PDF\-0-9.]/g, ''));
    }).catch((e) => setErr(e.message));
  }, [file]);

  const save = (strip) => task.run(async () => {
    const { doc } = await loadPdfLib(lib.bytes);
    if (strip) { doc.setTitle(''); doc.setAuthor(''); doc.setSubject(''); doc.setKeywords([]); doc.setCreator(''); doc.setProducer(''); }
    else { doc.setTitle(f.title); doc.setAuthor(f.author); doc.setSubject(f.subject); doc.setKeywords(f.keywords.split(',').map((s) => s.trim()).filter(Boolean)); doc.setProducer('OffKit'); }
    doc.setModificationDate(new Date());
    const bytes = await doc.save({ useObjectStreams: false });
    // prove it: re-read what we just wrote
    const check = await loadPdfLib(bytes);
    setOut([{ id: 'i', name: `${stripExt(file.name)}-${strip ? 'clean' : 'edited'}.pdf`, blob: pdfBlob(bytes), note: strip ? `Metadata removed (re-read: title “${check.doc.getTitle() || ''}”, author “${check.doc.getAuthor() || ''}”)` : `Re-read OK: title “${check.doc.getTitle() || ''}”` }]);
  });

  if (!file) return <Dropzone accept={PDF_ACCEPT} onFiles={(f2) => setFile(f2[0])} icon={Info} title="Drop a PDF to inspect or edit metadata" hint="See page sizes, producer and dates; edit or strip the metadata." formats="PDF" />;
  const d = lib?.doc;
  const pages = d ? d.getPages().map((p) => p.getSize()) : [];
  const uniq = [...new Set(pages.map((s) => `${Math.round(s.width)}×${Math.round(s.height)} pt`))];
  return (
    <ToolGrid side={
      <Panel title="Edit metadata" icon={Info}>
        <div className="stack">
          <TextField label="Title" value={f.title} onChange={(v) => setF({ ...f, title: v })} />
          <TextField label="Author" value={f.author} onChange={(v) => setF({ ...f, author: v })} />
          <TextField label="Subject" value={f.subject} onChange={(v) => setF({ ...f, subject: v })} />
          <TextField label="Keywords" value={f.keywords} onChange={(v) => setF({ ...f, keywords: v })} hint="Comma separated" />
          <Button variant="primary" loading={task.running} disabled={!d} onClick={() => save(false)} block>Save changes</Button>
          <Button disabled={!d} onClick={() => save(true)} block>Strip all metadata</Button>
          <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Choose another PDF</Button>
        </div>
      </Panel>
    }>
      {err && <Alert kind="error">{err}</Alert>}
      {d && <Panel title="Document info"><dl className="kv">
        <dt>File</dt><dd>{file.name}</dd><dt>Size</dt><dd>{formatBytes(file.size)}</dd><dt>Pages</dt><dd>{d.getPageCount()}</dd>
        <dt>Page size(s)</dt><dd>{uniq.slice(0, 4).join(', ')}{uniq.length > 4 ? ` +${uniq.length - 4} more` : ''}</dd><dt>PDF version</dt><dd>{version}</dd>
        <dt>Title</dt><dd>{d.getTitle() || '—'}</dd><dt>Author</dt><dd>{d.getAuthor() || '—'}</dd><dt>Creator</dt><dd>{d.getCreator() || '—'}</dd><dt>Producer</dt><dd>{d.getProducer() || '—'}</dd>
        <dt>Created</dt><dd>{fmtDate(d.getCreationDate())}</dd><dt>Modified</dt><dd>{fmtDate(d.getModificationDate())}</dd><dt>Encrypted</dt><dd>No</dd>
      </dl></Panel>}
      <TaskBar task={task} />
      <OutputList items={out} title="Updated PDF" />
    </ToolGrid>
  );
}
