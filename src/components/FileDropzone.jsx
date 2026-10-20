import React, { useState, useRef } from 'react';
import { UploadCloud, Film, Sparkles, FileVideo, Image as ImageIcon, FileText } from 'lucide-react';

export default function FileDropzone({
  onFileSelected,
  onLoadSample,
  acceptedTypes = 'video/*,image/*,application/pdf',
  label = 'Drop your video, image, or PDF here',
  fileCategory = 'all' // 'video' | 'image' | 'pdf' | 'all'
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const IconComponent = fileCategory === 'image' ? ImageIcon : fileCategory === 'pdf' ? FileText : UploadCloud;

  return (
    <div
      className={`dropzone-container ${isDragActive ? 'drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      <div className="dropzone-icon-circle">
        <IconComponent size={32} />
      </div>

      <h3 className="dropzone-title">{label}</h3>
      <p className="dropzone-sub">
        Supports MP4, WebM, MOV, PNG, JPG, WebP, PDF &bull; 100% In-Browser & Private
      </p>

      <div className="dropzone-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="btn btn-primary"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud size={16} />
          <span>Browse File</span>
        </button>

        {onLoadSample && (
          <button
            className="btn btn-secondary"
            onClick={onLoadSample}
          >
            <Sparkles size={16} color="#06b6d4" />
            <span>Use Demo File</span>
          </button>
        )}
      </div>
    </div>
  );
}
