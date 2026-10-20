import React, { useState } from 'react';
import { Gauge, RotateCcw, FastForward, Play } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { processVideoWithCanvas } from '../engine/mediaCore';

export default function VideoSpeedAndReverse({
  mediaData,
  thumbnails,
  defaultMode = 'speed', // 'speed' | 'reverser'
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [speed, setSpeed] = useState(1.5);
  const [isReverse, setIsReverse] = useState(defaultMode === 'reverser');

  const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 4.0];

  const handleApply = async () => {
    try {
      onStartProcessing(isReverse ? 'Rendering video in reverse...' : `Changing video speed to ${speed}x...`);
      const result = await processVideoWithCanvas({
        videoUrl: mediaData.url,
        startTime: 0,
        endTime: mediaData.duration,
        playbackRate: speed,
        targetFormat: 'mp4',
        onProgress
      });

      onComplete(result, `${isReverse ? 'reversed' : 'speed_' + speed + 'x'}_${mediaData.fileName || 'video.mp4'}`);
    } catch (err) {
      onError(err.message || 'Failed to modify video playback speed.');
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
          <Gauge size={18} color="#06b6d4" />
          <span>Playback Speed & Direction</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Speed Multiplier</span>
            <span className="setting-value-badge">{speed}x</span>
          </label>
          <div className="filter-presets">
            {speedOptions.map((s) => (
              <button
                key={s}
                className={`filter-preset-pill ${speed === s ? 'active' : ''}`}
                onClick={() => setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-input)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div>Original Duration: <strong style={{ color: 'var(--text-main)' }}>{mediaData.duration.toFixed(1)}s</strong></div>
          <div style={{ marginTop: '4px' }}>
            New Duration: <strong style={{ color: 'var(--accent-cyan)' }}>{(mediaData.duration / speed).toFixed(1)}s</strong>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleApply}
          >
            <Gauge size={18} />
            <span>Apply Speed & Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
