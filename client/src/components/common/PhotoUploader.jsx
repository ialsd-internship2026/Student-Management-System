import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

export default function PhotoUploader({
  photo = '',
  onPhotoChange,
  initials = '?',
  label = 'Profile Photo',
  presetPhotos = [],
  idPrefix = 'photo'
}) {
  const fileInputRef = useRef(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photo]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      alert('Photo is too large (max 2.5MB). Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onPhotoChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected if desired
    e.target.value = '';
  };

  return (
    <div className="photo-uploader-component">
      <label className="form-label">{label}</label>

      <div className="photo-uploader-main">
        {/* Preview Circle */}
        <div className="photo-preview-circle">
          {photo && !imgError ? (
            <img
              src={photo}
              alt="Profile preview"
              className="photo-preview-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="photo-preview-initials">{initials}</span>
          )}
          <button
            type="button"
            className="photo-camera-badge-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload photo from device"
          >
            <Camera size={13} />
          </button>
        </div>

        {/* Upload Controls */}
        <div className="photo-controls-col">
          <div className="photo-btn-row">
            <button
              type="button"
              className="btn btn-secondary btn-sm photo-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} />
              <span>Choose photo file</span>
            </button>

            {photo && (
              <button
                type="button"
                className="btn btn-danger btn-sm photo-remove-btn"
                onClick={() => onPhotoChange('')}
                title="Remove current photo"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              id={`${idPrefix}-file-input`}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Web URL input fallback */}
          <div className="photo-url-wrap">
            <input
              type="url"
              className="text-input photo-url-input"
              placeholder="Or paste web image link (https://...)"
              value={typeof photo === 'string' && photo.startsWith('data:') ? '' : (photo || '')}
              onChange={(e) => onPhotoChange(e.target.value)}
            />
          </div>

          {/* Preset Sample Avatars */}
          {presetPhotos.length > 0 && (
            <div className="photo-presets-row">
              <span className="photo-presets-label">Sample avatars:</span>
              <div className="photo-preset-chips">
                {presetPhotos.map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`photo-preset-chip-btn ${photo === presetUrl ? 'active' : ''}`}
                    onClick={() => onPhotoChange(presetUrl)}
                    title={`Select sample avatar ${idx + 1}`}
                  >
                    <img
                      src={presetUrl}
                      alt={`Sample ${idx + 1}`}
                      className="photo-preset-img"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
