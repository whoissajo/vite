import { useEffect, useState } from 'react';
import { Scissors } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Alert, Button, Dropzone, OutputList, Panel, Seg, TaskBar, TextField, NumberField, ToolGrid, Toggle } from '../../components/ui/index.jsx';
import PageThumb from '../../components/ui/PageThumb.jsx';
import { useTask } from '../../lib/common/hooks.js';
import { PDF_ACCEPT, copyPagesInto, loadPdfLib, openPdfJs, parseRanges, pdfBlob, rangeToPages } from '../../lib/pdf/core.js';
import { stripExt } from '../../lib/common/format.js';

export default function PdfSplit() {
  const [file, setFile] = useState(null);
  const [lib, setLib] = useState(null);
  const [view, setView] = useState(null);
  const [err, setErr] = useState('');
  const [mode, setMode] = useState('ranges');
  const [ranges, setRanges] = useState('1');
  const [combine, setCombine] = useState(false);
  const [n, setN] = useState(2);
  const [out, setOut] = useState([]);
  const task = useTask();

  useEffect(() => {
    if (!file) return undefined;
    let dead = false, v;
    setErr(''); setLib(null); setOut([]);
    (async () => {
      try { const l = await loadPdfLib(file); if (dead) return; setLib(l); setRanges(`1-${l.doc.getPageCount()}`); v = await openPdfJs(l.bytes); if (!dead) setView(v); }
      catch (e) { setErr(e.message); }
    })();
    return () => { dead = true; v?.destroy(); setView(null); };
  }, [file]);

  const total = lib?.doc.getPageCount() || 0;
  const base = file ? stripExt(file.name) : 'split';

  const run = () => task.run(async ({ onProgress }) => {
    const groups = [];
    if (mode === 'ranges') {
      const rs = parseRanges(ranges, total);
      if (combine) groups.push({ pages: rs.flatMap(rangeToPages), name: `${base}-extract.pdf` });
      else rs.forEach((r) => groups.push({ pages: rangeToPages(r), name: `${base}-${r[0] === r[1] ? `page-${r[0]}` : `pages-${r[0]}-${r[1]}`}.pdf` }));
    } else if (mode === 'each') {
      for (let p = 1; p <= total; p++) groups.push({ pages: [p], name: `${base}-page-${String(p).padStart(String(total).length, '0')}.pdf` });
    } else {
      const k = Math.max(1, Math.round(n));
      for (let p = 1, i = 1; p <= total; p += k, i++) groups.push({ pages: rangeToPages([p, Math.min(total, p + k - 1)]), name: `${base}-part-${i}.pdf` });
    }
    const res = [];
    for (let i = 0; i < groups.length; i++) {
      onProgress(i / groups.length, `Writing ${groups[i].name}`);
      const d = await PDFDocument.create();
      await copyPagesInto(d, lib.doc, groups[i].pages.map((p) => p - 1));
      res.push({ id: i, name: groups[i].name, blob: pdfBlob(await d.save({ useObjectStreams: true })), note: `${groups[i].pages.length} page${groups[i].pages.length === 1 ? '' : 's'}` });
    }
    setOut(res);
  });

  if (!file) return <Dropzone accept={PDF_ACCEPT} onFiles={(f) => setFile(f[0])} icon={Scissors} title="Drop a PDF to split" hint="Extract page ranges, split every page, or cut into equal parts." formats="PDF" />;
  return (
    <ToolGrid side={
      <Panel title="Split options" icon={Scissors}>
        <div className="stack">
          <Seg value={mode} onChange={setMode} block options={[{ value: 'ranges', label: 'Ranges' }, { value: 'each', label: 'Every page' }, { value: 'every', label: 'Every N' }]} />
          {mode === 'ranges' && <>
            <TextField label="Pages" value={ranges} onChange={setRanges} mono placeholder="1-3, 5, 8-" hint={`Document has ${total} pages. Use commas and dashes.`} />
            <Toggle checked={combine} onChange={setCombine} label="Combine into one PDF" hint="Otherwise one PDF per range" />
          </>}
          {mode === 'every' && <NumberField label="Pages per file" value={n} onChange={setN} min={1} max={Math.max(total, 1)} />}
          <Button variant="primary" size="lg" icon={Scissors} loading={task.running} disabled={!lib} onClick={run} block>Split PDF</Button>
          <Button variant="ghost" size="sm" onClick={() => { setFile(null); setLib(null); }}>Choose another PDF</Button>
        </div>
      </Panel>
    }>
      {err ? <Alert kind="error">{err}</Alert> : (
        <Panel title={`${file.name} · ${total || '…'} pages`}>
          <div className="page-grid">
            {view && Array.from({ length: Math.min(total, 60) }, (_, i) => (
              <div className="page-card" key={i}><div className="thumb-box"><PageThumb pdf={view} pageNo={i + 1} width={140} /></div><span className="page-no">{i + 1}</span></div>
            ))}
          </div>
          {total > 60 && <p className="small muted" style={{ marginTop: 10 }}>Showing the first 60 page previews; the split still covers all {total} pages.</p>}
        </Panel>
      )}
      <TaskBar task={task} />
      <OutputList items={out} zipName={`${base}-split.zip`} title="Split result" />
    </ToolGrid>
  );
}
