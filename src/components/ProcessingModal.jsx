import React, { useEffect } from 'react';
import { Download, CheckCircle, X, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatFileSize } from '../engine/mediaCore';

export default function ProcessingModal({
  isOpen,
  progress = 0,
  status = 'Processing in browser...',
  result = null,
  originalSize = 0,
  onClose,
  onDownload
}) {
  useEffect(() => {
    if (result) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [result]);

  if (!isOpen) return null;

  const isDone = !!result;

  return (
    <div className="modal-overlay" onClick={isDone ? onClose : undefined}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
            {isDone ? 'Processing Completed!' : 'Processing Media'}
          </h3>
          {isDone && (
            <button className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {!isDone ? (
          <div>
            <div style={{ margin: '24px 0' }}>
              <Loader2 size={40} className="spin-animation" style={{ color: 'var(--accent-cyan)', margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>{status}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                100% Client-side. Zero internet data used.
              </p>
            </div>

            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              <span>Hardware Acceleration Active</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{progress}%</span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle size={32} />
            </div>

            <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px' }}>
              Your file is ready for download!
            </p>

            <div style={{
              background: 'var(--bg-input)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              margin: '16px 0',
              display: 'flex',
              justifyContent: 'space-around',
              fontSize: '0.88rem'
            }}>
              {originalSize > 0 && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Original Size</span>
                  <span style={{ fontWeight: 600 }}>{formatFileSize(originalSize)}</span>
                </div>
              )}
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Output Size</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{formatFileSize(result.size)}</span>
              </div>
              {originalSize > 0 && result.size < originalSize && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Saved</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>
                    {Math.round(((originalSize - result.size) / originalSize) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {result.url && result.mimeType?.startsWith('video') && (
              <div style={{ maxHeight: '180px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', margin: '16px 0', background: '#000' }}>
                <video src={result.url} controls style={{ width: '100%', maxHeight: '180px', display: 'block' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                Done
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={onDownload}>
                <Download size={16} />
                <span>Save to Device</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
