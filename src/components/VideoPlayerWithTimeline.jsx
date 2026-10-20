import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTimecode } from '../engine/mediaCore';

export default function VideoPlayerWithTimeline({
  videoUrl,
  duration = 0,
  startTime = 0,
  endTime = 0,
  onRangeChange = () => {},
  thumbnails = [],
  filterStyle = '',
  transformStyle = {},
  showTrimHandles = true
}) {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Sync playhead state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (showTrimHandles && endTime > 0 && video.currentTime >= endTime) {
        video.pause();
        setIsPlaying(false);
        video.currentTime = startTime;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [startTime, endTime, showTrimHandles]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (showTrimHandles && (video.currentTime < startTime || video.currentTime >= endTime)) {
        video.currentTime = startTime;
      }
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const stepTime = (delta) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(0, Math.min(duration, video.currentTime + delta));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;

    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const effectiveEnd = endTime > 0 ? endTime : duration;
  const startPercent = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPercent = duration > 0 ? (effectiveEnd / duration) * 100 : 100;
  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="video-preview-wrapper">
      <div className="video-element-container">
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted={isMuted}
          style={{
            filter: filterStyle,
            transform: `scale(${transformStyle.flipH ? -1 : 1}, ${transformStyle.flipV ? -1 : 1}) rotate(${transformStyle.rotation || 0}deg)`,
            transition: 'filter 0.15s ease, transform 0.2s ease'
          }}
          onClick={togglePlay}
        />
      </div>

      <div className="timeline-scrubber-box">
        {/* Visual Track Rail with Thumbnails */}
        <div
          ref={timelineRef}
          className="timeline-track-rail"
          onClick={handleTimelineClick}
          title="Click to seek"
        >
          {thumbnails.length > 0 && (
            <div className="timeline-thumbnail-strip">
              {thumbnails.map((t, idx) => (
                <img
                  key={idx}
                  src={t.dataUrl}
                  alt={`thumbnail-${idx}`}
                  className="timeline-thumb"
                />
              ))}
            </div>
          )}

          {/* Active trimmed region */}
          {showTrimHandles && (
            <div
              className="timeline-selection-range"
              style={{
                left: `${startPercent}%`,
                width: `${Math.max(0, endPercent - startPercent)}%`
              }}
            />
          )}

          {/* Current Playhead */}
          <div
            className="timeline-playhead"
            style={{ left: `${playheadPercent}%` }}
          />
        </div>

        {/* Dual Handle Range Controls for Trimming */}
        {showTrimHandles && duration > 0 && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                <span>Start Point</span>
                <span className="setting-value-badge">{formatTimecode(startTime)}</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min={0}
                max={Math.max(0, effectiveEnd - 0.1)}
                step={0.1}
                value={startTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onRangeChange(val, effectiveEnd);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                <span>End Point</span>
                <span className="setting-value-badge">{formatTimecode(effectiveEnd)}</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min={startTime + 0.1}
                max={duration}
                step={0.1}
                value={effectiveEnd}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onRangeChange(startTime, val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom Playback Bar */}
        <div className="timeline-controls-row">
          <div className="play-controls">
            <button
              className="icon-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              className="icon-btn"
              onClick={() => stepTime(-0.1)}
              title="Step back 0.1s"
              aria-label="Step back 0.1s"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              className="icon-btn"
              onClick={() => stepTime(0.1)}
              title="Step forward 0.1s"
              aria-label="Step forward 0.1s"
            >
              <ChevronRight size={16} />
            </button>

            <button
              className="icon-btn"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = startTime;
                  setCurrentTime(startTime);
                }
              }}
              title="Restart from start point"
            >
              <RotateCcw size={16} />
            </button>

            <button
              className="icon-btn"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="timecode-display">
              {formatTimecode(currentTime)} / {formatTimecode(duration)}
            </span>
            {showTrimHandles && (
              <span className="tool-badge" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                Trimmed: {(effectiveEnd - startTime).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
