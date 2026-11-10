import { useEffect, useState } from 'react';
import { Menu, Search, WifiOff, X, Puzzle, Wrench } from 'lucide-react';
import { Logo, GithubIcon } from '../ui/brand.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useOnline } from '../../lib/common/hooks.js';
import { goSection } from '../../lib/router.js';
import { caps } from '../../lib/common/caps.js';

export const REPO_URL = 'https://github.com/whoissajo/vite';

export default function Header({ onSearch }) {
  const online = useOnline();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    const close = () => setMenu(false);
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  }, []);
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <div className="container header-inner">
        <a href="#/" className="brand" aria-label="OffKit home"><Logo /><span>Off<b>Kit</b></span></a>
        <nav className="nav" aria-label="Main">
          <a href="#/tools"><Wrench size={15} /> All tools</a>
          {!caps.isExtension && <a href="#/" onClick={(e) => { e.preventDefault(); goSection('extension'); }}><Puzzle size={15} /> Extension</a>}
          <a href="#/" onClick={(e) => { e.preventDefault(); goSection('offline'); }}>Offline</a>
          <a href="#/" onClick={(e) => { e.preventDefault(); goSection('faq'); }}>FAQ</a>
        </nav>
        <span className="spacer" />
        {!online && <span className="badge badge-warn offline-pill"><WifiOff size={12} /> Offline</span>}
        <button className="search-btn" onClick={onSearch} aria-label="Search tools">
          <Search size={16} /><span>Search tools…</span><span className="kbd">{isMac ? '⌘' : 'Ctrl'} K</span>
        </button>
        <button className="btn btn-ghost btn-icon search-icon-btn" onClick={onSearch} aria-label="Search tools"><Search size={18} /></button>
        <a className="btn btn-ghost btn-icon gh" href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository"><GithubIcon /></a>
        <ThemeToggle />
        <button className="btn btn-ghost btn-icon menu-btn" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>{menu ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {menu && (
        <div className="mobile-menu">
          <a href="#/tools">All tools</a>
          {!caps.isExtension && <a href="#/" onClick={(e) => { e.preventDefault(); setMenu(false); goSection('extension'); }}>Browser extension</a>}
          <a href="#/" onClick={(e) => { e.preventDefault(); setMenu(false); goSection('offline'); }}>Works offline</a>
          <a href="#/" onClick={(e) => { e.preventDefault(); setMenu(false); goSection('faq'); }}>FAQ</a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      )}
    </header>
  );
}
