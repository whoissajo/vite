# VideoKit - Online In-Browser Video & Audio Toolkit (React Clone)

A high-performance, 100% private in-browser video and audio processing toolkit built in **React** and powered by browser-native **WebCodecs, HTML5 Canvas, Web Audio API, and MediaRecorder**.

Inspired by [VideoKit (videokit.cc)](https://www.videokit.cc/en).

---

## ⚡ Zero Internet / 100% Private Architecture

Traditional online video converters require uploading massive video files (100MB - 2GB+) to remote cloud servers, consuming huge amounts of internet bandwidth and exposing private recordings to third parties.

**VideoKit works 100% locally in your web browser:**
- **Zero Server Uploads**: Videos are loaded directly into browser RAM via `URL.createObjectURL()`.
- **Zero Internet Bandwidth**: After the web app is loaded, all processing (trimming, compressing, color adjustment, rotation, audio extraction) is computed locally using your device's GPU/CPU.
- **Hardware Accelerated**: Leverages native hardware encoders through the HTML5 `MediaRecorder` & `WebCodecs` standard.

---

## 🛠️ Included Tools

### 1. Format Conversion
- **Video Format Conversion**: Convert between MP4 (H.264/AAC) and WebM (VP9/Opus).
- **Video to GIF**: Convert video highlights into animated GIFs with customizable resolution, FPS, and loop settings.
- **Photos to Video**: Render photo sequences and slideshows into video.

### 2. Compression & Optimization
- **Video Compressor**:
  - One-click presets: **Extreme** (~70% smaller), **Balanced** (Recommended 50%), **High Quality** (~30% smaller).
  - Target resolution downscaling: 1080p, 720p HD, 480p SD.
  - Custom bitrate slider (400 kbps to 6000 kbps) with real-time estimated output file size.

### 3. Editing & Processing
- **Video Trimmer**: Visual timeline with dual range markers, 0.1s frame-stepping buttons, and instant duration calculations.
- **Video Color Adjustment & Grading**: Live sliders for Brightness, Contrast, Saturation, Hue Rotation, Sepia, and Invert with instant preview, plus 1-click presets (*Cinematic, Cyberpunk, Vintage, Noir B&W, Vivid*).
- **Rotate Video**: Rotate 90°, 180°, or 270° without re-uploading.
- **Flip / Mirror Video**: Mirror videos horizontally or vertically.
- **Crop Video Frame**: Preset aspect ratios for 16:9 (Landscape), 9:16 (TikTok/Reels/Shorts), 1:1 (Square), and 4:5 (Instagram).
- **Video Resizer**: Scale video to standard resolutions.
- **Change Video Speed**: Adjust playback rate from 0.25x (Slow-Mo) to 4x (Hyperlapse).
- **Reverse Video**: Rewind and export video backward.
- **Watermark & Logo**: Overlay text watermarks with custom fonts, colors, positions, and opacity, or logo images.

### 4. Extract & Export
- **Extract Audio**: Strip the soundtrack from video into uncompressed studio-grade **16-bit PCM Stereo WAV**.
- **Remove Audio (Mute)**: Silence videos by removing audio streams.
- **Add Background Music**: Mix custom background music tracks with volume balancing.
- **Extract Thumbnails & Frames**: High-resolution frame grabber at any playhead timestamp, plus automated gallery generation (every 1s, 2s, 5s).

---

## 🚀 How to Run Locally

Navigate to the `videokit` directory:

```bash
cd videokit
npm install
npm run dev
```

The app will start at `http://localhost:3000` with hot-reloading enabled.

---

## 💡 Built-In Demo Mode
Don't have a video file ready on your computer?
Click the **"Load Demo Video"** button in the top navigation bar to generate an animated canvas test video with sound right inside browser memory!
"# vite" 
