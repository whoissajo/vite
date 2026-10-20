import React, { useState } from 'react';
import { RotateCw, FlipHorizontal, FlipVertical, Crop, Maximize2 } from 'lucide-react';
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
  const [resolution, setResolution] = useState('original');

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

  const handleApply = async () => {
    try {
      onStartProcessing('Applying transforms to video...');
      const cropRect = getCropRect();

      const result = await processVideoWithCanvas({
        videoUrl: mediaData.url,
        startTime: 0,
        endTime: mediaData.duration,
        rotation,
        flipH,
        flipV,
        crop: cropRect,
        targetFormat: 'mp4',
        onProgress
      });

      onComplete(result, `transformed_${mediaData.fileName || 'video.mp4'}`);
    } catch (err) {
      onError(err.message || 'Failed to transform video.');
    }
  };

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
          <RotateCw size={18} color="#06b6d4" />
          <span>Transform & Orientation</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Rotation ({rotation}&deg;)</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={rotateClockwise}>
              <RotateCw size={16} />
              <span>Rotate 90&deg;</span>
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRotation(180)}>
              <span>180&deg;</span>
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRotation(0)}>
              <span>Reset</span>
            </button>
          </div>
        </div>

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

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleApply}
          >
            <Maximize2 size={18} />
            <span>Apply Transform & Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
