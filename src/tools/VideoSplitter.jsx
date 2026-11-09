import React, { useState } from 'react';
import { SplitSquareVertical, Download, Clock, Scissors, CheckCircle, Play } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { processVideoWithCanvas, formatTimecode, formatFileSize } from '../engine/mediaCore';

export default function VideoSplitter({
  mediaData,
  thumbnails,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [splitMode, setSplitMode] = useState('stories'); // 'stories' | 'equal' | 'custom'
  const [segmentLength, setSegmentLength] = useState(30); // 30s WhatsApp / Instagram Story
  const [partsCount, setPartsCount] = useState(3);
  const [splitResults, setSplitResults] = useState([]);
  const [isSplitting, setIsSplitting] = useState(false);

  const duration = mediaData.duration || 10;

  // Calculate segment intervals based on mode
  const getSegments = () => {
    const list = [];
    if (splitMode === 'stories' || splitMode === 'custom') {
      const step = Math.max(1, segmentLength);
      let cur = 0;
      let idx = 1;
      while (cur < duration) {
        const end = Math.min(duration, cur + step);
        list.push({ id: idx, start: cur, end, duration: end - cur });
        cur = end;
        idx++;
      }
    } else {
      // Equal parts
      const count = Math.max(2, partsCount);
      const step = duration / count;
      for (let i = 0; i < count; i++) {
        const start = i * step;
        const end = Math.min(duration, (i + 1) * step);
        list.push({ id: i + 1, start, end, duration: end - start });
      }
    }
    return list;
  };

  const segments = getSegments();

  const handleSplitAll = async () => {
    try {
      setIsSplitting(true);
      onStartProcessing(`Splitting video into ${segments.length} clips in browser...`);

      const results = [];
      const baseName = mediaData.fileName?.replace(/\.[^/.]+$/, '') || 'clip';

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const stepProgress = (pct) => {
          const overall = Math.round(((i + pct / 100) / segments.length) * 100);
          onProgress(overall);
        };

        const result = await processVideoWithCanvas({
          videoUrl: mediaData.url,
          startTime: seg.start,
          endTime: seg.end,
          targetFormat: 'mp4',
          onProgress: stepProgress
        });

        results.push({
          ...seg,
          result,
          fileName: `${baseName}_part_${seg.id}.mp4`
        });
      }

      setSplitResults(results);
      setIsSplitting(false);
      onProgress(100);

      const totalSize = results.reduce((acc, c) => acc + (c.result?.size || 0), 0);
      onComplete({
        url: results[0].result.url,
        size: totalSize,
        mimeType: results[0].result.mimeType,
        isMultiple: true,
        count: results.length
      }, results[0].fileName);
    } catch (err) {
      setIsSplitting(false);
      onError(err.message || 'Failed to split video.');
    }
  };

  const handleDownloadClip = (clip) => {
    const a = document.createElement('a');
    a.href = clip.result.url;
    a.download = clip.fileName;
    a.click();
  };

  const handleDownloadAllClips = () => {
    splitResults.forEach((clip, idx) => {
      setTimeout(() => {
        handleDownloadClip(clip);
      }, idx * 300);
    });
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

        {/* Split Results Section */}
        {splitResults.length > 0 && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#10b981" />
                <span>Generated Clips ({splitResults.length} Files)</span>
              </h4>

              <button
                className="btn btn-primary"
                onClick={handleDownloadAllClips}
                style={{ fontSize: '0.85rem', padding: '8px 14px' }}
              >
                <Download size={15} />
                <span>Download All ({splitResults.length})</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {splitResults.map((clip) => (
                <div
                  key={clip.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="media-badge-icon" style={{ width: '36px', height: '36px' }}>
                      <Scissors size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{clip.fileName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>{formatTimecode(clip.start)} &rarr; {formatTimecode(clip.end)}</span>
                        <span> &bull; </span>
                        <span>{clip.duration.toFixed(1)}s</span>
                        <span> &bull; </span>
                        <span>{formatFileSize(clip.result.size)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                    onClick={() => handleDownloadClip(clip)}
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SplitSquareVertical size={18} color="#06b6d4" />
          <span>Split Configuration</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Split Method</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <button
              className={`btn ${splitMode === 'stories' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '10px 4px' }}
              onClick={() => setSplitMode('stories')}
            >
              Social Stories
            </button>
            <button
              className={`btn ${splitMode === 'equal' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '10px 4px' }}
              onClick={() => setSplitMode('equal')}
            >
              Equal Parts
            </button>
          </div>
        </div>

        {splitMode === 'stories' && (
          <div className="setting-group">
            <label className="setting-label">
              <span>Preset Clip Length</span>
            </label>
            <div className="filter-presets">
              {[
                { label: '15s (IG Stories)', val: 15 },
                { label: '30s (WhatsApp)', val: 30 },
                { label: '60s (TikTok/Shorts)', val: 60 }
              ].map(opt => (
                <button
                  key={opt.val}
                  className={`filter-preset-pill ${segmentLength === opt.val ? 'active' : ''}`}
                  onClick={() => setSegmentLength(opt.val)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {splitMode === 'equal' && (
          <div className="setting-group">
            <label className="setting-label">
              <span>Number of Parts</span>
              <span className="setting-value-badge">{partsCount} Clips</span>
            </label>
            <input
              type="range"
              className="range-slider"
              min={2}
              max={10}
              value={partsCount}
              onChange={(e) => setPartsCount(parseInt(e.target.value))}
            />
          </div>
        )}

        <div style={{
          background: 'var(--bg-input)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Segments:</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>{segments.length} clips</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Average Clip Length:</span>
            <span>~{(duration / segments.length).toFixed(1)}s each</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={isSplitting}
            onClick={handleSplitAll}
          >
            <Scissors size={18} />
            <span>{isSplitting ? 'Splitting Video...' : `Split into ${segments.length} Clips`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

