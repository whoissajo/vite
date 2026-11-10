import { useState } from 'react';
import { Scaling } from 'lucide-react';
import { ColorField, NumberField, Select, Seg, Slider, Toggle } from '../../components/ui/index.jsx';
import BatchShell from './BatchShell.jsx';
import { createCanvas, loadImage } from '../../lib/common/files.js';
import { encodeCanvas, scaleBitmap } from '../../lib/image/codec.js';
import { extFromMime, renameWithExt } from '../../lib/common/format.js';

const PRESETS = [
  { value: 'custom', label: 'Custom' }, { value: '1920x1080', label: 'Full HD 1920×1080' }, { value: '1280x720', label: 'HD 1280×720' },
  { value: '1080x1080', label: 'Instagram post 1080×1080' }, { value: '1080x1350', label: 'Instagram portrait 1080×1350' }, { value: '1080x1920', label: 'Story / Reel 1080×1920' },
  { value: '1200x630', label: 'Open Graph / Facebook 1200×630' }, { value: '1500x500', label: 'X / Twitter header 1500×500' }, { value: '512x512', label: 'App icon 512×512' }, { value: '256x256', label: 'Avatar 256×256' },
];

export default function ImageResize() {
  const [mode, setMode] = useState('px');
  const [w, setW] = useState(1200);
  const [h, setH] = useState(NaN);
  const [pct, setPct] = useState(50);
  const [preset, setPreset] = useState('custom');
  const [fit, setFit] = useState('contain');
  const [bg, setBg] = useState('#000000');
  const [fmt, setFmt] = useState('same');
  const [quality, setQuality] = useState(90);
  const [noUp, setNoUp] = useState(true);

  const process = async (file) => {
    const bmp = await loadImage(file);
    let tw, th, exact = false;
    if (mode === 'pct') { tw = bmp.width * pct / 100; th = bmp.height * pct / 100; }
    else {
      let pw = w, ph = h;
      if (preset !== 'custom') { [pw, ph] = preset.split('x').map(Number); exact = true; }
      else if (Number.isFinite(pw) && Number.isFinite(ph)) exact = true;
      else if (Number.isFinite(pw)) { ph = bmp.height * pw / bmp.width; }
      else if (Number.isFinite(ph)) { pw = bmp.width * ph / bmp.height; }
      else { pw = bmp.width; ph = bmp.height; }
      tw = pw; th = ph;
    }
    if (noUp && !exact && mode === 'px' && (tw > bmp.width || th > bmp.height)) { tw = bmp.width; th = bmp.height; }
    tw = Math.max(1, Math.round(tw)); th = Math.max(1, Math.round(th));
    let canvas;
    if (!exact || fit === 'stretch') canvas = scaleBitmap(bmp, tw, th);
    else {
      const s = fit === 'cover' ? Math.max(tw / bmp.width, th / bmp.height) : Math.min(tw / bmp.width, th / bmp.height);
      const dw = Math.round(bmp.width * s), dh = Math.round(bmp.height * s);
      const scaled = scaleBitmap(bmp, dw, dh);
      canvas = createCanvas(tw, th);
      const x = canvas.getContext('2d');
      if (fit === 'contain') { x.fillStyle = bg; x.fillRect(0, 0, tw, th); }
      x.drawImage(scaled, (tw - dw) / 2, (th - dh) / 2);
    }
    bmp.close?.();
    const mime = fmt === 'same' ? (['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? file.type : 'image/png') : fmt;
    const blob = await encodeCanvas(canvas, mime, { quality: quality / 100, background: bg === '#000000' && fit !== 'contain' ? '#ffffff' : bg });
    return { name: renameWithExt(file.name, extFromMime(mime), `-${tw}x${th}`), blob, note: `${tw}×${th}px` };
  };

  return (
    <BatchShell
      icon={Scaling} dropTitle="Drop images to resize" runLabel="Resize" zipName="resized-images.zip" process={process} formats="JPG · PNG · WebP · GIF · BMP · SVG"
      settings={
        <>
          <Seg label="Resize by" value={mode} onChange={setMode} block options={[{ value: 'px', label: 'Pixels' }, { value: 'pct', label: 'Percent' }]} />
          {mode === 'pct' ? <Slider label="Scale" value={pct} onChange={setPct} min={5} max={200} format={(v) => `${v}%`} /> : (
            <>
              <Select label="Preset" value={preset} onChange={setPreset} options={PRESETS} />
              {preset === 'custom' ? (
                <div className="grid-2">
                  <NumberField label="Width" value={w} onChange={setW} min={1} suffix="px" />
                  <NumberField label="Height" value={h} onChange={setH} min={1} suffix="px" />
                </div>
              ) : null}
              {preset === 'custom' && <div className="field-hint">Leave one empty to keep the aspect ratio. Fill both to force an exact size.</div>}
              {(preset !== 'custom' || (Number.isFinite(w) && Number.isFinite(h))) && (
                <>
                  <Seg label="When ratio differs" value={fit} onChange={setFit} block options={[{ value: 'contain', label: 'Fit + bars' }, { value: 'cover', label: 'Fill + crop' }, { value: 'stretch', label: 'Stretch' }]} />
                  {fit === 'contain' && <ColorField label="Bar colour" value={bg} onChange={setBg} />}
                </>
              )}
            </>
          )}
          {mode === 'px' && preset === 'custom' && !(Number.isFinite(w) && Number.isFinite(h)) && <Toggle checked={noUp} onChange={setNoUp} label="Don’t enlarge" hint="Keep small images at their original size" />}
          <Select label="Output format" value={fmt} onChange={setFmt} options={[{ value: 'same', label: 'Same as input' }, { value: 'image/jpeg', label: 'JPG' }, { value: 'image/png', label: 'PNG' }, { value: 'image/webp', label: 'WebP' }]} />
          {fmt !== 'image/png' && <Slider label="Quality" value={quality} onChange={setQuality} min={30} max={100} format={(v) => `${v}%`} />}
        </>
      }
    />
  );
}
