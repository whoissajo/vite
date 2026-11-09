import React, { useState } from 'react';
import { Film, Plus, Trash2, ArrowUp, ArrowDown, Music, Play, Sparkles } from 'lucide-react';
import { createVideoFromImages, formatFileSize } from '../engine/mediaCore';

export default function PhotosToVideo({
  onStartProcessing,
  onProgress,
  onComplete,
  onError
}) {
  const [images, setImages] = useState([]);
  const [secondsPerSlide, setSecondsPerSlide] = useState(3);
  const [resolution, setResolution] = useState('720p');
  const [bgMusicFile, setBgMusicFile] = useState(null);
  const [bgMusicUrl, setBgMusicUrl] = useState(null);
  const [format, setFormat] = useState('mp4');

  const handleFilesAdded = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const mapped = newFiles.map(f => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        id: Math.random().toString(36).substring(7)
      }));
      setImages(prev => [...prev, ...mapped]);
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const moveImage = (index, delta) => {
    const newIdx = index + delta;
    if (newIdx < 0 || newIdx >= images.length) return;
    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setImages(copy);
  };

  const handleMusicSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBgMusicFile(file);
      setBgMusicUrl(URL.createObjectURL(file));
    }
  };

  const getDimensions = () => {
    switch (resolution) {
      case '1080p': return { width: 1920, height: 1080 };
      case '720p': return { width: 1280, height: 720 };
      case 'vertical': return { width: 720, height: 1280 }; // 9:16 Reels/TikTok
      case 'square': return { width: 800, height: 800 }; // 1:1
      default: return { width: 1280, height: 720 };
    }
  };

  const handleCreateVideo = async () => {
    if (images.length === 0) {
      onError('Please add at least 1 photo to create a video slideshow.');
      return;
    }

    try {
      onStartProcessing(`Compiling ${images.length} photos into HD video in browser...`);
      const dims = getDimensions();

      const result = await createVideoFromImages({
        imageFiles: images.map(item => item.file),
        secondsPerSlide,
        targetWidth: dims.width,
        targetHeight: dims.height,
        backgroundAudioUrl: bgMusicUrl,
        targetFormat: format,
        onProgress
      });

      onComplete(result, `photos_slideshow.${format}`);
    } catch (err) {
      onError(err.message || 'Failed to render photos to video.');
    }
  };

  const totalDuration = images.length * secondsPerSlide;

  return (
    <div className="tool-work-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>
              Photo Slides ({images.length} photos)
            </h4>

            <label className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 12px', cursor: 'pointer' }}>
              <Plus size={14} />
              <span>Add Photos</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesAdded}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {images.length === 0 ? (
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
                <Film size={24} />
              </div>
              <span style={{ fontWeight: 600 }}>Click or Drag & Drop Photos to Build Video</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Combine any JPG, PNG, or WebP images into a cinematic video with crossfade
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesAdded}
                style={{ display: 'none' }}
              />
            </label>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '12px',
              maxHeight: '440px',
              overflowY: 'auto',
              padding: '4px'
            }}>
              {images.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    background: '#000',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    style={{ width: '100%', height: '95px', objectFit: 'cover' }}
                  />
                  <div style={{
                    padding: '6px',
                    background: 'var(--bg-input)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      #{idx + 1}
                    </span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <button
                        className="icon-btn"
                        style={{ width: '22px', height: '22px' }}
                        disabled={idx === 0}
                        onClick={() => moveImage(idx, -1)}
                        title="Move Left"
                      >
                        <ArrowUp size={11} style={{ transform: 'rotate(-90deg)' }} />
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: '22px', height: '22px' }}
                        disabled={idx === images.length - 1}
                        onClick={() => moveImage(idx, 1)}
                        title="Move Right"
                      >
                        <ArrowDown size={11} style={{ transform: 'rotate(-90deg)' }} />
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: '22px', height: '22px', color: '#f43f5e' }}
                        onClick={() => removeImage(item.id)}
                        title="Remove"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel settings-panel">
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Film size={18} color="#06b6d4" />
          <span>Slideshow Settings</span>
        </h4>

        <div className="setting-group">
          <label className="setting-label">
            <span>Duration per Slide</span>
            <span className="setting-value-badge">{secondsPerSlide}s</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={1}
            max={8}
            step={0.5}
            value={secondsPerSlide}
            onChange={(e) => setSecondsPerSlide(parseFloat(e.target.value))}
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Video Resolution</span>
          </label>
          <select
            className="form-select"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          >
            <option value="720p">720p HD (1280 &times; 720) - Fast</option>
            <option value="1080p">1080p Full HD (1920 &times; 1080)</option>
            <option value="vertical">9:16 Vertical (720 &times; 1280) - TikTok / Reels</option>
            <option value="square">1:1 Square (800 &times; 800) - Instagram</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>Background Music (Optional)</span>
          </label>
          <label className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', cursor: 'pointer', fontSize: '0.82rem' }}>
            <Music size={15} color="#06b6d4" />
            <span className="truncate">{bgMusicFile ? bgMusicFile.name : 'Add audio track (MP3/WAV)...'}</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleMusicSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div style={{
          background: 'var(--bg-input)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Estimated Duration:</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>{totalDuration}s</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Transition:</span>
            <span>Smooth Crossfade</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={images.length === 0}
            onClick={handleCreateVideo}
          >
            <Film size={18} />
            <span>Create & Export Video</span>
          </button>
        </div>
      </div>
    </div>
  );
}

