import { useRef, useState } from 'react';
import { ArrowRight, Download, ImageDown, ShieldCheck, Sparkles, WifiOff, Puzzle } from 'lucide-react';
import { TOOLS } from '../../registry/index.js';
import { goSection } from '../../lib/router.js';
import { caps } from '../../lib/common/caps.js';
import { bitmapToCanvas, encodeCanvas } from '../../lib/image/codec.js';
import { downloadBlob } from '../../lib/common/download.js';
import { formatBytes, percentSaved, renameWithExt, extFromMime } from '../../lib/common/format.js';
import { useCountUp } from '../../lib/fx.js';

const HEADLINE = ['Every', 'tool', 'you', 'need.'];
const HEADLINE2 = ['Nothing', 'leaves', 'your', 'device.'];

export function BlurText({ words, offset = 0, className = '' }) {
  return words.map((w, i) => (
    <span key={w + i} className={`bt-word ${className}`} style={{ '--i': i + offset }}>{w}&nbsp;</span>
  ));
}

function HeroDemo() {
  const [state, setState] = useState({ phase: 'idle' });
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const [pRef, pct] = useCountUp(state.saved > 0 ? Math.round(state.saved) : 0, { duration: 900 });

  const run = async (file) => {
    if (!file || !file.type.startsWith('image/')) { setState({ phase: 'error', msg: 'Please drop an image file (JPG, PNG, WebP…).' }); return; }
    setState({ phase: 'work', name: file.name });
    try {
      const { canvas } = await bitmapToCanvas(file, { maxDim: 2400 });
      const mime = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
      let blob = await encodeCanvas(canvas, mime, { quality: 0.72 });
      const saved = percentSaved(file.size, blob.size);
      const url = URL.createObjectURL(blob);
      setState({ phase: 'done', name: renameWithExt(file.name, extFromMime(blob.type), '-small'), blob, url, before: file.size, after: blob.size, saved });
    } catch (e) { setState({ phase: 'error', msg: e.message || 'Could not read that image.' }); }
  };

  return (
    <div className="hero-demo spot-border">
      <div className="hero-demo-bar"><i /><i /><i /><span>offkit — compress image</span><span className="badge badge-ok"><WifiOff size={11} /> offline-ready</span></div>
      <div
        className={`hero-demo-body${over ? ' is-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); run(e.dataTransfer.files[0]); }}
      >
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { run(e.target.files[0]); e.target.value = ''; }} />
        {state.phase === 'idle' || state.phase === 'error' ? (
          <button className="hero-drop" onClick={() => input.current.click()}>
            <span className="hero-drop-icon"><ImageDown size={26} /></span>
            <b>Try it: drop a photo here</b>
            <span>It really compresses it — right in this tab. Disconnect Wi-Fi if you don’t believe us.</span>
            {state.phase === 'error' && <em className="hero-err">{state.msg}</em>}
          </button>
        ) : state.phase === 'work' ? (
          <div className="hero-drop"><span className="spinner" style={{ width: 28, height: 28 }} /><b>Compressing {state.name}…</b></div>
        ) : (
          <div className="hero-result">
            <img src={state.url} alt="Compressed preview" />
            <div className="hero-result-info">
              <div className="small muted truncate">{state.name}</div>
              <div className="hero-sizes"><s>{formatBytes(state.before)}</s><ArrowRight size={16} /><b>{formatBytes(state.after)}</b></div>
              {state.saved > 0
                ? <div className="hero-saved" ref={pRef}>−{pct}%<span> smaller</span></div>
                : <div className="small muted">Already well optimised — try the full tool for more control.</div>}
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => downloadBlob(state.blob, state.name)}><Download size={15} /> Download</button>
                <button className="btn btn-sm" onClick={() => setState({ phase: 'idle' })}>Another</button>
                <a className="btn btn-sm btn-ghost" href="#/tool/image-compress">Full tool <ArrowRight size={14} /></a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Hero() {
  const ref = useRef(null);
  return (
    <section
      className="hero" ref={ref}
      onPointerMove={(e) => { const r = ref.current.getBoundingClientRect(); ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`); ref.current.style.setProperty('--my', `${e.clientY - r.top}px`); }}
    >
      <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-spot" aria-hidden="true" />
      <div className="container hero-inner">
        <a className="hero-pill" href="#/" onClick={(e) => { e.preventDefault(); goSection(caps.isExtension ? 'tools' : 'extension'); }}>
          <span className="hero-pill-dot" /> <Sparkles size={14} /> {caps.isExtension ? `${TOOLS.length} tools, fully offline` : 'Now with a browser extension'} <ArrowRight size={14} />
        </a>
        <h1 className="hero-title">
          <BlurText words={HEADLINE} /><br />
          <BlurText words={HEADLINE2} offset={4} className="grad-anim" />
        </h1>
        <p className="hero-sub">
          Compress images and video, edit PDFs, convert audio, format JSON and more — <b>{TOOLS.length} tools</b> in all, running on your device.
          No uploads, no accounts, and everything keeps working with <b>no internet</b>.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary btn-lg" href="#/tools">Browse {TOOLS.length} tools <ArrowRight size={18} /></a>
          {!caps.isExtension && <button className="btn btn-lg" onClick={() => goSection('extension')}><Puzzle size={18} /> Get the extension</button>}
        </div>
        <ul className="hero-trust">
          <li><ShieldCheck size={15} /> Files never uploaded</li><li><WifiOff size={15} /> Works offline</li><li>No sign-up</li><li>Free &amp; open source</li>
        </ul>
        <HeroDemo />
      </div>
    </section>
  );
}
