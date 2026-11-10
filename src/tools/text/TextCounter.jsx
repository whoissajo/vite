import { useMemo, useState } from 'react';
import { Panel, Stat, TextArea } from '../../components/ui/index.jsx';

const STOP = new Set('the a an and or of to in is it that for on with as at by be this are was from'.split(' '));
export function analyze(t) {
  const words = t.match(/[\p{L}\p{N}'’-]+/gu) || [];
  const seg = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(t)].length : [...t].length;
  const sentences = (t.match(/[^.!?…]+[.!?…]+(\s|$)|[^.!?…]+$/g) || []).filter((s) => s.trim()).length;
  const paragraphs = t.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const freq = new Map(); for (const w of words) { const k = w.toLowerCase(); if (k.length > 2 && !STOP.has(k)) freq.set(k, (freq.get(k) || 0) + 1); }
  return { chars: seg, noSpace: [...t.replace(/\s/g, '')].length, words: words.length, sentences, paragraphs, lines: t ? t.split('\n').length : 0, bytes: new TextEncoder().encode(t).length, read: Math.ceil(words.length / 238), speak: Math.ceil(words.length / 150), top: [...freq].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10) };
}
export default function TextCounter() {
  const [t, setT] = useState('');
  const a = useMemo(() => analyze(t), [t]);
  return (
    <div className="stack">
      <TextArea label="Your text" value={t} onChange={setT} rows={10} placeholder="Type or paste text…" />
      <div className="stat-row">
        <Stat label="Words" value={a.words} /><Stat label="Characters" value={a.chars} /><Stat label="No spaces" value={a.noSpace} /><Stat label="Sentences" value={a.sentences} /><Stat label="Paragraphs" value={a.paragraphs} /><Stat label="Lines" value={a.lines} /><Stat label="UTF-8 bytes" value={a.bytes} /><Stat label="Reading time" value={`${a.read} min`} /><Stat label="Speaking time" value={`${a.speak} min`} />
      </div>
      {a.top.length > 0 && <Panel title="Most used words"><div className="row" style={{ flexWrap: 'wrap' }}>{a.top.map(([w, n]) => <span className="chip" key={w}>{w} · {n}</span>)}</div></Panel>}
    </div>
  );
}
