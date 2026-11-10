import { useEffect, useState } from 'react';
import { Stamp } from 'lucide-react';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { Alert, Button, ColorField, Dropzone, OutputList, Panel, Seg, Select, Slider, TaskBar, TextField, ToolGrid, Toggle, NumberField } from '../../components/ui/index.jsx';
import { useTask } from '../../lib/common/hooks.js';
import { PDF_ACCEPT, loadPdfLib, parseRanges, pdfBlob, rangeToPages } from '../../lib/pdf/core.js';
import { stripExt } from '../../lib/common/format.js';

const hex = (h) => { const n = parseInt(h.slice(1), 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };

export default function PdfWatermark() {
  const [file, setFile] = useState(null);
  const [lib, setLib] = useState(null);
  const [err, setErr] = useState('');
  const [wm, setWm] = useState(true);
  const [text, setText] = useState('CONFIDENTIAL');
  const [size, setSize] = useState(56);
  const [color, setColor] = useState('#e11d48');
  const [opacity, setOpacity] = useState(25);
  const [rot, setRot] = useState(45);
  const [tile, setTile] = useState(false);
  const [num, setNum] = useState(true);
  const [fmt, setFmt] = useState('Page {n} of {total}');
  const [pos, setPos] = useState('bc');
  const [start, setStart] = useState(1);
  const [nsize, setNsize] = useState(10);
  const [range, setRange] = useState('');
  const [out, setOut] = useState([]);
  const task = useTask();

  useEffect(() => { if (!file) return; setErr(''); setLib(null); setOut([]); loadPdfLib(file).then(setLib).catch((e) => setErr(e.message)); }, [file]);

  const run = () => task.run(async () => {
    const doc = lib.doc; const total = doc.getPageCount();
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const reg = await doc.embedFont(StandardFonts.Helvetica);
    const sel = range.trim() ? new Set(parseRanges(range, total).flatMap(rangeToPages)) : null;
    const check = (f, s) => { try { f.encodeText(s); } catch { throw new Error('This text contains characters the built-in PDF fonts can’t draw (only Latin / Western European letters are supported). Remove emoji or non-Latin letters.'); } };
    if (wm) check(font, text); if (num) check(reg, fmt.replace('{n}', '1').replace('{total}', '1'));
    doc.getPages().forEach((page, i) => {
      if (sel && !sel.has(i + 1)) return;
      const { width: W, height: H } = page.getSize();
      if (wm && text.trim()) {
        const tw = font.widthOfTextAtSize(text, size), th = font.heightAtSize(size);
        const place = (cx, cy) => {
          const a = (rot * Math.PI) / 180;
          page.drawText(text, { x: cx - (tw / 2) * Math.cos(a) + (th / 3) * Math.sin(a), y: cy - (tw / 2) * Math.sin(a) - (th / 3) * Math.cos(a), size, font, color: hex(color), opacity: opacity / 100, rotate: degrees(rot) });
        };
        if (tile) { const sx = tw + 90, sy = th + 120; for (let y = -H; y < H * 2; y += sy) for (let x = -W; x < W * 2; x += sx) place(x + ((Math.round(y / sy) % 2) * sx) / 2, y); }
        else place(W / 2, H / 2);
      }
      if (num) {
        const label = fmt.replace('{n}', String(i + start)).replace('{total}', String(total + start - 1));
        const tw = reg.widthOfTextAtSize(label, nsize), m = 28;
        const x = pos.endsWith('l') ? m : pos.endsWith('r') ? W - m - tw : (W - tw) / 2;
        const y = pos.startsWith('t') ? H - m - nsize : m;
        page.drawText(label, { x, y, size: nsize, font: reg, color: rgb(0.2, 0.2, 0.2) });
      }
    });
    setOut([{ id: 'w', name: `${stripExt(file.name)}-stamped.pdf`, blob: pdfBlob(await doc.save({ useObjectStreams: true })), note: `${total} pages` }]);
    setLib(await loadPdfLib(file)); // fresh copy so re-running doesn't stamp twice
  });

  if (!file) return <Dropzone accept={PDF_ACCEPT} onFiles={(f) => setFile(f[0])} icon={Stamp} title="Drop a PDF to watermark or number" hint="Add a text watermark and/or page numbers." formats="PDF" />;
  return (
    <ToolGrid side={
      <>
        <Panel title="Watermark" icon={Stamp} actions={<Toggle checked={wm} onChange={setWm} label="" />}>
          <div className="stack">
            <TextField label="Text" value={text} onChange={setText} disabled={!wm} />
            <div className="grid-2"><ColorField label="Colour" value={color} onChange={setColor} /><NumberField label="Size" value={size} onChange={setSize} min={8} max={200} suffix="pt" /></div>
            <Slider label="Opacity" value={opacity} onChange={setOpacity} min={5} max={100} format={(v) => `${v}%`} />
            <Slider label="Rotation" value={rot} onChange={setRot} min={-90} max={90} format={(v) => `${v}°`} />
            <Toggle checked={tile} onChange={setTile} label="Tile across page" />
          </div>
        </Panel>
        <Panel title="Page numbers" actions={<Toggle checked={num} onChange={setNum} label="" />}>
          <div className="stack">
            <TextField label="Format" value={fmt} onChange={setFmt} mono hint="{n} = page number, {total} = page count" disabled={!num} />
            <Select label="Position" value={pos} onChange={setPos} options={[{ value: 'bc', label: 'Bottom centre' }, { value: 'bl', label: 'Bottom left' }, { value: 'br', label: 'Bottom right' }, { value: 'tc', label: 'Top centre' }, { value: 'tl', label: 'Top left' }, { value: 'tr', label: 'Top right' }]} />
            <div className="grid-2"><NumberField label="Start at" value={start} onChange={(v) => setStart(Math.max(0, Math.round(v) || 0))} /><NumberField label="Size" value={nsize} onChange={setNsize} min={6} max={40} suffix="pt" /></div>
          </div>
        </Panel>
        <Panel><div className="stack">
          <TextField label="Only pages (optional)" value={range} onChange={setRange} mono placeholder="all pages, or 1-3, 5" />
          <Button variant="primary" size="lg" icon={Stamp} loading={task.running} disabled={!lib || (!wm && !num)} onClick={run} block>Apply &amp; save</Button>
          <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Choose another PDF</Button>
        </div></Panel>
      </>
    }>
      {err && <Alert kind="error">{err}</Alert>}
      <Panel title={file.name}><p className="muted small">{lib ? `${lib.doc.getPageCount()} pages. Settings on the right are applied to the real PDF when you save.` : 'Reading…'}</p></Panel>
      <TaskBar task={task} />
      <OutputList items={out} title="Stamped PDF" />
    </ToolGrid>
  );
}
