import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { matchesAccept } from '../../lib/common/files.js';
import { toast } from './toast.jsx';

/**
 * Drag & drop / click / paste file picker.
 * onFiles(File[]) is only called with files that match `accept`; rejects are reported via toast.
 */
export default function Dropzone({
  accept = '', multiple = false, onFiles, title, hint, formats, compact = false, icon: Icon = Upload, paste = true, disabled = false,
}) {
  const inputRef = useRef(null);
  const id = useId();
  const [over, setOver] = useState(false);

  const take = useCallback((list) => {
    let files = Array.from(list || []);
    if (!files.length) return;
    const ok = files.filter((f) => matchesAccept(f, accept));
    if (ok.length !== files.length) toast.error(`${files.length - ok.length} file(s) skipped — unsupported type.`);
    if (!ok.length) return;
    files = multiple ? ok : ok.slice(0, 1);
    onFiles?.(files);
  }, [accept, multiple, onFiles]);

  useEffect(() => {
    if (!paste || disabled) return undefined;
    const on = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const files = e.clipboardData?.files;
      if (files?.length) { e.preventDefault(); take(files); }
    };
    window.addEventListener('paste', on);
    return () => window.removeEventListener('paste', on);
  }, [paste, disabled, take]);

  return (
    <div
      className={`dropzone${compact ? ' compact' : ''}${over ? ' is-over' : ''}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={title || 'Choose files'}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); inputRef.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) take(e.dataTransfer.files); }}
    >
      <input
        id={id} ref={inputRef} type="file" accept={accept} multiple={multiple} tabIndex={-1} data-testid="file-input"
        onChange={(e) => { take(e.target.files); e.target.value = ''; }}
      />
      <div className="dropzone-icon"><Icon size={compact ? 22 : 26} /></div>
      <div className="dropzone-title">{title || (multiple ? 'Drop files here or click to browse' : 'Drop a file here or click to browse')}</div>
      {hint && <div className="dropzone-hint">{hint}</div>}
      {formats && <div className="dropzone-formats">{formats}</div>}
    </div>
  );
}
