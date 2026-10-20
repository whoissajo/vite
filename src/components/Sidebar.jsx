import React, { useState } from 'react';
import {
  Scissors,
  FileVideo,
  Minimize2,
  Layers,
  Sparkles,
  RotateCw,
  FlipHorizontal,
  Crop,
  Maximize2,
  Gauge,
  RotateCcw,
  VolumeX,
  Music,
  Camera,
  Image as ImageIcon,
  Sliders,
  Type,
  Search,
  CheckCircle2,
  Film,
  Zap,
  SplitSquareVertical,
  AudioLines,
  FileText,
  Wand2,
  ArrowRightLeft
} from 'lucide-react';

export const TOOL_CATEGORIES = [
  {
    name: 'Format Conversion',
    tools: [
      { id: 'converter', name: 'Video Format Conversion', desc: 'Convert between MP4, WebM, MOV, and MKV', icon: FileVideo, badge: 'Popular' },
      { id: 'video-to-gif', name: 'Video to GIF', desc: 'Turn video clips into animated high-quality GIFs', icon: ImageIcon },
      { id: 'photos-to-video', name: 'Photos to Video', desc: 'Create slideshow video from photos and images', icon: Film }
    ]
  },
  {
    name: 'Image & Photo Tools',
    tools: [
      { id: 'png-to-jpg', name: 'PNG to JPG', desc: 'Convert transparent or standard PNG to optimized JPG', icon: ArrowRightLeft, badge: 'Hot' },
      { id: 'jpg-to-png', name: 'JPG to PNG', desc: 'Convert JPG to lossless PNG image format', icon: ImageIcon },
      { id: 'image-converter', name: 'Image Format Converter', desc: 'Convert between WebP, PNG, and JPG with quality tuning', icon: ArrowRightLeft },
      { id: 'image-compressor', name: 'Image Compression', desc: 'Reduce image file size with smart quality control', icon: Minimize2, badge: 'Fast' },
      { id: 'image-bg-remover', name: 'Remove Background', desc: 'Remove solid white/color backgrounds to transparent PNG', icon: Wand2, badge: 'AI/Key' }
    ]
  },
  {
    name: 'PDF & Documents',
    tools: [
      { id: 'pdf-to-image', name: 'PDF to Images', desc: 'Rasterize PDF pages into high-DPI PNG or JPG images', icon: FileText, badge: 'New' },
      { id: 'image-to-pdf', name: 'Images to PDF', desc: 'Merge multiple photos into a clean multi-page PDF', icon: Layers, badge: 'Popular' }
    ]
  },
  {
    name: 'Video Compression',
    tools: [
      { id: 'compressor', name: 'Video Compression', desc: 'Reduce video size with smart bitrate and scale presets', icon: Minimize2, badge: 'Fast' }
    ]
  },
  {
    name: 'Editing & Processing',
    tools: [
      { id: 'trimmer', name: 'Video Trimming', desc: 'Cut and trim video with 0.1s visual timeline precision', icon: Scissors, badge: 'Hot' },
      { id: 'splitter', name: 'Video Splitter', desc: 'Split videos into story clips or equal duration segments', icon: SplitSquareVertical },
      { id: 'merger', name: 'Video Merger', desc: 'Combine and concatenate multiple clips into one', icon: Layers },
      { id: 'watermark', name: 'Add Watermark', desc: 'Overlay logo image or custom text with styling', icon: Type },
      { id: 'color-adjust', name: 'Color Adjustment', desc: 'Adjust brightness, contrast, saturation, and filters', icon: Sliders },
      { id: 'rotator', name: 'Rotate Video', desc: 'Rotate video 90°, 180°, or 270° without re-upload', icon: RotateCw },
      { id: 'flipper', name: 'Flip Video', desc: 'Mirror video horizontally or vertically', icon: FlipHorizontal },
      { id: 'cropper', name: 'Crop Video Frame', desc: 'Crop frame to 16:9, 9:16 (TikTok), 1:1, or custom area', icon: Crop },
      { id: 'resizer', name: 'Video Resizer', desc: 'Scale to 4K, 1080p, 720p, or custom dimensions', icon: Maximize2 },
      { id: 'speed', name: 'Change Video Speed', desc: 'Speed up or slow down video from 0.25x to 4x', icon: Gauge },
      { id: 'reverser', name: 'Reverse Video', desc: 'Rewind and play video backwards frame-by-frame', icon: RotateCcw }
    ]
  },
  {
    name: 'Extract & Export',
    tools: [
      { id: 'thumbnail', name: 'Extract Thumbnails', desc: 'Capture crisp full-res frames or interval gallery', icon: Camera },
      { id: 'audio-extractor', name: 'Extract Audio', desc: 'Strip video track and export high-fidelity WAV audio', icon: AudioLines },
      { id: 'audio-remover', name: 'Remove Audio (Mute)', desc: 'Strip and silence audio tracks from video', icon: VolumeX },
      { id: 'bg-music', name: 'Add Background Music', desc: 'Mix background soundtrack with volume balancing', icon: Music }
    ]
  }
];

export default function Sidebar({ activeTool, onSelectTool, isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = TOOL_CATEGORIES.map(category => ({
    ...category,
    tools: category.tools.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(c => c.tools.length > 0);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <a href="#home" className="brand-logo" onClick={() => onSelectTool('dashboard')}>
          <div className="brand-icon-wrap">
            <Zap size={20} />
          </div>
          <span className="brand-name">VideoKit</span>
        </a>
      </div>

      <div className="sidebar-search">
        <div className="search-input-box">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search all video & image tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="sidebar-content">
        {filteredCategories.map((group) => (
          <div key={group.name}>
            <p className="sidebar-group-title">{group.name}</p>
            <ul className="sidebar-nav-list">
              {group.tools.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <li key={tool.id}>
                    <button
                      className={`nav-tool-btn ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onSelectTool(tool.id);
                        if (onClose) onClose();
                      }}
                    >
                      <IconComponent className="nav-icon" />
                      <span className="truncate">{tool.name}</span>
                      {tool.badge && <span className="tool-badge">{tool.badge}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
