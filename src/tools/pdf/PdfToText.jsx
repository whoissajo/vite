import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Alert, Button, CodeBox, Dropzone, Panel, TaskBar, Toggle } from '../../components/ui/index.jsx';
import { useTask } from '../../lib/common/hooks.js';
import { PDF_ACCEPT, openPdfJs } from '../../lib/pdf/core.js';
import { stripExt } from '../../lib/common/format.js';

/** Join pdf.js text items into lines using their y position. */
function pageToText(items) {
  const lines = []; let y = null, cur = '';
  for (const it of items) {
    if (!('str' in it)) continue;
    const ty = Math.round(it.transform[5]);
    if (y !== null && Math.abs(ty - y) > 2) { lines.push(cur); cur = ''; }
    cur += it.str + (it.hasEOL ? '\n' : '');
    y = ty;
  }
  lines.push(cur);
  return lines.join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export default function PdfToText() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [info, setInfo] = useState(null);
  const [seps, setSeps] = useState(true);
  const [pagesText, setPagesText] = useState([]);
  const task = useTask();

  useEffect(() => {
    if (!file) return;
    setText(''); setInfo(null);
    task.run(async ({ onProgress, throwIfAborted }) => {
      const pdf = await openPdfJs(file);
      try {
        const res = [];
        for (let p = 1; p <= pdf.numPages; p++) {
          onProgress((p - 1) / pdf.numPages, `Reading page ${p} of ${pdf.numPages}`);
          const page = await pdf.getPage(p);
          res.push(pageToText((await page.getTextContent()).items));
          throwIfAborted();
        }
        setPagesText(res);
        setInfo({ pages: pdf.numPages, chars: res.join('').length });
      } finally { pdf.destroy(); }
    });
  }, [file]); // eslint-disable-line
  useEffect(() => { setText(pagesText.map((t, i) => (seps ? `--- Page ${i + 1} ---\n${t}` : t)).join('\n\n')); }, [pagesText, seps]);

  if (!file) return <Dropzone accept={PDF_ACCEPT} onFiles={(f) => setFile(f[0])} icon={FileText} title="Drop a PDF to extract its text" hint="Reads the PDF’s real text layer. Scanned pages with no text layer are flagged." formats="PDF" />;
  return (
    <div className="stack">
      <TaskBar task={task} />
      {info && info.chars === 0 && <Alert kind="warn" title="No text found.">This PDF has no text layer — it’s probably scanned pages (images). OffKit can’t OCR yet, so there is nothing to extract.</Alert>}
      {info && info.chars > 0 && <Alert kind="ok">Extracted {info.chars.toLocaleString()} characters from {info.pages} page{info.pages === 1 ? '' : 's'}.</Alert>}
      <Panel title={file.name} actions={<Button size="sm" variant="ghost" onClick={() => setFile(null)}>Another file</Button>}>
        <div className="stack">
          <Toggle checked={seps} onChange={setSeps} label="Page separators" />
          <CodeBox value={text} rows={18} filename={`${stripExt(file.name)}.txt`} />
        </div>
      </Panel>
    </div>
  );
}
