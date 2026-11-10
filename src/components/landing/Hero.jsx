import { ArrowRight, ShieldCheck, Sparkles, WifiOff, Puzzle } from 'lucide-react';
import { TOOLS } from '../../registry/index.js';
import { goSection } from '../../lib/router.js';
import { caps } from '../../lib/common/caps.js';

const HEADLINE = ['Every', 'tool', 'you', 'need.'];
const HEADLINE2 = ['Nothing', 'leaves', 'your', 'device.'];

export function BlurText({ words, offset = 0, className = '' }) {
  return words.map((w, i) => (
    <span key={w + i} className={`bt-word ${className}`} style={{ '--i': i + offset }}>{w}&nbsp;</span>
  ));
}

export default function Hero() {
  return (
    <section className="hero">
      <div className="aurora" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
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
      </div>
    </section>
  );
}
