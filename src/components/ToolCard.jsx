import { groupById } from '../registry/index.js';
import { useSpotlight } from '../lib/fx.js';

/** Tool tile with cursor-follow spotlight + per-category hue. */
export default function ToolCard({ tool, compact = false }) {
  const g = groupById[tool.group];
  const spot = useSpotlight();
  return (
    <a href={`#/tool/${tool.id}`} className={`tool-card${compact ? ' compact' : ''}`} style={{ '--hue': g.hue }} {...spot}>
      <span className="tool-card-icon"><tool.icon size={20} /></span>
      <span className="tool-card-text">
        <b>{tool.name}</b>
        <span>{tool.tagline}</span>
      </span>
      {tool.isNew && <span className="badge tool-card-new">New</span>}
    </a>
  );
}
