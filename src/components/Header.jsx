import React, { useState, useEffect } from 'react';
import { Menu, ShieldCheck, Sun, Moon, Sparkles, Chrome, Wifi, WifiOff } from 'lucide-react';

export default function Header({
  activeToolName,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
  onLoadSampleVideo,
  onOpenExtensionModal,
  isProcessing
}) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

        <div className="privacy-badge" title="All media processing happens 100% inside your device memory. Zero server uploads.">
          <span className="privacy-dot" />
          <ShieldCheck size={14} />
          <span>100% Client-Side & Private</span>
        </div>

        {/* Offline / Low Internet Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: isOnline ? 'rgba(59, 130, 246, 0.1)' : 'rgba(234, 179, 8, 0.15)',
            border: isOnline ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(234, 179, 8, 0.35)',
            color: isOnline ? 'var(--accent-cyan)' : '#facc15'
          }}
          title={isOnline ? 'Internet connected, but all tools work 100% offline' : 'No internet detected - all tools continue to function smoothly!'}
        >
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isOnline ? 'Offline-Ready' : 'Offline Mode Active'}</span>
        </div>
      </div>

      <div className="nav-right">
        {/* Offline Browser Extension CTA */}
        <button
          className="btn btn-secondary extension-nav-btn"
          onClick={onOpenExtensionModal}
          title="Get browser extension for 1-click desktop offline usage"
          style={{ fontSize: '0.8rem', padding: '6px 12px', gap: '6px' }}
        >
          <Chrome size={15} color="#06b6d4" />
          <span>Offline Extension</span>
          <span className="tool-badge" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>Free</span>
        </button>

        <button
          className="btn btn-secondary demo-nav-btn"
          onClick={onLoadSampleVideo}
          disabled={isProcessing}
          title="Try out with an in-browser demo video"
          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
        >
          <Sparkles size={14} color="#06b6d4" />
          <span>Load Demo</span>
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
