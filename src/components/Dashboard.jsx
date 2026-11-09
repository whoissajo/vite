import React, { useState } from 'react';
import { TOOL_CATEGORIES } from './Sidebar';
import {
  ShieldCheck,
  Zap,
  Cpu,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Chrome,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Lock,
  HardDrive,
  Gauge,
  Layers,
  FileVideo,
  Image as ImageIcon,
  FileText,
  Sliders,
  Scissors
} from 'lucide-react';
import FileDropzone from './FileDropzone';

export default function Dashboard({ onSelectTool, onFileSelected, onLoadSample, onOpenExtensionModal }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'video' | 'image' | 'pdf' | 'audio'
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Flatten tools with category metadata
  const allTools = TOOL_CATEGORIES.flatMap(cat =>
    cat.tools.map(tool => ({
      ...tool,
      categoryName: cat.name,
      categoryKey: cat.name.toLowerCase().includes('video') || cat.name.toLowerCase().includes('format') || cat.name.toLowerCase().includes('edit')
        ? 'video'
        : cat.name.toLowerCase().includes('image')
          ? 'image'
          : cat.name.toLowerCase().includes('pdf')
            ? 'pdf'
            : cat.name.toLowerCase().includes('extract')
              ? 'audio'
              : 'video'
    }))
  );

  const filteredTools = allTools.filter(t => {
    const matchesFilter = selectedFilter === 'all' || t.categoryKey === selectedFilter;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: 'Does VideoKit really work with no internet or low connection?',
      a: 'Yes, 100%! All video encoding, audio extraction, image compression, and PDF conversions run purely on your computer hardware using HTML5 Canvas, WebCodecs, and the Web Audio API. You can disconnect your Wi-Fi, turn on Airplane Mode, or travel with zero connectivity, and all tools continue to function instantaneously.'
    },
    {
      q: 'Are my confidential media and documents uploaded to any server?',
      a: 'Never. VideoKit has zero backend processing servers. When you drop a video, photo, or PDF into VideoKit, it is loaded into your browser’s local RAM. No bytes are ever transmitted over the network, providing physics-level privacy.'
    },
    {
      q: 'Does the video compressor actually compress and reduce file size?',
      a: 'Absolutely! Our compressor re-encodes the video stream via hardware-accelerated MediaRecorder using calibrated bitrate controls (e.g. 500kbps to 4000kbps) and intelligent resolution scaling (1080p, 720p, 480p), delivering real 30% to 75% file size reductions.'
    },
    {
      q: 'How do I use this as a standalone desktop browser extension?',
      a: 'We built a complete Manifest V3 Chrome Extension located inside the `extension/` folder of this project! Click "Offline Extension" in the header or landing page, open chrome://extensions, toggle Developer Mode, and click "Load unpacked" to install it in 10 seconds.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '40px' }}>
      {/* Hero Section */}
      <div className="hero-aceternity-wrapper">
        {/* Ambient Glow Orbs */}
        <div className="hero-glow-orb hero-glow-1" />
        <div className="hero-glow-orb hero-glow-2" />

        <div style={{ textAlign: 'center', maxWidth: '880px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Top Announcement Pill */}
          <div className="announcement-badge">
            <span className="badge-pulse-dot" />
            <Sparkles size={14} color="#06b6d4" />
            <span>100% In-Browser &bull; Zero Server Uploads &bull; Works Completely Offline</span>
          </div>

          <h1 className="hero-main-title">
            The Ultimate Offline <br />
            <span className="gradient-shimmer-text">Media & Document Toolkit</span>
          </h1>

          <p className="hero-subtext">
            Compress, trim, convert, and edit videos, photos, and PDFs entirely inside your browser.
            Zero cloud queues, zero bandwidth waste, and absolute physics-level privacy.
          </p>

          {/* Quick Capability Feature Badges */}
          <div className="hero-pill-badges">
            <div className="hero-pill">
              <ShieldCheck size={16} color="#10b981" />
              <span>100% Private (No Cloud)</span>
            </div>
            <div className="hero-pill">
              <Cpu size={16} color="#06b6d4" />
              <span>GPU Hardware Accelerated</span>
            </div>
            <div className="hero-pill">
              <Zap size={16} color="#eab308" />
              <span>Airplane-Mode Ready</span>
            </div>
            <div className="hero-pill">
              <HardDrive size={16} color="#8b5cf6" />
              <span>Zero Bandwidth Consumption</span>
            </div>
          </div>

          {/* Dropzone right in Hero */}
          <div style={{ marginTop: '28px' }}>
            <FileDropzone
              onFileSelected={onFileSelected}
              onLoadSample={onLoadSample}
              label="Drop any Video, Photo, or PDF here to launch"
            />
          </div>
        </div>
      </div>

      {/* Bento Grid Feature Showcase (Aceternity / 21st.dev style) */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Engineered for Modern Offline & High-Speed Media
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
            Why millions prefer client-side WebCodecs over slow cloud converters
          </p>
        </div>

        <div className="bento-grid">
          {/* Card 1 */}
          <div className="bento-card bento-card-large">
            <div className="bento-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Lock size={24} />
            </div>
            <h3 className="bento-title">Physics-Level Data Privacy</h3>
            <p className="bento-desc">
              Your confidential contracts, private videos, and sensitive documents never touch an external server or API. They reside strictly in your device’s volatile RAM.
            </p>
            <div className="bento-highlight-badge" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <span>Zero Cloud Leaks &bull; GDPR & HIPAA Compliant by Design</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bento-card">
            <div className="bento-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              <Cpu size={24} />
            </div>
            <h3 className="bento-title">Hardware GPU Acceleration</h3>
            <p className="bento-desc">
              Renders and compresses frames using your computer’s internal graphics processor via HTML5 Canvas and native WebCodecs.
            </p>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Up to 10&times; faster than uploading 1GB to cloud
            </span>
          </div>

          {/* Card 3 */}
          <div className="bento-card">
            <div className="bento-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <Zap size={24} />
            </div>
            <h3 className="bento-title">Zero Mobile Bandwidth Cost</h3>
            <p className="bento-desc">
              Compress a 500MB video without uploading 500MB and downloading 200MB. Zero data consumption on limited hotspot or mobile plans.
            </p>
            <span style={{ fontSize: '0.8rem', color: '#facc15', fontWeight: 600 }}>
              100% Free Forever &bull; No Upload Quotas
            </span>
          </div>

          {/* Card 4 - Chrome Extension Banner */}
          <div className="bento-card bento-card-large bento-extension-cta" onClick={onOpenExtensionModal}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="bento-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                <Chrome size={24} />
              </div>
              <span className="tool-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                Chrome & Edge Extension Ready
              </span>
            </div>
            <h3 className="bento-title" style={{ marginTop: '12px' }}>
              Install as 100% Offline PC Extension
            </h3>
            <p className="bento-desc">
              Load our bundled <code style={{ color: 'var(--accent-cyan)' }}>extension/</code> package in developer mode to access all tools directly in your browser without ever navigating to a website.
            </p>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.88rem' }}>
              <span>Click to view 3-step installation guide</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tools Directory & Catalog */}
      <div id="tools-catalog">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Explore All 20+ In-Browser Tools
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
              Select any tool to start editing, compressing, or converting immediately
            </p>
          </div>

          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            width: '280px'
          }}>
            <Search size={16} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Search tools by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button
                className="icon-btn"
                style={{ width: '20px', height: '20px', padding: 0 }}
                onClick={() => setSearchQuery('')}
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {[
            { id: 'all', label: `All Tools (${allTools.length})` },
            { id: 'video', label: 'Video & Motion', icon: FileVideo },
            { id: 'image', label: 'Images & Photos', icon: ImageIcon },
            { id: 'pdf', label: 'PDF Documents', icon: FileText },
            { id: 'audio', label: 'Audio & Music', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              className={`filter-preset-pill ${selectedFilter === tab.id ? 'active' : ''}`}
              onClick={() => setSelectedFilter(tab.id)}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="tools-grid">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="tool-card"
                onClick={() => onSelectTool(tool.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="tool-card-icon-box">
                    <Icon size={22} />
                  </div>
                  {tool.badge && (
                    <span className="tool-badge">{tool.badge}</span>
                  )}
                </div>

                <h4 className="tool-card-title">{tool.name}</h4>
                <p className="tool-card-desc">{tool.desc}</p>

                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--accent-primary)'
                }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 500 }}>
                    {tool.categoryName}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Launch</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTools.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No tools found matching "{searchQuery}"</p>
            <button className="btn btn-secondary" onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}>
              Reset Search Filter
            </button>
          </div>
        )}
      </div>

      {/* Comparison: VideoKit vs Cloud Converters */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
          Why Client-Side Local Processing Wins
        </h3>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '28px' }}>
          Comparison between VideoKit (In-Browser) and traditional cloud converter sites
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th style={{ color: 'var(--accent-cyan)' }}>VideoKit (Offline / Local)</th>
                <th style={{ color: 'var(--text-dim)' }}>Traditional Cloud Converters</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Internet Requirement</strong></td>
                <td><span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> 0% Internet (Runs in Airplane Mode)</span></td>
                <td><span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={16} /> High-speed internet required</span></td>
              </tr>
              <tr>
                <td><strong>Privacy & Confidentiality</strong></td>
                <td><span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> 100% Private in RAM (0 bytes sent)</span></td>
                <td><span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={16} /> Stored on remote servers</span></td>
              </tr>
              <tr>
                <td><strong>Upload & Download Waiting</strong></td>
                <td><span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> Instant (Zero upload delay)</span></td>
                <td><span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={16} /> Minutes spent waiting for upload</span></td>
              </tr>
              <tr>
                <td><strong>File Size Limits</strong></td>
                <td><span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> Unlimited (Bounded only by RAM)</span></td>
                <td><span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={16} /> Restricted to 50MB - 100MB</span></td>
              </tr>
              <tr>
                <td><strong>Pricing & Subscriptions</strong></td>
                <td><span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> 100% Free Forever & Open</span></td>
                <td><span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={16} /> Monthly subscriptions & paywalls</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
          Frequently Asked Questions
        </h3>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '24px' }}>
          Everything you need to know about in-browser media processing
        </p>

        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-panel"
              style={{ padding: '16px 20px', cursor: 'pointer', transition: 'border-color var(--transition-fast)' }}
              onClick={() => toggleFaq(idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.98rem' }}>{faq.q}</span>
                {openFaqIndex === idx ? <ChevronUp size={18} color="#06b6d4" /> : <ChevronDown size={18} />}
              </div>
              {openFaqIndex === idx && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '12px', lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
