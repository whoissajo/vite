import { useMemo, useState } from 'react';
import { diffLines, diffWordsWithSpace, diffChars } from 'diff';
import { Panel, Seg, TextArea, Toggle } from '../../components/ui/index.jsx';

export default function TextDiff() {
  const [a, setA] = useState('The quick brown fox\njumps over the lazy dog.\nSame line.');
  const [b, setB] = useState('The quick red fox\njumps over the sleepy dog.\nSame line.\nA new line.');
  const [mode, setMode] = useState('lines'); const [ws, setWs] = useState(false);
  const parts = useMemo(() => (mode === 'lines' ? diffLines(a, b, { ignoreWhitespace: ws }) : mode === 'words' ? diffWordsWithSpace(a, b) : diffChars(a, b)), [a, b, mode, ws]);
  const add = parts.filter((p) => p.added).reduce((n, p) => n + (p.count || 0), 0), del = parts.filter((p) => p.removed).reduce((n, p) => n + (p.count || 0), 0);
  return (
    <div className="stack">
      <div className="two-col"><TextArea label="Original" value={a} onChange={setA} rows={10} mono /><TextArea label="Changed" value={b} onChange={setB} rows={10} mono /></div>
      <div className="row"><Seg label="Compare by" value={mode} onChange={setMode} options={[{ value: 'lines', label: 'Lines' }, { value: 'words', label: 'Words' }, { value: 'chars', label: 'Characters' }]} />{mode === 'lines' && <Toggle label="Ignore whitespace" checked={ws} onChange={setWs} />}</div>
      <Panel title={`Differences — +${add} / −${del} ${mode}`}>
        {a === b ? <p className="muted">The two texts are identical.</p> : <pre className="mono" style={{ whiteSpace: 'pre-wrap', margin: 0 }} data-testid="diff-out">{parts.map((p, i) => <span key={i} className={p.added ? 'diff-add' : p.removed ? 'diff-del' : ''}>{p.value}</span>)}</pre>}
      </Panel>
    </div>
  );
}
