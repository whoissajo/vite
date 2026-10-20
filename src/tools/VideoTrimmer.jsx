import React, { useState } from 'react';
import { Scissors, Download, RefreshCw, Clock } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { processVideoWithCanvas, formatTimecode } from '../engine/mediaCore';

export default function VideoTrimmer({
  mediaData,
  thumbnails,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(mediaData.duration || 5);
  const [outputFormat, setOutputFormat] = useState('mp4');

  const trimmedDuration = Math.max(0.1, endTime - startTime);

  const handleTrim = async () => {
    try {
      onStartProcessing('Trimming video clip in browser...');
      const result = await processVideoWithCanvas({
        videoUrl: mediaData.url,
        startTime,
        endTime,
        targetFormat: outputFormat,
        onProgress
      });
      onComplete(result, `trimmed_${mediaData.fileName || 'video'}.${outputFormat}`);
    } catch (err) {
      onError(err.message || 'Failed to trim video.');
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
          onRangeChange={(start, end) => {
            setStartTime(start);
            setEndTime(end);
          }}
          thumbnails={thumbnails}
          showTrimHandles={true}
        />
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scissors size={18} color="#06b6d4" />
          <span>Trimming Options</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Trim Range</span>
            <span className="setting-value-badge">
              {formatTimecode(startTime)} &rarr; {formatTimecode(endTime)}
            </span>
          </label>
          <div style={{
            background: 'var(--bg-input)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}>
            <Clock size={16} color="#06b6d4" />
            <span>Output Duration: <strong style={{ color: 'var(--text-main)' }}>{trimmedDuration.toFixed(1)}s</strong></span>
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Output Container</span>
          </label>
          <select
            className="form-select"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
          >
            <option value="mp4">MP4 (H.264/AAC - Universal Compatibility)</option>
            <option value="webm">WebM (VP9/Opus - Modern Web)</option>
          </select>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleTrim}
          >
            <Scissors size={18} />
            <span>Trim & Export Video</span>
          </button>
        </div>
      </div>
    </div>
  );
}
