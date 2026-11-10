import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronDown, Cpu, Download, FolderOpen, Gauge, Layers, Lock, Package, Puzzle, Smartphone, ToggleRight, Wifi, WifiOff, X, Zap, Copy } from 'lucide-react';
import { GROUPS, TOOLS, groupById } from '../../registry/index.js';
import ToolCard from '../ToolCard.jsx';
import { ChromeIcon } from '../ui/brand.jsx';
import { useCountUp, useReveal, useSpotlight } from '../../lib/fx.js';
import { useOnline } from '../../lib/common/hooks.js';
import { usePwaInstall, useOfflineReady } from '../../lib/pwa.js';
import { copyText } from '../../lib/common/download.js';
import { REPO_URL } from '../layout/Header.jsx';

export const Reveal = ({ children, className = '', delay = 0, as: Tag = 'div', ...rest }) => {
  const ref = useReveal();
  return <Tag ref={ref} className={`reveal ${className}`} style={{ '--d': `${delay}ms` }} {...rest}>{children}</Tag>;
};

export function SectionHead({ eyebrow, title, children }) {
  return (
    <Reveal className="section-head">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
    </Reveal>
  );
}

/* ───────── marquee of every tool ───────── */
export function Marquee() {
  const items = useMemo(() => TOOLS.map((t) => ({ id: t.id, name: t.name, icon: t.icon, hue: groupById[t.group].hue })), []);
  if (!items.length) return null;
  const row = (key) => (
    <ul className="marquee-track" aria-hidden={key === 'b'} key={key}>
      {items.map((t) => <li key={t.id} style={{ '--hue': t.hue }}><a href={`#/tool/${t.id}`} tabIndex={key === 'b' ? -1 : 0}><t.icon size={15} />{t.name}</a></li>)}
    </ul>
  );
  return <div className="marquee" aria-label="All tools"><div className="marquee-inner">{row('a')}{row('b')}</div></div>;
}

/* ───────── stats ───────── */
function Stat({ value, suffix = '', label }) {
  const [ref, v] = useCountUp(value);
  return <div className="lstat" ref={ref}><b>{v}{suffix}</b><span>{label}</span></div>;
}
export function Stats() {
  return (
    <Reveal className="container lstats">
      <Stat value={TOOLS.length} suffix="" label="tools, one place" />
      <Stat value={0} label="bytes uploaded" />
      <Stat value={0} label="accounts or trackers" />
      <Stat value={100} suffix="%" label="works offline" />
    </Reveal>
  );
}

/* ───────── bento ───────── */
function BentoCard({ icon: Icon, title, children, className = '', visual, hue = 265 }) {
  const spot = useSpotlight();
  return (
    <Reveal className={`bento-card spot ${className}`} style={{ '--hue': hue }} {...spot}>
      <div className="bento-visual" aria-hidden="true">{visual}</div>
      <div className="bento-icon"><Icon size={20} /></div>
      <h3>{title}</h3>
      <p>{children}</p>
    </Reveal>
  );
}
export function Bento() {
  return (
    <section className="section container" id="features">
      <SectionHead eyebrow="Why OffKit" title="Built different — because it runs on you">
        Most “free online tools” upload your files to someone else’s server. OffKit ships the tools to your browser instead.
      </SectionHead>
      <div className="bento">
        <BentoCard className="b-wide" hue={265} icon={Lock} title="Private by architecture" visual={
          <div className="vis-net"><div className="vis-row"><span>POST /upload</span><em>blocked — doesn’t exist</em></div><div className="vis-row ok"><span>compress(photo.jpg)</span><em>on-device</em></div><div className="vis-row ok"><span>network requests</span><em>0</em></div></div>
        }>There is no upload endpoint. Open your browser’s Network tab and watch: your files never leave the tab.</BentoCard>
        <BentoCard hue={160} icon={WifiOff} title="Offline after one visit" visual={<div className="vis-wifi"><WifiOff size={54} /><i /><i /><i /></div>}>Install it once and every tool keeps working on a plane, in a tunnel or behind a strict firewall.</BentoCard>
        <BentoCard hue={200} icon={Cpu} title="Real native speed" visual={<div className="vis-bars">{[40, 70, 55, 90, 62, 100].map((h, i) => <i key={i} style={{ '--h': `${h}%`, '--i': i }} />)}</div>}>Video and audio use hardware-accelerated WebCodecs; images use GPU canvas; PDFs use pdf-lib and PDF.js.</BentoCard>
        <BentoCard hue={25} icon={Layers} title="Batch everything" visual={<div className="vis-stack"><i /><i /><i /></div>}>Drop 50 photos, change one slider, download a single zip. Progress and cancel on every long job.</BentoCard>
        <BentoCard hue={295} icon={Gauge} title="Honest results" visual={<div className="vis-honest"><span>−68%</span><small>if it’s bigger, we tell you</small></div>}>Compressors show true before/after sizes — and keep your original rather than hand back a bigger file.</BentoCard>
        <BentoCard className="b-full" hue={350} icon={Puzzle} title="A browser extension for the desert island" visual={
          <div className="vis-ext"><span><Puzzle size={16} /></span><div>OffKit<small>{TOOLS.length} tools · offline</small></div><em>Pinned</em></div>
        }>Load the extension in Chrome, Edge, Brave or Opera and open every tool from the toolbar — no internet, no hosting, nothing to install server-side.</BentoCard>
      </div>
    </section>
  );
}

/* ───────── showcase ───────── */
export function Showcase() {
  const [group, setGroup] = useState('all');
  const list = useMemo(() => {
    if (group === 'all') return [...TOOLS.filter((t) => t.popular), ...TOOLS.filter((t) => !t.popular)].slice(0, 12);
    return TOOLS.filter((t) => t.group === group).slice(0, 12);
  }, [group]);
  return (
    <section className="section container" id="tools">
      <SectionHead eyebrow={`${TOOLS.length} tools`} title="Pick a tool. Drop a file. Done.">Grouped by what you’re trying to do. Press <span className="kbd">/</span> anywhere to search.</SectionHead>
      <Reveal className="chips center" role="tablist">
        <button className="chip" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>Popular</button>
        {GROUPS.filter((g) => TOOLS.some((t) => t.group === g.id)).map((g) => <button key={g.id} className="chip" aria-pressed={group === g.id} onClick={() => setGroup(g.id)}><g.icon size={14} /> {g.name}</button>)}
      </Reveal>
      <div className="tool-cards showcase-grid">{list.map((t) => <ToolCard key={t.id} tool={t} />)}</div>
      <div className="center-row"><a className="btn btn-lg" href="#/tools">See all {TOOLS.length} tools <ArrowRight size={18} /></a></div>
    </section>
  );
}

/* ───────── how it works ───────── */
export function HowItWorks() {
  const steps = [
    { n: 1, icon: FolderOpen, t: 'Drop your file', d: 'Drag it in, pick it, or paste it. It’s read straight into memory — no upload step exists.' },
    { n: 2, icon: Zap, t: 'It runs on your device', d: 'Your CPU, GPU and the browser’s built-in codecs do the work, with live progress and a cancel button.' },
    { n: 3, icon: Download, t: 'Save the result', d: 'Download it instantly. Close the tab and every trace is gone from memory.' },
  ];
  return (
    <section className="section container">
      <SectionHead eyebrow="How it works" title="Three steps, zero servers" />
      <div className="steps">
        {steps.map((s, i) => (
          <Reveal key={s.n} className="step" delay={i * 90}>
            <span className="step-n">{s.n}</span><div className="step-icon"><s.icon size={22} /></div><h3>{s.t}</h3><p className="muted">{s.d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────── offline ───────── */
export function Offline() {
  const online = useOnline();
  const ready = useOfflineReady();
  const pwa = usePwaInstall();
  return (
    <section className="section container" id="offline">
      <Reveal className="offline-card">
        <div className="offline-copy">
          <span className="eyebrow">No internet? No problem.</span>
          <h2>Install once. Use anywhere.</h2>
          <p className="muted">OffKit caches itself — every tool, font and codec — using a service worker. After the first load you can switch on airplane mode and keep working.</p>
          <ol className="checklist">
            <li><Check size={16} /> Open OffKit once while online</li>
            <li><Check size={16} /> Optionally install it as an app (button on the right)</li>
            <li><Check size={16} /> Go offline — all tools still work</li>
          </ol>
          <p className="small faint">Prefer a toolbar button that never needs a website? Use the browser extension below.</p>
        </div>
        <div className="offline-panel">
          <div className={`conn ${online ? 'on' : 'off'}`}>
            {online ? <Wifi size={26} /> : <WifiOff size={26} />}
            <div><b>{online ? 'You’re online' : 'You’re offline'}</b><span>{online ? 'Everything still runs locally.' : 'And OffKit still works. Try it.'}</span></div>
          </div>
          <div className={`conn ${ready ? 'on' : 'pending'}`}>
            <Package size={26} />
            <div><b>{ready ? 'Cached for offline use' : 'Offline cache not active yet'}</b><span>{ready ? 'The service worker is serving this page.' : 'Active on the deployed site after the first full load.'}</span></div>
          </div>
          {pwa.installed ? <div className="alert alert-ok"><Check size={18} /> Running as an installed app.</div>
            : pwa.canInstall ? <button className="btn btn-primary btn-lg btn-block" onClick={pwa.install}><Smartphone size={18} /> Install OffKit as an app</button>
              : <p className="small faint">Install option appears in Chrome/Edge (address bar ⊕ icon) and on Android; on iPhone use Share → Add to Home Screen.</p>}
        </div>
      </Reveal>
    </section>
  );
}

/* ───────── extension ───────── */
export const EXT_ZIP = './offkit-extension.zip';
export function Extension() {
  const [copied, setCopied] = useState('');
  const copy = async (t, k) => { await copyText(t); setCopied(k); setTimeout(() => setCopied(''), 1400); };
  const steps = [
    { t: 'Download & unzip', d: <>Download <b>offkit-extension.zip</b> and extract it. You’ll get a folder named <code>offkit-extension</code>.</> },
    { t: 'Open the extensions page', d: <>In Chrome/Brave open <code>chrome://extensions</code>, in Edge <code>edge://extensions</code>.</>, copy: ['chrome://extensions', 'ext'] },
    { t: 'Turn on Developer mode', d: <>Use the toggle in the top-right corner of that page.</> },
    { t: 'Load unpacked', d: <>Click <b>Load unpacked</b> and choose the extracted <code>offkit-extension</code> folder. Pin OffKit to your toolbar.</> },
  ];
  return (
    <section className="section container" id="extension">
      <SectionHead eyebrow="Browser extension" title="Every tool, one click, zero internet">
        The extension bundles the entire app. Click its icon and every tool opens instantly from your own disk.
      </SectionHead>
      <div className="ext-grid">
        <Reveal className="ext-steps">
          {steps.map((s, i) => (
            <div className="ext-step" key={i}>
              <span className="step-n">{i + 1}</span>
              <div><b>{s.t}</b><p className="muted small">{s.d}</p>
                {s.copy && <button className="btn btn-sm" onClick={() => copy(...s.copy)}>{copied === s.copy[1] ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy address</>}</button>}</div>
            </div>
          ))}
          <div className="row" style={{ marginTop: 6 }}>
            <a className="btn btn-primary btn-lg" href={EXT_ZIP} download><Download size={18} /> Download extension (.zip)</a>
            <a className="btn btn-lg btn-ghost" href={`${REPO_URL}/tree/main/extension`} target="_blank" rel="noopener noreferrer"><FolderOpen size={18} /> View folder on GitHub</a>
          </div>
          <p className="small faint">Works in Chrome, Edge, Brave, Opera, Vivaldi and other Chromium browsers (Manifest V3). Firefox: load via <code>about:debugging</code> → “Load Temporary Add-on”.</p>
        </Reveal>
        <Reveal className="browser-frame" delay={120} aria-hidden="true">
          <div className="bf-bar"><i /><i /><i /><span className="bf-url"><ChromeIcon size={13} /> chrome://extensions</span></div>
          <div className="bf-body">
            <div className="bf-row"><b>Extensions</b><span className="bf-toggle"><small>Developer mode</small><ToggleRight size={28} /></span></div>
            <div className="bf-actions"><span>Load unpacked</span><span>Pack extension</span><span>Update</span></div>
            <div className="bf-ext"><span className="bf-ext-icon"><Puzzle size={22} /></span><div><b>OffKit — tools that work offline</b><small>Version 2.0 · Loaded from offkit-extension</small></div><ToggleRight size={30} /></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── compare ───────── */
export function Compare() {
  const rows = [
    ['Uploads your files to a server', false, true], ['Works with no internet', true, false], ['File-size limits & paywalls', false, true], ['Needs an account or email', false, true], ['Speed depends on your connection', false, true], ['You can verify it in DevTools → Network', true, false],
  ];
  return (
    <section className="section container">
      <SectionHead eyebrow="Honest comparison" title="OffKit vs. the usual online converter" />
      <Reveal className="compare">
        <div className="compare-head"><span /><b className="grad-text">OffKit</b><b>Typical site</b></div>
        {rows.map(([label, a, b]) => (
          <div className="compare-row" key={label}>
            <span>{label}</span>
            <span className={a ? 'yes' : 'no'}>{a ? <Check size={18} /> : <X size={18} />}</span>
            <span className={b ? 'no' : 'yes'}>{b ? <Check size={18} /> : <X size={18} />}</span>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

/* ───────── faq ───────── */
const FAQ = [
  ['Is it really private?', 'Yes. There is no server that receives files. Everything is computed by JavaScript and WebAssembly inside your browser tab. Open DevTools → Network while you use a tool and you’ll see no requests carrying your data.'],
  ['Does it really work without internet?', 'Yes. After your first visit a service worker caches the whole app, so it works offline. The browser extension goes further: the entire app lives inside it, so it never needs a network at all.'],
  ['How do I install the extension?', 'Download the zip, extract it, open chrome://extensions (or edge://extensions), enable Developer mode, click “Load unpacked” and pick the extracted folder. Step-by-step instructions are in the extension section above.'],
  ['Are there file size limits?', 'No artificial limits. The only limit is your device’s memory. Very large videos or PDFs on a phone may be slow, and a Cancel button is always available.'],
  ['Which browsers are supported?', 'Latest Chrome, Edge, Brave, Opera and Safari 17+ for everything. Video and audio tools use WebCodecs, which Firefox only partly supports — those tools tell you clearly when something isn’t available instead of failing silently.'],
  ['Are the results “real”?', 'Always. A compressor compresses and reports true before/after sizes. If a result would be larger than your original we say so and keep the original. Tools that can’t do something (for example AVIF encoding in an older browser) disable that option instead of pretending.'],
  ['Is it free?', 'Completely, and open source. There are no accounts, ads or tracking.'],
];
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section container narrow" id="faq">
      <SectionHead eyebrow="FAQ" title="Questions, answered" />
      <Reveal className="faq">
        {FAQ.map(([q, a], i) => (
          <div className={`faq-item${open === i ? ' open' : ''}`} key={q}>
            <button aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>{q}<ChevronDown size={18} /></button>
            <div className="faq-body"><div><p className="muted">{a}</p></div></div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="section container">
      <Reveal className="final-cta beam">
        <h2>Stop uploading your files to strangers.</h2>
        <p className="muted">Open a tool, drop a file, and watch it happen on your own device.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <a className="btn btn-primary btn-lg" href="#/tools">Browse all tools <ArrowRight size={18} /></a>
          <a className="btn btn-lg" href={REPO_URL} target="_blank" rel="noopener noreferrer">Star on GitHub</a>
        </div>
      </Reveal>
    </section>
  );
}
