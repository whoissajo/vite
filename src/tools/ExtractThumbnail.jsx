import React, { useState } from 'react';
import { Camera, Download, Image as ImageIcon, Grid } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { extractTimelineThumbnails } from '../engine/mediaCore';

export default function ExtractThumbnail({
  mediaData,
  thumbnails,
  onComplete,
  onError
}) {
  const [gallery, setGallery] = useState(thumbnails || []);
  const [intervalSec, setIntervalSec] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateGallery = async () => {
    try {
      setIsGenerating(true);
      const count = Math.min(24, Math.max(4, Math.round(mediaData.duration / intervalSec)));
      const thumbs = await extractTimelineThumbnails(mediaData.url, mediaData.duration, count);
      setGallery(thumbs);
    } catch (err) {
      onError('Failed to extract gallery thumbnails.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadThumbnail = (dataUrl, index) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `frame_${index + 1}_${mediaData.fileName || 'video'}.jpg`;
    a.click();
  };

  return (
    <div className="tool-work-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <VideoPlayerWithTimeline
          videoUrl={mediaData.url}
          duration={mediaData.duration}
          thumbnails={thumbnails}
          showTrimHandles={false}
        />

        {gallery.length > 0 && (
          <div className="glass-panel">
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Grid size={18} color="#06b6d4" />
              <span>Extracted Frame Gallery ({gallery.length} frames)</span>
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px',
              maxHeight: '360px',
              overflowY: 'auto'
            }}>
              {gallery.map((thumb, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    background: '#000',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleDownloadThumbnail(thumb.dataUrl, idx)}
                  title="Click to download frame"
                >
                  <img src={thumb.dataUrl} alt={`frame-${idx}`} style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                  <div style={{
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    color: '#fff',
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{thumb.time.toFixed(1)}s</span>
                    <Download size={12} color="#06b6d4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={18} color="#06b6d4" />
          <span>Thumbnail Extractor</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Interval Step</span>
            <span className="setting-value-badge">Every {intervalSec}s</span>
          </label>
          <select
            className="form-select"
            value={intervalSec}
            onChange={(e) => setIntervalSec(parseFloat(e.target.value))}
          >
            <option value="1">Every 1 second</option>
            <option value="2">Every 2 seconds</option>
            <option value="5">Every 5 seconds</option>
            <option value="10">Every 10 seconds</option>
          </select>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={isGenerating}
            onClick={handleGenerateGallery}
          >
            <Camera size={18} />
            <span>{isGenerating ? 'Extracting Frames...' : 'Extract Thumbnail Gallery'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
