import { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Minimize2, Plus, Trash2 } from 'lucide-react';
import { Alert, BeforeAfter, Button, Dropzone, FileRow, NumberField, OutputList, Panel, Seg, Slider, TaskBar, ToolGrid, Toggle } from '../../components/ui/index.jsx';
import { useTask, useObjectUrl } from '../../lib/common/hooks.js';
import { useFiles } from '../../lib/common/useFiles.js';
import { extFromMime, formatBytes, renameWithExt } from '../../lib/common/format.js';
import { bitmapToCanvas, encodeCanvas, encodeToTarget, hasAlpha, IMAGE_ACCEPT, tick } from '../../lib/image/codec.js';

const SAME = { 'image/jpeg': 'image/jpeg', 'image/png': 'image/png', 'image/webp': 'image/webp' };

export default function ImageCompress() {
  const list = useFiles();
  const task = useTask();
  const [format, setFormat] = useState('same');
  const [quality, setQuality] = useState(75);
  const [colors, setColors] = useState(128);
  const [lossless, setLossless] = useState(false);
  const [maxDim, setMaxDim] = useState(0);
  const [targetOn, setTargetOn] = useState(false);
  const [targetKb, setTargetKb] = useState(200);
  const [out, setOut] = useState([]);
  const [sel, setSel] = useState(0);

  useEffect(() => { setOut([]); setSel(0); }, [list.items.length]);

  const run = () => task.run(async ({ onProgress, throwIfAborted }) => {
    const results = [];
    for (let i = 0; i < list.files.length; i++) {
      const file = list.files[i];
      onProgress(i / list.files.length, `Compressing ${file.name} (${i + 1}/${list.files.length})`);
      const { canvas } = await bitmapToCanvas(file, { maxDim: maxDim || undefined });
      let mime = format === 'same' ? (SAME[file.type] || 'image/webp') : format;
      // transparent image → JPEG would silently flatten; keep transparency by choosing WebP/PNG
      if (format === 'same' && mime === 'image/jpeg') mime = 'image/jpeg';
      let blob;
      if (mime === 'image/png') blob = await encodeCanvas(canvas, mime, { pngColors: lossless ? 0 : colors });
      else if (targetOn) blob = await encodeToTarget(canvas, mime, targetKb * 1024);
      else blob = await encodeCanvas(canvas, mime, { quality: quality / 100 });
      const sameFormat = mime === file.type && !maxDim;
      let name = renameWithExt(file.name, extFromMime(mime), '-compressed');
      let note;
      if (sameFormat && blob.size >= file.size) { blob = file; name = file.name; note = 'Already optimal — kept original'; }
      else if (blob.size >= file.size) note = 'Larger than the original (format change)';
      results.push({ id: i, name, blob, original: file.size, note, src: file });
      throwIfAborted();
      await tick();
    }
    setOut(results); setSel(0);
  });

  const cur = out[sel];
  const beforeUrl = useObjectUrl(cur?.src);
  const afterUrl = useObjectUrl(cur?.blob);
  const png = format === 'image/png' || (format === 'same' && list.file?.type === 'image/png');

  if (!list.items.length) {
    return <Dropzone multiple accept={IMAGE_ACCEPT} onFiles={list.add} icon={Minimize2} title="Drop images to compress" hint="JPG, PNG, WebP and more. Batch as many as you like — nothing is uploaded." formats="JPG · PNG · WebP · GIF · BMP · AVIF" />;
  }
  return (
    <ToolGrid side={
      <>
        <Panel title="Settings" icon={Minimize2}>
          <div className="stack">
            <Seg label="Output format" value={format} onChange={setFormat} block options={[{ value: 'same', label: 'Same' }, { value: 'image/jpeg', label: 'JPG' }, { value: 'image/webp', label: 'WebP' }, { value: 'image/png', label: 'PNG' }]} />
            {png ? (
              <>
                <Toggle checked={lossless} onChange={setLossless} label="Lossless PNG" hint="Exact pixels, smaller gains" />
                {!lossless && <Slider label="Colours" value={colors} onChange={setColors} min={8} max={256} step={8} hint="Fewer colours = smaller file. 128 is usually invisible on photos/graphics." />}
              </>
            ) : (
              <>
                <Toggle checked={targetOn} onChange={setTargetOn} label="Target file size" hint="Finds the highest quality under the limit" />
                {targetOn ? <NumberField label="Max size" value={targetKb} onChange={setTargetKb} min={5} step={10} suffix="KB" /> : <Slider label="Quality" value={quality} onChange={setQuality} min={10} max={100} format={(v) => `${v}%`} />}
              </>
            )}
            <NumberField label="Max width/height" value={maxDim || ''} onChange={(v) => setMaxDim(v > 0 ? Math.round(v) : 0)} min={0} step={100} suffix="px" hint="Leave empty to keep original dimensions." />
            <Button variant="primary" size="lg" icon={Minimize2} loading={task.running} onClick={run} block>Compress {list.items.length > 1 ? `${list.items.length} images` : 'image'}</Button>
          </div>
        </Panel>
      </>
    }>
      <Panel title={`Images (${list.items.length})`} icon={ImageIcon} actions={<><AddMore onFiles={list.add} />
        <Button size="sm" icon={Trash2} variant="ghost" onClick={list.clear}>Clear</Button></>}>
        <div className="file-list">{list.items.map((it) => <FileRow key={it.id} file={it.file} onRemove={() => list.remove(it.id)} />)}</div>
      </Panel>
      <TaskBar task={task} />
      {cur && (
        <>
          {out.length > 1 && <div className="seg" style={{ alignSelf: 'flex-start' }}>{out.map((o, i) => <button key={o.id} aria-pressed={i === sel} onClick={() => setSel(i)}>{i + 1}</button>)}</div>}
          {cur.blob !== cur.src && beforeUrl && afterUrl && <BeforeAfter before={beforeUrl} after={afterUrl} beforeLabel={`Original · ${formatBytes(cur.src.size)}`} afterLabel={`Compressed · ${formatBytes(cur.blob.size)}`} />}
          <OutputList items={out} zipName="compressed-images.zip" />
          {out.some((o) => o.blob === o.src) && <Alert kind="info">Some files were already as small as they can get in this format, so the originals were kept instead of making them bigger.</Alert>}
        </>
      )}
    </ToolGrid>
  );
}

function AddMore({ onFiles }) {
  return (
    <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
      <Plus size={15} /> Add more
      <input type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
    </label>
  );
}
