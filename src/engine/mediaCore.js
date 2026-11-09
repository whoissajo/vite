/**
 * VideoKit Pure Browser-Native Media Processing Engine
 * Zero server uploads | 100% Client-side | Hardware-accelerated WebCodecs & Canvas
 */

/**
 * Format time in seconds to mm:ss.ms
 */
export function formatTimecode(seconds = 0) {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
}

/**
 * Format bytes to readable string (KB, MB, GB)
 */
export function formatFileSize(bytes = 0) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Load video metadata from a File or Blob
 */
export function loadVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      resolve({
        url,
        videoElement: video,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: (video.videoWidth / video.videoHeight).toFixed(2),
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type || 'video/mp4',
        lastModified: file.lastModified
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video file. Format may not be supported by browser.'));
    };
  });
}

/**
 * Extract timeline thumbnails at even intervals across duration
 */
export async function extractTimelineThumbnails(videoUrl, duration, count = 10) {
  const thumbs = [];
  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;

  await new Promise((resolve) => {
    video.onloadeddata = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const thumbWidth = 120;
  const thumbHeight = 68;
  canvas.width = thumbWidth;
  canvas.height = thumbHeight;

  const step = duration / Math.max(count, 1);

  for (let i = 0; i < count; i++) {
    const targetTime = Math.min(i * step, duration - 0.05);
    video.currentTime = targetTime;
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight);
    thumbs.push({
      time: targetTime,
      dataUrl: canvas.toDataURL('image/jpeg', 0.6)
    });
  }

  return thumbs;
}

/**
 * Capture a single high-resolution snapshot frame from video at currentTime
 */
export function captureVideoFrame(video, format = 'image/png', quality = 0.95) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(format, quality);
}

/**
 * Detect best supported MediaRecorder MIME type in user's browser
 */
export function getOptimalMimeType(targetFormat = 'mp4') {
  const mimeTypes = targetFormat === 'mp4'
    ? [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=h264,aac',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ]
    : [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];

  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

/**
 * Process and re-record video through HTML5 Canvas with custom transformations
 * Supports: Trimming, Filters, Cropping, Rotation, Watermark, Speed, Subtitles
 */
export async function processVideoWithCanvas({
  videoUrl,
  startTime = 0,
  endTime = null,
  filters = {}, // brightness, contrast, saturate, hue, invert, sepia, grayscale, blur
  crop = null, // { x, y, width, height }
  rotation = 0, // 0, 90, 180, 270
  flipH = false,
  flipV = false,
  resize = null, // { width, height }
  watermark = null, // { text, color, fontSize, opacity, position: 'top-left'|'center'|'bottom-right' }
  watermarkImage = null, // HTMLImageElement
  subtitles = [], // [{ start, end, text }]
  playbackRate = 1.0,
  targetBitrate = 3000000,
  targetFormat = 'mp4',
  audioMuted = false,
  backgroundAudioUrl = null,
  backgroundAudioVolume = 0.5,
  onProgress = () => { }
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.muted = true; // muted to allow programmatic playback in all browsers

      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = rej;
      });

      const videoDuration = video.duration;
      const actualStart = Math.max(0, startTime);
      const actualEnd = endTime !== null ? Math.min(videoDuration, endTime) : videoDuration;
      const totalProcessDuration = Math.max(0.1, actualEnd - actualStart);

      // Determine dimensions
      let sourceWidth = video.videoWidth;
      let sourceHeight = video.videoHeight;

      let drawWidth = crop ? crop.width : sourceWidth;
      let drawHeight = crop ? crop.height : sourceHeight;

      if (rotation === 90 || rotation === 270) {
        const temp = drawWidth;
        drawWidth = drawHeight;
        drawHeight = temp;
      }

      const outWidth = resize?.width || drawWidth;
      const outHeight = resize?.height || drawHeight;

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(outWidth);
      canvas.height = Math.round(outHeight);
      const ctx = canvas.getContext('2d');

      // Set up Audio Mixing via Web Audio API
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioDest = audioCtx.createMediaStreamDestination();

      // Video audio: Decode audio data directly via Web Audio API
      // This bypasses browser autoplay restrictions and speaker mute limitations completely
      let bufferSource = null;
      if (!audioMuted) {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', videoUrl, true);
          xhr.responseType = 'arraybuffer';
          const arrayBuffer = await new Promise((res, rej) => {
            xhr.onload = () => (xhr.status === 200 || xhr.status === 0) ? res(xhr.response) : rej();
            xhr.onerror = rej;
            xhr.send();
          });

          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          bufferSource = audioCtx.createBufferSource();
          bufferSource.buffer = audioBuffer;
          bufferSource.playbackRate.value = playbackRate;
          bufferSource.connect(audioDest);
        } catch (e) {
          console.warn('Audio decoding skipped (silent video or unsupported audio codec):', e);
          bufferSource = null;
        }
      }

      // Background music mixing
      let bgBufferSource = null;
      if (backgroundAudioUrl) {
        try {
          const bgXhr = new XMLHttpRequest();
          bgXhr.open('GET', backgroundAudioUrl, true);
          bgXhr.responseType = 'arraybuffer';
          const bgAb = await new Promise((res, rej) => {
            bgXhr.onload = () => (bgXhr.status === 200 || bgXhr.status === 0) ? res(bgXhr.response) : rej();
            bgXhr.onerror = rej;
            bgXhr.send();
          });
          const bgBuffer = await audioCtx.decodeAudioData(bgAb);
          bgBufferSource = audioCtx.createBufferSource();
          bgBufferSource.buffer = bgBuffer;
          bgBufferSource.loop = true;
          const bgGain = audioCtx.createGain();
          bgGain.gain.value = backgroundAudioVolume;
          bgBufferSource.connect(bgGain);
          bgGain.connect(audioDest);
        } catch (e) {
          console.warn('Background audio decode skipped:', e);
          bgBufferSource = null;
        }
      }

      // Compose stream
      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [...canvasStream.getVideoTracks()];

      if (!audioMuted && audioDest.stream.getAudioTracks().length > 0) {
        combinedTracks.push(...audioDest.stream.getAudioTracks());
      }

      const combinedStream = new MediaStream(combinedTracks);
      const mimeType = getOptimalMimeType(targetFormat);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: targetBitrate
      });

      const recordedChunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      let isCancelled = false;

      recorder.onstop = () => {
        if (isCancelled) {
          reject(new Error('Processing was cancelled'));
          return;
        }
        if (bufferSource) { try { bufferSource.stop(); } catch(e) {} }
        if (bgBufferSource) { try { bgBufferSource.stop(); } catch(e) {} }
        const blob = new Blob(recordedChunks, { type: mimeType });
        const resultUrl = URL.createObjectURL(blob);
        audioCtx.close().catch(() => { });
        resolve({
          blob,
          url: resultUrl,
          size: blob.size,
          duration: totalProcessDuration / playbackRate,
          width: canvas.width,
          height: canvas.height,
          mimeType
        });
      };

      // Construct CSS filter string
      const filterParts = [];
      if (filters.brightness !== undefined && filters.brightness !== 100) filterParts.push(`brightness(${filters.brightness}%)`);
      if (filters.contrast !== undefined && filters.contrast !== 100) filterParts.push(`contrast(${filters.contrast}%)`);
      if (filters.saturate !== undefined && filters.saturate !== 100) filterParts.push(`saturate(${filters.saturate}%)`);
      if (filters.hue !== undefined && filters.hue !== 0) filterParts.push(`hue-rotate(${filters.hue}deg)`);
      if (filters.invert !== undefined && filters.invert !== 0) filterParts.push(`invert(${filters.invert}%)`);
      if (filters.sepia !== undefined && filters.sepia !== 0) filterParts.push(`sepia(${filters.sepia}%)`);
      if (filters.grayscale !== undefined && filters.grayscale !== 0) filterParts.push(`grayscale(${filters.grayscale}%)`);
      if (filters.blur !== undefined && filters.blur !== 0) filterParts.push(`blur(${filters.blur}px)`);

      const cssFilterString = filterParts.join(' ') || 'none';

      // Seek to start position
      video.currentTime = actualStart;
      video.playbackRate = playbackRate;
      await new Promise((res) => {
        video.onseeked = res;
      });

      // Start recording and audio nodes
      recorder.start(100);

      if (bufferSource) {
        try {
          bufferSource.start(0, actualStart, totalProcessDuration / playbackRate);
        } catch (e) {
          console.warn('Audio start note:', e);
        }
      }

      if (bgBufferSource) {
        try {
          bgBufferSource.start(0);
        } catch (e) {
          console.warn('BG audio start note:', e);
        }
      }

      await video.play();

      function renderFrame() {
        if (isCancelled) return;

        const currentPos = video.currentTime;
        const progress = Math.min(100, Math.max(0, ((currentPos - actualStart) / totalProcessDuration) * 100));
        onProgress(Math.round(progress));

        if (currentPos >= actualEnd || video.ended) {
          video.pause();
          if (bufferSource) { try { bufferSource.stop(); } catch(e) {} }
          if (bgBufferSource) { try { bgBufferSource.stop(); } catch(e) {} }
          recorder.stop();
          return;
        }

        // Clear canvas
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply filters
        ctx.filter = cssFilterString;

        // Apply transformations (Rotation & Flip)
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (rotation !== 0) {
          ctx.rotate((rotation * Math.PI) / 180);
        }
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

        const cropX = crop ? crop.x : 0;
        const cropY = crop ? crop.y : 0;
        const cropW = crop ? crop.width : sourceWidth;
        const cropH = crop ? crop.height : sourceHeight;

        const targetW = (rotation === 90 || rotation === 270) ? canvas.height : canvas.width;
        const targetH = (rotation === 90 || rotation === 270) ? canvas.width : canvas.height;

        ctx.drawImage(
          video,
          cropX, cropY, cropW, cropH,
          -targetW / 2, -targetH / 2, targetW, targetH
        );

        ctx.restore();

        // Overlay Watermark
        if (watermark && watermark.text) {
          ctx.save();
          ctx.font = `${watermark.fontSize || 24}px sans-serif`;
          ctx.fillStyle = watermark.color || '#ffffff';
          ctx.globalAlpha = (watermark.opacity !== undefined ? watermark.opacity : 80) / 100;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 6;

          let posX = 30;
          let posY = canvas.height - 30;
          if (watermark.position === 'top-left') {
            posX = 30;
            posY = 50;
          } else if (watermark.position === 'top-right') {
            const metrics = ctx.measureText(watermark.text);
            posX = canvas.width - metrics.width - 30;
            posY = 50;
          } else if (watermark.position === 'center') {
            const metrics = ctx.measureText(watermark.text);
            posX = (canvas.width - metrics.width) / 2;
            posY = canvas.height / 2;
          } else if (watermark.position === 'bottom-right') {
            const metrics = ctx.measureText(watermark.text);
            posX = canvas.width - metrics.width - 30;
            posY = canvas.height - 30;
          }

          ctx.fillText(watermark.text, posX, posY);
          ctx.restore();
        }

        // Overlay Image Watermark
        if (watermarkImage) {
          ctx.save();
          ctx.globalAlpha = 0.85;
          const imgW = 120;
          const imgH = (watermarkImage.naturalHeight / watermarkImage.naturalWidth) * imgW;
          ctx.drawImage(watermarkImage, canvas.width - imgW - 20, 20, imgW, imgH);
          ctx.restore();
        }

        // Overlay Subtitles
        if (subtitles && subtitles.length > 0) {
          const currentSub = subtitles.find(s => currentPos >= s.start && currentPos <= s.end);
          if (currentSub) {
            ctx.save();
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const metrics = ctx.measureText(currentSub.text);
            const boxPadding = 12;

            // Background banner for readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(
              canvas.width / 2 - metrics.width / 2 - boxPadding,
              canvas.height - 70,
              metrics.width + boxPadding * 2,
              36
            );

            ctx.fillStyle = '#ffffff';
            ctx.fillText(currentSub.text, canvas.width / 2, canvas.height - 42);
            ctx.restore();
          }
        }

        if ('requestVideoFrameCallback' in video) {
          video.requestVideoFrameCallback(renderFrame);
        } else {
          requestAnimationFrame(renderFrame);
        }
      }

      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(renderFrame);
      } else {
        requestAnimationFrame(renderFrame);
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Merge and concatenate multiple video clips sequentially into a single video file
 * 100% In-Browser & Hardware-Accelerated
 */
export async function mergeVideosWithCanvas({
  videoFiles, // Array of File objects or { url, name }
  targetWidth = 1280,
  targetHeight = 720,
  targetBitrate = 3500000,
  targetFormat = 'mp4',
  onProgress = () => { }
}) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!videoFiles || videoFiles.length === 0) {
        throw new Error('At least two video files are required to merge.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioDest = audioCtx.createMediaStreamDestination();

      const mimeType = getOptimalMimeType(targetFormat);
      const combinedTracks = [...stream.getVideoTracks()];
      if (audioDest.stream.getAudioTracks().length > 0) {
        combinedTracks.push(...audioDest.stream.getAudioTracks());
      }
      const combinedStream = new MediaStream(combinedTracks);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: targetBitrate
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordedPromise = new Promise((res) => {
        recorder.onstop = () => {
          audioCtx.close().catch(() => { });
          const blob = new Blob(chunks, { type: mimeType });
          res({
            blob,
            url: URL.createObjectURL(blob),
            size: blob.size,
            width: targetWidth,
            height: targetHeight,
            mimeType
          });
        };
      });

      recorder.start(100);

      // Play through each video sequentially
      for (let i = 0; i < videoFiles.length; i++) {
        const fileItem = videoFiles[i];
        const vUrl = fileItem.url || URL.createObjectURL(fileItem);
        const tempVideo = document.createElement('video');
        tempVideo.src = vUrl;
        tempVideo.muted = true;
        tempVideo.playsInline = true;

        await new Promise((res, rej) => {
          tempVideo.onloadedmetadata = res;
          tempVideo.onerror = rej;
        });

        // Decode and play audio for this clip if audio track exists
        let clipAudioSource = null;
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', vUrl, true);
          xhr.responseType = 'arraybuffer';
          const ab = await new Promise((r) => {
            xhr.onload = () => (xhr.status === 200 || xhr.status === 0) ? r(xhr.response) : r(null);
            xhr.onerror = () => r(null);
            xhr.send();
          });
          if (ab) {
            const aBuf = await audioCtx.decodeAudioData(ab);
            clipAudioSource = audioCtx.createBufferSource();
            clipAudioSource.buffer = aBuf;
            clipAudioSource.connect(audioDest);
            clipAudioSource.start(0);
          }
        } catch (e) {
          clipAudioSource = null;
        }

        await tempVideo.play();

        await new Promise((donePlaying) => {
          function drawClipFrame() {
            if (tempVideo.ended || tempVideo.paused) {
              if (clipAudioSource) { try { clipAudioSource.stop(); } catch(e) {} }
              donePlaying();
              return;
            }

            // Fill canvas with black letterbox
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Compute aspect ratio fit
            const vAspect = tempVideo.videoWidth / tempVideo.videoHeight;
            const cAspect = canvas.width / canvas.height;
            let drawW = canvas.width;
            let drawH = canvas.height;
            let drawX = 0;
            let drawY = 0;

            if (vAspect > cAspect) {
              drawH = canvas.width / vAspect;
              drawY = (canvas.height - drawH) / 2;
            } else {
              drawW = canvas.height * vAspect;
              drawX = (canvas.width - drawW) / 2;
            }

            ctx.drawImage(tempVideo, drawX, drawY, drawW, drawH);

            const clipProgress = (tempVideo.currentTime / Math.max(0.1, tempVideo.duration));
            const totalProgress = Math.round(((i + clipProgress) / videoFiles.length) * 100);
            onProgress(Math.min(99, Math.max(1, totalProgress)));

            if ('requestVideoFrameCallback' in tempVideo) {
              tempVideo.requestVideoFrameCallback(drawClipFrame);
            } else {
              requestAnimationFrame(drawClipFrame);
            }
          }

          if ('requestVideoFrameCallback' in tempVideo) {
            tempVideo.requestVideoFrameCallback(drawClipFrame);
          } else {
            requestAnimationFrame(drawClipFrame);
          }
        });

        tempVideo.pause();
      }

      onProgress(100);
      recorder.stop();
      const result = await recordedPromise;
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate high-definition slideshow video from multiple photos with smooth crossfade
 * 100% In-Browser & Hardware-Accelerated
 */
export async function createVideoFromImages({
  imageFiles, // Array of File or Image elements
  secondsPerSlide = 3,
  transitionSeconds = 0.6,
  targetWidth = 1280,
  targetHeight = 720,
  backgroundAudioUrl = null,
  targetFormat = 'mp4',
  onProgress = () => { }
}) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!imageFiles || imageFiles.length === 0) {
        throw new Error('Please select at least 1 image.');
      }

      // Preload all images
      const loadedImages = await Promise.all(
        imageFiles.map(file => {
          return new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = file instanceof HTMLImageElement ? file.src : URL.createObjectURL(file);
          });
        })
      );

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      const fps = 30;
      const stream = canvas.captureStream(fps);

      // Audio setup via Web Audio buffer source
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioDest = audioCtx.createMediaStreamDestination();
      let bgBufferSource = null;

      if (backgroundAudioUrl) {
        try {
          const bgXhr = new XMLHttpRequest();
          bgXhr.open('GET', backgroundAudioUrl, true);
          bgXhr.responseType = 'arraybuffer';
          const bgAb = await new Promise((res, rej) => {
            bgXhr.onload = () => (bgXhr.status === 200 || bgXhr.status === 0) ? res(bgXhr.response) : rej();
            bgXhr.onerror = rej;
            bgXhr.send();
          });
          const bgBuffer = await audioCtx.decodeAudioData(bgAb);
          bgBufferSource = audioCtx.createBufferSource();
          bgBufferSource.buffer = bgBuffer;
          bgBufferSource.loop = true;
          bgBufferSource.connect(audioDest);
        } catch (e) {
          console.warn('Slideshow audio decode note:', e);
          bgBufferSource = null;
        }
      }

      const mimeType = getOptimalMimeType(targetFormat);
      const combinedTracks = [...stream.getVideoTracks()];
      if (bgBufferSource && audioDest.stream.getAudioTracks().length > 0) {
        combinedTracks.push(...audioDest.stream.getAudioTracks());
      }
      const combinedStream = new MediaStream(combinedTracks);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 3000000
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordedPromise = new Promise((res) => {
        recorder.onstop = () => {
          if (bgBufferSource) { try { bgBufferSource.stop(); } catch(e) {} }
          audioCtx.close().catch(() => { });
          const blob = new Blob(chunks, { type: mimeType });
          res({
            blob,
            url: URL.createObjectURL(blob),
            size: blob.size,
            duration: loadedImages.length * secondsPerSlide,
            width: targetWidth,
            height: targetHeight,
            mimeType
          });
        };
      });

      recorder.start(100);
      if (bgBufferSource) {
        try { bgBufferSource.start(0); } catch(e) {}
      }

      const totalFramesPerSlide = Math.round(secondsPerSlide * fps);
      const transitionFrames = Math.round(transitionSeconds * fps);
      const totalSlides = loadedImages.length;
      const grandTotalFrames = totalSlides * totalFramesPerSlide;

      function drawImageFitted(img, alpha = 1.0) {
        ctx.save();
        ctx.globalAlpha = alpha;
        const iAspect = img.naturalWidth / img.naturalHeight;
        const cAspect = canvas.width / canvas.height;
        let dW = canvas.width;
        let dH = canvas.height;
        let dX = 0;
        let dY = 0;

        if (iAspect > cAspect) {
          dH = canvas.width / iAspect;
          dY = (canvas.height - dH) / 2;
        } else {
          dW = canvas.height * iAspect;
          dX = (canvas.width - dW) / 2;
        }

        ctx.drawImage(img, dX, dY, dW, dH);
        ctx.restore();
      }

      let currentFrame = 0;

      async function renderSlideshow() {
        for (let slideIdx = 0; slideIdx < totalSlides; slideIdx++) {
          const currentImg = loadedImages[slideIdx];
          const nextImg = loadedImages[(slideIdx + 1) % totalSlides];

          for (let f = 0; f < totalFramesPerSlide; f++) {
            ctx.fillStyle = '#0b0f19';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Check if in transition window
            const remainingInSlide = totalFramesPerSlide - f;
            if (remainingInSlide <= transitionFrames && totalSlides > 1 && slideIdx < totalSlides - 1) {
              const blend = (transitionFrames - remainingInSlide) / transitionFrames;
              drawImageFitted(currentImg, 1.0 - blend);
              drawImageFitted(nextImg, blend);
            } else {
              drawImageFitted(currentImg, 1.0);
            }

            currentFrame++;
            const pct = Math.round((currentFrame / grandTotalFrames) * 100);
            onProgress(Math.min(99, Math.max(1, pct)));

            // Delay for accurate FPS timing
            await new Promise((r) => setTimeout(r, 1000 / fps));
          }
        }

        onProgress(100);
        recorder.stop();
      }

      renderSlideshow();
      const result = await recordedPromise;
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Extract audio track from video and convert to high-fidelity WAV PCM file
 * Uses XHR to load blob URLs reliably in all browsers (fetch can fail on blob:)
 */
export async function extractAudioFromVideo(videoUrl, onProgress = () => { }) {
  onProgress(20);

  // Use XHR which reliably loads blob: URLs in all browsers
  const arrayBuffer = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', videoUrl, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 0) {
        resolve(xhr.response);
      } else {
        reject(new Error('Failed to load video data for audio extraction.'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error loading video for audio extraction.'));
    xhr.send();
  });

  onProgress(50);

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  onProgress(75);

  const wavBlob = audioBufferToWav(audioBuffer);
  onProgress(100);

  return {
    blob: wavBlob,
    url: URL.createObjectURL(wavBlob),
    size: wavBlob.size,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels
  };
}

/**
 * Convert AudioBuffer to 16-bit PCM WAV Blob
 */
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result;
  if (numChannels === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataByteLength = result.length * bytesPerSample;
  const headerByteLength = 44;
  const totalLength = headerByteLength + dataByteLength;

  const wavBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(wavBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Write samples as 16-bit signed PCM
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function interleave(inputL, inputR) {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;

  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

/**
 * Generate a rich, colorful demo test video in browser memory
 * Allows immediate tool testing without needing user to upload files
 */
export function generateSampleVideo() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  const stream = canvas.captureStream(30);

  // Add dummy tone audio track
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const dest = audioCtx.createMediaStreamDestination();
  const gain = audioCtx.createGain();
  gain.gain.value = 0.05;
  osc.frequency.value = 440;
  osc.connect(gain);
  gain.connect(dest);
  osc.start();

  stream.addTrack(dest.stream.getAudioTracks()[0]);

  const mimeType = getOptimalMimeType('webm');
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];

  recorder.ondataavailable = e => chunks.push(e.data);

  return new Promise((resolve) => {
    recorder.onstop = () => {
      osc.stop();
      audioCtx.close().catch(() => { });
      const blob = new Blob(chunks, { type: mimeType });
      const file = new File([blob], 'videokit_sample_demo.webm', { type: mimeType });
      resolve(file);
    };

    recorder.start();

    let frame = 0;
    const totalFrames = 30 * 4; // 4 seconds sample video

    function drawSample() {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      const progress = frame / totalFrames;

      // Dynamic animated background gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, `hsl(${frame * 3 % 360}, 75%, 20%)`);
      grad.addColorStop(0.5, `hsl(${(frame * 3 + 60) % 360}, 75%, 35%)`);
      grad.addColorStop(1, `hsl(${(frame * 3 + 120) % 360}, 75%, 20%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rotating geometric orb
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 - 20);
      ctx.rotate((frame * 2 * Math.PI) / 60);

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 4;
      ctx.strokeRect(-50, -50, 100, 100);

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Text Overlay
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Outfit, Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VideoKit In-Browser Demo', canvas.width / 2, canvas.height - 70);

      ctx.font = '14px JetBrains Mono, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Frame ${frame} / ${totalFrames} | ${(frame / 30).toFixed(1)}s`, canvas.width / 2, canvas.height - 40);

      frame++;
      requestAnimationFrame(drawSample);
    }

    drawSample();
  });
}
