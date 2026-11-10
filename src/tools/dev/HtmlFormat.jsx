import { useState } from 'react';
import { Download, Wand2, Minimize2 } from 'lucide-react';
import { Alert, Button, CopyButton, Panel, Seg, TextArea } from '../../components/ui/index.jsx';
import { downloadText } from '../../lib/common/download.js';
import { formatBytes } from '../../lib/common/format.js';

const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const RAW = new Set(['pre', 'textarea', 'script', 'style']);
const INLINE = new Set('a abbr b bdi bdo cite code data dfn em i kbd mark q s samp small span strong sub sup time u var label'.split(' '));
export function tokenize(src) {
  const toks = []; const re = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/?([a-zA-Z][\w:-]*)(?:"[^"]*"|'[^']*'|[^'">])*>|[^<]+|</gi; let m;
  while ((m = re.exec(src))) {
    const t = m[0];
    if (t.startsWith('<!--')) toks.push({ k: 'c', t }); else if (/^<!doctype/i.test(t)) toks.push({ k: 'd', t });
    else if (m[1]) { const name = m[1].toLowerCase(); const close = t[1] === '/'; const self = VOID.has(name) || /\/>$/.test(t); toks.push({ k: close ? 'e' : self ? 's' : 'o', n: name, t });
      if (!close && !self && RAW.has(name)) { const end = src.toLowerCase().indexOf(`</${name}`, re.lastIndex); if (end > 0) { toks.push({ k: 'r', t: src.slice(re.lastIndex, end) }); re.lastIndex = end; } } }
    else toks.push({ k: 't', t });
  }
  return toks;
}
export function beautifyHtml(src, ind = '  ') {
  const out = []; let depth = 0; const toks = tokenize(src);
  for (let i = 0; i < toks.length; i++) {
    const x = toks[i]; const pad = ind.repeat(Math.max(0, depth));
    if (x.k === 't') { const s = x.t.replace(/\s+/g, ' ').trim(); if (s) out.push(pad + s); }
    else if (x.k === 'r') { const lines = x.t.replace(/^\n+|\s+$/g, ''); if (lines.trim()) out.push(...lines.split('\n').map((l) => (l.trim() ? ind.repeat(depth) + l.replace(/^\s{0,8}/, '') : ''))); }
    else if (x.k === 'e') { depth = Math.max(0, depth - 1); out.push(ind.repeat(depth) + x.t); }
    else if (x.k === 'o') {
      // keep short inline text content on one line: <b>text</b>
      const a = toks[i + 1], b = toks[i + 2];
      if (a?.k === 't' && b?.k === 'e' && b.n === x.n && a.t.trim().length < 80 && !a.t.includes('\n')) { out.push(pad + x.t + a.t.trim() + b.t); i += 2; continue; }
      out.push(pad + x.t); depth++;
    } else out.push(pad + x.t);
  }
  return out.join('\n');
}
export function minifyHtml(src) {
  const toks = tokenize(src); let o = '';
  for (const x of toks) { if (x.k === 'c') continue; if (x.k === 't') { const s = x.t.replace(/\s+/g, ' '); o += s; } else if (x.k === 'r') o += x.t.trim(); else o += x.t.replace(/\s+/g, ' ').replace(/\s*(\/?)>$/, '$1>'); }
  return o.replace(/>\s+</g, '><').trim();
}
const SAMPLE = '<!doctype html><html><head><title>Hi</title><style>body{margin:0}</style></head><body><div class="a"><h1>Hello</h1><p>Some <b>bold</b> text</p><ul><li>One</li><li>Two</li></ul></div></body></html>';
export default function HtmlFormat() {
  const [src, setSrc] = useState(SAMPLE); const [mode, setMode] = useState('beautify'); const [out, setOut] = useState('');
  const run = (m) => { setMode(m); setOut(m === 'beautify' ? beautifyHtml(src) : minifyHtml(src)); };
  const inB = new Blob([src]).size, outB = new Blob([out]).size;
  return (
    <div className="stack">
      <div className="two-col">
        <Panel title="Input HTML"><TextArea value={src} onChange={setSrc} rows={14} mono label="HTML" /></Panel>
        <Panel title="Output"><TextArea value={out} onChange={() => {}} rows={14} mono label="Result" readOnly /></Panel>
      </div>
      <div className="row"><Button variant="primary" icon={Wand2} onClick={() => run('beautify')}>Beautify</Button><Button icon={Minimize2} onClick={() => run('minify')}>Minify</Button>{out && <><CopyButton text={out} /><Button icon={Download} onClick={() => downloadText(out, 'formatted.html', 'text/html')}>Download</Button></>}</div>
      {out && mode === 'minify' && <Alert kind="success">{formatBytes(inB)} → {formatBytes(outB)} ({inB ? Math.round((1 - outB / inB) * 100) : 0}% smaller). Comments and extra whitespace removed; &lt;pre&gt;, scripts and styles are preserved.</Alert>}
    </div>
  );
}
