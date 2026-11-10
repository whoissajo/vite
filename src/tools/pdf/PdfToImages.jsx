import { useEffect, useState } from 'react';
import { Images } from 'lucide-react';
import { Alert, Button, Dropzone, OutputList, Panel, Seg, Slider, TaskBar, TextField, ToolGrid } from '../../components/ui/index.jsx';
import { useTask } from '../../lib/common/hooks.js';
import { PDF_ACCEPT, openPdfJs, parseRanges, rangeToPages, renderPage } from '../../lib/pdf/core.js';
import { canvasToBlob, tick } from '../../lib/common/files.js';
import { extFromMime, stripExt } from '../../lib/common/format.js';

export default function PdfToImages() {
  const [file, setFile] = useState(null);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState('');
  const [fmt, setFmt] = useState('image/png');
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(90);
  const [pagesText, setPagesText] = useState('');
  const [out, setOut] = useState([]);
  const task = useTask();

  useEffect(() => {
    if (!file) return undefined;
    let d, dead = false; setErr(''); setOut([]);
    openPdfJs(file).then((p) => { d = p; if (!dead) { setTotal(p.numPages); setPagesText(''); } else p.destroy(); }).catch((e) => setErr(e.message));
    return () => { dead = true; d?.destroy(); };
  }, [file]);

  const run = () => task.run(async ({ onProgress, throwIfAborted }) => {
    const pdf = await openPdfJs(file);
    try {
      const list = pagesText.trim() ? [...new Set(parseRanges(pagesText, pdf.numPages).flatMap(rangeToPages))] : Array.from({ length: pdf.numPages }, (_, i) => i + 1);
      const res = [];
      for (let i = 0; i < list.length; i++) {
        onProgress(i / list.length, `Rendering page ${list[i]} (${i + 1}/${list.length})`);
        const c = await renderPage(pdf, list[i], dpi / 72);
        const blob = await canvasToBlob(c, fmt, quality / 100);
        res.push({ id: i, name: `${stripExt(file.name)}-page-${String(list[i]).padStart(String(pdf.numPages).length, '0')}.${extFromMime(fmt)}`, blob, note: `${c.width}×${c.height}px` });
        c.width = c.height = 0; // free canvas memory right away
        throwIfAborted(); await tick();
      }
      setOut(res);
    } finally { pdf.destroy(); }
  });

  if (!file) return <Dropzone accept={PDF_ACCEPT} onFiles={(f) => setFile(f[0])} icon={Images} title="Drop a PDF to turn into images" hint="Every page becomes a PNG, JPG or WebP." formats="PDF" />;
  return (
    <ToolGrid side={
      <Panel title="Image settings" icon={Images}>
        <div className="stack">
          <Seg label="Format" value={fmt} onChange={setFmt} block options={[{ value: 'image/png', label: 'PNG' }, { value: 'image/jpeg', label: 'JPG' }, { value: 'image/webp', label: 'WebP' }]} />
          <Slider label="Resolution" value={dpi} onChange={setDpi} min={72} max={300} step={6} format={(v) => `${v} DPI`} hint="150 is crisp on screen; 300 for print." />
          {fmt !== 'image/png' && <Slider label="Quality" value={quality} onChange={setQuality} min={40} max={100} format={(v) => `${v}%`} />}
          <TextField label="Pages (optional)" value={pagesText} onChange={setPagesText} mono placeholder="all pages, or e.g. 1-3, 7" hint={total ? `Document has ${total} pages.` : ''} />
          <Button variant="primary" size="lg" icon={Images} loading={task.running} disabled={!total} onClick={run} block>Convert to images</Button>
          <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Choose another PDF</Button>
        </div>
      </Panel>
    }>
      {err && <Alert kind="error">{err}</Alert>}
      <Panel title={file.name}><p className="muted small">{total ? `${total} pages detected.` : 'Reading…'}</p></Panel>
      <TaskBar task={task} />
      <OutputList items={out} zipName={`${stripExt(file.name)}-images.zip`} title="Page images" />
    </ToolGrid>
  );
}
