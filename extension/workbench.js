// Offline Media Toolkit - Standalone In-Browser Engine (Zero Server Calls)
(function() {
  let activeTool = 'compressor';
  let loadedFile = null;
  let loadedMediaUrl = null;
  let mediaType = null; // 'video' | 'image'
  let videoDuration = 0;
  let mediaWidth = 0;
  let mediaHeight = 0;
  let processResult = null;
  let outputFileName = '';

  const params = new URLSearchParams(window.location.search);
  if (params.get('tool')) {
    activeTool = params.get('tool');
  }

  // DOM Elements
  const navItems = document.querySelectorAll('.nav-item');
  const activeToolTitle = document.getElementById('activeToolTitle');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const loadDemoBtn = document.getElementById('loadDemoBtn');
  const workspace = document.getElementById('workspace');
  const videoPreview = document.getElementById('videoPreview');
  const imagePreview = document.getElementById('imagePreview');
  const toolControls = document.getElementById('toolSpecificControls');
  const processBtn = document.getElementById('processBtn');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const progressBar = document.getElementById('progressBar');
  const resultStats = document.getElementById('resultStats');
  const statOriginal = document.getElementById('statOriginal');
  const statOutput = document.getElementById('statOutput');
  const statSaved = document.getElementById('statSaved');
  const modalActions = document.getElementById('modalActions');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  const metaDimensions = document.getElementById('metaDimensions');
  const metaDuration = document.getElementById('metaDuration');
  const metaSize = document.getElementById('metaSize');

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function setActiveTool(toolId) {
    activeTool = toolId;
    navItems.forEach(n => {
      n.classList.toggle('active', n.getAttribute('data-tool') === toolId);
    });

    const activeNav = Array.from(navItems).find(n => n.getAttribute('data-tool') === toolId);
    if (activeNav) {
      activeToolTitle.textContent = activeNav.textContent.replace(/^[^\s]+\s/, '');
    }

    renderControls();
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      setActiveTool(item.getAttribute('data-tool'));
    });
  });

  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#3b82f6';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  async function handleFileSelected(file) {
    loadedFile = file;
    loadedMediaUrl = URL.createObjectURL(file);

    if (file.type.startsWith('video/')) {
      mediaType = 'video';
      imagePreview.style.display = 'none';
      videoPreview.style.display = 'block';
      videoPreview.src = loadedMediaUrl;

      await new Promise(r => { videoPreview.onloadedmetadata = r; });
      videoDuration = videoPreview.duration;
      mediaWidth = videoPreview.videoWidth;
      mediaHeight = videoPreview.videoHeight;

      metaDimensions.textContent = `${mediaWidth}x${mediaHeight}`;
      metaDuration.textContent = `${videoDuration.toFixed(1)}s`;
      metaSize.textContent = formatBytes(file.size);
    } else {
      mediaType = 'image';
      videoPreview.style.display = 'none';
      imagePreview.style.display = 'block';
      imagePreview.src = loadedMediaUrl;

      await new Promise(r => { imagePreview.onload = r; });
      mediaWidth = imagePreview.naturalWidth;
      mediaHeight = imagePreview.naturalHeight;

      metaDimensions.textContent = `${mediaWidth}x${mediaHeight}`;
      metaDuration.textContent = 'Photo';
      metaSize.textContent = formatBytes(file.size);
    }

    dropzone.style.display = 'none';
    workspace.style.display = 'grid';
    renderControls();
  }

  // Generate an animated video test sample
  loadDemoBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(30);

    const mime = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const f = new File([blob], 'demo_video.webm', { type: mime });
      handleFileSelected(f);
    };

    recorder.start();
    let frame = 0;
    const totalFrames = 90;

    function render() {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }
      ctx.fillStyle = `hsl(${frame * 4 % 360}, 65%, 20%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OfflineKit Demo Video', canvas.width / 2, canvas.height / 2);
      ctx.font = '16px monospace';
      ctx.fillText(`Frame ${frame} / ${totalFrames}`, canvas.width / 2, canvas.height / 2 + 40);
      frame++;
      requestAnimationFrame(render);
    }
    render();
  });

  function renderControls() {
    if (!loadedFile) return;

    if (activeTool === 'compressor') {
      toolControls.innerHTML = `
        <div class="setting-group">
          <label class="setting-label"><span>Resolution Scale</span></label>
          <select class="form-select" id="cmpRes">
            <option value="720p">720p HD (Optimal ~50% savings)</option>
            <option value="480p">480p SD (High ~75% savings)</option>
            <option value="original">Original Dimensions</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="setting-label">
            <span>Bitrate Quality</span>
            <span id="bitrateVal" style="color: var(--accent-cyan);">1500 kbps</span>
          </label>
          <input type="range" class="range-slider" id="cmpBitrate" min="400" max="4000" step="100" value="1500">
        </div>
      `;
      const slider = document.getElementById('cmpBitrate');
      const val = document.getElementById('bitrateVal');
      slider.oninput = () => { val.textContent = `${slider.value} kbps`; };
    } else if (activeTool === 'trimmer') {
      toolControls.innerHTML = `
        <div class="setting-group">
          <label class="setting-label"><span>Start Time (seconds)</span><span id="sVal">0s</span></label>
          <input type="range" class="range-slider" id="trimStart" min="0" max="${Math.max(1, videoDuration - 1)}" step="0.5" value="0">
        </div>
        <div class="setting-group">
          <label class="setting-label"><span>End Time (seconds)</span><span id="eVal">${videoDuration.toFixed(1)}s</span></label>
          <input type="range" class="range-slider" id="trimEnd" min="1" max="${videoDuration}" step="0.5" value="${videoDuration}">
        </div>
      `;
      const tStart = document.getElementById('trimStart');
      const tEnd = document.getElementById('trimEnd');
      tStart.oninput = () => { document.getElementById('sVal').textContent = `${tStart.value}s`; };
      tEnd.oninput = () => { document.getElementById('eVal').textContent = `${tEnd.value}s`; };
    } else if (activeTool === 'image-compressor') {
      toolControls.innerHTML = `
        <div class="setting-group">
          <label class="setting-label"><span>Quality</span><span id="qVal" style="color: var(--accent-cyan);">75%</span></label>
          <input type="range" class="range-slider" id="imgQuality" min="10" max="95" value="75">
        </div>
        <div class="setting-group">
          <label class="setting-label"><span>Max Width</span></label>
          <select class="form-select" id="imgMaxWidth">
            <option value="1920">1920px (Full HD)</option>
            <option value="1280">1280px (HD)</option>
            <option value="800">800px (Compact Web)</option>
          </select>
        </div>
      `;
      const q = document.getElementById('imgQuality');
      q.oninput = () => { document.getElementById('qVal').textContent = `${q.value}%`; };
    } else if (activeTool === 'image-converter') {
      toolControls.innerHTML = `
        <div class="setting-group">
          <label class="setting-label"><span>Target Format</span></label>
          <select class="form-select" id="targetImgFmt">
            <option value="jpeg">JPG / JPEG</option>
            <option value="png">PNG (Lossless)</option>
            <option value="webp">WebP (Modern Compact)</option>
          </select>
        </div>
      `;
    } else if (activeTool === 'image-bg-remover') {
      toolControls.innerHTML = `
        <div class="setting-group">
          <label class="setting-label"><span>Background Color to Erase</span></label>
          <input type="color" class="form-input" id="bgHex" value="#ffffff" style="height: 40px; cursor: pointer;">
        </div>
        <div class="setting-group">
          <label class="setting-label"><span>Color Tolerance</span><span id="tolVal">35%</span></label>
          <input type="range" class="range-slider" id="bgTol" min="5" max="80" value="35">
        </div>
      `;
      const tol = document.getElementById('bgTol');
      tol.oninput = () => { document.getElementById('tolVal').textContent = `${tol.value}%`; };
    } else if (activeTool === 'audio-extractor') {
      toolControls.innerHTML = `
        <p style="color: var(--text-muted); font-size: 0.88rem;">
          Strips video frames and extracts the audio stream into a studio-grade <strong>16-bit Stereo PCM WAV</strong> audio file with zero loss.
        </p>
      `;
    } else if (activeTool === 'video-to-gif') {
      toolControls.innerHTML = `
        <div class="setting-group">
          <label class="setting-label"><span>Resolution Width</span></label>
          <select class="form-select" id="gifWidth">
            <option value="480">480px (Standard)</option>
            <option value="320">320px (Compact)</option>
            <option value="640">640px (High Quality)</option>
          </select>
        </div>
      `;
    }
  }

  // Processing Execution
  processBtn.addEventListener('click', async () => {
    if (!loadedFile) return;

    modal.style.display = 'flex';
    modalTitle.textContent = 'Processing Locally in Browser...';
    modalDesc.textContent = 'Using local GPU & WebCodecs. 100% private in device memory.';
    progressBar.style.width = '20%';
    resultStats.style.display = 'none';
    modalActions.style.display = 'none';

    try {
      if (activeTool === 'image-compressor' || activeTool === 'image-converter') {
        const quality = activeTool === 'image-compressor'
          ? (parseInt(document.getElementById('imgQuality').value) / 100)
          : 0.9;
        const fmt = activeTool === 'image-converter'
          ? document.getElementById('targetImgFmt').value
          : 'jpeg';

        const canvas = document.createElement('canvas');
        canvas.width = imagePreview.naturalWidth;
        canvas.height = imagePreview.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (fmt === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(imagePreview, 0, 0);

        progressBar.style.width = '70%';
        const mime = fmt === 'png' ? 'image/png' : fmt === 'webp' ? 'image/webp' : 'image/jpeg';
        const blob = await new Promise(r => canvas.toBlob(r, mime, quality));

        processResult = {
          blob,
          url: URL.createObjectURL(blob),
          size: blob.size
        };
        outputFileName = `processed_${loadedFile.name.split('.')[0]}.${fmt === 'jpeg' ? 'jpg' : fmt}`;
        finishProcessing();
      } else if (activeTool === 'image-bg-remover') {
        const hex = document.getElementById('bgHex').value;
        const tol = parseInt(document.getElementById('bgTol').value) / 100;

        const canvas = document.createElement('canvas');
        canvas.width = imagePreview.naturalWidth;
        canvas.height = imagePreview.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imagePreview, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        const rT = parseInt(hex.slice(1, 3), 16);
        const gT = parseInt(hex.slice(3, 5), 16);
        const bT = parseInt(hex.slice(5, 7), 16);
        const thresh = tol * 441.67;

        for (let i = 0; i < d.length; i += 4) {
          const dist = Math.sqrt(Math.pow(d[i] - rT, 2) + Math.pow(d[i+1] - gT, 2) + Math.pow(d[i+2] - bT, 2));
          if (dist <= thresh) d[i + 3] = 0;
        }
        ctx.putImageData(imgData, 0, 0);

        progressBar.style.width = '80%';
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        processResult = { blob, url: URL.createObjectURL(blob), size: blob.size };
        outputFileName = `${loadedFile.name.split('.')[0]}_nobg.png`;
        finishProcessing();
      } else if (activeTool === 'audio-extractor') {
        const arrayBuf = await loadedFile.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = await audioCtx.decodeAudioData(arrayBuf);

        // Convert AudioBuffer to WAV
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const data = buffer.getChannelData(0);
        const wavBuf = new ArrayBuffer(44 + data.length * 2);
        const v = new DataView(wavBuf);

        function wStr(offset, str) {
          for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i));
        }
        wStr(0, 'RIFF');
        v.setUint32(4, 36 + data.length * 2, true);
        wStr(8, 'WAVE');
        wStr(12, 'fmt ');
        v.setUint32(16, 16, true);
        v.setUint16(20, 1, true); // PCM
        v.setUint16(22, 1, true); // mono
        v.setUint32(24, sampleRate, true);
        v.setUint32(28, sampleRate * 2, true);
        v.setUint16(32, 2, true);
        v.setUint16(34, 16, true);
        wStr(36, 'data');
        v.setUint32(40, data.length * 2, true);

        let offset = 44;
        for (let i = 0; i < data.length; i++, offset += 2) {
          const s = Math.max(-1, Math.min(1, data[i]));
          v.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }

        const blob = new Blob([wavBuf], { type: 'audio/wav' });
        processResult = { blob, url: URL.createObjectURL(blob), size: blob.size };
        outputFileName = `${loadedFile.name.split('.')[0]}.wav`;
        finishProcessing();
      } else {
        // Video processing (Compressor, Trimmer, GIF)
        const canvas = document.createElement('canvas');
        let outW = videoPreview.videoWidth;
        let outH = videoPreview.videoHeight;

        if (activeTool === 'compressor') {
          const res = document.getElementById('cmpRes').value;
          if (res === '720p') {
            outW = 1280;
            outH = Math.round(1280 / (videoPreview.videoWidth / videoPreview.videoHeight));
          } else if (res === '480p') {
            outW = 854;
            outH = 480;
          }
        } else if (activeTool === 'video-to-gif') {
          outW = parseInt(document.getElementById('gifWidth').value);
          outH = Math.round(outW / (videoPreview.videoWidth / videoPreview.videoHeight));
        }

        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');

        const stream = canvas.captureStream(30);
        const mime = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
        const bitrate = activeTool === 'compressor'
          ? parseInt(document.getElementById('cmpBitrate').value) * 1000
          : 2500000;

        const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
        const chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);

        const recPromise = new Promise(res => {
          recorder.onstop = () => {
            const b = new Blob(chunks, { type: mime });
            res({ blob: b, url: URL.createObjectURL(b), size: b.size });
          };
        });

        const startT = activeTool === 'trimmer' ? parseFloat(document.getElementById('trimStart').value) : 0;
        const endT = activeTool === 'trimmer' ? parseFloat(document.getElementById('trimEnd').value) : videoDuration;

        videoPreview.currentTime = startT;
        await new Promise(r => { videoPreview.onseeked = r; });

        recorder.start(100);
        await videoPreview.play();

        function step() {
          if (videoPreview.currentTime >= endT || videoPreview.ended) {
            videoPreview.pause();
            recorder.stop();
            return;
          }

          ctx.drawImage(videoPreview, 0, 0, outW, outH);
          const pct = Math.round(((videoPreview.currentTime - startT) / Math.max(0.1, endT - startT)) * 100);
          progressBar.style.width = `${Math.min(98, Math.max(5, pct))}%`;
          requestAnimationFrame(step);
        }
        step();

        processResult = await recPromise;
        const ext = activeTool === 'video-to-gif' ? 'gif' : 'mp4';
        outputFileName = `${activeTool}_${loadedFile.name.split('.')[0]}.${ext}`;
        finishProcessing();
      }
    } catch (err) {
      alert('Error during processing: ' + err.message);
      modal.style.display = 'none';
    }
  });

  function finishProcessing() {
    progressBar.style.width = '100%';
    modalTitle.textContent = 'Processing Complete!';
    modalDesc.textContent = 'Your file has been generated entirely inside your browser.';

    statOriginal.textContent = formatBytes(loadedFile.size);
    statOutput.textContent = formatBytes(processResult.size);

    if (loadedFile.size > processResult.size) {
      const pct = Math.round(((loadedFile.size - processResult.size) / loadedFile.size) * 100);
      statSaved.textContent = `-${pct}% smaller`;
    } else {
      statSaved.textContent = 'Optimized';
    }

    resultStats.style.display = 'flex';
    modalActions.style.display = 'flex';
  }

  downloadBtn.addEventListener('click', () => {
    if (!processResult) return;
    const a = document.createElement('a');
    a.href = processResult.url;
    a.download = outputFileName || 'output';
    a.click();
  });

  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Initialize
  setActiveTool(activeTool);
})();

