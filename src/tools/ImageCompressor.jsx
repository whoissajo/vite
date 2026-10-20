import React, { useState } from 'react';
import { Minimize2, Download, HardDrive } from 'lucide-react';
import { convertImageFormat } from '../engine/imageCore';
import { formatFileSize } from '../engine/mediaCore';

export default function ImageCompressor({
  imageData,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [quality, setQuality] = useState(0.75);
  const [maxWidth, setMaxWidth] = useState(imageData.width || 1600);
  const [format, setFormat] = useState('jpeg');

  const handleCompress = async () => {
    try {
      onStartProcessing('Compressing image in browser memory...');
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
            <span>Dimensions: <strong>{imageData.width} &times; {imageData.height}</strong></span>
            <span>Current Size: <strong>{formatFileSize(imageData.fileSize)}</strong></span>
          </div>
        </div>
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Minimize2 size={18} color="#06b6d4" />
          <span>Compression Settings</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Compression Level ({Math.round(quality * 100)}%)</span>
            <span className="setting-value-badge">
              {quality <= 0.6 ? 'High Compression' : quality <= 0.8 ? 'Balanced' : 'Low Compression'}
            </span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={10}
            max={95}
            value={Math.round(quality * 100)}
            onChange={(e) => setQuality(parseInt(e.target.value) / 100)}
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
              JPG (Best)
            </button>
            <button
              className={`btn ${format === 'webp' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setFormat('webp')}
            >
              WebP (Modern)
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Max Width</span>
            <span className="setting-value-badge">{maxWidth}px</span>
          </label>
          <select
            className="form-select"
            value={maxWidth}
            onChange={(e) => setMaxWidth(parseInt(e.target.value))}
          >
            <option value={imageData.width}>Original ({imageData.width}px)</option>
            <option value={1920}>1920px (Full HD)</option>
            <option value={1280}>1280px (HD 720p)</option>
            <option value={800}>800px (Medium)</option>
          </select>
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
