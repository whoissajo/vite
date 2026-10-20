import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Sliders } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { formatTimecode } from '../engine/mediaCore';

export default function VideoToGif({
  mediaData,
  thumbnails,
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(mediaData.duration || 5, 6)); // default to max 6s for crisp GIFs
  const [fps, setFps] = useState(12);
  const [gifWidth, setGifWidth] = useState(480);

  const handleExportGif = async () => {
    try {
      onStartProcessing('Converting video clip to animated GIF in browser...');
      const video = document.createElement('video');
      video.src = mediaData.url;
      video.muted = true;
      video.playsInline = true;

      await new Promise(res => { video.onloadedmetadata = res; });

      const clipDuration = Math.max(0.5, endTime - startTime);
      const totalFrames = Math.round(clipDuration * fps);
      const aspect = video.videoWidth / video.videoHeight;
      const gifHeight = Math.round(gifWidth / aspect);

      const canvas = document.createElement('canvas');
      canvas.width = gifWidth;
      canvas.height = gifHeight;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(fps);
      const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
      const chunks = [];

      recorder.ondataavailable = e => chunks.push(e.data);

      const recordingPromise = new Promise(resolve => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve({
            blob,
            url: URL.createObjectURL(blob),
            size: blob.size,
            duration: clipDuration,
            width: gifWidth,
            height: gifHeight,
            mimeType
          });
        };
      });

      recorder.start();

      const timeStep = clipDuration / totalFrames;
      for (let i = 0; i < totalFrames; i++) {
        const targetTime = startTime + i * timeStep;
        video.currentTime = targetTime;
        await new Promise(r => { video.onseeked = r; });
        ctx.drawImage(video, 0, 0, gifWidth, gifHeight);
        onProgress(Math.round(((i + 1) / totalFrames) * 100));
        await new Promise(r => setTimeout(r, 1000 / fps));
      }

      recorder.stop();
      const result = await recordingPromise;
      onComplete(result, `animated_${mediaData.fileName?.split('.')[0] || 'clip'}.gif`);
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
            <span>Clip Duration</span>
            <span className="setting-value-badge">{(endTime - startTime).toFixed(1)}s</span>
          </label>
          <small style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
            Recommended: 2 - 6 seconds for optimal GIF size and smooth loading.
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
            <option value="320">320px (Compact - Social Sharing)</option>
            <option value="480">480px (Standard Medium)</option>
            <option value="640">640px (High Resolution)</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Frame Rate (FPS)</span>
            <span className="setting-value-badge">{fps} FPS</span>
          </label>
          <div className="filter-presets">
            {[10, 12, 15, 20].map((f) => (
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

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleExportGif}
          >
            <ImageIcon size={18} />
            <span>Generate & Download GIF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
