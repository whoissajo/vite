import React, { useState } from 'react';
import { FileText, Plus, Trash2, ArrowUp, ArrowDown, Download, Layers } from 'lucide-react';
import { convertImagesToPdf } from '../engine/imageCore';
import { formatFileSize } from '../engine/mediaCore';

export default function ImageToPdf({
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [images, setImages] = useState([]);
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState(10);

  const handleFilesAdded = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const mapped = newFiles.map(f => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        id: Math.random().toString(36).substring(7)
      }));
      setImages(prev => [...prev, ...mapped]);
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const moveImage = (index, delta) => {
    const newIdx = index + delta;
    if (newIdx < 0 || newIdx >= images.length) return;
    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setImages(copy);
  };

  const handleCreatePdf = async () => {
    if (images.length === 0) {
      onError('Please add at least one image to create a PDF.');
      return;
    }

    try {
      onStartProcessing(`Compiling ${images.length} images into PDF in browser...`);
      const filesOnly = images.map(img => img.file);

      const result = await convertImagesToPdf(filesOnly, {
        pageSize,
        orientation,
        margin,
        onProgress
      });

      onComplete(result, 'converted_images.pdf');
    } catch (err) {
      onError(err.message || 'Failed to create PDF.');
    }
  };

  return (
    <div className="tool-work-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>
              Image Pages ({images.length})
            </h4>

            <label className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 12px', cursor: 'pointer' }}>
              <Plus size={14} />
              <span>Add Images</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesAdded}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {images.length === 0 ? (
            <label
              style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '40px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div className="dropzone-icon-circle" style={{ width: '48px', height: '48px', margin: 0 }}>
                <Plus size={24} />
              </div>
              <span style={{ fontWeight: 600 }}>Click or Drag & Drop Photos to add to PDF</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Supports PNG, JPG, JPEG, and WebP</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesAdded}
                style={{ display: 'none' }}
              />
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {images.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-dim)', fontSize: '0.82rem', width: '20px' }}>
                      #{idx + 1}
                    </span>
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.file.name}</div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatFileSize(item.file.size)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="icon-btn"
                      style={{ width: '30px', height: '30px' }}
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, -1)}
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      style={{ width: '30px', height: '30px' }}
                      disabled={idx === images.length - 1}
                      onClick={() => moveImage(idx, 1)}
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      style={{ width: '30px', height: '30px', color: '#f43f5e' }}
                      onClick={() => removeImage(item.id)}
                      title="Delete page"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#06b6d4" />
          <span>PDF Document Settings</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Page Format</span>
          </label>
          <select
            className="form-select"
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
          >
            <option value="a4">A4 (Standard 210 &times; 297 mm)</option>
            <option value="letter">US Letter (8.5 &times; 11 in)</option>
            <option value="legal">US Legal</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Orientation</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${orientation === 'portrait' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setOrientation('portrait')}
            >
              Portrait
            </button>
            <button
              className={`btn ${orientation === 'landscape' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setOrientation('landscape')}
            >
              Landscape
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Page Margins</span>
          </label>
          <select
            className="form-select"
            value={margin}
            onChange={(e) => setMargin(parseInt(e.target.value))}
          >
            <option value="0">Zero Margins (Edge-to-Edge)</option>
            <option value="10">Standard Margin (10mm)</option>
            <option value="20">Wide Margin (20mm)</option>
          </select>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={images.length === 0}
            onClick={handleCreatePdf}
          >
            <FileText size={18} />
            <span>Generate & Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
