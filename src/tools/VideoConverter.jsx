import React, { useState } from 'react';
import { FileVideo, ArrowRight, AudioLines, Minimize2, Check } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { processVideoWithCanvas, extractAudioFromVideo, formatFileSize } from '../engine/mediaCore';

export default function VideoConverter({
  mediaData,
  thumbnails,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [targetFormat, setTargetFormat] = useState('mp4'); // 'mp4' | 'webm' | 'wav'
  const [qualityPreset, setQualityPreset] = useState('high'); // 'high' | 'medium' | 'small'
  const [keepAudio, setKeepAudio] = useState(true);

  const getBitrate = () => {
    switch (qualityPreset) {
      case 'high': return 3500000;
      case 'medium': return 2000000;
      case 'small': return 1000000;
      default: return 2500000;
    }
  };

  const handleConvert = async () => {
    try {
      if (targetFormat === 'wav') {
        onStartProcessing('Extracting audio track into lossless 16-bit PCM WAV...');
        const result = await extractAudioFromVideo(mediaData.url, onProgress);
        const baseName = mediaData.fileName?.replace(/\.[^/.]+$/, '') || 'audio';
        onComplete(result, `${baseName}.wav`);
        return;
      }

      onStartProcessing(`Converting video to ${targetFormat.toUpperCase()} in browser memory...`);
      const result = await processVideoWithCanvas({
        videoUrl: mediaData.url,
        startTime: 0,
        endTime: mediaData.duration,
        targetBitrate: getBitrate(),
        targetFormat,
        audioMuted: !keepAudio,
        onProgress
      });

      const baseName = mediaData.fileName?.replace(/\.[^/.]+$/, '') || 'video';
      onComplete(result, `${baseName}_converted.${targetFormat}`);
    } catch (err) {
      onError(err.message || 'Video conversion failed.');
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
          <FileVideo size={18} color="#06b6d4" />
          <span>Format & Quality</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Target Output Format</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { id: 'mp4', label: 'MP4', sub: 'Universal' },
              { id: 'webm', label: 'WebM', sub: 'Modern Web' },
              { id: 'wav', label: 'WAV', sub: 'Audio Only' }
            ].map(f => (
              <button
                key={f.id}
                className={`btn ${targetFormat === f.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.82rem', padding: '10px 4px', flexDirection: 'column', gap: '2px' }}
                onClick={() => setTargetFormat(f.id)}
              >
                <strong>{f.label}</strong>
                <small style={{ opacity: 0.75, fontSize: '0.7rem' }}>{f.sub}</small>
              </button>
            ))}
          </div>
        </div>

        {targetFormat !== 'wav' && (
          <>
            <div className="setting-group">
              <label className="setting-label">
                <span>Quality & Bitrate Preset</span>
              </label>
              <div className="filter-presets">
                {[
                  { id: 'high', label: 'High Quality (3.5 Mbps)' },
                  { id: 'medium', label: 'Balanced (2.0 Mbps)' },
                  { id: 'small', label: 'Compact / Web (1.0 Mbps)' }
                ].map(p => (
                  <button
                    key={p.id}
                    className={`filter-preset-pill ${qualityPreset === p.id ? 'active' : ''}`}
                    onClick={() => setQualityPreset(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                <span>Audio Stream</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn ${keepAudio ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.82rem' }}
                  onClick={() => setKeepAudio(true)}
                >
                  Keep Audio Track
                </button>
                <button
                  className={`btn ${!keepAudio ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.82rem' }}
                  onClick={() => setKeepAudio(false)}
                >
                  Remove Audio (Mute)
                </button>
              </div>
            </div>
          </>
        )}

        <div style={{
          background: 'var(--bg-input)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Input File Size:</span>
            <span>{formatFileSize(mediaData.fileSize)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Original Format:</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>{mediaData.fileType || 'video/mp4'}</strong>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleConvert}
          >
            <ArrowRight size={18} />
            <span>Convert to {targetFormat.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

