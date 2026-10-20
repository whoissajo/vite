import React, { useState } from 'react';
import { Wand2, Download, RefreshCw, Sparkles, Check } from 'lucide-react';
import { removeColorBackground } from '../engine/imageCore';
import { formatFileSize } from '../engine/mediaCore';

export default function ImageBgRemover({
  imageData,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [targetHex, setTargetHex] = useState('#ffffff');
  const [tolerance, setTolerance] = useState(35);
  const [previewResult, setPreviewResult] = useState(null);
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);

  const handleApply = async () => {
    try {
      setIsProcessingLocal(true);
      onStartProcessing('Removing background color and creating alpha mask...');
      onProgress(30);

      const result = await removeColorBackground(imageData.imageElement, {
        targetHex,
        tolerance
      });

      setPreviewResult(result);
      onProgress(100);
      setIsProcessingLocal(false);

      const baseName = imageData.fileName.replace(/\.[^/.]+$/, '');
      onComplete(result, `${baseName}_nobg.png`);
    } catch (err) {
      setIsProcessingLocal(false);
      onError(err.message || 'Failed to remove background.');
    }
  };

  return (
    <div className="tool-work-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{
            maxWidth: '100%',
            maxHeight: '440px',
            overflow: 'hidden',
            borderRadius: 'var(--radius-sm)',
            background: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 20px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={previewResult ? previewResult.url : imageData.url}
              alt="Background removal preview"
              style={{
                maxWidth: '100%',
                maxHeight: '440px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}>
            <span>Resolution: <strong>{imageData.width} &times; {imageData.height}</strong></span>
            {previewResult && <span style={{ color: '#10b981' }}>Transparent PNG Created</span>}
          </div>
        </div>
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wand2 size={18} color="#06b6d4" />
          <span>Color Keyer Background Remover</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Color to Remove</span>
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {[
              { label: 'White', color: '#ffffff' },
              { label: 'Black', color: '#000000' },
              { label: 'Green Screen', color: '#00ff00' },
              { label: 'Blue Screen', color: '#0000ff' }
            ].map(c => (
              <button
                key={c.color}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: c.color,
                  border: targetHex === c.color ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
                onClick={() => setTargetHex(c.color)}
                title={c.label}
              />
            ))}
            <input
              type="color"
              value={targetHex}
              onChange={(e) => setTargetHex(e.target.value)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent'
              }}
            />
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Color Tolerance</span>
            <span className="setting-value-badge">{tolerance}%</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={5}
            max={85}
            value={tolerance}
            onChange={(e) => setTolerance(parseInt(e.target.value))}
          />
          <small style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            Increase tolerance for JPEG artifacts or uneven lighting.
          </small>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={isProcessingLocal}
            onClick={handleApply}
          >
            <Wand2 size={18} />
            <span>Remove Background & Export PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
