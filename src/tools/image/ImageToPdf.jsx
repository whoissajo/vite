import { useState } from 'react';
import { FileImage, Plus, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import exifr from 'exifr';
import { Alert, Button, Dropzone, FileRow, NumberField, OutputList, Panel, Seg, Select, TaskBar, ToolGrid } from '../../components/ui/index.jsx';
import { useTask } from '../../lib/common/hooks.js';
import { useFiles } from '../../lib/common/useFiles.js';
import { createCanvas, loadImage, canvasToBlob } from '../../lib/common/files.js';
import { IMAGE_ACCEPT, tick } from '../../lib/image/codec.js';

const SIZES = { a4: [595.28, 841.89], letter: [612, 792], a3: [841.89, 1190.55], a5: [419.53, 595.28] };
const MM = 72 / 25.4;

async function embed(doc, file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isJpg = file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name);
  const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
  if (isJpg) {
    const orient = await exifr.orientation(file).catch(() => 1);
    if (!orient || orient === 1) return doc.embedJpg(bytes); // untouched JPEG bytes, no recompression
  } else if (isPng) return doc.embedPng(bytes);
  // anything else (webp/gif/bmp/svg/rotated jpeg): decode (orientation applied) → PNG/JPEG
  const bmp = await loadImage(file);
  const c = createCanvas(bmp.width, bmp.height);
  c.getContext('2d').drawImage(bmp, 0, 0);
  bmp.close?.();
  const blob = await canvasToBlob(c, isJpg ? 'image/jpeg' : 'image/png', 0.92);
  const b = new Uint8Array(await blob.arrayBuffer());
  return isJpg ? doc.embedJpg(b) : doc.embedPng(b);
}

export default function ImageToPdf() {
  const list = useFiles();
  const task = useTask();
  const [size, setSize] = useState('a4');
  const [orient, setOrient] = useState('auto');
  const [margin, setMargin] = useState(10);
  const [fit, setFit] = useState('contain');
  const [out, setOut] = useState([]);
  const [pages, setPages] = useState(0);

  const build = () => task.run(async ({ onProgress, throwIfAborted }) => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < list.files.length; i++) {
      onProgress(i / list.files.length, `Adding page ${i + 1} of ${list.files.length}`);
      const img = await embed(doc, list.files[i]);
      let pw, ph;
      if (size === 'fit') { pw = img.width * 0.75; ph = img.height * 0.75; }
      else {
        [pw, ph] = SIZES[size];
        const land = orient === 'landscape' || (orient === 'auto' && img.width > img.height);
        if (land) [pw, ph] = [ph, pw];
      }
      const page = doc.addPage([pw, ph]);
      const m = size === 'fit' ? 0 : margin * MM;
      const bw = pw - 2 * m, bh = ph - 2 * m;
      let s = fit === 'fill' ? Math.max(bw / img.width, bh / img.height) : Math.min(bw / img.width, bh / img.height);
      if (size === 'fit') s = 0.75;
      const dw = img.width * s, dh = img.height * s;
      if (fit === 'fill' && size !== 'fit') {
        // cover: clip by drawing within page bounds (extra is cut off by the page edge)
      }
      page.drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
      throwIfAborted();
      await tick();
    }
    doc.setProducer('OffKit'); doc.setCreator('OffKit');
    const bytes = await doc.save();
    setPages(doc.getPageCount());
    setOut([{ id: 'pdf', name: 'images.pdf', blob: new Blob([bytes], { type: 'application/pdf' }), note: `${doc.getPageCount()} pages` }]);
  });

  if (!list.items.length) return <Dropzone multiple accept={IMAGE_ACCEPT} onFiles={list.add} icon={FileImage} title="Drop images to turn into a PDF" hint="Each image becomes a page. Reorder them before you build." formats="JPG · PNG · WebP · GIF · BMP" />;
  return (
    <ToolGrid side={
      <Panel title="Page setup" icon={FileImage}>
        <div className="stack">
          <Select label="Page size" value={size} onChange={setSize} options={[{ value: 'a4', label: 'A4' }, { value: 'letter', label: 'US Letter' }, { value: 'a3', label: 'A3' }, { value: 'a5', label: 'A5' }, { value: 'fit', label: 'Fit to each image' }]} />
          {size !== 'fit' && (
            <>
              <Seg label="Orientation" value={orient} onChange={setOrient} block options={[{ value: 'auto', label: 'Auto' }, { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
              <NumberField label="Margin" value={margin} onChange={(v) => setMargin(Math.max(0, v || 0))} min={0} max={50} suffix="mm" />
              <Seg label="Image fit" value={fit} onChange={setFit} block options={[{ value: 'contain', label: 'Fit inside' }, { value: 'fill', label: 'Fill page' }]} />
            </>
          )}
          <Button variant="primary" size="lg" icon={FileImage} loading={task.running} onClick={build} block>Create PDF</Button>
        </div>
      </Panel>
    }>
      <Panel title={`Pages (${list.items.length})`} icon={FileImage} actions={<>
        <label className="btn btn-sm" style={{ cursor: 'pointer' }}><Plus size={15} /> Add more<input type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={(e) => { list.add(e.target.files); e.target.value = ''; }} /></label>
        <Button size="sm" variant="ghost" icon={Trash2} onClick={() => { list.clear(); setOut([]); }}>Clear</Button></>}>
        <div className="file-list">
          {list.items.map((it, i) => <FileRow key={it.id} file={it.file} sub={`Page ${i + 1}`} onUp={i > 0 ? () => list.move(it.id, -1) : undefined} onDown={i < list.items.length - 1 ? () => list.move(it.id, 1) : undefined} onRemove={() => list.remove(it.id)} />)}
        </div>
      </Panel>
      <TaskBar task={task} />
      {out.length > 0 && <OutputList items={out} title={`PDF with ${pages} page${pages === 1 ? '' : 's'}`} />}
      {size !== 'fit' && fit === 'fill' && <Alert kind="info">“Fill page” scales each image to cover the page area inside the margins; parts outside the page are cropped by the page edge.</Alert>}
    </ToolGrid>
  );
}
