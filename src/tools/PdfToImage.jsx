import React, { useState } from 'react';
import { FileText, Download, Layers, Sparkles, CheckCircle2, Grid } from 'lucide-react';
import { renderPdfToImages } from '../engine/imageCore';
import { formatFileSize } from '../engine/mediaCore';

export default function PdfToImage({
  pdfFile,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [format, setFormat] = useState('png');
  const [scale, setScale] = useState(2.0); // 200% resolution for crisp documents
  const [renderedPages, setRenderedPages] = useState([]);
  const [isRendering, setIsRendering] = useState(false);

  const handleConvertPdf = async () => {
    try {
      setIsRendering(true);
      onStartProcessing(`Rendering PDF pages to ${format.toUpperCase()} in browser...`);

      const result = await renderPdfToImages(pdfFile, {
        scale,
        format,
        quality: 0.95,
        onProgress
      });

      setRenderedPages(result.pages);
      setIsRendering(false);
      onComplete(null, null); // Close modal, show gallery directly
    } catch (err) {
      setIsRendering(false);
      onError(err.message || 'Failed to render PDF pages.');
    }
  };

  const handleDownloadSingle = (page) => {
    const a = document.createElement('a');
    a.href = page.dataUrl;
    a.download = page.fileName;
    a.click();
  };

  const handleDownloadAll = () => {
    renderedPages.forEach((p, idx) => {
      setTimeout(() => {
        handleDownloadSingle(p);
      }, idx * 250); // slight delay to prevent browser download throttling
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="media-badge-icon">
            <FileText size={24} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{pdfFile.name}</h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>{formatFileSize(pdfFile.size)}</span>
              <span> &bull; </span>
              <span>Ready for high-DPI rasterization</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Format:</span>
            <select
              className="form-select"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={{ width: '100px', padding: '6px 10px' }}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Resolution:</span>
            <select
              className="form-select"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{ width: '130px', padding: '6px 10px' }}
            >
              <option value="1.0">Standard (100%)</option>
              <option value="1.5">Sharp (150%)</option>
              <option value="2.0">Crisp HD (200%)</option>
              <option value="3.0">Ultra Print (300%)</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleConvertPdf}
            disabled={isRendering}
          >
            <Layers size={16} />
            <span>{isRendering ? 'Rendering Pages...' : 'Convert to Images'}</span>
          </button>
        </div>
      </div>

      {renderedPages.length > 0 && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Grid size={18} color="#06b6d4" />
              <span>Extracted Pages ({renderedPages.length} Pages)</span>
            </h4>

            <button
              className="btn btn-primary"
              onClick={handleDownloadAll}
              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            >
              <Download size={15} />
              <span>Download All ({renderedPages.length})</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            {renderedPages.map((page) => (
              <div
                key={page.pageNumber}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform var(--transition-fast)'
                }}
              >
                <div style={{
                  padding: '12px',
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '260px'
                }}>
                  <img
                    src={page.dataUrl}
                    alt={`Page ${page.pageNumber}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '260px',
                      objectFit: 'contain',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}
                  />
                </div>

                <div style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-card)'
                }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Page {page.pageNumber}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>
                      {page.width}&times;{page.height} &bull; {formatFileSize(page.size)}
                    </span>
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    onClick={() => handleDownloadSingle(page)}
                    title="Download this page image"
                  >
                    <Download size={14} />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
