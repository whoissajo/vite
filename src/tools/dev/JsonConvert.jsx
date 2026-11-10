import { useMemo, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import * as yaml from 'js-yaml';
import Papa from 'papaparse';
import { Alert, CodeBox, Panel, Seg, Select, TextArea, Toggle } from '../../components/ui/index.jsx';

const flatten = (o, p = '', out = {}) => {
  if (Array.isArray(o) || o === null || typeof o !== 'object') { out[p || 'value'] = Array.isArray(o) ? JSON.stringify(o) : o; return out; }
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p ? `${p}.${k}` : k, out);
    else out[p ? `${p}.${k}` : k] = Array.isArray(v) ? JSON.stringify(v) : v;
  }
  return out;
};
const unflatten = (row) => {
  const o = {};
  for (const [k, v] of Object.entries(row)) {
    const parts = k.split('.'); let c = o;
    parts.forEach((p, i) => { if (i === parts.length - 1) c[p] = v; else c = c[p] ??= {}; });
  }
  return o;
};
const SAMPLE = { 'json-yaml': '{"name":"OffKit","tags":["offline","private"],"meta":{"version":2}}', 'yaml-json': 'name: OffKit\ntags:\n  - offline\n  - private\nmeta:\n  version: 2\n', 'json-csv': '[{"id":1,"user":{"name":"Ada"},"ok":true},{"id":2,"user":{"name":"Linus"},"ok":false}]', 'csv-json': 'id,user.name,ok\n1,Ada,true\n2,Linus,false\n' };

export default function JsonConvert() {
  const [mode, setMode] = useState('json-yaml');
  const [src, setSrc] = useState(SAMPLE['json-yaml']);
  const [delim, setDelim] = useState(',');
  const [header, setHeader] = useState(true);
  const change = (m) => { setMode(m); setSrc(SAMPLE[m]); };

  const r = useMemo(() => {
    if (!src.trim()) return { out: '' };
    try {
      if (mode === 'json-yaml') return { out: yaml.dump(JSON.parse(src), { lineWidth: 120 }) };
      if (mode === 'yaml-json') return { out: JSON.stringify(yaml.load(src), null, 2) };
      if (mode === 'json-csv') {
        let v = JSON.parse(src); if (!Array.isArray(v)) v = [v];
        const rows = v.map((x) => flatten(x));
        const cols = [...new Set(rows.flatMap(Object.keys))];
        return { out: Papa.unparse({ fields: cols, data: rows.map((x) => cols.map((c) => x[c] ?? '')) }, { delimiter: delim, header }) };
      }
      const res = Papa.parse(src.trim(), { header, delimiter: delim === ',' ? '' : delim, skipEmptyLines: true, dynamicTyping: true });
      if (res.errors.length && !res.data.length) throw new Error(res.errors[0].message);
      return { out: JSON.stringify(header ? res.data.map(unflatten) : res.data, null, 2), warn: res.errors[0]?.message };
    } catch (e) { return { err: e.message }; }
  }, [src, mode, delim, header]);
  const ext = mode.split('-')[1];

  return (
    <div className="stack">
      <Seg value={mode} onChange={change} options={[{ value: 'json-yaml', label: 'JSON → YAML' }, { value: 'yaml-json', label: 'YAML → JSON' }, { value: 'json-csv', label: 'JSON → CSV' }, { value: 'csv-json', label: 'CSV → JSON' }]} />
      {mode.includes('csv') && <div className="row"><Select value={delim} onChange={setDelim} options={[{ value: ',', label: 'Comma' }, { value: ';', label: 'Semicolon' }, { value: '\t', label: 'Tab' }, { value: '|', label: 'Pipe' }]} /><Toggle checked={header} onChange={setHeader} label="Header row" /></div>}
      <div className="two-col">
        <Panel title="Input"><TextArea value={src} onChange={setSrc} rows={16} mono /></Panel>
        <Panel title="Output">{r.err ? <Alert kind="error" title="Can’t convert.">{r.err}</Alert> : <div className="stack"><CodeBox value={r.out} rows={14} filename={`converted.${ext}`} />{r.warn && <Alert kind="warn">{r.warn}</Alert>}</div>}</Panel>
      </div>
    </div>
  );
}
