import { useMemo, useState } from 'react';
import { Link2, Plus, Trash2 } from 'lucide-react';
import { Alert, Button, CodeBox, Panel, TextArea, TextField } from '../../components/ui/index.jsx';

export default function UrlTool() {
  const [url, setUrl] = useState('https://example.com:8443/a/b%20c?x=1&y=hello%20world&x=2#top');
  const [raw, setRaw] = useState('hello world & café/ü?');
  const parsed = useMemo(() => { try { return new URL(url); } catch { return null; } }, [url]);
  const params = parsed ? [...parsed.searchParams.entries()] : [];
  const setParams = (list) => { const u = new URL(url); u.search = ''; list.forEach(([k, v]) => u.searchParams.append(k, v)); setUrl(u.toString()); };
  const part = (k, v) => { const u = new URL(url); u[k] = v; setUrl(u.toString()); };
  const safeDec = (s) => { try { return decodeURIComponent(s); } catch { return '⚠ malformed % sequence'; } };

  return (
    <div className="stack">
      <Panel title="URL"><TextArea value={url} onChange={setUrl} rows={3} mono /></Panel>
      {!parsed ? <Alert kind="error">Not a valid absolute URL (needs a scheme like https://).</Alert> : (
        <div className="two-col">
          <Panel title="Parts"><div className="stack">
            {['protocol', 'hostname', 'port', 'pathname', 'hash'].map((k) => <TextField key={k} label={k} mono value={parsed[k]} onChange={(v) => { try { part(k, v); } catch { /* ignore partial input */ } }} />)}
            <p className="small muted">Origin: <code>{parsed.origin}</code></p>
          </div></Panel>
          <Panel title={`Query parameters (${params.length})`} actions={<Button size="sm" icon={Plus} onClick={() => setParams([...params, ['', '']])}>Add</Button>}>
            <div className="stack">
              {params.length === 0 && <p className="muted small">No query parameters.</p>}
              {params.map(([k, v], i) => (
                <div className="row-nowrap" key={i}>
                  <input className="input mono" aria-label={`Key ${i + 1}`} value={k} onChange={(e) => setParams(params.map((p, j) => (j === i ? [e.target.value, p[1]] : p)))} />
                  <input className="input mono" aria-label={`Value ${i + 1}`} value={v} onChange={(e) => setParams(params.map((p, j) => (j === i ? [p[0], e.target.value] : p)))} />
                  <Button size="sm" variant="ghost" icon={Trash2} aria-label="Remove" onClick={() => setParams(params.filter((_, j) => j !== i))} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
      <Panel title="Encode / decode a component"><div className="two-col">
        <TextArea label="Text" value={raw} onChange={setRaw} rows={3} mono />
        <div className="stack"><CodeBox label="encodeURIComponent" value={encodeURIComponent(raw)} rows={2} /><CodeBox label="decodeURIComponent" value={safeDec(raw)} rows={2} /></div>
      </div></Panel>
    </div>
  );
}
