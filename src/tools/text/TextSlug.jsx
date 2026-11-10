import { useMemo, useState } from 'react';
import { CopyButton, Panel, Seg, TextArea, Toggle } from '../../components/ui/index.jsx';

export function slugify(s, { sep = '-', lower = true, ascii = true } = {}) {
  let t = s.normalize('NFKD'); if (ascii) t = t.replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').replace(/æ/gi, 'ae').replace(/ø/gi, 'o').replace(/đ/gi, 'd').replace(/ł/gi, 'l'); else t = s.normalize('NFC');
  t = t.replace(ascii ? /[^A-Za-z0-9]+/g : /[^\p{L}\p{N}]+/gu, sep).replace(new RegExp(`^${sep === '-' ? '\\-' : sep}+|${sep === '-' ? '\\-' : sep}+$`, 'g'), '');
  return lower ? t.toLowerCase() : t;
}
export default function TextSlug() {
  const [t, setT] = useState('Héllo Wörld — Crème brûlée & Straße!\nSecond line here');
  const [sep, setSep] = useState('-'); const [lower, setLower] = useState(true); const [ascii, setAscii] = useState(true);
  const out = useMemo(() => t.split('\n').filter((x) => x.trim()).map((l) => slugify(l, { sep, lower, ascii })).join('\n'), [t, sep, lower, ascii]);
  return (
    <div className="stack">
      <div className="row" style={{ flexWrap: 'wrap' }}><Seg label="Separator" value={sep} onChange={setSep} options={[{ value: '-', label: 'Hyphen -' }, { value: '_', label: 'Underscore _' }, { value: '.', label: 'Dot .' }]} /><Toggle label="Lowercase" checked={lower} onChange={setLower} /><Toggle label="Strip accents (ASCII)" checked={ascii} onChange={setAscii} /></div>
      <div className="two-col"><TextArea label="Titles (one per line)" value={t} onChange={setT} rows={8} /><div><TextArea label="Slugs" value={out} onChange={() => {}} readOnly rows={8} mono /><div style={{ marginTop: 8 }}><CopyButton text={out} /></div></div></div>
    </div>
  );
}
