# VideoKit - Online In-Browser Video, Image & PDF Toolkit (React Clone)

A high-performance, 100% private in-browser multimedia processing toolkit built with **React** and powered by browser-native **Canvas, WebCodecs, Web Audio API, MediaRecorder, PDF.js, and jsPDF**.

Inspired by [VideoKit (videokit.cc)](https://www.videokit.cc/en).

---

## ⚡ Zero Internet / 100% Private Architecture

Traditional online media converters upload your private photos, videos, and PDF documents to remote cloud servers, consuming valuable bandwidth and compromising privacy.

**VideoKit operates 100% locally in your web browser:**
- **Zero Server Uploads**: Files are loaded directly into browser memory (`URL.createObjectURL()`).
- **Zero Internet Bandwidth**: After the web app is loaded, all operations (conversion, compression, PDF rasterization, video trimming) compute directly on your device.
- **Hardware Acceleration**: Video encoding uses native browser WebCodecs / MediaRecorder; image manipulation runs at maximum GPU canvas throughput.

---

## 🛠️ Complete Toolkit Suite

### 1. Image & Photo Tools (New!)
- **PNG to JPG**: Convert transparent or standard PNG to optimized JPEG with customizable background fill color (prevents black boxes on transparent PNGs).
- **JPG to PNG**: Convert lossy JPG files to lossless PNG.
- **Image Format Converter**: Batch convert between WebP, PNG, and JPG with instant quality and dimension scaling.
- **Image Compression**: Reduce photo sizes with real-time quality slider and dimension bounds.
- **Remove Background (Color Keyer)**: Magic wand background remover that detects and removes solid backgrounds (white product backgrounds, green screens, black studio backdrops) and outputs transparent PNGs.

### 2. PDF & Document Tools (New!)
- **PDF to Images**: High-resolution rasterization of all PDF pages to individual PNG, JPG, or WebP images with DPI scale selection (*100%, 150%, 200% HD, 300% Ultra*). Includes single-page downloads or 1-click "Download All".
- **Images to PDF**: Drag & drop multiple images (PNG, JPG, WebP), reorder pages with up/down arrows, and compile into a single downloadable multi-page PDF with custom page sizes (A4, Letter) and margins.

### 3. Video Format Conversion
- **Video Format Conversion**: Convert between MP4 (H.264/AAC) and WebM (VP9/Opus).
- **Video to GIF**: Convert video highlights into animated GIFs with customizable resolution, FPS, and loop bounds.
- **Photos to Video**: Render photo sequences into video slideshows.

### 4. Video Compression & Optimization
- **Video Compressor**:
  - One-click presets: **Extreme** (~70% smaller), **Balanced** (Recommended 50%), **High Quality** (~30% smaller).
  - Target resolution downscaling: 1080p, 720p HD, 480p SD.
  - Custom bitrate slider (400 kbps to 6000 kbps) with real-time estimated file size.

### 5. Video Editing & Processing
- **Video Trimmer**: Visual timeline with dual range markers, 0.1s frame-stepping buttons (`-0.1s` / `+0.1s`), and live timecode display.
- **Video Color Adjustment & Grading**: Live sliders for Brightness, Contrast, Saturation, Hue Rotation, Sepia, and Invert with instant preview, plus 1-click presets (*Cinematic, Cyberpunk, Vintage, Noir B&W, Vivid*).
- **Rotate Video**: Rotate 90°, 180°, or 270° without re-uploading.
- **Flip / Mirror Video**: Mirror videos horizontally or vertically.
- **Crop Video Frame**: Preset aspect ratios for 16:9 (Landscape), 9:16 (TikTok/Reels/Shorts), 1:1 (Square), and 4:5 (Instagram).
- **Video Resizer**: Scale video to standard resolutions.
- **Change Video Speed**: Adjust playback rate from 0.25x (Slow-Mo) to 4x (Hyperlapse).
- **Reverse Video**: Rewind and export video backward.
- **Watermark & Logo**: Overlay text watermarks with custom fonts, colors, positions, and opacity, or logo images.

### 6. Extract & Export
- **Extract Audio**: Strip the soundtrack from video into uncompressed studio-grade **16-bit PCM Stereo WAV**.
- **Remove Audio (Mute)**: Silence videos by removing audio streams.
- **Add Background Music**: Mix custom background music tracks with volume balancing.
- **Extract Thumbnails & Frames**: High-resolution frame grabber at any playhead timestamp, plus automated gallery generation (every 1s, 2s, 5s).

---

## 🚀 How to Run Locally

Navigate to the `videokit` directory:

```bash
cd e:\seo\REACT\REA\videokit
npm install
npm run dev
```

Open `http://localhost:3000` in any modern browser (Chrome, Edge, Safari, Firefox).
