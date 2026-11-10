import { useEffect, useMemo, useRef, useState } from 'react';
import { Crop, Download, FlipHorizontal, FlipVertical, RotateCcw, RotateCw } from 'lucide-react';
import { Alert, Button, Dropzone, NumberField, Panel, Seg, Slider, ToolGrid, toast } from '../../components/ui/index.jsx';
import { canvasToBlob, createCanvas, loadImage } from '../../lib/common/files.js';
import { downloadBlob } from '../../lib/common/download.js';
import { extFromMime, formatBytes, renameWithExt } from '../../lib/common/format.js';
import { encodeCanvas, IMAGE_ACCEPT } from '../../lib/image/codec.js';

const RATIOS = [['free', 'Free', null], ['1:1', '1:1', 1], ['4:3', '4:3', 4 / 3], ['3:2', '3:2', 3 / 2], ['16:9', '16:9', 16 / 9], ['9:16', '9:16', 9 / 16], ['4:5', '4:5', 4 / 5]];
const MIN = 8;

function buildWork(bmp, quarter, angle, flipH, flipV) {
  const rad = ((quarter * 90 + angle) * Math.PI) / 180;
  const w = bmp.width, h = bmp.height;
  const bw = Math.max(1, Math.round(Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))));
  const bh = Math.max(1, Math.round(Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))));
  const c = createCanvas(bw, bh);
  const x = c.getContext('2d');
  x.translate(bw / 2, bh / 2);
  x.rotate(rad);
  x.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  x.imageSmoothingQuality = 'high';
  x.drawImage(bmp, -w / 2, -h / 2);
  return c;
}

export default function ImageCrop() {
  const [file, setFile] = useState(null);
  const [bmp, setBmp] = useState(null);
  const [quarter, setQuarter] = useState(0);
  const [angle, setAngle] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [ratioKey, setRatioKey] = useState('free');
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 1, h: 1 });
  const [fmt, setFmt] = useState('image/png');
  const [quality, setQuality] = useState(92);
  const stage = useRef(null);
  const drag = useRef(null);
  const ratio = RATIOS.find((r) => r[0] === ratioKey)[2];

  useEffect(() => {
    if (!file) { setBmp(null); return undefined; }
    let dead = false, b;
    loadImage(file).then((x) => { if (dead) { x.close?.(); return; } b = x; setBmp(x); setQuarter(0); setAngle(0); setFlipH(false); setFlipV(false); setRatioKey('free'); })
      .catch((e) => toast.error(`Can’t open this image: ${e.message}`));
    return () => { dead = true; b?.close?.(); };
  }, [file]);

  const work = useMemo(() => (bmp ? buildWork(bmp, quarter, angle, flipH, flipV) : null), [bmp, quarter, angle, flipH, flipV]);
  useEffect(() => { if (work) setCrop(fitRatio({ x: 0, y: 0, w: work.width, h: work.height }, work, ratio)); }, [work]); // eslint-disable-line
  useEffect(() => {
    const el = stage.current;
    if (!el || !work) return;
    work.style.cssText = 'display:block;width:100%;height:auto;pointer-events:none;user-select:none';
    el.replaceChildren(work);
  }, [work]);

  function fitRatio(c, wk, r) {
    if (!r) return c;
    let w = c.w, h = w / r;
    if (h > wk.height) { h = wk.height; w = h * r; }
    if (w > wk.width) { w = wk.width; h = w / r; }
    return { x: Math.min(Math.max(0, c.x + (c.w - w) / 2), wk.width - w), y: Math.min(Math.max(0, c.y + (c.h - h) / 2), wk.height - h), w, h };
  }
  const pickRatio = (k) => { setRatioKey(k); const r = RATIOS.find((x) => x[0] === k)[2]; if (work) setCrop((c) => fitRatio(r ? { x: 0, y: 0, w: work.width, h: work.height } : c, work, r)); };

  const onDown = (mode) => (e) => {
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { mode, sx: e.clientX, sy: e.clientY, start: { ...crop }, scale: work.width / stage.current.clientWidth };
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) * d.scale, dy = (e.clientY - d.sy) * d.scale;
    const W = work.width, H = work.height, s = d.start;
    if (d.mode === 'move') { setCrop({ ...s, x: Math.min(Math.max(0, s.x + dx), W - s.w), y: Math.min(Math.max(0, s.y + dy), H - s.h) }); return; }
    let x1 = s.x, y1 = s.y, x2 = s.x + s.w, y2 = s.y + s.h;
    if (d.mode.includes('w')) x1 = Math.min(Math.max(0, s.x + dx), x2 - MIN);
    if (d.mode.includes('e')) x2 = Math.max(Math.min(W, x2 + dx), x1 + MIN);
    if (d.mode.includes('n')) y1 = Math.min(Math.max(0, s.y + dy), y2 - MIN);
    if (d.mode.includes('s')) y2 = Math.max(Math.min(H, y2 + dy), y1 + MIN);
    let nw = x2 - x1, nh = y2 - y1;
    if (ratio) {
      const vert = d.mode === 'n' || d.mode === 's', horiz = d.mode === 'e' || d.mode === 'w';
      if (vert) nw = nh * ratio; else if (horiz) nh = nw / ratio; else if (nw / nh > ratio) nh = nw / ratio; else nw = nh * ratio;
      // anchor opposite side, then clamp inside the image
      const ax = d.mode.includes('w') ? s.x + s.w : s.x, ay = d.mode.includes('n') ? s.y + s.h : s.y;
      const maxW = d.mode.includes('w') ? ax : W - ax, maxH = d.mode.includes('n') ? ay : H - ay;
      const k = Math.min(1, maxW / nw, maxH / nh);
      nw *= k; nh *= k;
      x1 = d.mode.includes('w') ? ax - nw : ax; y1 = d.mode.includes('n') ? ay - nh : ay;
      if (vert) x1 = Math.min(Math.max(0, s.x + (s.w - nw) / 2), W - nw);
      if (horiz) y1 = Math.min(Math.max(0, s.y + (s.h - nh) / 2), H - nh);
    }
    setCrop({ x: x1, y: y1, w: ratio ? nw : x2 - x1, h: ratio ? nh : y2 - y1 });
  };
  const onUp = () => { drag.current = null; };

  const setField = (k, v) => {
    if (!Number.isFinite(v) || !work) return;
    setCrop((c) => {
      const n = { ...c, [k]: Math.round(v) };
      if (k === 'w') { n.w = Math.min(Math.max(MIN, n.w), work.width); n.x = Math.min(n.x, work.width - n.w); if (ratio) n.h = Math.min(work.height - n.y, n.w / ratio); }
      if (k === 'h') { n.h = Math.min(Math.max(MIN, n.h), work.height); n.y = Math.min(n.y, work.height - n.h); if (ratio) n.w = Math.min(work.width - n.x, n.h * ratio); }
      if (k === 'x') n.x = Math.min(Math.max(0, n.x), work.width - n.w);
      if (k === 'y') n.y = Math.min(Math.max(0, n.y), work.height - n.h);
      return n;
    });
  };

  const exportIt = async () => {
    const cw = Math.round(crop.w), ch = Math.round(crop.h);
    const c = createCanvas(cw, ch);
    c.getContext('2d').drawImage(work, Math.round(crop.x), Math.round(crop.y), cw, ch, 0, 0, cw, ch);
    try {
      const blob = await encodeCanvas(c, fmt, { quality: quality / 100 });
      downloadBlob(blob, renameWithExt(file.name, extFromMime(fmt), '-cropped'));
      toast.ok(`Saved ${cw}×${ch}px · ${formatBytes(blob.size)}`);
    } catch (e) { toast.error(e.message); }
  };

  if (!file) return <Dropzone accept={IMAGE_ACCEPT} onFiles={(f) => setFile(f[0])} icon={Crop} title="Drop an image to crop or rotate" hint="Drag the box, pull the handles, pick an aspect ratio. Exports at full resolution." formats="JPG · PNG · WebP · GIF · BMP · SVG" />;
  const pc = work ? { l: (crop.x / work.width) * 100, t: (crop.y / work.height) * 100, w: (crop.w / work.width) * 100, h: (crop.h / work.height) * 100 } : null;
  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  return (
    <ToolGrid side={
      <>
        <Panel title="Crop" icon={Crop}>
          <div className="stack">
            <div className="chips" style={{ flexWrap: 'wrap' }}>{RATIOS.map(([k, l]) => <button key={k} className="chip" aria-pressed={ratioKey === k} onClick={() => pickRatio(k)}>{l}</button>)}</div>
            <div className="grid-2">
              <NumberField label="X" value={Math.round(crop.x)} onChange={(v) => setField('x', v)} suffix="px" />
              <NumberField label="Y" value={Math.round(crop.y)} onChange={(v) => setField('y', v)} suffix="px" />
              <NumberField label="Width" value={Math.round(crop.w)} onChange={(v) => setField('w', v)} suffix="px" />
              <NumberField label="Height" value={Math.round(crop.h)} onChange={(v) => setField('h', v)} suffix="px" />
            </div>
          </div>
        </Panel>
        <Panel title="Rotate & flip" icon={RotateCw}>
          <div className="stack">
            <div className="row">
              <Button size="sm" icon={RotateCcw} onClick={() => setQuarter((q) => (q + 3) % 4)}>90° left</Button>
              <Button size="sm" icon={RotateCw} onClick={() => setQuarter((q) => (q + 1) % 4)}>90° right</Button>
              <Button size="sm" icon={FlipHorizontal} aria-label="Flip horizontal" onClick={() => setFlipH((v) => !v)} />
              <Button size="sm" icon={FlipVertical} aria-label="Flip vertical" onClick={() => setFlipV((v) => !v)} />
            </div>
            <Slider label="Fine angle" value={angle} onChange={setAngle} min={-45} max={45} step={0.5} format={(v) => `${v}°`} hint="Straighten a tilted photo. Corners become transparent (white in JPG)." />
          </div>
        </Panel>
        <Panel title="Export" icon={Download}>
          <div className="stack">
            <Seg value={fmt} onChange={setFmt} block options={[{ value: 'image/png', label: 'PNG' }, { value: 'image/jpeg', label: 'JPG' }, { value: 'image/webp', label: 'WebP' }]} />
            {fmt !== 'image/png' && <Slider label="Quality" value={quality} onChange={setQuality} min={30} max={100} format={(v) => `${v}%`} />}
            <Button variant="primary" size="lg" icon={Download} onClick={exportIt} block disabled={!work}>Crop &amp; download</Button>
            <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Choose another image</Button>
          </div>
        </Panel>
      </>
    }>
      <Panel title={`${file.name} · ${work ? `${work.width}×${work.height}` : '…'}`}>
        {!work ? <div className="skeleton" style={{ height: 320 }} /> : (
          <div className="crop-wrap checker" style={{ maxWidth: `${(72 * work.width) / work.height}vh` }}>
            <div className="crop-stage" ref={stage} />
            <div className="crop-layer" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
              <div className="crop-box" style={{ left: `${pc.l}%`, top: `${pc.t}%`, width: `${pc.w}%`, height: `${pc.h}%` }} onPointerDown={onDown('move')} role="group" aria-label="Crop area">
                <i className="crop-grid" />
                {handles.map((h) => <b key={h} className={`crop-h crop-h-${h}`} onPointerDown={onDown(h)} />)}
              </div>
            </div>
          </div>
        )}
      </Panel>
      <Alert kind="info">Drag inside the box to move it, or drag a handle to resize. Output is cut from the full-resolution image, not the preview.</Alert>
    </ToolGrid>
  );
}
