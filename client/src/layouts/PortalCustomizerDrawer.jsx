import React from 'react';
import {
  X,
  Palette,
  School,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  User,
  Sliders,
  Download,
  GraduationCap,
  Compass,
  Cloud
} from 'lucide-react';
import PhotoUploader from '../components/common/PhotoUploader';
import { uploadAPI } from '../services/api';

export default function PortalCustomizerDrawer({
  isOpen,
  onClose,
  branding,
  onUpdateBranding,
  theme,
  onToggleTheme,
  primaryColor,
  onChangePrimaryColor,
  adminUser,
  onUpdateAdminUser,
  teacherUser,
  onUpdateTeacherUser,
  defaultNav,
  onChangeDefaultNav,
  onSaveAsDefault,
  onResetDefaults,
  courses,
  students,
  sections,
  showToast,
  onOpenMonumentsTour,
  isColorFlowActive = true,
  onToggleColorFlow
}) {
  if (!isOpen) return null;

  const colorThemes = [
    { id: 'indigo', name: 'Aster Indigo', primary: '#4f46e5', accent: '#6366f1', lightBg: '#f5f3ff' },
    { id: 'blue', name: 'Ocean Blue', primary: '#2563eb', accent: '#3b82f6', lightBg: '#eff6ff' },
    { id: 'emerald', name: 'Emerald Green', primary: '#059669', accent: '#10b981', lightBg: '#ecfdf5' },
    { id: 'violet', name: 'Royal Violet', primary: '#7c3aed', accent: '#8b5cf6', lightBg: '#fbf7ff' },
    { id: 'rose', name: 'Crimson Rose', primary: '#e11d48', accent: '#f43f5e', lightBg: '#fff1f2' },
    { id: 'amber', name: 'Sunset Amber', primary: '#d97706', accent: '#f59e0b', lightBg: '#fffbeb' },
  ];

  const handleExportJSON = () => {
    const data = {
      branding,
      theme,
      primaryColor,
      adminUser,
      defaultNav,
      courses,
      students,
      sections,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aster_portal_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Portal configuration exported as JSON backup.');
  };

  return (
    <div className="customizer-backdrop" onClick={onClose}>
      <aside className="customizer-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="customizer-header">
          <div className="customizer-title-wrap">
            <Sliders size={20} className="customizer-header-icon" />
            <div>
              <h2 className="customizer-title">Portal Customizer & Settings</h2>
              <p className="customizer-subtitle">Configure institute identity, color themes, and starting defaults.</p>
            </div>
          </div>
          <button className="customizer-close-btn" onClick={onClose} aria-label="Close customizer">
            <X size={18} />
          </button>
        </div>

        <div className="customizer-body">
          {/* Section 1: Institute Branding */}
          <div className="customizer-section">
            <div className="section-label-row">
              <School size={16} />
              <span>Institute Identity & Branding</span>
            </div>

            <div className="customizer-form-group">
              <label className="field-label">Institute / School Name</label>
              <input
                type="text"
                className="text-input"
                value={branding.name}
                onChange={(e) => onUpdateBranding({ ...branding, name: e.target.value })}
                placeholder="e.g. Apex Academy or Stanford"
              />
            </div>

            <div className="customizer-form-group">
              <label className="field-label">Subtitle / Tagline</label>
              <input
                type="text"
                className="text-input"
                value={branding.tagline}
                onChange={(e) => onUpdateBranding({ ...branding, tagline: e.target.value })}
                placeholder="e.g. INSTITUTE or HIGH SCHOOL"
              />
            </div>

            {/* Cloud Image Uploads via ImageKit */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
              <PhotoUploader
                photo={branding.logoUrl || ''}
                onPhotoChange={(newUrl) => onUpdateBranding({ ...branding, logoUrl: newUrl })}
                initials={branding.name ? branding.name[0].toUpperCase() : 'A'}
                label="Institute Brand Logo (ImageKit Cloud)"
                idPrefix="brand-logo"
                folder="branding"
              />
            </div>

            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="field-label" style={{ margin: 0 }}>Landing Page Hero Image / Banner (Cloud)</label>
                {branding.heroImageUrl && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                    <Cloud size={12} /> ImageKit
                  </span>
                )}
              </div>

              {branding.heroImageUrl ? (
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)', marginBottom: '8px' }}>
                  <img
                    src={branding.heroImageUrl}
                    alt="Landing Hero Banner"
                    style={{ width: '100%', height: '110px', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateBranding({ ...branding, heroImageUrl: '' })}
                    className="btn btn-danger btn-sm"
                    style={{ position: 'absolute', top: '6px', right: '6px', padding: '3px 8px', fontSize: '11px' }}
                  >
                    Remove
                  </button>
                </div>
              ) : null}

              <PhotoUploader
                photo={branding.heroImageUrl || ''}
                onPhotoChange={(newUrl) => onUpdateBranding({ ...branding, heroImageUrl: newUrl })}
                initials="LP"
                label="Upload New Landing Page Banner"
                idPrefix="landing-hero"
                folder="landing"
              />

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={async () => {
                  try {
                    await uploadAPI.updateLandingSettings({
                      name: branding.name,
                      tagline: branding.tagline,
                      logoUrl: branding.logoUrl,
                      heroImageUrl: branding.heroImageUrl
                    });
                    showToast('Saved branding & landing images to cloud database.');
                  } catch (err) {
                    showToast(err.message || 'Failed to save to cloud.');
                  }
                }}
              >
                <Cloud size={14} />
                <span>Save Branding & Landing to Cloud</span>
              </button>
            </div>
          </div>

          {/* Section 2: Color Palette Accent */}
          <div className="customizer-section">
            <div className="section-label-row">
              <Palette size={16} />
              <span>Color Theme & Accents</span>
            </div>

            <div className="color-swatches-grid">
              {colorThemes.map((c) => (
                <button
                  key={c.id}
                  className={`color-swatch-card ${primaryColor === c.primary || primaryColor === c.id ? 'active' : ''}`}
                  onClick={() => {
                    onChangePrimaryColor(c.primary);
                    document.documentElement.style.setProperty('--primary-600', c.primary);
                    document.documentElement.style.setProperty('--primary-500', c.accent);
                    document.documentElement.style.setProperty('--primary-50', c.lightBg);
                  }}
                  title={`Switch to ${c.name} palette`}
                >
                  <span className="swatch-circle" style={{ backgroundColor: c.primary }} />
                  <span className="swatch-name">{c.name}</span>
                  {(primaryColor === c.primary || primaryColor === c.id) && <Check size={14} className="swatch-check" />}
                </button>
              ))}
            </div>

            {/* Continuous Smooth Color Flow Control */}
            <div style={{ marginTop: '14px', padding: '12px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: '#ec4899' }} />
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--slate-800)' }}>Liquid Color Flow Animation</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    backgroundColor: isColorFlowActive ? '#10b981' : 'var(--slate-400)',
                    color: '#ffffff',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    border: 'none'
                  }}
                  onClick={onToggleColorFlow}
                >
                  {isColorFlowActive ? 'ACTIVE (ON)' : 'PAUSED'}
                </button>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--slate-500)', margin: 0, lineHeight: 1.4 }}>
                {isColorFlowActive
                  ? '✨ Portal accent colors and ambient aurora mesh smoothly transition every 3.2s.'
                  : '⏸ Animation is paused. Using static custom accent color above.'}
              </p>
            </div>

            <div className="theme-mode-row" style={{ marginTop: '12px' }}>
              <span className="field-label">Color Scheme:</span>
              <button className="btn btn-secondary btn-sm" onClick={onToggleTheme}>
                Current: <strong>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong> (Click to switch)
              </button>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => {
                  onClose();
                  if (onOpenMonumentsTour) onOpenMonumentsTour();
                }}
              >
                <Compass size={16} />
                <span>Launch 7 World Wonders Tour (All 7 Photos)</span>
              </button>
            </div>
          </div>

          {/* Section 3: User Personas */}
          <div className="customizer-section">
            <div className="section-label-row">
              <User size={16} />
              <span>Active Administrator Persona</span>
            </div>

            <div className="customizer-form-row">
              <div className="customizer-form-group">
                <label className="field-label">Admin Full Name</label>
                <input
                  type="text"
                  className="text-input"
                  value={adminUser?.name || ''}
                  onChange={(e) => onUpdateAdminUser && onUpdateAdminUser({
                    ...adminUser,
                    name: e.target.value,
                    initials: e.target.value.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
                  })}
                />
              </div>

              <div className="customizer-form-group">
                <label className="field-label">Role Title</label>
                <input
                  type="text"
                  className="text-input"
                  value={adminUser?.role || ''}
                  onChange={(e) => onUpdateAdminUser && onUpdateAdminUser({ ...adminUser, role: e.target.value })}
                />
              </div>
            </div>

            {teacherUser && onUpdateTeacherUser && (
              <>
                <div className="section-label-row" style={{ marginTop: '14px' }}>
                  <GraduationCap size={16} />
                  <span>Class Teacher Persona</span>
                </div>

                <div className="customizer-form-row">
                  <div className="customizer-form-group">
                    <label className="field-label">Teacher Full Name</label>
                    <input
                      type="text"
                      className="text-input"
                      value={teacherUser.name || ''}
                      onChange={(e) => onUpdateTeacherUser({
                        ...teacherUser,
                        name: e.target.value,
                        initials: e.target.value.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
                      })}
                    />
                  </div>

                  <div className="customizer-form-group">
                    <label className="field-label">Role & Subject</label>
                    <input
                      type="text"
                      className="text-input"
                      value={teacherUser.role || ''}
                      onChange={(e) => onUpdateTeacherUser({ ...teacherUser, role: e.target.value })}
                    />
                  </div>
                </div>

                <div className="customizer-form-group" style={{ marginTop: '8px' }}>
                  <label className="field-label">Assigned Class Section</label>
                  <select
                    className="select-input"
                    value={teacherUser.assignedClass || 'Grade 10-A'}
                    onChange={(e) => onUpdateTeacherUser({ ...teacherUser, assignedClass: e.target.value })}
                  >
                    <option value="Grade 10-A">Grade 10-A</option>
                    <option value="Grade 10-B">Grade 10-B</option>
                    <option value="Grade 11-A">Grade 11-A</option>
                    <option value="Grade 11-B">Grade 11-B</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Section 4: Default Landing View */}
          <div className="customizer-section">
            <div className="section-label-row">
              <Sparkles size={16} />
              <span>Starting Landing View</span>
            </div>

            <div className="nav-options-group">
              {[
                { id: 'courses', label: 'Courses & sections (Curriculum)' },
                { id: 'students', label: 'Students & results (Analytics)' },
                { id: 'overview', label: 'Overview (Institute Dashboard)' },
                { id: 'attendance', label: 'Attendance Sheet' },
                { id: 'schedule', label: 'Class Schedule (Timetable)' }
              ].map(opt => (
                <label key={opt.id} className="radio-option-card">
                  <input
                    type="radio"
                    name="defaultNav"
                    checked={defaultNav === opt.id}
                    onChange={() => onChangeDefaultNav(opt.id)}
                  />
                  <span className="radio-label">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 5: Backup & Master Default Actions */}
          <div className="customizer-section">
            <div className="section-label-row">
              <Save size={16} />
              <span>Master Default & Backup</span>
            </div>

            <p className="backup-desc">
              Save everything currently configured across all screens (courses, students, marks, timetable, branding) as the permanent starting state.
            </p>

            <div className="backup-buttons-row">
              <button className="btn btn-primary" onClick={onSaveAsDefault}>
                <Save size={15} />
                <span>Save as Permanent Default</span>
              </button>

              <button className="btn btn-secondary" onClick={handleExportJSON}>
                <Download size={15} />
                <span>Export JSON</span>
              </button>

              <button className="btn btn-danger btn-sm" onClick={onResetDefaults}>
                <RotateCcw size={14} />
                <span>Reset to Factory</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
