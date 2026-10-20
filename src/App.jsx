import React, { useState, useEffect } from 'react';
import Sidebar, { TOOL_CATEGORIES } from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FileDropzone from './components/FileDropzone';
import ProcessingModal from './components/ProcessingModal';

// Tools
import VideoTrimmer from './tools/VideoTrimmer';
import VideoCompressor from './tools/VideoCompressor';
import VideoColorAdjust from './tools/VideoColorAdjust';
import VideoTransform from './tools/VideoTransform';
import VideoWatermark from './tools/VideoWatermark';
import AudioExtractor from './tools/AudioExtractor';
import ExtractThumbnail from './tools/ExtractThumbnail';
import VideoSpeedAndReverse from './tools/VideoSpeedAndReverse';
import VideoToGif from './tools/VideoToGif';

import {
  loadVideoMetadata,
  extractTimelineThumbnails,
  generateSampleVideo,
  formatFileSize,
  formatTimecode
} from './engine/mediaCore';

import { FileVideo, RefreshCw, XCircle, CheckCircle } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeTool, setActiveTool] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active loaded media
  const [mediaData, setMediaData] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [processResult, setProcessResult] = useState(null);
  const [outputFileName, setOutputFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync theme attribute to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleFileSelect = async (file) => {
    try {
      setIsLoadingMedia(true);
      setErrorMessage('');
      const data = await loadVideoMetadata(file);
      setMediaData(data);

      // Auto-extract timeline thumbnails in background
      extractTimelineThumbnails(data.url, data.duration, 10)
        .then(thumbs => setThumbnails(thumbs))
        .catch(() => {});

      // If user dropped file from dashboard, navigate to trimmer as default
      if (activeTool === 'dashboard') {
        setActiveTool('trimmer');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not load video file.');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setIsLoadingMedia(true);
      setErrorMessage('');
      const sampleFile = await generateSampleVideo();
      await handleFileSelect(sampleFile);
    } catch (err) {
      setErrorMessage('Failed to generate sample video.');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleStartProcessing = (status = 'Processing media in browser...') => {
    setIsProcessing(true);
    setProgress(0);
    setStatusText(status);
    setProcessResult(null);
  };

  const handleProgress = (percent) => {
    setProgress(percent);
  };

  const handleComplete = (result, filename) => {
    setProcessResult(result);
    setOutputFileName(filename);
    setProgress(100);
    setStatusText('Complete!');
  };

  const handleError = (msg) => {
    setIsProcessing(false);
    setErrorMessage(msg);
  };

  const handleDownload = () => {
    if (!processResult || !processResult.url) return;
    const a = document.createElement('a');
    a.href = processResult.url;
    a.download = outputFileName || 'videokit_output.mp4';
    a.click();
  };

  const handleCloseModal = () => {
    setIsProcessing(false);
    setProcessResult(null);
  };

  // Find active tool metadata
  let activeToolMeta = null;
  for (const cat of TOOL_CATEGORIES) {
    const found = cat.tools.find(t => t.id === activeTool);
    if (found) {
      activeToolMeta = found;
      break;
    }
  }

  // Render current tool interface
  const renderToolComponent = () => {
    if (!mediaData) {
      return (
        <FileDropzone
          onFileSelected={handleFileSelect}
          onLoadSample={handleLoadSample}
          label={`Upload a video to use ${activeToolMeta?.name || 'this tool'}`}
        />
      );
    }

    const commonProps = {
      mediaData,
      thumbnails,
      onStartProcessing: handleStartProcessing,
      onProgress: handleProgress,
      onComplete: handleComplete,
      onError: handleError
    };

    switch (activeTool) {
      case 'trimmer':
        return <VideoTrimmer {...commonProps} />;
      case 'compressor':
        return <VideoCompressor {...commonProps} />;
      case 'color-adjust':
        return <VideoColorAdjust {...commonProps} />;
      case 'rotator':
        return <VideoTransform {...commonProps} defaultMode="rotate" />;
      case 'flipper':
      case 'cropper':
      case 'resizer':
        return <VideoTransform {...commonProps} defaultMode="crop" />;
      case 'watermark':
        return <VideoWatermark {...commonProps} />;
      case 'audio-extractor':
        return <AudioExtractor {...commonProps} mode="extract" />;
      case 'audio-remover':
        return <AudioExtractor {...commonProps} mode="mute" />;
      case 'bg-music':
        return <AudioExtractor {...commonProps} mode="bg-music" />;
      case 'thumbnail':
        return <ExtractThumbnail {...commonProps} />;
      case 'speed':
        return <VideoSpeedAndReverse {...commonProps} defaultMode="speed" />;
      case 'reverser':
        return <VideoSpeedAndReverse {...commonProps} defaultMode="reverser" />;
      case 'video-to-gif':
        return <VideoToGif {...commonProps} />;
      case 'converter':
        return <VideoTrimmer {...commonProps} />; // Trimmer with format selector
      default:
        return <VideoTrimmer {...commonProps} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="main-wrapper">
        <Header
          activeToolName={activeToolMeta?.name || 'Dashboard'}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onLoadSampleVideo={handleLoadSample}
          isProcessing={isProcessing || isLoadingMedia}
        />

        <main className="page-body">
          {errorMessage && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              padding: '12px 18px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <XCircle size={18} />
                <span>{errorMessage}</span>
              </div>
              <button
                className="icon-btn"
                onClick={() => setErrorMessage('')}
                style={{ width: '28px', height: '28px' }}
              >
                &times;
              </button>
            </div>
          )}

          {activeTool === 'dashboard' ? (
            <Dashboard
              onSelectTool={setActiveTool}
              onFileSelected={handleFileSelect}
              onLoadSample={handleLoadSample}
            />
          ) : (
            <div>
              {/* Tool Header Banner */}
              <div className="tool-header-banner">
                <div className="tool-title-row">
                  <div>
                    <h2 className="tool-title">
                      {activeToolMeta?.icon && (
                        <div className="media-badge-icon" style={{ width: '36px', height: '36px' }}>
                          <activeToolMeta.icon size={20} />
                        </div>
                      )}
                      <span>{activeToolMeta?.name}</span>
                    </h2>
                    <p className="tool-desc">{activeToolMeta?.desc}</p>
                  </div>

                  {mediaData && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setMediaData(null)}
                      title="Upload or pick a different video"
                    >
                      <RefreshCw size={14} />
                      <span>Change Video</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Media File Card */}
              {mediaData && (
                <div className="loaded-media-card">
                  <div className="media-file-meta">
                    <div className="media-badge-icon">
                      <FileVideo size={22} />
                    </div>
                    <div>
                      <div className="file-name" title={mediaData.fileName}>{mediaData.fileName}</div>
                      <div className="file-details">
                        <span>{mediaData.width}x{mediaData.height}</span>
                        <span>&bull;</span>
                        <span>{formatTimecode(mediaData.duration)}</span>
                        <span>&bull;</span>
                        <span>{formatFileSize(mediaData.fileSize)}</span>
                      </div>
                    </div>
                  </div>

                  <span className="tool-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    Loaded in RAM
                  </span>
                </div>
              )}

              {/* Tool Workspace */}
              {renderToolComponent()}
            </div>
          )}
        </main>
      </div>

      <ProcessingModal
        isOpen={isProcessing}
        progress={progress}
        status={statusText}
        result={processResult}
        originalSize={mediaData?.fileSize || 0}
        onClose={handleCloseModal}
        onDownload={handleDownload}
      />
    </div>
  );
}
