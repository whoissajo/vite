import React, { useState } from 'react';
import { AudioLines, VolumeX, Music, Download, Upload } from 'lucide-react';
import VideoPlayerWithTimeline from '../components/VideoPlayerWithTimeline';
import { extractAudioFromVideo, processVideoWithCanvas } from '../engine/mediaCore';

export default function AudioExtractor({
  mediaData,
  thumbnails,
  mode = 'extract', // 'extract' | 'mute' | 'bg-music'
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [activeMode, setActiveMode] = useState(mode);
  const [bgAudioFile, setBgAudioFile] = useState(null);
  const [bgAudioUrl, setBgAudioUrl] = useState(null);
  const [bgVolume, setBgVolume] = useState(50);

  const handleBgAudioSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBgAudioFile(file);
      setBgAudioUrl(URL.createObjectURL(file));
    }
  };

  const handleExtractAudio = async () => {
    try {
      onStartProcessing('Extracting audio track into 16-bit PCM WAV...');
      const result = await extractAudioFromVideo(mediaData.url, onProgress);
      onComplete(result, `${mediaData.fileName?.split('.')[0] || 'audio'}.wav`);
    } catch (err) {
      onError(err.message || 'Failed to extract audio.');
    }
  };

  const handleMuteVideo = async () => {
    try {
      onStartProcessing('Removing audio stream from video...');
      const result = await processVideoWithCanvas({
        videoUrl: mediaData.url,
        startTime: 0,
        endTime: mediaData.duration,
        audioMuted: true,
        targetFormat: 'mp4',
        onProgress
      });
      onComplete(result, `muted_${mediaData.fileName || 'video.mp4'}`);
    } catch (err) {
      onError(err.message || 'Failed to mute video.');
    }
  };

  const handleAddMusic = async () => {
    if (!bgAudioUrl) {
      onError('Please upload an audio music track first.');
      return;
    }
    try {
      onStartProcessing('Mixing background audio soundtrack...');
      const result = await processVideoWithCanvas({
        videoUrl: mediaData.url,
        startTime: 0,
        endTime: mediaData.duration,
        backgroundAudioUrl: bgAudioUrl,
        backgroundAudioVolume: bgVolume / 100,
        targetFormat: 'mp4',
        onProgress
      });
      onComplete(result, `with_music_${mediaData.fileName || 'video.mp4'}`);
    } catch (err) {
      onError(err.message || 'Failed to mix background music.');
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
          <AudioLines size={18} color="#06b6d4" />
          <span>Audio Processing</span>
        </h4>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeMode === 'extract' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '0.8rem', padding: '10px 4px' }}
            onClick={() => setActiveMode('extract')}
          >
            Extract Audio
          </button>
          <button
            className={`btn ${activeMode === 'mute' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '0.8rem', padding: '10px 4px' }}
            onClick={() => setActiveMode('mute')}
          >
            Mute Audio
          </button>
          <button
            className={`btn ${activeMode === 'bg-music' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '0.8rem', padding: '10px 4px' }}
            onClick={() => setActiveMode('bg-music')}
          >
            Add Music
          </button>
        </div>

        {activeMode === 'extract' && (
          <div className="setting-group" style={{ marginTop: '8px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Extracts the internal soundtrack from the video into a studio-grade <strong>16-bit Stereo PCM WAV</strong> audio file without recompression artifacts.
            </p>
            <div style={{ marginTop: '24px' }}>
              <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }} onClick={handleExtractAudio}>
                <AudioLines size={18} />
                <span>Extract Audio to WAV</span>
              </button>
            </div>
          </div>
        )}

        {activeMode === 'mute' && (
          <div className="setting-group" style={{ marginTop: '8px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Completely strips all audio tracks from this video clip, creating a 100% silent video.
            </p>
            <div style={{ marginTop: '24px' }}>
              <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }} onClick={handleMuteVideo}>
                <VolumeX size={18} />
                <span>Mute Video & Export</span>
              </button>
            </div>
          </div>
        )}

        {activeMode === 'bg-music' && (
          <div className="setting-group" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="setting-label">
                <span>Select Music Track (MP3/WAV)</span>
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleBgAudioSelect}
                className="form-input"
              />
              {bgAudioFile && (
                <small style={{ color: 'var(--accent-cyan)', display: 'block', marginTop: '4px' }}>
                  Loaded: {bgAudioFile.name}
                </small>
              )}
            </div>

            <div className="setting-group">
              <label className="setting-label">
                <span>Music Volume</span>
                <span className="setting-value-badge">{bgVolume}%</span>
              </label>
              <input
                type="range"
                className="range-slider"
                min={5}
                max={100}
                value={bgVolume}
                onChange={(e) => setBgVolume(parseInt(e.target.value))}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }} onClick={handleAddMusic}>
                <Music size={18} />
                <span>Mix Music & Export</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
