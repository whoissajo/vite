import { useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Download } from 'lucide-react';
import { Button, CopyButton, Panel, TextArea } from '../../components/ui/index.jsx';
import { downloadText } from '../../lib/common/download.js';

const SAMPLE = '# Hello OffKit\n\nWrite **Markdown** on the left. It renders *live*, offline.\n\n- [x] Tables\n- [x] Code\n- [ ] World peace\n\n| Tool | Offline |\n|------|---------|\n| Markdown | ✅ |\n\n```js\nconsole.log("hi");\n```\n\n> Everything is sanitized before display.\n';
export default function TextMarkdown() {
  const [src, setSrc] = useState(SAMPLE);
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(src, { gfm: true, breaks: false }), { USE_PROFILES: { html: true } }), [src]);
  const full = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px/1.6 system-ui;max-width:720px;margin:2rem auto;padding:0 1rem}pre{background:#f4f4f5;padding:12px;border-radius:8px;overflow:auto}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px 10px}blockquote{border-left:3px solid #999;margin-left:0;padding-left:1rem;color:#555}</style>\n${html}`;
  return (
    <div className="stack">
      <div className="two-col"><TextArea label="Markdown" value={src} onChange={setSrc} rows={18} mono /><Panel title="Preview"><div className="md" data-testid="md-preview" dangerouslySetInnerHTML={{ __html: html }} /></Panel></div>
      <div className="row"><CopyButton text={html} label="Copy HTML" /><Button icon={Download} onClick={() => downloadText(full, 'document.html', 'text/html')}>Download .html</Button><Button icon={Download} onClick={() => downloadText(src, 'document.md', 'text/markdown')}>Download .md</Button></div>
    </div>
  );
}
