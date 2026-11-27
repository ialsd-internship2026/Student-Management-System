import React, { useState } from 'react';
import {
  LayoutGrid,
  Calendar,
  BookOpen,
  CheckSquare,
  Users,
  GraduationCap,
  HelpCircle,
  Settings,
  FolderOpen,
  ChevronsUpDown,
  Sparkles,
  X,
  Check,
  Edit2,
  LogOut
} from 'lucide-react';

export default function Sidebar({
  workspace, // 'admin' | 'teacher'
  onWorkspaceChange,
  activeNav,
  onNavChange,
  isOpen,
  onClose,
  branding = { name: 'aster', tagline: 'INSTITUTE' },
  onUpdateBranding,
  isEditSession,
  termWidget,
  onOpenEditTermWidget,
  onOpenCustomizer,
  adminUser,
  teacherUser,
  onOpenEditProfile,
  onLogout
}) {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [brandForm, setBrandForm] = useState(branding);

  // Nav menus based on workspace
  const adminNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'schedule', label: 'Schedule management', icon: Calendar },
    { id: 'courses', label: 'Courses & sections', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'students', label: 'Students & results', icon: GraduationCap },
    { id: 'teachers', label: 'Teachers', icon: Users },
  ];

  const teacherNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'attendance', label: 'Attendance sheet', icon: CheckSquare },
    { id: 'students', label: 'Students & results', icon: GraduationCap },
    { id: 'schedule', label: 'Class schedule', icon: Calendar },
    { id: 'resources', label: 'Resources', icon: FolderOpen },
  ];

  const currentNavItems = workspace === 'admin' ? adminNavItems : teacherNavItems;

  const handleWorkspaceSelect = (newWorkspace) => {
    onWorkspaceChange(newWorkspace);
    setWorkspaceMenuOpen(false);
  };

  const handleBrandSave = (e) => {
    e.preventDefault();
    if (onUpdateBranding) {
      onUpdateBranding(brandForm);
    }
    setIsEditingBrand(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar-container ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-wrapper">
          {!isEditingBrand ? (
            <div
              className={`brand-logo-lockup ${isEditSession ? 'editable-brand' : ''}`}
              onClick={() => {
                if (isEditSession) {
                  setBrandForm(branding);
                  setIsEditingBrand(true);
                }
              }}
              title={isEditSession ? 'Click to customize institute name & tagline' : ''}
            >
              <div className="brand-icon">
                {branding?.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt="Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                  />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="aster-star">
                    <path
                      d="M12 2L14.2 8.5L20.5 10.5L14.2 12.5L12 19L9.8 12.5L3.5 10.5L9.8 8.5L12 2Z"
                      fill="white"
                    />
                  </svg>
                )}
              </div>
              <div className="brand-text">
                <span className="brand-name">{branding.name}</span>
                <span className="brand-tagline">{branding.tagline}</span>
              </div>
              {isEditSession && <Edit2 size={12} className="brand-edit-icon" />}
            </div>
          ) : (
            <form onSubmit={handleBrandSave} className="brand-edit-form">
              <input
                type="text"
                className="text-input brand-input"
                value={brandForm.name}
                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                placeholder="School name"
                autoFocus
              />
              <input
                type="text"
                className="text-input brand-input-sub"
                value={brandForm.tagline}
                onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })}
                placeholder="Tagline / ACADEMY"
              />
              <div className="brand-edit-btns">
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditingBrand(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <button className="mobile-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        {/* Workspace Switcher Selector */}
        <div className="workspace-switcher-wrapper">
          <button
            className="workspace-selector-btn"
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            aria-expanded={workspaceMenuOpen}
          >
            <div className="workspace-info">
              <span className="workspace-title">
                {workspace === 'admin' ? 'Admin workspace' : 'Teacher workspace'}
              </span>
              <span className="workspace-subtitle">
                {workspace === 'admin' ? 'Institute-wide access' : 'Assigned classes only'}
              </span>
            </div>
            <ChevronsUpDown size={16} className="workspace-chevron" />
          </button>

          {workspaceMenuOpen && (
            <div className="workspace-dropdown-menu">
              <div className="workspace-dropdown-header">Switch Workspace</div>
              <button
                className={`workspace-option ${workspace === 'admin' ? 'selected' : ''}`}
                onClick={() => handleWorkspaceSelect('admin')}
              >
                <div>
                  <div className="option-title">Admin workspace</div>
                  <div className="option-subtitle">Institute-wide access (Courses, Teachers, Staff)</div>
                </div>
                {workspace === 'admin' && <Check size={16} className="check-icon" />}
              </button>

              <button
                className={`workspace-option ${workspace === 'teacher' ? 'selected' : ''}`}
                onClick={() => handleWorkspaceSelect('teacher')}
              >
                <div>
                  <div className="option-title">Teacher workspace</div>
                  <div className="option-subtitle">Assigned classes (10-A, 10-B Grade records)</div>
                </div>
                {workspace === 'teacher' && <Check size={16} className="check-icon" />}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-nav-section">
          <div className="nav-group-label">WORKSPACE</div>
          <nav className="sidebar-nav-list">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onNavChange(item.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                >
                  <Icon size={18} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Motivational Term Progress Card */}
        <div
          className="term-progress-card clickable-widget"
          onClick={onOpenEditTermWidget}
          title="Click to edit term progress & quote"
        >
          <div className="progress-card-title-row">
            <div className="progress-card-title">{termWidget?.title || 'A little progress, every day.'}</div>
            <Edit2 size={12} className="widget-edit-hint" />
          </div>
          <div className="progress-card-meta">{termWidget?.meta || 'Fall term 2026 Week 6 of 16'}</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${termWidget?.percentage ?? 37.5}%` }} />
          </div>
          <div className="progress-dates">{termWidget?.dates || '31 Aug – 18 Dec'}</div>
        </div>

        {/* Spacer */}
        <div className="sidebar-spacer" />

        {/* Support & Settings Links */}
        <div className="sidebar-utility-links">
          <button className="utility-link" onClick={() => alert('Aster Help & Support: Contact support@aster.edu or consult the faculty handbook.')}>
            <HelpCircle size={17} />
            <span>Help & support</span>
          </button>
          <button
            className="utility-link"
            onClick={onOpenCustomizer}
            title="Open Portal Settings & Customizer"
          >
            <Settings size={17} />
            <span>Settings & Themes</span>
          </button>
          {onLogout && (
            <button
              className="utility-link"
              onClick={onLogout}
              title="Sign Out of Portal"
              style={{ color: '#ef4444' }}
            >
              <LogOut size={17} />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* User Profile Card */}
        <div
          className="sidebar-user-card editable-user-card"
          onClick={onOpenEditProfile}
          title="Click to edit your name, role, and persona details"
        >
          <div className="user-avatar-circle" style={{ overflow: 'hidden', padding: 0 }}>
            {workspace === 'admin' ? (
              adminUser?.photo ? (
                <img
                  src={adminUser.photo}
                  alt={adminUser.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (adminUser?.initials || 'OC')
            ) : (
              teacherUser?.photo ? (
                <img
                  src={teacherUser.photo}
                  alt={teacherUser.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (teacherUser?.initials || 'DR')
            )}
          </div>
          <div className="user-details">
            <div className="user-name-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="user-name">
                {workspace === 'admin' ? (adminUser?.name || 'Olivia Chen') : (teacherUser?.name || 'Daniel Reed')}
              </span>
              <Edit2 size={11} className="profile-edit-hint" style={{ color: 'var(--slate-400)' }} />
            </div>
            <div className="user-role">
              {workspace === 'admin' ? (adminUser?.role || 'Institute administrator') : (teacherUser?.role || 'Mathematics faculty')}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
