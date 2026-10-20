import React, { useState, useRef } from 'react';
import { UploadCloud, Film, Sparkles, FileVideo } from 'lucide-react';

export default function FileDropzone({ onFileSelected, onLoadSample, acceptedTypes = 'video/*', label = 'Drop your video here or browse' }) {
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
        <UploadCloud size={32} />
      </div>

      <h3 className="dropzone-title">{label}</h3>
      <p className="dropzone-sub">
        Supports MP4, WebM, MOV, MKV, AVI, M4V &bull; 100% processed on your machine
      </p>

      <div className="dropzone-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="btn btn-primary"
          onClick={() => inputRef.current?.click()}
        >
          <FileVideo size={16} />
          <span>Select Video File</span>
        </button>

        {onLoadSample && (
          <button
            className="btn btn-secondary"
            onClick={onLoadSample}
          >
            <Sparkles size={16} color="#06b6d4" />
            <span>Use Demo Video</span>
          </button>
        )}
      </div>
    </div>
  );
}
