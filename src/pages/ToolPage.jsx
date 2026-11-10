import { Suspense, lazy, useEffect, useMemo } from 'react';
import { ArrowLeft, ShieldCheck, WifiOff, Zap } from 'lucide-react';
import { groupById, toolById, toolsInGroup } from '../registry/index.js';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { Alert } from '../components/ui/index.jsx';
import { caps } from '../lib/common/caps.js';
import ToolCard from '../components/ToolCard.jsx';

const cache = new Map();
const lazyFor = (tool) => {
  if (!cache.has(tool.id)) cache.set(tool.id, lazy(tool.load));
  return cache.get(tool.id);
};

export default function ToolPage({ id }) {
  const tool = toolById[id];
  const Tool = useMemo(() => (tool ? lazyFor(tool) : null), [tool]);
  useEffect(() => {
    document.title = tool ? `${tool.name} — OffKit` : 'Not found — OffKit';
    return () => { document.title = 'OffKit — Free tools that work offline'; };
  }, [tool]);

  if (!tool) {
    return (
      <div className="container page-pad">
        <div className="empty"><b>That tool doesn’t exist.</b><a className="btn btn-sm" href="#/tools">Browse all tools</a></div>
      </div>
    );
  }
  const group = groupById[tool.group];
  const related = toolsInGroup(tool.group).filter((t) => t.id !== tool.id).slice(0, 4);
  const needsCodecs = tool.needs?.includes('webcodecs') && !caps.webcodecs;

  return (
    <div className="container page-pad tool-page" style={{ '--hue': group.hue }}>
      <a href={`#/tools/${group.id}`} className="back-link"><ArrowLeft size={15} /> {group.name} tools</a>
      <header className="tool-head">
        <div className="tool-head-icon"><tool.icon size={26} /></div>
        <div className="min0">
          <h1>{tool.name}</h1>
          <p className="muted">{tool.description || tool.tagline}</p>
          <div className="tool-badges">
            <span className="badge badge-ok"><ShieldCheck size={12} /> Stays on your device</span>
            <span className="badge"><WifiOff size={12} /> Works offline</span>
            {tool.needs?.includes('webcodecs') && <span className="badge"><Zap size={12} /> Hardware accelerated</span>}
          </div>
        </div>
      </header>
      {needsCodecs && (
        <Alert kind="warn" title="Your browser is missing WebCodecs.">
          This tool needs a recent Chrome, Edge, Brave, Opera or Safari 17+. Firefox support is still partial.
        </Alert>
      )}
      <ErrorBoundary resetKey={id}>
        <Suspense fallback={<div className="stack"><div className="skeleton" style={{ height: 260 }} /><div className="skeleton" style={{ height: 120 }} /></div>}>
          <div className="tool-body"><Tool /></div>
        </Suspense>
      </ErrorBoundary>
      {related.length > 0 && (
        <section className="related">
          <h2>More {group.name.toLowerCase()} tools</h2>
          <div className="tool-cards">{related.map((t) => <ToolCard key={t.id} tool={t} />)}</div>
        </section>
      )}
    </div>
  );
}
