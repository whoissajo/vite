import React, { useState } from 'react';
import { Type, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { processVideoWithCanvas } from '../engine/mediaCore';

export default function VideoWatermark({
  mediaData,
  thumbnails,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [watermarkText, setWatermarkText] = useState('© VideoKit');
  const [fontSize, setFontSize] = useState(28);
  const [textColor, setTextColor] = useState('#ffffff');
  const [position, setPosition] = useState('bottom-right');
  const [opacity, setOpacity] = useState(85);

  const handleApply = async () => {
    try {
      onStartProcessing('Burning watermark onto video frames...');
      const result = await processVideoWithCanvas({
        videoUrl: mediaData.url,
        startTime: 0,
        endTime: mediaData.duration,
        watermark: {
          text: watermarkText,
          fontSize,
          color: textColor,
          position,
          opacity
        },
        targetFormat: 'mp4',
        onProgress
      });

      onComplete(result, `watermarked_${mediaData.fileName || 'video.mp4'}`);
    } catch (err) {
      onError(err.message || 'Failed to add watermark.');
    }
  };

  return (
    <div className="tool-work-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <VideoPlayerWithTimeline
            videoUrl={mediaData.url}
            duration={mediaData.duration}
            thumbnails={thumbnails}
            showTrimHandles={false}
          />
          {/* Live Watermark Overlay Tag */}
          <div
            style={{
              position: 'absolute',
              top: position.includes('top') ? '24px' : 'auto',
              bottom: position.includes('bottom') ? '110px' : 'auto',
              left: position === 'top-left' || position === 'bottom-left' ? '24px' : position === 'center' ? '50%' : 'auto',
              right: position === 'top-right' || position === 'bottom-right' ? '24px' : 'auto',
              transform: position === 'center' ? 'translate(-50%, -50%)' : 'none',
              color: textColor,
              fontSize: `${fontSize}px`,
              opacity: opacity / 100,
              fontWeight: 700,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            {watermarkText}
          </div>
        </div>
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Type size={18} color="#06b6d4" />
          <span>Watermark Settings</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Watermark Text</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Enter brand name or copyright"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Position</span>
          </label>
          <select
            className="form-select"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="bottom-right">Bottom Right (Standard)</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
            <option value="center">Centered (Conceal/Protection)</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Font Size</span>
            <span className="setting-value-badge">{fontSize}px</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={14}
            max={72}
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Opacity</span>
            <span className="setting-value-badge">{opacity}%</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={10}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(parseInt(e.target.value))}
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Color</span>
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['#ffffff', '#06b6d4', '#facc15', '#f43f5e', '#000000'].map((c) => (
              <button
                key={c}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: c,
                  border: textColor === c ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
                onClick={() => setTextColor(c)}
              />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleApply}
          >
            <Type size={18} />
            <span>Apply Watermark & Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
