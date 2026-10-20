import React from 'react';
import { TOOL_CATEGORIES } from './Sidebar';
import { ShieldCheck, Zap, Cpu, Sparkles, ArrowRight, UploadCloud } from 'lucide-react';
import FileDropzone from './FileDropzone';

export default function Dashboard({ onSelectTool, onFileSelected, onLoadSample }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto', padding: '20px 0 10px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--accent-cyan)',
          marginBottom: '16px'
        }}>
          <Sparkles size={14} />
          <span>Next-Generation In-Browser Media Toolkit</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.75rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '16px'
        }}>
          Fast, Free & Private Online <span style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Video Toolkit</span>
        </h1>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          lineHeight: 1.6,
          marginBottom: '28px'
        }}>
          Process, trim, compress, convert, and edit videos entirely inside your browser. No files are ever uploaded to any server — keeping your bandwidth at zero and your data 100% private.
        </p>

        {/* Hero Feature Pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Zero Server Uploads</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Cpu size={16} color="#06b6d4" />
            <span>Hardware Accelerated</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Zap size={16} color="#eab308" />
            <span>Zero Bandwidth Consumption</span>
          </div>
        </div>

        {/* Direct Upload Dropzone in Hero */}
        <FileDropzone
          onFileSelected={onFileSelected}
          onLoadSample={onLoadSample}
          label="Drop your video here to get started with any tool"
        />
      </div>

      {/* Categorized Tools Catalog */}
      <div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>Explore All Video Tools</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {TOOL_CATEGORIES.map((category) => (
            <div key={category.name}>
              <h3 style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-dim)',
                marginBottom: '14px'
              }}>
                {category.name}
              </h3>

              <div className="tools-grid">
                {category.tools.map((tool) => {
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
                        gap: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--accent-primary)'
                      }}>
                        <span>Open Tool</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
