import { useEffect, useMemo, useState } from 'react';
import { Alert, CodeBox, Panel, Select, TextArea, TextField } from '../../components/ui/index.jsx';

const b64u = (s) => { const t = s.replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(t + '='.repeat((4 - (t.length % 4)) % 4)), (c) => c.charCodeAt(0)); };
const dec = (s) => JSON.parse(new TextDecoder().decode(b64u(s)));
const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const HS = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
const when = (n) => { const d = new Date(n * 1000); const diff = n * 1000 - Date.now(); const a = Math.abs(diff); const u = a > 864e5 ? `${Math.round(a / 864e5)} days` : a > 36e5 ? `${Math.round(a / 36e5)} hours` : `${Math.round(a / 6e4)} minutes`; return `${d.toISOString()} (${diff > 0 ? `in ${u}` : `${u} ago`})`; };

async function verify(token, alg, key) {
  const [h, p, s] = token.split('.'); const data = new TextEncoder().encode(`${h}.${p}`); const sig = b64u(s);
  if (HS[alg]) {
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: HS[alg] }, false, ['verify']);
    return crypto.subtle.verify('HMAC', k, sig, data);
  }
  const hash = `SHA-${alg.slice(2)}`;
  let jwk, fmt = 'spki', der;
  if (key.trim().startsWith('{')) { jwk = JSON.parse(key); } else {
    const body = key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''); der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  }
  if (alg.startsWith('RS')) {
    const k = jwk ? await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash }, false, ['verify']) : await crypto.subtle.importKey(fmt, der, { name: 'RSASSA-PKCS1-v1_5', hash }, false, ['verify']);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', k, sig, data);
  }
  if (alg.startsWith('ES')) {
    const curve = { ES256: 'P-256', ES384: 'P-384', ES512: 'P-521' }[alg];
    const k = jwk ? await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: curve }, false, ['verify']) : await crypto.subtle.importKey(fmt, der, { name: 'ECDSA', namedCurve: curve }, false, ['verify']);
    return crypto.subtle.verify({ name: 'ECDSA', hash }, k, sig, data);
  }
  throw new Error(`Algorithm ${alg} can’t be verified here.`);
}

export default function JwtDecoder() {
  const [token, setToken] = useState(SAMPLE);
  const [key, setKey] = useState('your-256-bit-secret');
  const [vr, setVr] = useState(null);
  const d = useMemo(() => {
    const t = token.trim(); if (!t) return null;
    const parts = t.split('.'); if (parts.length !== 3) return { err: 'A JWT has three dot-separated parts (header.payload.signature).' };
    try { return { header: dec(parts[0]), payload: dec(parts[1]), t }; } catch { return { err: 'Header or payload is not valid base64url-encoded JSON.' }; }
  }, [token]);
  const alg = d?.header?.alg;
  useEffect(() => {
    setVr(null); if (!d?.header || !alg) return; let dead = false;
    if (alg === 'none') { setVr({ kind: 'warn', msg: 'alg is "none": this token is unsigned — never trust it.' }); return; }
    if (!key.trim()) { setVr({ kind: 'info', msg: `Enter the ${HS[alg] ? 'secret' : 'public key (PEM or JWK)'} to verify the ${alg} signature.` }); return; }
    verify(d.t, alg, key).then((ok) => !dead && setVr(ok ? { kind: 'ok', msg: 'Signature verified ✓' } : { kind: 'error', msg: 'Signature does NOT match — wrong key or tampered token.' })).catch((e) => !dead && setVr({ kind: 'error', msg: `Couldn’t verify: ${e.message}` }));
    return () => { dead = true; };
  }, [d, alg, key]);
  const p = d?.payload || {};
  const times = ['iat', 'nbf', 'exp'].filter((k) => typeof p[k] === 'number');

  return (
    <div className="stack">
      <Panel title="Token"><TextArea value={token} onChange={setToken} rows={5} mono placeholder="Paste a JWT" /></Panel>
      {d?.err && <Alert kind="error">{d.err}</Alert>}
      {d?.header && <>
        <div className="two-col"><Panel title="Header"><CodeBox value={JSON.stringify(d.header, null, 2)} rows={7} /></Panel><Panel title="Payload"><CodeBox value={JSON.stringify(d.payload, null, 2)} rows={7} /></Panel></div>
        {times.length > 0 && <Panel title="Times"><dl className="kv">{times.map((k) => [<dt key={k + 'k'}>{k}</dt>, <dd key={k}>{when(p[k])}</dd>])}</dl>{typeof p.exp === 'number' && <Alert kind={p.exp * 1000 < Date.now() ? 'error' : 'ok'}>{p.exp * 1000 < Date.now() ? 'This token has expired.' : 'This token has not expired.'}</Alert>}</Panel>}
        <Panel title={`Verify signature (${alg})`}><div className="stack">
          <TextArea label={HS[alg] ? 'Secret' : 'Public key (PEM or JWK)'} value={key} onChange={setKey} rows={HS[alg] ? 2 : 6} mono />
          {vr ? <Alert kind={vr.kind}>{vr.msg}</Alert> : <p className="small muted">Checking…</p>}
          <p className="small muted">Verification runs locally with Web Crypto. The secret never leaves this page. Decoding alone does not prove a token is authentic.</p>
        </div></Panel>
      </>}
    </div>
  );
}
