import { useEffect, useMemo, useState } from 'react';
import { Alert, CopyButton, Panel, Select, TextField } from '../../components/ui/index.jsx';

const zones = (() => { try { return Intl.supportedValuesOf('timeZone'); } catch { return ['UTC']; } })();
const rel = (ms) => { const s = Math.round(ms / 1000), a = Math.abs(s); const u = a < 60 ? [a, 'second'] : a < 3600 ? [Math.round(a / 60), 'minute'] : a < 86400 ? [Math.round(a / 3600), 'hour'] : a < 2592000 ? [Math.round(a / 86400), 'day'] : a < 31536000 ? [Math.round(a / 2592000), 'month'] : [Math.round(a / 31536000), 'year']; return `${s < 0 ? '' : 'in '}${u[0]} ${u[1]}${u[0] === 1 ? '' : 's'}${s < 0 ? ' ago' : ''}`; };
/** auto-detect seconds / ms / µs / ns by magnitude */
export function toMs(n) { const a = Math.abs(n); if (a < 1e11) return [n * 1000, 'seconds']; if (a < 1e14) return [n, 'milliseconds']; if (a < 1e17) return [n / 1000, 'microseconds']; return [n / 1e6, 'nanoseconds']; }
const fmtTz = (d, tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, dateStyle: 'full', timeStyle: 'long' }).format(d);
const pad = (n) => String(n).padStart(2, '0');
const localInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export default function TimestampConverter() {
  const [now, setNow] = useState(Date.now());
  const [ts, setTs] = useState(String(Math.floor(Date.now() / 1000)));
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [dt, setDt] = useState(localInput(new Date()));
  const [a, setA] = useState(localInput(new Date(Date.now() - 864e5 * 3)));
  const [b, setB] = useState(localInput(new Date()));
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);

  const parsed = useMemo(() => { const n = Number(ts.trim()); if (!ts.trim() || !Number.isFinite(n)) return null; const [ms, unit] = toMs(n); const d = new Date(ms); return Number.isNaN(d.getTime()) ? null : { d, unit }; }, [ts]);
  const fromPicker = new Date(dt); const diff = new Date(b) - new Date(a);
  const dd = Math.abs(diff) / 1000;

  return (
    <div className="stack">
      <Panel title="Current time"><div className="two-col"><div><div className="small muted">Unix seconds</div><div className="stat-value mono">{Math.floor(now / 1000)} <CopyButton text={String(Math.floor(now / 1000))} /></div></div><div><div className="small muted">Milliseconds</div><div className="stat-value mono">{now} <CopyButton text={String(now)} /></div></div></div></Panel>
      <div className="two-col">
        <Panel title="Timestamp → date"><div className="stack">
          <TextField label="Unix timestamp" value={ts} onChange={setTs} mono hint="Seconds, milliseconds, microseconds or nanoseconds — detected automatically." />
          <Select label="Time zone" value={tz} onChange={setTz} options={zones.includes(tz) ? zones : [tz, ...zones]} />
          {parsed ? <dl className="kv"><dt>Detected</dt><dd>{parsed.unit}</dd><dt>Local ({tz})</dt><dd>{fmtTz(parsed.d, tz)}</dd><dt>UTC</dt><dd>{parsed.d.toUTCString()}</dd><dt>ISO 8601</dt><dd>{parsed.d.toISOString()}</dd><dt>Relative</dt><dd>{rel(parsed.d - now)}</dd></dl> : <Alert kind="error">Enter a number.</Alert>}
        </div></Panel>
        <Panel title="Date → timestamp"><div className="stack">
          <label className="field"><span className="field-label">Date &amp; time (your local zone)</span><input className="input mono" type="datetime-local" step="1" value={dt} onChange={(e) => setDt(e.target.value)} /></label>
          {!Number.isNaN(fromPicker.getTime()) && <dl className="kv"><dt>Seconds</dt><dd>{Math.floor(fromPicker / 1000)} <CopyButton text={String(Math.floor(fromPicker / 1000))} /></dd><dt>Milliseconds</dt><dd>{fromPicker.getTime()} <CopyButton text={String(fromPicker.getTime())} /></dd><dt>ISO (UTC)</dt><dd>{fromPicker.toISOString()}</dd></dl>}
        </div></Panel>
      </div>
      <Panel title="Difference between two dates"><div className="two-col">
        <div className="stack"><label className="field"><span className="field-label">From</span><input className="input mono" type="datetime-local" step="1" value={a} onChange={(e) => setA(e.target.value)} /></label><label className="field"><span className="field-label">To</span><input className="input mono" type="datetime-local" step="1" value={b} onChange={(e) => setB(e.target.value)} /></label></div>
        {Number.isFinite(diff) && <dl className="kv"><dt>Total days</dt><dd>{(dd / 86400).toFixed(4)}</dd><dt>Breakdown</dt><dd>{Math.floor(dd / 86400)}d {Math.floor((dd % 86400) / 3600)}h {Math.floor((dd % 3600) / 60)}m {Math.floor(dd % 60)}s {diff < 0 ? '(to is earlier)' : ''}</dd><dt>Seconds</dt><dd>{Math.round(dd)}</dd></dl>}
      </div></Panel>
    </div>
  );
}
