import React, { useState } from 'react';
import { Image as ImageIcon, ArrowRight, Download, Sliders, Check, Sparkles } from 'lucide-react';
import { convertImageFormat } from '../engine/imageCore';
import { formatFileSize } from '../engine/mediaCore';

export default function ImageConverter({
  imageData,
  defaultTargetFormat = 'jpeg', // 'jpeg' | 'png' | 'webp'
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [targetFormat, setTargetFormat] = useState(defaultTargetFormat);
  const [quality, setQuality] = useState(0.92);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [maxWidth, setMaxWidth] = useState(imageData.width || 1920);

  const isConvertingToJpg = targetFormat === 'jpeg';

  const handleConvert = async () => {
    try {
      onStartProcessing(`Converting ${imageData.fileName} to ${targetFormat.toUpperCase()} in browser...`);
      onProgress(30);

      const result = await convertImageFormat({
        imageSource: imageData.imageElement,
        targetFormat,
        quality,
        backgroundColor: bgColor,
        maxWidth: maxWidth !== imageData.width ? maxWidth : null
      });

      onProgress(100);
      const baseName = imageData.fileName.replace(/\.[^/.]+$/, '');
      const outExt = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
      onComplete(result, `${baseName}_converted.${outExt}`);
    } catch (err) {
      onError(err.message || 'Image conversion failed.');
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
              src={imageData.url}
              alt="Source preview"
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
            <span>Original: <strong>{imageData.width} &times; {imageData.height}</strong></span>
            <span>Size: <strong>{formatFileSize(imageData.fileSize)}</strong></span>
            <span>Format: <strong>{imageData.fileType?.split('/')[1]?.toUpperCase()}</strong></span>
          </div>
        </div>
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={18} color="#06b6d4" />
          <span>Conversion Options</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Target Format</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { id: 'jpeg', label: 'JPG / JPEG' },
              { id: 'png', label: 'PNG' },
              { id: 'webp', label: 'WebP' }
            ].map(f => (
              <button
                key={f.id}
                className={`btn ${targetFormat === f.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '10px 4px' }}
                onClick={() => setTargetFormat(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {targetFormat !== 'png' && (
          <div className="setting-group">
            <label className="setting-label">
              <span>Quality ({Math.round(quality * 100)}%)</span>
              <span className="setting-value-badge">
                {quality >= 0.9 ? 'Maximum' : quality >= 0.75 ? 'Balanced' : 'Compact'}
              </span>
            </label>
            <input
              type="range"
              className="range-slider"
              min={10}
              max={100}
              value={Math.round(quality * 100)}
              onChange={(e) => setQuality(parseInt(e.target.value) / 100)}
            />
          </div>
        )}

        {isConvertingToJpg && (
          <div className="setting-group">
            <label className="setting-label">
              <span>Transparent Fill Color</span>
              <small style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>JPEG has no alpha</small>
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {['#ffffff', '#000000', '#f1f5f9', '#3b82f6'].map(c => (
                <button
                  key={c}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: c,
                    border: bgColor === c ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setBgColor(c)}
                  title={`Fill with ${c}`}
                />
              ))}
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
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
        )}

        <div className="setting-group">
          <label className="setting-label">
            <span>Resize Max Width</span>
            <span className="setting-value-badge">{maxWidth}px</span>
          </label>
          <select
            className="form-select"
            value={maxWidth}
            onChange={(e) => setMaxWidth(parseInt(e.target.value))}
          >
            <option value={imageData.width}>Original ({imageData.width}px)</option>
            <option value={1920}>1920px (Full HD)</option>
            <option value={1280}>1280px (HD)</option>
            <option value={800}>800px (Web standard)</option>
            <option value={500}>500px (Compact)</option>
          </select>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleConvert}
          >
            <ArrowRight size={18} />
            <span>Convert to {targetFormat.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
