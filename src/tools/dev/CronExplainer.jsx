import { useMemo, useState } from 'react';
import { Alert, Panel, TextField } from '../../components/ui/index.jsx';

const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const FIELDS = [{ n: 'minute', min: 0, max: 59 }, { n: 'hour', min: 0, max: 23 }, { n: 'day of month', min: 1, max: 31 }, { n: 'month', min: 1, max: 12 }, { n: 'day of week', min: 0, max: 7 }];
const ALIAS = { '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *', '@weekly': '0 0 * * 0', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *' };
const NAMES = { 3: Object.fromEntries(MON.map((m, i) => [m.slice(0, 3).toLowerCase(), i + 1])), 4: Object.fromEntries(DOW.map((d, i) => [d.slice(0, 3).toLowerCase(), i])) };

/** Expand one field to a Set of ints (throws on error) */
export function expand(text, i) {
  const { min, max } = FIELDS[i]; const set = new Set(); const sub = (s) => { s = s.toLowerCase(); return NAMES[i]?.[s] ?? (/^\d+$/.test(s) ? Number(s) : NaN); };
  for (const part of text.split(',')) {
    const [range, stepS] = part.split('/'); const step = stepS === undefined ? 1 : Number(stepS);
    if (!Number.isInteger(step) || step < 1) throw new Error(`Bad step in "${part}"`);
    let a, b; if (range === '*' || range === '?') { a = min; b = i === 4 ? 6 : max; } else if (range.includes('-')) { const [x, y] = range.split('-'); a = sub(x); b = sub(y); } else { a = sub(range); b = stepS === undefined ? a : max; }
    if (Number.isNaN(a) || Number.isNaN(b)) throw new Error(`Cannot read "${part}" in ${FIELDS[i].n}`);
    if (a < min || b > max || a > b) throw new Error(`${FIELDS[i].n} must be ${min}–${max} (got "${part}")`);
    for (let v = a; v <= b; v += step) set.add(i === 4 && v === 7 ? 0 : v);
  }
  return set;
}
const pad = (n) => String(n).padStart(2, '0');
const list = (a) => a.length < 3 ? a.join(' and ') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
export function explain(expr) {
  const t = ALIAS[expr.trim().toLowerCase()] || expr.trim(); const p = t.split(/\s+/);
  if (p.length !== 5) throw new Error('A cron expression has 5 fields: minute hour day-of-month month day-of-week.');
  const sets = p.map((x, i) => expand(x, i)); const [mi, ho, dm, mo, dw] = sets; const pr = (i) => p[i] === '*' || p[i] === '?';
  let when;
  if (pr(0) && pr(1)) when = 'Every minute';
  else if (p[0].startsWith('*/') && pr(1)) when = `Every ${p[0].slice(2)} minutes`;
  else if (pr(1) && mi.size === 1) when = `At minute ${[...mi][0]} of every hour`;
  else if (p[1].startsWith('*/') && mi.size === 1) when = `At minute ${[...mi][0]}, every ${p[1].slice(2)} hours`;
  else if (mi.size * ho.size <= 8 && !pr(1)) when = `At ${list([...ho].flatMap((h) => [...mi].map((m) => `${pad(h)}:${pad(m)}`)))}`;
  else when = `At ${mi.size} minute value(s) past ${ho.size} hour value(s)`;
  const bits = [];
  if (!pr(2)) bits.push(`on day ${list([...dm].map(String))} of the month`);
  if (!pr(4)) bits.push(`on ${list([...dw].sort().map((d) => DOW[d]))}`);
  if (!pr(3)) bits.push(`in ${list([...mo].map((m) => MON[m - 1]))}`);
  const dual = !pr(2) && !pr(4) ? ' (cron runs when EITHER the day-of-month OR the day-of-week matches)' : '';
  return { text: `${when}${bits.length ? ', ' + bits.join(', ') : ''}${dual}.`, sets };
}
export function nextRuns(sets, count = 8, from = new Date()) {
  const [mi, ho, dm, mo, dw] = sets; const star = (i) => sets[i].size === FIELDS[i].max - FIELDS[i].min + 1 || (i === 4 && sets[4].size === 7);
  const d = new Date(from); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1); const out = [];
  for (let n = 0; n < 60 * 24 * 366 * 5 && out.length < count; n++, d.setMinutes(d.getMinutes() + 1)) {
    if (!mi.has(d.getMinutes()) || !ho.has(d.getHours()) || !mo.has(d.getMonth() + 1)) continue;
    const a = dm.has(d.getDate()), b = dw.has(d.getDay()); const ok = !star(2) && !star(4) ? a || b : a && b; if (ok) out.push(new Date(d));
  }
  return out;
}
const EX = [['*/5 * * * *', 'Every 5 minutes'], ['0 9 * * 1-5', 'Weekdays at 09:00'], ['30 2 1 * *', '1st of month, 02:30'], ['0 0 * * 0', 'Sundays at midnight'], ['0 */6 * * *', 'Every 6 hours']];
export default function CronExplainer() {
  const [expr, setExpr] = useState('0 9 * * 1-5');
  const r = useMemo(() => { try { const e = explain(expr); return { ...e, runs: nextRuns(e.sets) }; } catch (e) { return { error: e.message }; } }, [expr]);
  return (
    <div className="two-col">
      <Panel title="Cron expression"><div className="stack">
        <TextField label="minute hour day-of-month month day-of-week" value={expr} onChange={setExpr} mono />
        <div className="row" style={{ flexWrap: 'wrap' }}>{EX.map(([e, l]) => <button key={e} className="chip" onClick={() => setExpr(e)} title={l}>{e}</button>)}</div>
        <p className="small muted">Supports * , - / lists, names (MON, JAN) and @daily-style aliases. Standard 5-field cron.</p>
      </div></Panel>
      <Panel title="Meaning">{r.error ? <Alert kind="error">{r.error}</Alert> : <div className="stack"><p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{r.text}</p><div><div className="small muted">Next runs (your local time)</div><ol className="mono small" style={{ paddingLeft: 20 }}>{r.runs.map((d) => <li key={+d}>{d.toLocaleString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</li>)}{!r.runs.length && <li>No upcoming run found.</li>}</ol></div></div>}</Panel>
    </div>
  );
}
