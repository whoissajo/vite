import { useState } from 'react';
import { FileStack, Plus, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Alert, Button, Dropzone, FileRow, OutputList, Panel, TaskBar, ToolGrid, toast } from '../../components/ui/index.jsx';
import { useTask } from '../../lib/common/hooks.js';
import { useFiles } from '../../lib/common/useFiles.js';
import { PDF_ACCEPT, copyPagesInto, loadPdfLib, pdfBlob } from '../../lib/pdf/core.js';
import { tick } from '../../lib/common/files.js';

export default function PdfMerge() {
  const list = useFiles();
  const task = useTask();
  const [counts, setCounts] = useState({});
  const [out, setOut] = useState([]);

  const add = async (files) => {
    list.add(files);
    for (const f of files) {
      try { const { doc } = await loadPdfLib(f); setCounts((c) => ({ ...c, [f.name + f.size]: doc.getPageCount() })); }
      catch (e) { setCounts((c) => ({ ...c, [f.name + f.size]: e.message })); }
    }
  };
  const key = (f) => f.name + f.size;
  const total = list.files.reduce((s, f) => s + (typeof counts[key(f)] === 'number' ? counts[key(f)] : 0), 0);
  const bad = list.files.some((f) => typeof counts[key(f)] === 'string');

  const merge = () => task.run(async ({ onProgress, throwIfAborted }) => {
    const target = await PDFDocument.create();
    for (let i = 0; i < list.files.length; i++) {
      onProgress(i / list.files.length, `Merging ${list.files[i].name}`);
      const { doc } = await loadPdfLib(list.files[i]);
      await copyPagesInto(target, doc, doc.getPageIndices());
      throwIfAborted(); await tick();
    }
    target.setProducer('OffKit');
    const bytes = await target.save({ useObjectStreams: true });
    setOut([{ id: 'm', name: 'merged.pdf', blob: pdfBlob(bytes), note: `${target.getPageCount()} pages` }]);
    toast.ok(`Merged ${target.getPageCount()} pages`);
  });

  if (!list.items.length) return <Dropzone multiple accept={PDF_ACCEPT} onFiles={add} icon={FileStack} title="Drop PDFs to merge" hint="Add two or more PDFs, put them in order, get one file." formats="PDF" />;
  return (
    <ToolGrid side={
      <Panel title="Merge" icon={FileStack}>
        <div className="stack">
          <div className="stat"><div className="stat-label">Result</div><div className="stat-value">{total} pages</div></div>
          <Button variant="primary" size="lg" icon={FileStack} loading={task.running} disabled={list.items.length < 2 || bad} onClick={merge} block>Merge {list.items.length} PDFs</Button>
          {list.items.length < 2 && <p className="small muted">Add at least one more PDF.</p>}
        </div>
      </Panel>
    }>
      <Panel title={`PDFs (${list.items.length})`} icon={FileStack} actions={<>
        <label className="btn btn-sm" style={{ cursor: 'pointer' }}><Plus size={15} /> Add more<input type="file" accept={PDF_ACCEPT} multiple hidden onChange={(e) => { add(Array.from(e.target.files)); e.target.value = ''; }} /></label>
        <Button size="sm" variant="ghost" icon={Trash2} onClick={() => { list.clear(); setOut([]); }}>Clear</Button></>}>
        <div className="file-list">
          {list.items.map((it, i) => {
            const c = counts[key(it.file)];
            return <FileRow key={it.id} file={it.file} icon={FileStack} sub={typeof c === 'number' ? `${c} page${c === 1 ? '' : 's'}` : c || 'Reading…'}
              onUp={i > 0 ? () => list.move(it.id, -1) : undefined} onDown={i < list.items.length - 1 ? () => list.move(it.id, 1) : undefined} onRemove={() => list.remove(it.id)} />;
          })}
        </div>
      </Panel>
      {bad && <Alert kind="error">One of the files can’t be read (see its row). Remove it to continue.</Alert>}
      <TaskBar task={task} />
      <OutputList items={out} title="Merged PDF" />
    </ToolGrid>
  );
}
