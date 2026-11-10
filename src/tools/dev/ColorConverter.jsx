import { useMemo, useState } from 'react';
import { Alert, ColorField, CopyButton, Panel, TextField } from '../../components/ui/index.jsx';
import { contrast, mix, parseColor, rgbToCmyk, rgbToHex, rgbToHsl, rgbToHsv, rgbToOklch } from '../../lib/dev/color.js';

const r0 = (n) => Math.round(n), r1 = (n) => Math.round(n * 10) / 10;
export default function ColorConverter() {
  const [input, setInput] = useState('#3b82f6');
  const [fg, setFg] = useState('#111827');
  const [bg, setBg] = useState('#ffffff');
  const c = useMemo(() => parseColor(input), [input]);
  const rows = c ? [
    ['HEX', rgbToHex(c) + (c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, '0') : '')],
    ['RGB', `rgb(${r0(c.r)} ${r0(c.g)} ${r0(c.b)}${c.a < 1 ? ` / ${r1(c.a)}` : ''})`],
    ['HSL', (() => { const h = rgbToHsl(c); return `hsl(${r0(h.h)} ${r0(h.s)}% ${r0(h.l)}%)`; })()],
    ['HSV', (() => { const h = rgbToHsv(c); return `hsv(${r0(h.h)}, ${r0(h.s)}%, ${r0(h.v)}%)`; })()],
    ['CMYK', (() => { const k = rgbToCmyk(c); return `cmyk(${r0(k.c)}%, ${r0(k.m)}%, ${r0(k.y)}%, ${r0(k.k)}%)`; })()],
    ['OKLCH', (() => { const o = rgbToOklch(c); return `oklch(${r1(o.l)}% ${(Math.round(o.c * 1000) / 1000)} ${r1(o.h)})`; })()],
  ] : [];
  const f = parseColor(fg), b = parseColor(bg); const ratio = f && b ? contrast(f, b) : 0;
  const White = { r: 255, g: 255, b: 255 }, Black = { r: 0, g: 0, b: 0 };
  const scale = c ? Array.from({ length: 11 }, (_, i) => { const t = i / 10; return rgbToHex(t < 0.5 ? mix(White, c, t * 2) : mix(c, Black, (t - 0.5) * 2)); }) : [];
  const pass = (v) => <b style={{ color: v ? 'var(--ok)' : 'var(--danger)' }}>{v ? 'Pass' : 'Fail'}</b>;

  return (
    <div className="stack">
      <div className="two-col">
        <Panel title="Convert"><div className="stack">
          <TextField label="Any CSS colour" value={input} onChange={setInput} mono placeholder="#3b82f6, rgb(59 130 246), hsl(217 91% 60%), tomato…" />
          <ColorField label="Picker" value={c ? rgbToHex(c) : '#000000'} onChange={setInput} />
          {!c && <Alert kind="error">Not a colour the browser understands.</Alert>}
          <div className="swatch" style={{ background: c ? input : 'transparent' }} />
        </div></Panel>
        <Panel title="Formats"><div className="out-list">{rows.map(([k, v]) => <div className="out-item" key={k}><b style={{ width: 54 }}>{k}</b><span>{v}</span><CopyButton text={v} /></div>)}</div></Panel>
      </div>
      {c && <Panel title="Shades & tints"><div className="row" style={{ gap: 0 }}>{scale.map((h) => <button key={h} title={h} onClick={() => navigator.clipboard?.writeText(h)} style={{ flex: '1 1 0', minWidth: 0, height: 56, background: h, border: 0 }} aria-label={`Copy ${h}`} />)}</div><p className="small muted" style={{ marginTop: 8 }}>Click a swatch to copy its HEX. {scale.join('  ')}</p></Panel>}
      <Panel title="Contrast checker (WCAG)"><div className="two-col">
        <div className="stack"><TextField label="Text colour" value={fg} onChange={setFg} mono /><TextField label="Background" value={bg} onChange={setBg} mono /></div>
        <div className="stack">
          <div style={{ padding: 18, borderRadius: 12, background: b ? bg : '#fff', color: f ? fg : '#000', border: '1px solid var(--border)' }}><b style={{ fontSize: '1.4rem' }}>Large text sample</b><p>Normal body text sample — the quick brown fox.</p></div>
          {ratio > 0 ? <><div className="stat-value">{ratio.toFixed(2)} : 1</div><dl className="kv"><dt>AA normal (4.5)</dt><dd>{pass(ratio >= 4.5)}</dd><dt>AA large (3)</dt><dd>{pass(ratio >= 3)}</dd><dt>AAA normal (7)</dt><dd>{pass(ratio >= 7)}</dd><dt>AAA large (4.5)</dt><dd>{pass(ratio >= 4.5)}</dd></dl></> : <Alert kind="error">Enter two valid colours.</Alert>}
        </div>
      </div></Panel>
    </div>
  );
}
