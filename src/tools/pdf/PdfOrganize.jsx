import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, Layers, RotateCw, Trash2 } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Alert, Button, Dropzone, OutputList, Panel, TaskBar, ToolGrid } from '../../components/ui/index.jsx';
import PageThumb from '../../components/ui/PageThumb.jsx';
import { useTask } from '../../lib/common/hooks.js';
import { PDF_ACCEPT, loadPdfLib, openPdfJs, pdfBlob } from '../../lib/pdf/core.js';
import { stripExt } from '../../lib/common/format.js';

let uid = 0;
export default function PdfOrganize() {
  const [file, setFile] = useState(null);
  const [lib, setLib] = useState(null);
  const [view, setView] = useState(null);
  const [pages, setPages] = useState([]); // { id, src (0-based), rot }
  const [err, setErr] = useState('');
  const [out, setOut] = useState([]);
  const task = useTask();

  useEffect(() => {
    if (!file) return undefined;
    let dead = false, v;
    setErr(''); setOut([]);
    (async () => {
      try {
        const l = await loadPdfLib(file); if (dead) return;
        setLib(l); setPages(l.doc.getPageIndices().map((i) => ({ id: ++uid, src: i, rot: 0 })));
        v = await openPdfJs(l.bytes); if (!dead) setView(v);
      } catch (e) { setErr(e.message); }
    })();
    return () => { dead = true; v?.destroy(); setView(null); };
  }, [file]);

  const upd = (fn) => { setOut([]); setPages(fn); };
  const move = (i, d) => upd((p) => { const n = p.slice(); const j = i + d; if (j < 0 || j >= n.length) return p; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const rotate = (i) => upd((p) => p.map((x, k) => (k === i ? { ...x, rot: (x.rot + 90) % 360 } : x)));
  const remove = (i) => upd((p) => p.filter((_, k) => k !== i));
  const dup = (i) => upd((p) => { const n = p.slice(); n.splice(i + 1, 0, { ...p[i], id: ++uid }); return n; });

  const save = () => task.run(async () => {
    const d = await PDFDocument.create();
    const copied = await d.copyPages(lib.doc, pages.map((p) => p.src));
    copied.forEach((pg, i) => { pg.setRotation(degrees((pg.getRotation().angle + pages[i].rot) % 360)); d.addPage(pg); });
    setOut([{ id: 'o', name: `${stripExt(file.name)}-organized.pdf`, blob: pdfBlob(await d.save({ useObjectStreams: true })), note: `${pages.length} pages` }]);
  });

  if (!file) return <Dropzone accept={PDF_ACCEPT} onFiles={(f) => setFile(f[0])} icon={Layers} title="Drop a PDF to organize" hint="Reorder, rotate, delete and duplicate pages visually." formats="PDF" />;
  return (
    <ToolGrid side={
      <Panel title="Actions" icon={Layers}>
        <div className="stack">
          <div className="stat"><div className="stat-label">Pages in result</div><div className="stat-value">{pages.length}</div></div>
          <Button variant="primary" size="lg" loading={task.running} disabled={!pages.length} onClick={save} block>Save new PDF</Button>
          <div className="row">
            <Button size="sm" icon={RotateCw} onClick={() => upd((p) => p.map((x) => ({ ...x, rot: (x.rot + 90) % 360 })))}>Rotate all</Button>
            <Button size="sm" onClick={() => upd((p) => p.slice().reverse())}>Reverse</Button>
            <Button size="sm" onClick={() => lib && upd(() => lib.doc.getPageIndices().map((i) => ({ id: ++uid, src: i, rot: 0 })))}>Reset</Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Choose another PDF</Button>
        </div>
      </Panel>
    }>
      {err ? <Alert kind="error">{err}</Alert> : (
        <Panel title={file.name}>
          {!pages.length && lib && <Alert kind="warn">All pages removed — reset to start over.</Alert>}
          <div className="page-grid">
            {view && pages.map((p, i) => (
              <div className="page-card" key={p.id}>
                <div className="thumb-box"><PageThumb pdf={view} pageNo={p.src + 1} width={140} rotate={p.rot} /></div>
                <span className="page-no">Page {i + 1} <span className="faint">(orig {p.src + 1})</span></span>
                <div className="page-actions">
                  <Button size="sm" variant="ghost" icon={ArrowLeft} aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)} />
                  <Button size="sm" variant="ghost" icon={RotateCw} aria-label="Rotate 90°" onClick={() => rotate(i)} />
                  <Button size="sm" variant="ghost" icon={Copy} aria-label="Duplicate" onClick={() => dup(i)} />
                  <Button size="sm" variant="ghost" icon={Trash2} aria-label="Delete page" onClick={() => remove(i)} />
                  <Button size="sm" variant="ghost" icon={ArrowRight} aria-label="Move later" disabled={i === pages.length - 1} onClick={() => move(i, 1)} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      <TaskBar task={task} />
      <OutputList items={out} title="Organized PDF" />
    </ToolGrid>
  );
}
