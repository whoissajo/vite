import { useId, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Check, Copy, Download, Info, Loader2, X, Archive, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { copyText, downloadBlob, downloadZip } from '../../lib/common/download.js';
import { formatBytes, percentSaved } from '../../lib/common/format.js';
import { useObjectUrl } from '../../lib/common/hooks.js';
import { toast } from './toast.jsx';

export { default as Dropzone } from './Dropzone.jsx';
export { default as BeforeAfter } from './BeforeAfter.jsx';
export { toast, ToastHost } from './toast.jsx';

/* ─────────── layout ─────────── */
/** Standard two-column tool layout: workspace on the left, options on the right (stacks on mobile). */
export function ToolGrid({ children, side }) {
  return (
    <div className="tool-grid">
      <div className="tool-main">{children}</div>
      {side && <aside className="tool-side">{side}</aside>}
    </div>
  );
}

export function Panel({ title, icon: Icon, actions, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <div className="panel-title">
          {Icon && <Icon size={18} />}
          <span>{title}</span>
          {actions && <><span className="spacer" />{actions}</>}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={28} />}
      <b>{title}</b>
      {children && <span className="small">{children}</span>}
    </div>
  );
}

/* ─────────── controls ─────────── */
export function Button({ variant, size, icon: Icon, loading, block, className = '', children, ...rest }) {
  const cls = ['btn', variant && `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', !children && 'btn-icon', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="spinner" /> : Icon ? <Icon size={size === 'sm' ? 15 : 17} /> : null}
      {children}
    </button>
  );
}

export function Field({ label, value, hint, children, htmlFor }) {
  return (
    <div className="field">
      {(label || value != null) && (
        <div className="field-head">
          {label && <label className="field-label" htmlFor={htmlFor}>{label}</label>}
          {value != null && <span className="field-value">{value}</span>}
        </div>
      )}
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, format, hint, disabled }) {
  const id = useId();
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <Field label={label} value={format ? format(value) : value} hint={hint} htmlFor={id}>
      <input
        id={id} className="slider" type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        style={{ '--pct': `${pct}%` }} onChange={(e) => onChange(+e.target.value)}
      />
    </Field>
  );
}

export function Seg({ value, onChange, options, block, label, hint, disabled }) {
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: String(o) }));
  return (
    <Field label={label} hint={hint}>
      <div className={`seg${block ? ' seg-block' : ''}`} role="radiogroup" aria-label={label}>
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} disabled={disabled || o.disabled} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function Toggle({ checked, onChange, label, hint, disabled }) {
  return (
    <label className="toggle">
      <span className="toggle-text"><b>{label}</b>{hint && <span>{hint}</span>}</span>
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  );
}

export function Select({ label, value, onChange, options, hint, disabled }) {
  const id = useId();
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: String(o) }));
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <select id={id} className="select" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function NumberField({ label, value, onChange, min, max, step = 1, suffix, hint, disabled }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="input-affix">
        <input
          id={id} className="input mono" type="number" inputMode="decimal" min={min} max={max} step={step} value={Number.isNaN(value) ? '' : value} disabled={disabled}
          onChange={(e) => onChange(e.target.value === '' ? NaN : +e.target.value)}
        />
        {suffix && <span className="affix">{suffix}</span>}
      </div>
    </Field>
  );
}

export function TextField({ label, value, onChange, placeholder, mono, hint, type = 'text', disabled, ...rest }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input id={id} className={`input${mono ? ' mono' : ''}`} type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} {...rest} />
    </Field>
  );
}

export function ColorField({ label, value, onChange }) {
  const id = useId();
  return (
    <Field label={label} value={value} htmlFor={id}>
      <input id={id} className="input" type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 8, mono, readOnly, hint, ...rest }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <textarea id={id} className={`textarea${mono ? ' mono' : ''}`} rows={rows} value={value} placeholder={placeholder} readOnly={readOnly} spellCheck={false} onChange={(e) => onChange?.(e.target.value)} {...rest} />
    </Field>
  );
}

export function CopyButton({ text, label = 'Copy', size = 'sm', disabled }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size={size} icon={done ? Check : Copy} disabled={disabled || !text}
      onClick={async () => {
        const ok = await copyText(typeof text === 'function' ? text() : text);
        if (ok) { setDone(true); setTimeout(() => setDone(false), 1400); } else toast.error('Copy failed — select the text and copy manually.');
      }}
    >{done ? 'Copied' : label}</Button>
  );
}

/** Output textarea with a copy button. */
export function CodeBox({ value, label, rows = 10, placeholder, onChange, readOnly = true, filename }) {
  return (
    <div className="stack-sm">
      <div className="row-nowrap">
        {label && <b className="field-label">{label}</b>}
        <span className="spacer" />
        {filename && (
          <Button size="sm" icon={Download} disabled={!value} onClick={() => downloadBlob(new Blob([value], { type: 'text/plain;charset=utf-8' }), filename)}>Save</Button>
        )}
        <CopyButton text={value} />
      </div>
      <textarea className="textarea mono" rows={rows} value={value} readOnly={readOnly} placeholder={placeholder} spellCheck={false} onChange={(e) => onChange?.(e.target.value)} />
    </div>
  );
}

/* ─────────── feedback ─────────── */
const ALERT_ICON = { info: Info, warn: AlertTriangle, error: AlertCircle, ok: CheckCircle2 };
export function Alert({ kind = 'info', children, title }) {
  const Icon = ALERT_ICON[kind];
  return (
    <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      <Icon size={18} />
      <div>{title && <b>{title} </b>}{children}</div>
    </div>
  );
}

/** Progress + cancel + error for a `useTask()` instance. Renders nothing when idle. */
export function TaskBar({ task, cancelable = true }) {
  if (task.error) return <Alert kind="error" title="Something went wrong.">{task.error}</Alert>;
  if (!task.running) return null;
  const determinate = task.progress != null;
  return (
    <div className="task" role="status" aria-live="polite">
      <div className="task-head">
        <span className="row-nowrap"><Loader2 size={16} className="spin" /> {task.label || 'Working…'}</span>
        <span className="row-nowrap">
          {determinate && <b className="mono">{Math.round(task.progress * 100)}%</b>}
          {cancelable && <Button size="sm" variant="ghost" icon={X} onClick={task.cancel}>Cancel</Button>}
        </span>
      </div>
      <div className={`progress${determinate ? '' : ' indeterminate'}`}><i style={{ '--p': `${(task.progress ?? 0) * 100}%` }} /></div>
    </div>
  );
}

export function Stat({ label, value, tone }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${tone ? ` ${tone}` : ''}`}>{value}</div>
    </div>
  );
}

/** Success card: stats + custom actions. stats: [{label, value, tone?}] */
export function Result({ title = 'Done', name, stats = [], children }) {
  return (
    <div className="result">
      <div className="result-head">
        <div className="result-check"><Check size={20} /></div>
        <div className="min0"><div className="small muted">{title}</div>{name && <div className="result-name">{name}</div>}</div>
      </div>
      {stats.length > 0 && <div className="result-stats">{stats.map((s) => <Stat key={s.label} {...s} />)}</div>}
      {children}
    </div>
  );
}

/** Size comparison stats for compressors. Never claims savings that didn't happen. */
export function sizeStats(original, next) {
  const saved = percentSaved(original, next);
  return [
    { label: 'Original', value: formatBytes(original) },
    { label: 'Result', value: formatBytes(next) },
    saved >= 0
      ? { label: 'Saved', value: `${saved}%`, tone: 'good' }
      : { label: 'Larger by', value: `${Math.abs(saved)}%`, tone: 'bad' },
  ];
}

/* ─────────── files ─────────── */
export function Thumb({ file, icon: Icon }) {
  const isImg = file?.type?.startsWith('image/') && !file.type.includes('svg+xml') ? true : file?.type === 'image/svg+xml';
  const url = useObjectUrl(isImg ? file : null);
  return <div className="file-thumb">{url ? <img src={url} alt="" /> : Icon ? <Icon size={20} /> : null}</div>;
}

/** One row in a file list. Pass onRemove / onUp / onDown for controls. */
export function FileRow({ file, icon, sub, onRemove, onUp, onDown, children }) {
  return (
    <div className="file-item">
      <Thumb file={file} icon={icon} />
      <div className="file-meta">
        <div className="file-name truncate">{file.name}</div>
        <div className="file-sub">{sub ?? formatBytes(file.size)}</div>
      </div>
      {children}
      {onUp && <Button size="sm" variant="ghost" icon={ArrowUp} aria-label="Move up" onClick={onUp} />}
      {onDown && <Button size="sm" variant="ghost" icon={ArrowDown} aria-label="Move down" onClick={onDown} />}
      {onRemove && <Button size="sm" variant="ghost" icon={Trash2} aria-label={`Remove ${file.name}`} onClick={onRemove} />}
    </div>
  );
}

/**
 * Batch outputs with per-file download and "Download all (.zip)".
 * items: [{ id, name, blob, original?: number, note?: string, preview?: boolean }]
 */
export function OutputList({ items, zipName = 'offkit-files.zip', title = 'Results' }) {
  if (!items?.length) return null;
  const totalOrig = items.reduce((s, i) => s + (i.original || 0), 0);
  const totalNew = items.reduce((s, i) => s + i.blob.size, 0);
  const showSavings = totalOrig > 0;
  return (
    <div className="result">
      <div className="result-head">
        <div className="result-check"><Check size={20} /></div>
        <div className="min0">
          <div className="small muted">{title}</div>
          <div className="result-name">{items.length} file{items.length === 1 ? '' : 's'} ready{showSavings ? ` · ${formatBytes(totalOrig)} → ${formatBytes(totalNew)}` : ''}</div>
        </div>
        <span className="spacer" />
        {items.length > 1 && (
          <Button variant="primary" icon={Archive} onClick={() => downloadZip(items.map((i) => ({ name: i.name, blob: i.blob })), zipName)}>Download all (.zip)</Button>
        )}
      </div>
      <div className="file-list">
        {items.map((i) => {
          const saved = i.original ? percentSaved(i.original, i.blob.size) : null;
          return (
            <div className="file-item" key={i.id ?? i.name}>
              {i.preview !== false && i.blob.type.startsWith('image/') ? <BlobThumb blob={i.blob} /> : <div className="file-thumb"><Download size={18} /></div>}
              <div className="file-meta">
                <div className="file-name truncate">{i.name}</div>
                <div className="file-sub">
                  {i.original ? `${formatBytes(i.original)} → ${formatBytes(i.blob.size)}` : formatBytes(i.blob.size)}
                  {saved != null && <b style={{ color: saved >= 0 ? 'var(--ok)' : 'var(--warn)', marginLeft: 8 }}>{saved >= 0 ? `−${saved}%` : `+${Math.abs(saved)}%`}</b>}
                  {i.note && <span style={{ marginLeft: 8 }}>{i.note}</span>}
                </div>
              </div>
              <Button size="sm" variant={items.length === 1 ? 'primary' : undefined} icon={Download} onClick={() => downloadBlob(i.blob, i.name)}>Download</Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function BlobThumb({ blob }) {
  const url = useObjectUrl(blob);
  return <div className="file-thumb checker">{url && <img src={url} alt="" />}</div>;
}

/** Wraps child text in <b> for inline emphasis — tiny helper for hints. */
export const B = ({ children }) => <b>{children}</b>;
