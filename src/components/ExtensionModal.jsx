import React from 'react';
import { X, Chrome, Download, CheckCircle2, ShieldCheck, Zap, ArrowRight, FolderCheck } from 'lucide-react';

export default function ExtensionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px', padding: '32px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="media-badge-icon" style={{ width: '42px', height: '42px' }}>
              <Chrome size={22} color="#06b6d4" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800 }}>
                Offline Browser Extension
              </h3>
              <p style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600 }}>
                100% Offline PC Suite &bull; Zero Internet Required
              </p>
            </div>
          </div>

          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '22px' }}>
          You can use all 20+ video, audio, image, and PDF tools directly on your PC even when you have <strong>no internet connection</strong> or when traveling in Airplane mode.
        </p>

        {/* 3 Step Guide Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              color: '#fff',
              fontWeight: 800,
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              flexShrink: 0
            }}>
              1
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '2px' }}>
                Open Browser Extensions Manager
              </strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                In Chrome, Edge, or Brave, open a new tab and go to <code style={{ color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>chrome://extensions</code> (or <code style={{ color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>edge://extensions</code>).
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              color: '#fff',
              fontWeight: 800,
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              flexShrink: 0
            }}>
              2
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '2px' }}>
                Toggle "Developer Mode" ON
              </strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Flip the <strong>Developer mode</strong> switch located in the top-right corner of the Extensions page.
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              color: '#fff',
              fontWeight: 800,
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              flexShrink: 0
            }}>
              3
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '2px' }}>
                Click "Load Unpacked" & Select Folder
              </strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Click <strong>Load unpacked</strong> and select the ready-to-use <code style={{ color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>extension</code> folder inside this project.
              </p>
            </div>
          </div>
        </div>

        {/* Folder Location & Status */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <FolderCheck size={20} color="#10b981" />
          <div style={{ fontSize: '0.85rem' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>Ready in Project:</span>
            <span style={{ color: 'var(--text-main)', marginLeft: '6px' }}>
              The extension files are already created inside the <code style={{ color: 'var(--accent-cyan)' }}>extension/</code> directory of this workspace!
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1.5 }}
            onClick={() => {
              alert('The extension is ready in your project directory at folder: "extension"!\nSimply open chrome://extensions, toggle Developer mode, and click "Load unpacked" to import the "extension" folder.');
              onClose();
            }}
          >
            <CheckCircle2 size={16} />
            <span>Got It & Ready to Load</span>
          </button>
        </div>
      </div>
    </div>
  );
}

