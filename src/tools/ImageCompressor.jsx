import React, { useState } from 'react';
import { Minimize2, Download, HardDrive, Sparkles, Check } from 'lucide-react';
import { convertImageFormat } from '../engine/imageCore';
import { formatFileSize } from '../engine/mediaCore';

export default function ImageCompressor({
  imageData,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [quality, setQuality] = useState(0.72);
  const [maxWidth, setMaxWidth] = useState(imageData.width || 1600);
  const [format, setFormat] = useState('jpeg');
  const [preset, setPreset] = useState('balanced');

  const applyPreset = (mode) => {
    setPreset(mode);
    if (mode === 'extreme') {
      setQuality(0.50);
      setMaxWidth(Math.min(imageData.width || 1200, 1200));
    } else if (mode === 'balanced') {
      setQuality(0.72);
      setMaxWidth(Math.min(imageData.width || 1600, 1600));
    } else if (mode === 'light') {
      setQuality(0.85);
      setMaxWidth(imageData.width || 1920);
    }
  };

  // Realistic file size reduction estimation
  const downscaleFactor = maxWidth < imageData.width ? Math.pow(maxWidth / imageData.width, 2) : 1;
  const estimatedSizeBytes = Math.max(1024, Math.round(imageData.fileSize * quality * 0.85 * downscaleFactor));
  const estimatedSavedPct = imageData.fileSize > 0
    ? Math.max(5, Math.min(95, Math.round(((imageData.fileSize - estimatedSizeBytes) / imageData.fileSize) * 100)))
    : 0;

  const handleCompress = async () => {
    try {
      onStartProcessing('Compressing image in browser memory with Canvas...');
      onProgress(30);

      const result = await convertImageFormat({
        imageSource: imageData.imageElement,
        targetFormat: format,
        quality,
        maxWidth: maxWidth !== imageData.width ? maxWidth : null
      });

      onProgress(100);
      const baseName = imageData.fileName.replace(/\.[^/.]+$/, '');
      onComplete(result, `compressed_${baseName}.${format === 'jpeg' ? 'jpg' : format}`);
    } catch (err) {
      onError(err.message || 'Image compression failed.');
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
            background: 'var(--bg-input)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={imageData.url}
              alt="Preview"
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
            <span>Original Dimensions: <strong>{imageData.width} &times; {imageData.height}</strong></span>
            <span>Current Size: <strong>{formatFileSize(imageData.fileSize)}</strong></span>
          </div>
        </div>
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Minimize2 size={18} color="#06b6d4" />
          <span>Image Compression Settings</span>
        </h4>

        {/* Presets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <button
            className={`btn ${preset === 'extreme' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '10px 4px', flexDirection: 'column', gap: '2px' }}
            onClick={() => applyPreset('extreme')}
          >
            <span>Extreme</span>
            <small style={{ opacity: 0.85, color: preset === 'extreme' ? '#fff' : '#10b981' }}>~75% smaller</small>
          </button>
          <button
            className={`btn ${preset === 'balanced' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '10px 4px', flexDirection: 'column', gap: '2px' }}
            onClick={() => applyPreset('balanced')}
          >
            <span>Balanced</span>
            <small style={{ opacity: 0.85 }}>Recommended</small>
          </button>
          <button
            className={`btn ${preset === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '10px 4px', flexDirection: 'column', gap: '2px' }}
            onClick={() => applyPreset('light')}
          >
            <span>Light</span>
            <small style={{ opacity: 0.85 }}>~30% smaller</small>
          </button>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Compression Quality ({Math.round(quality * 100)}%)</span>
            <span className="setting-value-badge">
              {quality <= 0.6 ? 'High Compression' : quality <= 0.8 ? 'Balanced' : 'High Fidelity'}
            </span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={10}
            max={95}
            value={Math.round(quality * 100)}
            onChange={(e) => {
              setQuality(parseInt(e.target.value) / 100);
              setPreset('custom');
            }}
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Output Format</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${format === 'jpeg' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setFormat('jpeg')}
            >
              JPG (Standard)
            </button>
            <button
              className={`btn ${format === 'webp' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setFormat('webp')}
            >
              WebP (Ultra Compact)
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Downscale Max Width</span>
            <span className="setting-value-badge">{maxWidth}px</span>
          </label>
          <select
            className="form-select"
            value={maxWidth}
            onChange={(e) => {
              setMaxWidth(parseInt(e.target.value));
              setPreset('custom');
            }}
          >
            <option value={imageData.width}>Original Dimensions ({imageData.width}px)</option>
            <option value={1920}>1920px (Full HD)</option>
            <option value={1280}>1280px (HD 720p)</option>
            <option value={800}>800px (Medium Web)</option>
            <option value={500}>500px (Compact Mobile)</option>
          </select>
        </div>

        {/* Estimated Reduction Stats */}
        <div style={{
          background: 'var(--bg-input)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>Estimated Target Size</span>
            <strong style={{ color: 'var(--accent-cyan)', fontSize: '1rem' }}>~{formatFileSize(estimatedSizeBytes)}</strong>
            <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>
              Save ~{estimatedSavedPct}% space
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>Original</span>
            <span>{formatFileSize(imageData.fileSize)}</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleCompress}
          >
            <Minimize2 size={18} />
            <span>Compress & Save Image</span>
          </button>
        </div>
      </div>
    </div>
  );
}
