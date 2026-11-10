import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Alert, ColorField, Seg, Slider } from '../../components/ui/index.jsx';
import BatchShell from './BatchShell.jsx';
import { bitmapToCanvas, encodeCanvas, IMAGE_ACCEPT } from '../../lib/image/codec.js';
import { canEncodeImage } from '../../lib/common/files.js';
import { renameWithExt } from '../../lib/common/format.js';

const FORMATS = [
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg' }, { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' }, { value: 'image/avif', label: 'AVIF', ext: 'avif' }, { value: 'image/bmp', label: 'BMP', ext: 'bmp' },
];

export default function ImageConvert() {
  const [fmt, setFmt] = useState('image/webp');
  const [quality, setQuality] = useState(85);
  const [bg, setBg] = useState('#ffffff');
  const [support, setSupport] = useState({ 'image/jpeg': true, 'image/png': true, 'image/bmp': true });
  useEffect(() => {
    (async () => {
      const [webp, avif] = [await canEncodeImage('image/webp'), await canEncodeImage('image/avif')];
      setSupport((s) => ({ ...s, 'image/webp': webp, 'image/avif': avif }));
    })();
  }, []);
  const lossy = ['image/jpeg', 'image/webp', 'image/avif'].includes(fmt);
  const flat = fmt === 'image/jpeg' || fmt === 'image/bmp';
  const f = FORMATS.find((x) => x.value === fmt);

  return (
    <BatchShell
      icon={RefreshCw} dropTitle="Drop images to convert" formats="JPG · PNG · WebP · GIF · BMP · AVIF · SVG → JPG · PNG · WebP · AVIF · BMP"
      runLabel="Convert" zipName="converted-images.zip" accept={IMAGE_ACCEPT}
      process={async (file) => {
        const { canvas } = await bitmapToCanvas(file);
        const blob = await encodeCanvas(canvas, fmt, { quality: quality / 100, background: bg });
        return { name: renameWithExt(file.name, f.ext), blob };
      }}
      settings={
        <>
          <Seg label="Convert to" value={fmt} onChange={setFmt} options={FORMATS.map((o) => ({ value: o.value, label: o.label, disabled: support[o.value] === false }))} />
          {(support['image/avif'] === false) && <Alert kind="info">This browser can’t encode AVIF, so that option is disabled. Chrome and Edge can.</Alert>}
          {lossy && <Slider label="Quality" value={quality} onChange={setQuality} min={10} max={100} format={(v) => `${v}%`} />}
          {flat && <ColorField label="Background for transparent areas" value={bg} onChange={setBg} />}
        </>
      }
    />
  );
}
