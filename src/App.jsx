import React, { useState, useEffect } from 'react';
import Sidebar, { TOOL_CATEGORIES } from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FileDropzone from './components/FileDropzone';
import ProcessingModal from './components/ProcessingModal';

// Video Tools
import VideoTrimmer from './tools/VideoTrimmer';
import VideoCompressor from './tools/VideoCompressor';
import VideoColorAdjust from './tools/VideoColorAdjust';
import VideoTransform from './tools/VideoTransform';
import VideoWatermark from './tools/VideoWatermark';
import AudioExtractor from './tools/AudioExtractor';
import ExtractThumbnail from './tools/ExtractThumbnail';
import VideoSpeedAndReverse from './tools/VideoSpeedAndReverse';
import VideoToGif from './tools/VideoToGif';

// Image & PDF Tools
import ImageConverter from './tools/ImageConverter';
import ImageCompressor from './tools/ImageCompressor';
import ImageBgRemover from './tools/ImageBgRemover';
import PdfToImage from './tools/PdfToImage';
import ImageToPdf from './tools/ImageToPdf';

// Engines
import {
  loadVideoMetadata,
  extractTimelineThumbnails,
  generateSampleVideo,
  formatFileSize,
  formatTimecode
} from './engine/mediaCore';

import {
  loadImageMetadata,
  generateSampleImage
} from './engine/imageCore';

import { FileVideo, Image as ImageIcon, FileText, RefreshCw, XCircle } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeTool, setActiveTool] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active loaded media state
  const [mediaData, setMediaData] = useState(null); // Video
  const [imageData, setImageData] = useState(null); // Image
  const [pdfFile, setPdfFile] = useState(null);     // PDF
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

  // Determine what type of file the active tool expects
  const isImageTool = ['png-to-jpg', 'jpg-to-png', 'image-converter', 'image-compressor', 'image-bg-remover'].includes(activeTool);
  const isPdfTool = activeTool === 'pdf-to-image';
  const isImageToPdfTool = activeTool === 'image-to-pdf';

  const handleFileSelect = async (file) => {
    try {
      setIsLoadingMedia(true);
      setErrorMessage('');

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setPdfFile(file);
        setMediaData(null);
        setImageData(null);
        if (activeTool === 'dashboard') setActiveTool('pdf-to-image');
      } else if (file.type.startsWith('image/')) {
        const data = await loadImageMetadata(file);
        setImageData(data);
        setMediaData(null);
        setPdfFile(null);
        if (activeTool === 'dashboard') setActiveTool('png-to-jpg');
      } else {
        const data = await loadVideoMetadata(file);
        setMediaData(data);
        setImageData(null);
        setPdfFile(null);

        // Auto-extract timeline thumbnails in background
        extractTimelineThumbnails(data.url, data.duration, 10)
          .then(thumbs => setThumbnails(thumbs))
          .catch(() => {});

        if (activeTool === 'dashboard') setActiveTool('trimmer');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not load media file.');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setIsLoadingMedia(true);
      setErrorMessage('');

      if (isImageTool) {
        const sampleImage = await generateSampleImage();
        await handleFileSelect(sampleImage);
      } else {
        const sampleVideo = await generateSampleVideo();
        await handleFileSelect(sampleVideo);
      }
    } catch (err) {
      setErrorMessage('Failed to generate sample media.');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleStartProcessing = (status = 'Processing in browser...') => {
    setIsProcessing(true);
    setProgress(0);
    setStatusText(status);
    setProcessResult(null);
  };

  const handleProgress = (percent) => {
    setProgress(percent);
  };

  const handleComplete = (result, filename) => {
    if (result) {
      setProcessResult(result);
      setOutputFileName(filename);
      setProgress(100);
      setStatusText('Complete!');
    } else {
      setIsProcessing(false);
    }
  };

  const handleError = (msg) => {
    setIsProcessing(false);
    setErrorMessage(msg);
  };

  const handleDownload = () => {
    if (!processResult || !processResult.url) return;
    const a = document.createElement('a');
    a.href = processResult.url;
    a.download = outputFileName || 'videokit_output';
    a.click();
  };

  const handleCloseModal = () => {
    setIsProcessing(false);
    setProcessResult(null);
  };

  const handleClearCurrentMedia = () => {
    setMediaData(null);
    setImageData(null);
    setPdfFile(null);
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
    // Special tool: Images to PDF handles its own multi-upload dropzone
    if (isImageToPdfTool) {
      return (
        <ImageToPdf
          onStartProcessing={handleStartProcessing}
          onProgress={handleProgress}
          onComplete={handleComplete}
          onError={handleError}
        />
      );
    }

    // PDF to Image Tool requires a PDF
    if (isPdfTool) {
      if (!pdfFile) {
        return (
          <FileDropzone
            onFileSelected={handleFileSelect}
            acceptedTypes="application/pdf"
            fileCategory="pdf"
            label="Drop your PDF document here"
          />
        );
      }
      return (
        <PdfToImage
          pdfFile={pdfFile}
          onStartProcessing={handleStartProcessing}
          onProgress={handleProgress}
          onComplete={handleComplete}
          onError={handleError}
        />
      );
    }

    // Image Tools require an Image
    if (isImageTool) {
      if (!imageData) {
        return (
          <FileDropzone
            onFileSelected={handleFileSelect}
            onLoadSample={handleLoadSample}
            acceptedTypes="image/*"
            fileCategory="image"
            label={`Upload a photo to use ${activeToolMeta?.name || 'this image tool'}`}
          />
        );
      }

      const commonImageProps = {
        imageData,
        onStartProcessing: handleStartProcessing,
        onProgress: handleProgress,
        onComplete: handleComplete,
        onError: handleError
      };

      switch (activeTool) {
        case 'png-to-jpg':
          return <ImageConverter {...commonImageProps} defaultTargetFormat="jpeg" />;
        case 'jpg-to-png':
          return <ImageConverter {...commonImageProps} defaultTargetFormat="png" />;
        case 'image-converter':
          return <ImageConverter {...commonImageProps} defaultTargetFormat="webp" />;
        case 'image-compressor':
          return <ImageCompressor {...commonImageProps} />;
        case 'image-bg-remover':
          return <ImageBgRemover {...commonImageProps} />;
        default:
          return <ImageConverter {...commonImageProps} defaultTargetFormat="jpeg" />;
      }
    }

    // Video Tools require a Video
    if (!mediaData) {
      return (
        <FileDropzone
          onFileSelected={handleFileSelect}
          onLoadSample={handleLoadSample}
          acceptedTypes="video/*"
          fileCategory="video"
          label={`Upload a video to use ${activeToolMeta?.name || 'this tool'}`}
        />
      );
    }

    const commonVideoProps = {
      mediaData,
      thumbnails,
      onStartProcessing: handleStartProcessing,
      onProgress: handleProgress,
      onComplete: handleComplete,
      onError: handleError
    };

    switch (activeTool) {
      case 'trimmer':
        return <VideoTrimmer {...commonVideoProps} />;
      case 'compressor':
        return <VideoCompressor {...commonVideoProps} />;
      case 'color-adjust':
        return <VideoColorAdjust {...commonVideoProps} />;
      case 'rotator':
        return <VideoTransform {...commonVideoProps} defaultMode="rotate" />;
      case 'flipper':
      case 'cropper':
      case 'resizer':
        return <VideoTransform {...commonVideoProps} defaultMode="crop" />;
      case 'watermark':
        return <VideoWatermark {...commonVideoProps} />;
      case 'audio-extractor':
        return <AudioExtractor {...commonVideoProps} mode="extract" />;
      case 'audio-remover':
        return <AudioExtractor {...commonVideoProps} mode="mute" />;
      case 'bg-music':
        return <AudioExtractor {...commonVideoProps} mode="bg-music" />;
      case 'thumbnail':
        return <ExtractThumbnail {...commonVideoProps} />;
      case 'speed':
        return <VideoSpeedAndReverse {...commonVideoProps} defaultMode="speed" />;
      case 'reverser':
        return <VideoSpeedAndReverse {...commonVideoProps} defaultMode="reverser" />;
      case 'video-to-gif':
        return <VideoToGif {...commonVideoProps} />;
      case 'converter':
      default:
        return <VideoTrimmer {...commonVideoProps} />;
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

                  {(mediaData || imageData || pdfFile) && (
                    <button
                      className="btn btn-secondary"
                      onClick={handleClearCurrentMedia}
                      title="Upload or pick a different file"
                    >
                      <RefreshCw size={14} />
                      <span>Change File</span>
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

              {imageData && (
                <div className="loaded-media-card">
                  <div className="media-file-meta">
                    <div className="media-badge-icon">
                      <ImageIcon size={22} />
                    </div>
                    <div>
                      <div className="file-name" title={imageData.fileName}>{imageData.fileName}</div>
                      <div className="file-details">
                        <span>{imageData.width}x{imageData.height}</span>
                        <span>&bull;</span>
                        <span>{formatFileSize(imageData.fileSize)}</span>
                        <span>&bull;</span>
                        <span>{imageData.fileType?.split('/')[1]?.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <span className="tool-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    Photo in Memory
                  </span>
                </div>
              )}

              {pdfFile && (
                <div className="loaded-media-card">
                  <div className="media-file-meta">
                    <div className="media-badge-icon">
                      <FileText size={22} />
                    </div>
                    <div>
                      <div className="file-name" title={pdfFile.name}>{pdfFile.name}</div>
                      <div className="file-details">
                        <span>{formatFileSize(pdfFile.size)}</span>
                        <span>&bull;</span>
                        <span>PDF Document</span>
                      </div>
                    </div>
                  </div>
                  <span className="tool-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    PDF in Memory
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
        originalSize={mediaData?.fileSize || imageData?.fileSize || pdfFile?.size || 0}
        onClose={handleCloseModal}
        onDownload={handleDownload}
      />
    </div>
  );
}
