import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Sliders, CheckCircle2 } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { formatTimecode, formatFileSize } from '../engine/mediaCore';
import { GifWriter } from '../engine/gifEncoder';

export default function VideoToGif({
  mediaData,
  thumbnails,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(mediaData.duration || 4, 4)); // default to max 4s for responsive encoding
  const [fps, setFps] = useState(10); // 10fps is standard for GIFs
  const [gifWidth, setGifWidth] = useState(360);

  const clipDuration = Math.max(0.5, endTime - startTime);

  const handleExportGif = async () => {
    try {
      onStartProcessing('Extracting frames and encoding animated GIF in browser...');
      const video = document.createElement('video');
      video.src = mediaData.url;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = rej;
      });

      const totalFrames = Math.round(clipDuration * fps);
      const aspect = (video.videoWidth || 1280) / (video.videoHeight || 720);
      const gifHeight = Math.round(gifWidth / aspect);

      const canvas = document.createElement('canvas');
      canvas.width = gifWidth;
      canvas.height = gifHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const gifWriter = new GifWriter(gifWidth, gifHeight);
      const timeStep = clipDuration / Math.max(1, totalFrames);
      const delayMs = Math.round(1000 / fps);

      for (let i = 0; i < totalFrames; i++) {
        const targetTime = startTime + i * timeStep;
        video.currentTime = Math.min(mediaData.duration - 0.01, targetTime);
        await new Promise((r) => { video.onseeked = r; });

        ctx.drawImage(video, 0, 0, gifWidth, gifHeight);
        gifWriter.addFrame(ctx, gifWidth, gifHeight, delayMs);

        const pct = Math.round(((i + 1) / totalFrames) * 85);
        onProgress(pct);
      }

      onProgress(90);
      // Build the binary GIF blob
      const gifBlob = gifWriter.buildBlob();
      onProgress(100);

      const gifUrl = URL.createObjectURL(gifBlob);
      const result = {
        blob: gifBlob,
        url: gifUrl,
        size: gifBlob.size,
        duration: clipDuration,
        width: gifWidth,
        height: gifHeight,
        mimeType: 'image/gif'
      };

      const baseName = mediaData.fileName?.replace(/\.[^/.]+$/, '') || 'clip';
      onComplete(result, `${baseName}_animated.gif`);
    } catch (err) {
      onError(err.message || 'Failed to generate GIF.');
    }
  };

  return (
    <div className="tool-work-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <VideoPlayerWithTimeline
          videoUrl={mediaData.url}
          duration={mediaData.duration}
          startTime={startTime}
          endTime={endTime}
          onRangeChange={(s, e) => {
            setStartTime(s);
            setEndTime(e);
          }}
          thumbnails={thumbnails}
          showTrimHandles={true}
        />
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={18} color="#06b6d4" />
          <span>GIF Generator Settings</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Clip Range</span>
            <span className="setting-value-badge">
              {formatTimecode(startTime)} &rarr; {formatTimecode(endTime)} ({clipDuration.toFixed(1)}s)
            </span>
          </label>
          <small style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
            Recommended: 1 to 4 seconds for fast in-browser GIF encoding and compact file size.
          </small>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Resolution (Width)</span>
          </label>
          <select
            className="form-select"
            value={gifWidth}
            onChange={(e) => setGifWidth(parseInt(e.target.value))}
          >
            <option value="240">240px (Ultra-Compact - Fast)</option>
            <option value="360">360px (Standard Medium - Recommended)</option>
            <option value="480">480px (Sharp HD GIF)</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Frame Rate</span>
            <span className="setting-value-badge">{fps} FPS</span>
          </label>
          <div className="filter-presets">
            {[8, 10, 12, 15].map((f) => (
              <button
                key={f}
                className={`filter-preset-pill ${fps === f ? 'active' : ''}`}
                onClick={() => setFps(f)}
              >
                {f} FPS
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-input)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Estimated Frames:</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>{Math.round(clipDuration * fps)} frames</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Format:</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>True GIF89a Animated Image</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleExportGif}
          >
            <ImageIcon size={18} />
            <span>Encode &amp; Download GIF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
