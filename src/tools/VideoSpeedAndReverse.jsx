import React, { useState } from 'react';
import { Gauge, RotateCcw, AlertTriangle } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { processVideoWithCanvas, getOptimalMimeType, formatFileSize } from '../engine/mediaCore';

/**
 * Reverse a video by extracting all frames into an array and replaying them backwards
 * via Canvas + MediaRecorder. This is a true frame-by-frame reversal in browser.
 */
async function reverseVideoInBrowser(videoUrl, duration, { onProgress }) {
  return new Promise(async (resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = rej;
      });

      const W = video.videoWidth;
      const H = video.videoHeight;
      const fps = 24; // frame rate for extraction
      const totalFrames = Math.round(duration * fps);

      onProgress(5);

      // Step 1: Extract all frames by seeking forward
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = W;
      frameCanvas.height = H;
      const fCtx = frameCanvas.getContext('2d');

      // Store frames as ImageData
      const frames = [];
      const timeStep = duration / Math.max(1, totalFrames);

      for (let i = 0; i < totalFrames; i++) {
        video.currentTime = i * timeStep;
        await new Promise((res) => { video.onseeked = res; });
        fCtx.drawImage(video, 0, 0, W, H);
        frames.push(fCtx.getImageData(0, 0, W, H));
        onProgress(Math.round(5 + ((i / totalFrames) * 50)));
      }

      onProgress(55);

      // Step 2: Play frames in reverse order via MediaRecorder
      const outCanvas = document.createElement('canvas');
      outCanvas.width = W;
      outCanvas.height = H;
      const oCtx = outCanvas.getContext('2d');

      const stream = outCanvas.captureStream(fps);
      const mimeType = getOptimalMimeType('mp4');
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 3000000
      });

      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };

      const recordedPromise = new Promise((res) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          res({
            blob,
            url: URL.createObjectURL(blob),
            size: blob.size,
            duration,
            width: W,
            height: H,
            mimeType
          });
        };
      });

      recorder.start(100);

      // Draw frames in reverse order with correct timing
      const frameDelayMs = 1000 / fps;
      for (let i = frames.length - 1; i >= 0; i--) {
        oCtx.putImageData(frames[i], 0, 0);
        onProgress(Math.round(55 + ((frames.length - 1 - i) / frames.length) * 44));
        await new Promise((r) => setTimeout(r, frameDelayMs));
      }

      onProgress(99);
      recorder.stop();

      const result = await recordedPromise;
      onProgress(100);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

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

  // Approximate memory estimate for reversal (3 bytes per pixel per frame at 24fps)
  const reversalMemEstMB = Math.round(
    (mediaData.width * mediaData.height * 3 * Math.round(mediaData.duration * 24)) / (1024 * 1024)
  );

  const handleApply = async () => {
    try {
      if (isReverse) {
        onStartProcessing('Extracting & reversing frames in browser RAM... (may take a moment for long videos)');
        const result = await reverseVideoInBrowser(mediaData.url, mediaData.duration, {
          onProgress
        });
        onComplete(result, `reversed_${mediaData.fileName || 'video.mp4'}`);
      } else {
        onStartProcessing(`Changing video speed to ${speed}x...`);
        const result = await processVideoWithCanvas({
          videoUrl: mediaData.url,
          startTime: 0,
          endTime: mediaData.duration,
          playbackRate: speed,
          targetFormat: 'mp4',
          onProgress
        });
        onComplete(result, `speed_${speed}x_${mediaData.fileName || 'video.mp4'}`);
      }
    } catch (err) {
      onError(err.message || 'Failed to modify video.');
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
          <span>Speed &amp; Direction</span>
        </h4>

        {/* Mode Toggle */}
        <div className="setting-group">
          <label className="setting-label">
            <span>Mode</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${!isReverse ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setIsReverse(false)}
            >
              <Gauge size={15} />
              <span>Change Speed</span>
            </button>
            <button
              className={`btn ${isReverse ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setIsReverse(true)}
            >
              <RotateCcw size={15} />
              <span>Reverse Video</span>
            </button>
          </div>
        </div>

        {!isReverse && (
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
            <div style={{
              background: 'var(--bg-input)',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginTop: '12px'
            }}>
              <div>Original: <strong style={{ color: 'var(--text-main)' }}>{mediaData.duration.toFixed(1)}s</strong></div>
              <div style={{ marginTop: '4px' }}>
                New Duration: <strong style={{ color: 'var(--accent-cyan)' }}>{(mediaData.duration / speed).toFixed(1)}s</strong>
              </div>
            </div>
          </div>
        )}

        {isReverse && (
          <div className="setting-group">
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.84rem',
              color: '#fbbf24'
            }}>
              <AlertTriangle size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
              <div>
                <strong>Frame-by-Frame Reversal</strong><br />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.80rem' }}>
                  Every frame is extracted into RAM then played backwards — true reversal.
                  Est. memory usage: ~<strong style={{ color: '#fbbf24' }}>{reversalMemEstMB} MB</strong>.
                  Best for clips under 30s. Longer videos may be slow.
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleApply}
          >
            {isReverse ? <RotateCcw size={18} /> : <Gauge size={18} />}
            <span>{isReverse ? 'Reverse & Export Video' : `Apply ${speed}x Speed & Export`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
