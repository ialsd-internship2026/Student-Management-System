import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Trash2, Cloud, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { uploadAPI } from '../../services/api';

export default function PhotoUploader({
  photo = '',
  onPhotoChange,
  initials = '?',
  label = 'Profile Photo',
  presetPhotos = [],
  idPrefix = 'photo',
  folder = 'profiles'
}) {
  const fileInputRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // 'success' | 'error' | ''
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setImgError(false);
  }, [photo]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, GIF, SVG).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('File exceeds 8MB. Please choose a smaller image.');
      return;
    }

    // Set immediate local preview
    const localPreviewUrl = URL.createObjectURL(file);
    onPhotoChange(localPreviewUrl);
    setIsUploading(true);
    setUploadStatus('');
    setErrorMessage('');

    try {
      // Upload directly to ImageKit cloud storage via backend proxy
      const response = await uploadAPI.uploadFile(file, folder);
      if (response?.url) {
        onPhotoChange(response.url);
        setUploadStatus('success');
      } else {
        throw new Error(response?.message || 'Failed to get cloud URL');
      }
    } catch (err) {
      console.warn('[PhotoUploader] ImageKit upload error, falling back:', err);
      setUploadStatus('error');
      setErrorMessage(err.message || 'Cloud upload failed');
      // Keep local preview as fallback
    } finally {
      setIsUploading(false);
      // Reset file input so user can pick the same file again if desired
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isCloudImage = typeof photo === 'string' && (photo.includes('imagekit.io') || photo.includes('ik.imagekit.io'));

  return (
    <div className="photo-uploader-component">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label className="form-label" style={{ margin: 0 }}>{label}</label>
        {isCloudImage && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
            <Cloud size={12} /> ImageKit Cloud
          </span>
        )}
      </div>

      <div className="photo-uploader-main">
        {/* Preview Circle */}
        <div className="photo-preview-circle" style={{ position: 'relative' }}>
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

          {isUploading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}

          <button
            type="button"
            className="photo-camera-badge-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload photo from device"
            disabled={isUploading}
          >
            <Camera size={13} />
          </button>
        </div>

        {/* Upload Controls */}
        <div className="photo-controls-col">
          <div className="photo-btn-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm photo-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isUploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Uploading to Cloud...</span>
                </>
              ) : (
                <>
                  <Upload size={13} />
                  <span>Upload Image (Cloud)</span>
                </>
              )}
            </button>

            {photo && !isUploading && (
              <button
                type="button"
                className="btn btn-danger btn-sm photo-remove-btn"
                onClick={() => {
                  onPhotoChange('');
                  setUploadStatus('');
                }}
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

          {/* Cloud Upload Status feedback */}
          {uploadStatus === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#059669', marginTop: '4px' }}>
              <CheckCircle2 size={13} />
              <span>Uploaded & hosted on ImageKit CDN</span>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#e11d48', marginTop: '4px' }}>
              <AlertCircle size={13} />
              <span>{errorMessage || 'Cloud upload failed (using local preview)'}</span>
            </div>
          )}

          {/* Web URL input fallback */}
          <div className="photo-url-wrap" style={{ marginTop: '6px' }}>
            <input
              type="url"
              className="text-input photo-url-input"
              placeholder="Or paste web image link (https://...)"
              value={typeof photo === 'string' && photo.startsWith('blob:') ? '' : (photo || '')}
              onChange={(e) => {
                onPhotoChange(e.target.value);
                setUploadStatus('');
              }}
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
                    onClick={() => {
                      onPhotoChange(presetUrl);
                      setUploadStatus('');
                    }}
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
