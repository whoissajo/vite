import { useEffect } from 'react';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { Button, Dropzone, FileRow, OutputList, Panel, TaskBar, ToolGrid } from '../../components/ui/index.jsx';
import { useTask } from '../../lib/common/hooks.js';
import { useFiles } from '../../lib/common/useFiles.js';
import { IMAGE_ACCEPT, tick } from '../../lib/image/codec.js';
import { useState } from 'react';

/**
 * Shared layout for "apply settings to many images" tools.
 * process(file, { index }) → { name, blob, note?, sub? }
 */
export default function BatchShell({ icon: Icon = ImageIcon, dropTitle, hint, formats, settings, process, runLabel = 'Convert', zipName, accept = IMAGE_ACCEPT, deps = [], extra }) {
  const list = useFiles();
  const task = useTask();
  const [out, setOut] = useState([]);
  useEffect(() => { setOut([]); }, [list.items.length]);

  const run = () => task.run(async ({ onProgress, throwIfAborted }) => {
    const res = [];
    for (let i = 0; i < list.files.length; i++) {
      const f = list.files[i];
      onProgress(i / list.files.length, `${f.name} (${i + 1}/${list.files.length})`);
      const r = await process(f, { index: i });
      res.push({ id: i, original: f.size, ...r });
      throwIfAborted();
      await tick();
    }
    setOut(res);
  });

  if (!list.items.length) return <Dropzone multiple accept={accept} onFiles={list.add} icon={Icon} title={dropTitle} hint={hint || 'Batch as many as you like — nothing is uploaded.'} formats={formats} />;
  return (
    <ToolGrid side={
      <Panel title="Settings" icon={Icon}>
        <div className="stack">
          {settings}
          <Button variant="primary" size="lg" icon={Icon} loading={task.running} onClick={run} block>{runLabel}{list.items.length > 1 ? ` ${list.items.length} files` : ''}</Button>
        </div>
      </Panel>
    }>
      <Panel title={`Files (${list.items.length})`} icon={Icon} actions={<>
        <label className="btn btn-sm" style={{ cursor: 'pointer' }}><Plus size={15} /> Add more
          <input type="file" accept={accept} multiple hidden onChange={(e) => { list.add(e.target.files); e.target.value = ''; }} /></label>
        <Button size="sm" icon={Trash2} variant="ghost" onClick={list.clear}>Clear</Button></>}>
        <div className="file-list">{list.items.map((it) => <FileRow key={it.id} file={it.file} onRemove={() => list.remove(it.id)} />)}</div>
      </Panel>
      {extra?.(list)}
      <TaskBar task={task} />
      <OutputList items={out} zipName={zipName} />
    </ToolGrid>
  );
}
