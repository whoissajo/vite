import React, { useState } from 'react';
import { Sliders, Sparkles, RefreshCw } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { processVideoWithCanvas } from '../engine/mediaCore';

export default function VideoColorAdjust({
  mediaData,
  thumbnails,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hue: 0,
    invert: 0,
    sepia: 0,
    grayscale: 0,
    blur: 0
  });

  const filterString = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) hue-rotate(${filters.hue}deg) invert(${filters.invert}%) sepia(${filters.sepia}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px)`;

  const applyPreset = (preset) => {
    switch (preset) {
      case 'cinematic':
        setFilters({ brightness: 95, contrast: 125, saturate: 110, hue: 15, invert: 0, sepia: 10, grayscale: 0, blur: 0 });
        break;
      case 'cyberpunk':
        setFilters({ brightness: 105, contrast: 130, saturate: 160, hue: 140, invert: 0, sepia: 0, grayscale: 0, blur: 0 });
        break;
      case 'vintage':
        setFilters({ brightness: 90, contrast: 95, saturate: 85, hue: 0, invert: 0, sepia: 45, grayscale: 0, blur: 0 });
        break;
      case 'noir':
        setFilters({ brightness: 100, contrast: 140, saturate: 0, hue: 0, invert: 0, sepia: 0, grayscale: 100, blur: 0 });
        break;
      case 'vivid':
        setFilters({ brightness: 105, contrast: 115, saturate: 150, hue: 0, invert: 0, sepia: 0, grayscale: 0, blur: 0 });
        break;
      default:
        setFilters({ brightness: 100, contrast: 100, saturate: 100, hue: 0, invert: 0, sepia: 0, grayscale: 0, blur: 0 });
    }
  };

  const handleExport = async () => {
    try {
      onStartProcessing('Applying color adjustments to video...');
      const result = await processVideoWithCanvas({
        videoUrl: mediaData.url,
        startTime: 0,
        endTime: mediaData.duration,
        filters,
        targetFormat: 'mp4',
        onProgress
      });
      onComplete(result, `color_adjusted_${mediaData.fileName || 'video.mp4'}`);
    } catch (err) {
      onError(err.message || 'Failed to adjust video colors.');
    }
  };

  return (
    <div className="tool-work-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <VideoPlayerWithTimeline
          videoUrl={mediaData.url}
          duration={mediaData.duration}
          thumbnails={thumbnails}
          filterStyle={filterString}
          showTrimHandles={false}
        />
      </div>

      <div className="glass-panel settings-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#06b6d4" />
            <span>Color Grading</span>
          </h4>
          <button
            className="icon-btn"
            title="Reset filters"
            onClick={() => applyPreset('default')}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Quick Style Presets</span>
          <div className="filter-presets">
            {['Default', 'Cinematic', 'Cyberpunk', 'Vintage', 'Noir', 'Vivid'].map(p => (
              <button
                key={p}
                className="filter-preset-pill"
                onClick={() => applyPreset(p.toLowerCase())}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Brightness</span>
            <span className="setting-value-badge">{filters.brightness}%</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={20}
            max={200}
            value={filters.brightness}
            onChange={(e) => setFilters({ ...filters, brightness: parseInt(e.target.value) })}
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Contrast</span>
            <span className="setting-value-badge">{filters.contrast}%</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={20}
            max={200}
            value={filters.contrast}
            onChange={(e) => setFilters({ ...filters, contrast: parseInt(e.target.value) })}
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Saturation</span>
            <span className="setting-value-badge">{filters.saturate}%</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={0}
            max={250}
            value={filters.saturate}
            onChange={(e) => setFilters({ ...filters, saturate: parseInt(e.target.value) })}
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Hue Rotate</span>
            <span className="setting-value-badge">{filters.hue}&deg;</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={0}
            max={360}
            value={filters.hue}
            onChange={(e) => setFilters({ ...filters, hue: parseInt(e.target.value) })}
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Sepia Tone</span>
            <span className="setting-value-badge">{filters.sepia}%</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={0}
            max={100}
            value={filters.sepia}
            onChange={(e) => setFilters({ ...filters, sepia: parseInt(e.target.value) })}
          />
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleExport}
          >
            <Sliders size={18} />
            <span>Apply & Export Video</span>
          </button>
        </div>
      </div>
    </div>
  );
}
