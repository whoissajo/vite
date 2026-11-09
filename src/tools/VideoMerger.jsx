import React, { useState } from 'react';
import { Layers, Plus, Trash2, ArrowUp, ArrowDown, Download, Film, Sparkles, CheckCircle } from 'lucide-react';
import { mergeVideosWithCanvas, formatTimecode, formatFileSize, loadVideoMetadata } from '../engine/mediaCore';

export default function VideoMerger({
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [videoClips, setVideoClips] = useState([]);
  const [resolution, setResolution] = useState('720p');
  const [format, setFormat] = useState('mp4');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const handleFilesAdded = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        setIsLoadingFiles(true);
        const newFiles = Array.from(e.target.files);
        const loadedList = [];

        for (const file of newFiles) {
          const meta = await loadVideoMetadata(file);
          loadedList.push({
            id: Math.random().toString(36).substring(7),
            file,
            name: file.name,
            size: file.size,
            duration: meta.duration,
            width: meta.width,
            height: meta.height,
            url: meta.url
          });
        }

        setVideoClips(prev => [...prev, ...loadedList]);
      } catch (err) {
        onError('Failed to inspect one or more video files.');
      } finally {
        setIsLoadingFiles(false);
      }
    }
  };

  const removeClip = (id) => {
    setVideoClips(prev => prev.filter(c => c.id !== id));
  };

  const moveClip = (index, delta) => {
    const newIdx = index + delta;
    if (newIdx < 0 || newIdx >= videoClips.length) return;
    const copy = [...videoClips];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setVideoClips(copy);
  };

  const getTargetDims = () => {
    if (resolution === '1080p') return { width: 1920, height: 1080 };
    if (resolution === '720p') return { width: 1280, height: 720 };
    if (videoClips.length > 0) {
      return { width: videoClips[0].width || 1280, height: videoClips[0].height || 720 };
    }
    return { width: 1280, height: 720 };
  };

  const totalDuration = videoClips.reduce((acc, c) => acc + (c.duration || 0), 0);
  const totalOriginalSize = videoClips.reduce((acc, c) => acc + (c.size || 0), 0);

  const handleMerge = async () => {
    if (videoClips.length < 2) {
      onError('Please add at least 2 video clips to merge.');
      return;
    }

    try {
      onStartProcessing(`Merging ${videoClips.length} clips into one continuous video in browser...`);
      const dims = getTargetDims();

      const result = await mergeVideosWithCanvas({
        videoFiles: videoClips.map(c => c.file),
        targetWidth: dims.width,
        targetHeight: dims.height,
        targetFormat: format,
        onProgress
      });

      onComplete(result, `merged_${videoClips.length}_clips.${format}`);
    } catch (err) {
      onError(err.message || 'Failed to merge video clips.');
    }
  };

  return (
    <div className="tool-work-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>
              Video Sequence ({videoClips.length} clips)
            </h4>

            <label className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 12px', cursor: 'pointer' }}>
              <Plus size={14} />
              <span>Add Videos</span>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={handleFilesAdded}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {videoClips.length === 0 ? (
            <label
              style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '48px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div className="dropzone-icon-circle" style={{ width: '48px', height: '48px', margin: 0 }}>
                <Layers size={24} />
              </div>
              <span style={{ fontWeight: 600 }}>Click or Drag & Drop Multiple Videos to Merge</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Combines clips in exact order with synchronized audio • 100% Client-Side
              </span>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={handleFilesAdded}
                style={{ display: 'none' }}
              />
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {videoClips.map((clip, idx) => (
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
                    <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.85rem', width: '22px' }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{clip.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span>{clip.width} &times; {clip.height}</span>
                        <span>&bull;</span>
                        <span>{formatTimecode(clip.duration)}</span>
                        <span>&bull;</span>
                        <span>{formatFileSize(clip.size)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="icon-btn"
                      style={{ width: '30px', height: '30px' }}
                      disabled={idx === 0}
                      onClick={() => moveClip(idx, -1)}
                      title="Move clip earlier"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      style={{ width: '30px', height: '30px' }}
                      disabled={idx === videoClips.length - 1}
                      onClick={() => moveClip(idx, 1)}
                      title="Move clip later"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      style={{ width: '30px', height: '30px', color: '#f43f5e' }}
                      onClick={() => removeClip(clip.id)}
                      title="Remove clip"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="#06b6d4" />
          <span>Merger Settings</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Target Resolution</span>
          </label>
          <select
            className="form-select"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          >
            <option value="720p">720p HD (1280 &times; 720) - Fast & Recommended</option>
            <option value="1080p">1080p Full HD (1920 &times; 1080)</option>
            <option value="first">Match 1st Clip Resolution</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Output Container Format</span>
          </label>
          <select
            className="form-select"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="mp4">MP4 (Universal Video)</option>
            <option value="webm">WebM (VP9/Opus)</option>
          </select>
        </div>

        <div style={{
          background: 'var(--bg-input)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Merged Length:</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>{formatTimecode(totalDuration)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Input Size:</span>
            <span>{formatFileSize(totalOriginalSize)}</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={videoClips.length < 2}
            onClick={handleMerge}
          >
            <Layers size={18} />
            <span>Merge {videoClips.length} Clips & Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}

