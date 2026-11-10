import { useState } from 'react';
import { Minimize2 } from 'lucide-react';
import { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFArray, PDFDict } from 'pdf-lib';
import { Alert, Button, Dropzone, OutputList, Panel, Result, Seg, Slider, TaskBar, ToolGrid, Toggle, sizeStats } from '../../components/ui/index.jsx';
import { useTask } from '../../lib/common/hooks.js';
import { PDF_ACCEPT, loadPdfLib, openPdfJs, pdfBlob, renderPage } from '../../lib/pdf/core.js';
import { canvasToBlob, createCanvas, tick } from '../../lib/common/files.js';
import { downloadBlob } from '../../lib/common/download.js';
import { stripExt, formatBytes } from '../../lib/common/format.js';

const N = (s) => PDFName.of(s);
const nameOf = (v) => (v instanceof PDFName ? v.decodeText() : undefined);

/** Re-encode embedded DCT (JPEG) images smaller. Returns { replaced, saved }. */
async function recompressImages(doc, { quality, maxDim, onProgress, throwIfAborted }) {
  const ctx = doc.context;
  const targets = [];
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const d = obj.dict;
    if (nameOf(d.get(N('Subtype'))) !== 'Image') continue;
    let filter = d.get(N('Filter'));
    if (filter instanceof PDFArray) { if (filter.size() !== 1) continue; filter = filter.get(0); }
    if (nameOf(filter) !== 'DCTDecode') continue;
    const cs = nameOf(d.get(N('ColorSpace')));
    if (cs !== 'DeviceRGB' && cs !== 'DeviceGray') continue; // skip CMYK/ICC/indexed: not safely re-encodable
    if (d.get(N('Decode')) || d.get(N('Mask'))) continue;
    targets.push([ref, obj]);
  }
  let replaced = 0, saved = 0;
  for (let i = 0; i < targets.length; i++) {
    const [ref, obj] = targets[i];
    onProgress?.(i / Math.max(1, targets.length), `Recompressing image ${i + 1} of ${targets.length}`);
    try {
      const bmp = await createImageBitmap(new Blob([obj.contents], { type: 'image/jpeg' }), { imageOrientation: 'none' });
      const r = maxDim ? Math.min(1, maxDim / Math.max(bmp.width, bmp.height)) : 1;
      const w = Math.max(1, Math.round(bmp.width * r)), h = Math.max(1, Math.round(bmp.height * r));
      const c = createCanvas(w, h);
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, w, h); bmp.close();
      const blob = await canvasToBlob(c, 'image/jpeg', quality);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (bytes.length < obj.contents.length * 0.95) {
        const dict = ctx.obj({ Type: 'XObject', Subtype: 'Image', Width: w, Height: h, ColorSpace: 'DeviceRGB', BitsPerComponent: 8, Filter: 'DCTDecode' });
        const sm = obj.dict.get(N('SMask')); if (sm) dict.set(N('SMask'), sm);
        if (sm && r !== 1) dict.delete(N('SMask')) && 0; // keep as-is; mask dims are independent in PDF
        ctx.assign(ref, PDFRawStream.of(dict, bytes));
        saved += obj.contents.length - bytes.length; replaced++;
      }
    } catch { /* undecodable image: leave untouched */ }
    throwIfAborted?.(); await tick();
  }
  return { replaced, saved, found: targets.length };
}

export default function PdfCompress() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('optimize');
  const [quality, setQuality] = useState(70);
  const [maxDim, setMaxDim] = useState(1800);
  const [dpi, setDpi] = useState(110);
  const [strip, setStrip] = useState(true);
  const [res, setRes] = useState(null);
  const task = useTask();

  const run = () => task.run(async ({ onProgress, throwIfAborted }) => {
    setRes(null);
    let outBytes, note;
    if (mode === 'optimize') {
      const { doc } = await loadPdfLib(file);
      const r = await recompressImages(doc, { quality: quality / 100, maxDim, onProgress, throwIfAborted });
      if (strip) { doc.setTitle(''); doc.setAuthor(''); doc.setSubject(''); doc.setKeywords([]); doc.setCreator(''); doc.setProducer('OffKit'); }
      outBytes = await doc.save({ useObjectStreams: true });
      note = r.found ? `${r.replaced} of ${r.found} JPEG images recompressed` : 'No recompressible JPEG images found — only structure was optimised';
    } else {
      const pdf = await openPdfJs(file);
      try {
        const d = await PDFDocument.create();
        for (let p = 1; p <= pdf.numPages; p++) {
          onProgress((p - 1) / pdf.numPages, `Rasterizing page ${p} of ${pdf.numPages}`);
          const page = await pdf.getPage(p); const vp = page.getViewport({ scale: 1 });
          const c = await renderPage(pdf, p, dpi / 72);
          const jpg = new Uint8Array(await (await canvasToBlob(c, 'image/jpeg', quality / 100)).arrayBuffer());
          const img = await d.embedJpg(jpg);
          d.addPage([vp.width, vp.height]).drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
          c.width = c.height = 0; throwIfAborted(); await tick();
        }
        outBytes = await d.save({ useObjectStreams: true });
        note = 'Pages were converted to images — text is no longer selectable';
      } finally { pdf.destroy(); }
    }
    setRes({ bytes: outBytes, note, smaller: outBytes.length < file.size });
  });

  if (!file) return <Dropzone accept={PDF_ACCEPT} onFiles={(f) => { setFile(f[0]); setRes(null); }} icon={Minimize2} title="Drop a PDF to compress" hint="Recompresses embedded photos, or rasterizes for maximum shrink. Real sizes, always." formats="PDF" />;
  return (
    <ToolGrid side={
      <Panel title="Compression" icon={Minimize2}>
        <div className="stack">
          <Seg value={mode} onChange={setMode} block options={[{ value: 'optimize', label: 'Optimize' }, { value: 'max', label: 'Maximum' }]} />
          {mode === 'optimize'
            ? <p className="small muted">Keeps text, links and vector graphics sharp. Re-encodes embedded JPEG photos smaller. Best for scans-with-photos and image-heavy PDFs.</p>
            : <p className="small muted">Turns every page into a JPEG image. Biggest savings, but text becomes non-selectable and non-searchable.</p>}
          <Slider label="Image quality" value={quality} onChange={setQuality} min={20} max={95} format={(v) => `${v}%`} />
          {mode === 'optimize' ? <Slider label="Max image size" value={maxDim} onChange={setMaxDim} min={600} max={4000} step={100} format={(v) => `${v}px`} hint="Longest side of embedded photos." /> : <Slider label="Page resolution" value={dpi} onChange={setDpi} min={50} max={200} step={10} format={(v) => `${v} DPI`} />}
          {mode === 'optimize' && <Toggle checked={strip} onChange={setStrip} label="Strip metadata" hint="Title, author, creator" />}
          <Button variant="primary" size="lg" icon={Minimize2} loading={task.running} onClick={run} block>Compress PDF</Button>
          <Button variant="ghost" size="sm" onClick={() => { setFile(null); setRes(null); }}>Choose another PDF</Button>
        </div>
      </Panel>
    }>
      <Panel title={`${file.name} · ${formatBytes(file.size)}`}><p className="small muted">Original size {formatBytes(file.size)}</p></Panel>
      <TaskBar task={task} />
      {res && (res.smaller
        ? <>
          <Result title="Compressed" name={`${stripExt(file.name)}-compressed.pdf`} stats={sizeStats(file.size, res.bytes.length)}>
            <p className="small muted">{res.note}</p>
            <Button variant="primary" onClick={() => downloadBlob(pdfBlob(res.bytes), `${stripExt(file.name)}-compressed.pdf`)}>Download</Button>
          </Result>
        </>
        : <Alert kind="warn" title="Couldn’t make it smaller.">This PDF is already well compressed — the result would be {formatBytes(res.bytes.length)} vs your {formatBytes(file.size)}. Keep the original. {mode === 'optimize' && 'Try “Maximum” if you can live without selectable text.'}</Alert>)}
    </ToolGrid>
  );
}
