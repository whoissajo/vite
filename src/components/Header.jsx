import React from 'react';
import { Menu, ShieldCheck, Sun, Moon, PlayCircle, Sparkles } from 'lucide-react';

export default function Header({
  activeToolName,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
  onLoadSampleVideo,
  isProcessing
}) {
  return (
    <header className="top-navbar">
      <div className="nav-left">
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>

        <div className="privacy-badge" title="All processing happens on your device. Videos are never uploaded to any server.">
          <span className="privacy-dot" />
          <ShieldCheck size={14} />
          <span>100% In-Browser & Private</span>
        </div>
      </div>

      <div className="nav-right">
        <button
          className="btn btn-secondary"
          onClick={onLoadSampleVideo}
          disabled={isProcessing}
          title="Try out VideoKit with a built-in animated video sample"
          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
        >
          <Sparkles size={14} color="#06b6d4" />
          <span>Load Demo Video</span>
        </button>

        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
