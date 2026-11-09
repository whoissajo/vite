import React, { useState } from 'react';
import { RotateCw, FlipHorizontal, FlipVertical, Crop, Maximize2, Sparkles, Check } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { processVideoWithCanvas } from '../engine/mediaCore';

export default function VideoTransform({
  mediaData,
  thumbnails,
  defaultMode = 'rotate', // 'rotate' | 'flip' | 'crop' | 'resize'
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [cropPreset, setCropPreset] = useState('none');
  const [resolution, setResolution] = useState(defaultMode === 'resize' ? '720p' : 'original');

  const rotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const getCropRect = () => {
    const origW = mediaData.width || 1280;
    const origH = mediaData.height || 720;

    if (cropPreset === '16:9') {
      const targetH = Math.round((origW * 9) / 16);
      return { x: 0, y: Math.max(0, Math.round((origH - targetH) / 2)), width: origW, height: Math.min(origH, targetH) };
    }
    if (cropPreset === '9:16') {
      const targetW = Math.round((origH * 9) / 16);
      return { x: Math.max(0, Math.round((origW - targetW) / 2)), y: 0, width: Math.min(origW, targetW), height: origH };
    }
    if (cropPreset === '1:1') {
      const size = Math.min(origW, origH);
      return { x: Math.round((origW - size) / 2), y: Math.round((origH - size) / 2), width: size, height: size };
    }
    if (cropPreset === '4:5') {
      const targetW = Math.round((origH * 4) / 5);
      return { x: Math.max(0, Math.round((origW - targetW) / 2)), y: 0, width: Math.min(origW, targetW), height: origH };
    }
    return null;
  };

  const getResizeDimensions = () => {
    if (resolution === 'original') return null;
    const origW = mediaData.width || 1280;
    const origH = mediaData.height || 720;
    const aspect = origW / origH;

    switch (resolution) {
      case '4k': return { width: Math.round(2160 * aspect), height: 2160 };
      case '1080p': return { width: Math.round(1080 * aspect), height: 1080 };
      case '720p': return { width: Math.round(720 * aspect), height: 720 };
      case '480p': return { width: Math.round(480 * aspect), height: 480 };
      case '360p': return { width: Math.round(360 * aspect), height: 360 };
      default: return null;
    }
  };

  const handleApply = async () => {
    try {
      const modeLabel = defaultMode === 'resize' ? 'Resizing video'
        : defaultMode === 'crop' ? 'Cropping video frame'
        : defaultMode === 'flip' ? 'Mirroring video'
        : 'Transforming video';

      onStartProcessing(`${modeLabel} in browser...`);
      const cropRect = getCropRect();
      const resizeDims = getResizeDimensions();

      const result = await processVideoWithCanvas({
        videoUrl: mediaData.url,
        startTime: 0,
        endTime: mediaData.duration,
        rotation,
        flipH,
        flipV,
        crop: cropRect,
        resize: resizeDims,
        targetFormat: 'mp4',
        onProgress
      });

      const prefix = defaultMode === 'resize' ? `resized_${resolution}`
        : defaultMode === 'crop' ? `cropped_${cropPreset}`
        : defaultMode === 'flip' ? 'flipped'
        : `rotated_${rotation}deg`;

      onComplete(result, `${prefix}_${mediaData.fileName || 'video.mp4'}`);
    } catch (err) {
      onError(err.message || 'Failed to transform video.');
    }
  };

  const getTitle = () => {
    switch (defaultMode) {
      case 'rotate': return 'Rotate Video';
      case 'flip': return 'Mirror & Flip Video';
      case 'crop': return 'Aspect Ratio Crop';
      case 'resize': return 'Video Resizer & Scaler';
      default: return 'Transform & Orientation';
    }
  };

  const IconComponent = defaultMode === 'crop' ? Crop
    : defaultMode === 'resize' ? Maximize2
    : defaultMode === 'flip' ? FlipHorizontal
    : RotateCw;

  return (
    <div className="tool-work-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <VideoPlayerWithTimeline
          videoUrl={mediaData.url}
          duration={mediaData.duration}
          thumbnails={thumbnails}
          transformStyle={{ rotation, flipH, flipV }}
          showTrimHandles={false}
        />
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconComponent size={18} color="#06b6d4" />
          <span>{getTitle()}</span>
        </h4>

        {/* Rotation */}
        <div className="setting-group">
          <label className="setting-label">
            <span>Rotation ({rotation}&deg;)</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${rotation === 90 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={rotateClockwise}
            >
              <RotateCw size={16} />
              <span>Rotate 90&deg;</span>
            </button>
            <button
              className={`btn ${rotation === 180 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setRotation(180)}
            >
              <span>180&deg;</span>
            </button>
            <button
              className={`btn ${rotation === 0 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setRotation(0)}
            >
              <span>Reset (0&deg;)</span>
            </button>
          </div>
        </div>

        {/* Mirror / Flip */}
        <div className="setting-group">
          <label className="setting-label">
            <span>Mirror / Flip</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${flipH ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setFlipH(!flipH)}
            >
              <FlipHorizontal size={16} />
              <span>Flip Horizontal</span>
            </button>
            <button
              className={`btn ${flipV ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setFlipV(!flipV)}
            >
              <FlipVertical size={16} />
              <span>Flip Vertical</span>
            </button>
          </div>
        </div>

        {/* Aspect Ratio Crop */}
        <div className="setting-group">
          <label className="setting-label">
            <span>Aspect Ratio Crop</span>
          </label>
          <div className="filter-presets">
            {[
              { id: 'none', label: 'Full Frame' },
              { id: '16:9', label: '16:9 (Landscape)' },
              { id: '9:16', label: '9:16 (TikTok/Reels)' },
              { id: '1:1', label: '1:1 (Square)' },
              { id: '4:5', label: '4:5 (Instagram)' }
            ].map((p) => (
              <button
                key={p.id}
                className={`filter-preset-pill ${cropPreset === p.id ? 'active' : ''}`}
                onClick={() => setCropPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution Scaler */}
        <div className="setting-group">
          <label className="setting-label">
            <span>Target Resolution Output</span>
            <span className="setting-value-badge">{resolution.toUpperCase()}</span>
          </label>
          <select
            className="form-select"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          >
            <option value="original">Original ({mediaData.width} &times; {mediaData.height})</option>
            <option value="4k">4K Ultra HD (2160p)</option>
            <option value="1080p">1080p Full HD</option>
            <option value="720p">720p HD (Fast & Web Friendly)</option>
            <option value="480p">480p SD</option>
            <option value="360p">360p Mobile Compact</option>
          </select>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleApply}
          >
            <IconComponent size={18} />
            <span>Apply {getTitle()} &amp; Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
