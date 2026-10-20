import React, { useState } from 'react';
import { Minimize2, Gauge, HardDrive, CheckCircle } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { processVideoWithCanvas, formatFileSize } from '../engine/mediaCore';

export default function VideoCompressor({
  mediaData,
  thumbnails,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [preset, setPreset] = useState('balanced');
  const [resolution, setResolution] = useState('720p');
  const [bitrateKbps, setBitrateKbps] = useState(1800);

  const applyPreset = (mode) => {
    setPreset(mode);
    if (mode === 'extreme') {
      setResolution('480p');
      setBitrateKbps(900);
    } else if (mode === 'balanced') {
      setResolution('720p');
      setBitrateKbps(1800);
    } else if (mode === 'high') {
      setResolution('1080p');
      setBitrateKbps(3200);
    }
  };

  const getTargetDimensions = () => {
    const origW = mediaData.width || 1280;
    const origH = mediaData.height || 720;
    const aspect = origW / origH;

    if (resolution === '1080p') return { width: Math.round(1080 * aspect), height: 1080 };
    if (resolution === '720p') return { width: Math.round(720 * aspect), height: 720 };
    if (resolution === '480p') return { width: Math.round(480 * aspect), height: 480 };
    return { width: origW, height: origH };
  };

  // Estimated output size = (bitrate * duration) / 8
  const estimatedSizeBytes = Math.round((bitrateKbps * 1000 * (mediaData.duration || 10)) / 8);

  const handleCompress = async () => {
    try {
      onStartProcessing('Compressing video with browser hardware acceleration...');
      const targetDims = getTargetDimensions();

      const result = await processVideoWithCanvas({
        videoUrl: mediaData.url,
        startTime: 0,
        endTime: mediaData.duration,
        resize: targetDims,
        targetBitrate: bitrateKbps * 1000,
        targetFormat: 'mp4',
        onProgress
      });

      onComplete(result, `compressed_${mediaData.fileName || 'video.mp4'}`);
    } catch (err) {
      onError(err.message || 'Failed to compress video.');
    }
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
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Minimize2 size={18} color="#06b6d4" />
          <span>Compression Presets</span>
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <button
            className={`btn ${preset === 'extreme' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '10px 4px', flexDirection: 'column', gap: '4px' }}
            onClick={() => applyPreset('extreme')}
          >
            <span>Extreme</span>
            <small style={{ opacity: 0.8 }}>~70% smaller</small>
          </button>
          <button
            className={`btn ${preset === 'balanced' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '10px 4px', flexDirection: 'column', gap: '4px' }}
            onClick={() => applyPreset('balanced')}
          >
            <span>Balanced</span>
            <small style={{ opacity: 0.8 }}>Recommended</small>
          </button>
          <button
            className={`btn ${preset === 'high' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '10px 4px', flexDirection: 'column', gap: '4px' }}
            onClick={() => applyPreset('high')}
          >
            <span>High Quality</span>
            <small style={{ opacity: 0.8 }}>~30% smaller</small>
          </button>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Target Resolution</span>
          </label>
          <select
            className="form-select"
            value={resolution}
            onChange={(e) => {
              setResolution(e.target.value);
              setPreset('custom');
            }}
          >
            <option value="original">Original ({mediaData.width}x{mediaData.height})</option>
            <option value="1080p">1080p Full HD</option>
            <option value="720p">720p HD</option>
            <option value="480p">480p SD (Compact)</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Bitrate Quality</span>
            <span className="setting-value-badge">{bitrateKbps} kbps</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={400}
            max={6000}
            step={100}
            value={bitrateKbps}
            onChange={(e) => {
              setBitrateKbps(parseInt(e.target.value));
              setPreset('custom');
            }}
          />
        </div>

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
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>Estimated Output Size</span>
            <strong style={{ color: 'var(--accent-cyan)', fontSize: '1rem' }}>~{formatFileSize(estimatedSizeBytes)}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>Original</span>
            <span>{formatFileSize(mediaData.fileSize)}</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleCompress}
          >
            <Minimize2 size={18} />
            <span>Compress Video</span>
          </button>
        </div>
      </div>
    </div>
  );
}
