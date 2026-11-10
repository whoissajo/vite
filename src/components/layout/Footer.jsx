import { Logo, GithubIcon } from '../ui/brand.jsx';
import { GROUPS, toolsInGroup, TOOLS } from '../../registry/index.js';
import { REPO_URL } from './Header.jsx';
import { goSection } from '../../lib/router.js';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#/" className="brand"><Logo /><span>Off<b>Kit</b></span></a>
            <p className="muted small">{TOOLS.length} free tools that run entirely on your device. Your files never leave your browser — and everything keeps working with no internet.</p>
            <a className="btn btn-sm" href={REPO_URL} target="_blank" rel="noopener noreferrer"><GithubIcon size={15} /> Star on GitHub</a>
          </div>
          {GROUPS.slice(0, 4).map((g) => (
            <div key={g.id} className="footer-col">
              <h4><a href={`#/tools/${g.id}`}>{g.name}</a></h4>
              {toolsInGroup(g.id).slice(0, 6).map((t) => <a key={t.id} href={`#/tool/${t.id}`}>{t.name}</a>)}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} OffKit · Open source · No tracking · No uploads</span>
          <span className="row" style={{ gap: 16 }}>
            <a href="#/tools">All tools</a>
            <a href="#/" onClick={(e) => { e.preventDefault(); goSection('extension'); }}>Extension</a>
            <a href="#/" onClick={(e) => { e.preventDefault(); goSection('faq'); }}>FAQ</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
