import React, { useEffect } from 'react';
import { Download, CheckCircle, X, Loader2, Sparkles, FileText, Music, Image as ImageIcon, Film } from 'lucide-react';
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
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [result]);

  if (!isOpen) return null;

  const isDone = !!result;
  const isVideo = result?.mimeType?.startsWith('video');
  const isAudio = result?.mimeType?.startsWith('audio');
  const isImage = result?.mimeType?.startsWith('image');
  const isPdf = result?.mimeType === 'application/pdf';

  return (
    <div className="modal-overlay" onClick={isDone ? onClose : undefined}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDone ? (
              <>
                <Sparkles size={20} color="#06b6d4" />
                <span>Ready to Download!</span>
              </>
            ) : (
              <span>Processing Media</span>
            )}
          </h3>
          {isDone && (
            <button className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {!isDone ? (
          <div>
            <div style={{ margin: '24px 0', textAlign: 'center' }}>
              <Loader2 size={40} className="spin-animation" style={{ color: 'var(--accent-cyan)', margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>{status}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                100% Client-side in browser RAM &bull; Zero internet data used
              </p>
            </div>

            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              <span>Hardware Acceleration Active</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{progress}%</span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <CheckCircle size={30} />
            </div>

            <p style={{ fontSize: '1.05rem', fontWeight: 600, textAlign: 'center', marginBottom: '6px' }}>
              {result?.isMultiple ? `All ${result.count} Files Generated Successfully!` : 'Processed Successfully!'}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              {result?.isMultiple
                ? `Ready to save. You can download clip #1 directly or close this window to download all ${result.count} clips individually.`
                : 'Your file was generated 100% in local memory without leaving your computer.'}
            </p>

            <div style={{
              background: 'var(--bg-input)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              margin: '16px 0',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
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
                <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{formatFileSize(result?.size || 0)}</span>
              </div>
              {originalSize > 0 && result?.size && result.size < originalSize && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Space Saved</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>
                    {Math.round(((originalSize - result.size) / originalSize) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Media Type Previews */}
            {result?.url && (
              <div style={{ margin: '14px 0' }}>
                {isVideo && (
                  <div style={{ maxHeight: '200px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000' }}>
                    <video src={result.url} controls style={{ width: '100%', maxHeight: '200px', display: 'block' }} />
                  </div>
                )}

                {isImage && (
                  <div style={{ maxHeight: '200px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 16px 16px', display: 'flex', justifyContent: 'center' }}>
                    <img src={result.url} alt="Output Preview" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                  </div>
                )}

                {isAudio && (
                  <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                      <Music size={16} />
                      <span>Studio Quality Audio Track (PCM WAV)</span>
                    </div>
                    <audio src={result.url} controls style={{ width: '100%' }} />
                  </div>
                )}

                {isPdf && (
                  <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={24} color="#f43f5e" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>PDF Document Ready</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{result.pagesCount || 1} Pages compiled</div>
                    </div>
                  </div>
                )}
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
