import React, { useState } from 'react';
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Sun,
  Moon,
  Save,
  RotateCcw,
  Check,
  ShieldCheck,
  Sliders,
  GraduationCap,
  Compass,
  HardDrive,
  AppWindow,
  RefreshCw,
  LogOut
} from 'lucide-react';

export default function Header({
  workspace,
  onWorkspaceChange,
  activeNav,
  onOpenMobileSidebar,
  onOpenSearch,
  theme,
  onToggleTheme,
  onSaveAsDefault,
  onResetDefaults,
  academicTerm = 'Fall 2026',
  onSelectTerm,
  onOpenCustomizer,
  adminUser,
  teacherUser,
  onOpenEditProfile,
  onOpenMonumentsTour,
  isColorFlowActive = true,
  onToggleColorFlow,
  diskSyncStatus = 'synced',
  lastSavedTime = null,
  onOpenAppWindow,
  onLogout
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Data science course draft ready to launch', time: '10m ago', unread: true },
    { id: 2, title: 'Midterm schedule updated for Grade 10', time: '1h ago', unread: true },
    { id: 3, title: 'Exam scores published by Daniel Reed', time: '3h ago', unread: false }
  ]);

  const navLabels = {
    overview: 'Overview',
    schedule: workspace === 'admin' ? 'Schedule management' : 'Class schedule',
    courses: 'Courses & sections',
    attendance: workspace === 'admin' ? 'Attendance' : 'Attendance sheet',
    students: 'Students & results',
    teachers: 'Teachers',
    resources: 'Resources'
  };

  const portalLabel = workspace === 'admin' ? 'Admin portal' : 'Teacher portal';
  const pageLabel = navLabels[activeNav] || 'Courses & sections';

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  return (
    <header className="header-container">
      <div className="header-left">
        <button
          className="mobile-hamburger-btn"
          onClick={onOpenMobileSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <nav className="header-breadcrumbs" aria-label="Breadcrumbs">
          <span className="crumb-parent">{portalLabel}</span>
          <ChevronRight size={14} className="crumb-separator" />
          <span className="crumb-current">{pageLabel}</span>
        </nav>
      </div>

      <div className="header-right">
        {/* Workspace Mode Switcher: Admin vs Class Teacher */}
        <div className="workspace-mode-toggle" title="Switch workspace mode">
          <button
            type="button"
            className={`mode-toggle-btn ${workspace === 'admin' ? 'active' : ''}`}
            onClick={() => onWorkspaceChange && onWorkspaceChange('admin')}
            title="Switch to Admin Workspace"
          >
            <ShieldCheck size={13} />
            <span>Admin</span>
          </button>
          <button
            type="button"
            className={`mode-toggle-btn ${workspace === 'teacher' ? 'active' : ''}`}
            onClick={() => onWorkspaceChange && onWorkspaceChange('teacher')}
            title="Switch to Class Teacher Workspace (Daniel Reed)"
          >
            <GraduationCap size={13} />
            <span>Class Teacher</span>
          </button>
        </div>

        {/* Master Save as Default Actions */}
        <div className="admin-actions-pill-group">
          <div
            className={workspace === 'teacher' ? "teacher-badge-indicator" : "admin-badge-indicator"}
            onClick={onOpenEditProfile}
            style={{ cursor: 'pointer' }}
            title={workspace === 'teacher' ? `Teacher: ${teacherUser?.name || 'Daniel Reed'} (Click to edit persona)` : `Admin: ${adminUser?.name || 'Olivia Chen'} (Click to edit persona)`}
          >
            {workspace === 'teacher' ? (
              <>
                <GraduationCap size={14} className="teacher-cap-icon" />
                <span>Teacher: {teacherUser?.name?.split(' ')[0] || 'Daniel'} ({teacherUser?.assignedClass ? teacherUser.assignedClass.replace('Grade ', '') : '10-A'})</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} className="admin-shield-icon" />
                <span>Admin: {adminUser?.name?.split(' ')[0] || 'Olivia'}</span>
              </>
            )}
          </div>

          {/* Live Disk Folder Sync Status Indicator */}
          <div
            className={`folder-sync-status-pill ${diskSyncStatus === 'saving' ? 'saving' : diskSyncStatus === 'error' ? 'error' : 'synced'}`}
            title={`Disk Sync: ${diskSyncStatus === 'saving' ? 'Writing changes directly to project folder files...' : 'All edits are permanently synced to project files on disk'}${lastSavedTime ? ` · Last: ${lastSavedTime}` : ''}`}
          >
            {diskSyncStatus === 'saving' ? (
              <RefreshCw size={11} className="spin-icon" />
            ) : diskSyncStatus === 'error' ? (
              <HardDrive size={11} style={{ color: '#ef4444' }} />
            ) : (
              <CheckCircle2 size={11} style={{ color: '#10b981' }} />
            )}
            <span>
              {diskSyncStatus === 'saving'
                ? 'Syncing to folder...'
                : diskSyncStatus === 'error'
                ? 'Folder sync err'
                : 'Folder auto-synced'}
            </span>
          </div>

          {/* Special Desktop App Window Mode */}
          <button
            type="button"
            className="btn-open-app-window"
            onClick={onOpenAppWindow}
            title="Launch Aster Portal in Special Standalone Desktop App Window (Edge App Mode)"
          >
            <AppWindow size={13} style={{ color: 'var(--primary-600)' }} />
            <span>App Mode</span>
          </button>

          <button
            className="btn-save-master-default"
            onClick={onSaveAsDefault}
            title="Set current portal configuration as the permanent default"
          >
            <Save size={13} />
            <span>Save as Default</span>
          </button>

          <button
            className="btn-reset-master-default"
            onClick={onResetDefaults}
            title="Reset portal data back to factory defaults"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="header-search-box" onClick={onOpenSearch}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            readOnly
            placeholder="Search your workspace"
            className="search-input"
          />
          <kbd className="search-shortcut">⌘ K</kbd>
        </div>

        {/* Academic Term Dropdown Pill */}
        <div className="term-selector-pill" title="Active academic term">
          <Calendar size={13} className="term-calendar-icon" />
          <select
            className="term-select-dropdown"
            value={academicTerm}
            onChange={(e) => onSelectTerm && onSelectTerm(e.target.value)}
            title="Change active academic term"
          >
            <option value="Fall 2026">Fall 2026</option>
            <option value="Spring 2027">Spring 2027</option>
            <option value="Summer 2027">Summer 2027</option>
            <option value="Academic Year 2026-27">Academic Year 2026-27</option>
          </select>
        </div>

        {/* Color Flow Smooth Animation Controller */}
        <button
          type="button"
          className={`btn-color-flow-toggle ${isColorFlowActive ? 'active' : ''}`}
          onClick={onToggleColorFlow}
          title={isColorFlowActive ? "Color Flow Animation: Active (Click to pause)" : "Color Flow Animation: Paused (Click to start)"}
          aria-label="Toggle Color Flow Animation"
        >
          <Sparkles size={13} className={isColorFlowActive ? "flow-sparkle-spin" : ""} />
          <span>{isColorFlowActive ? "🌈 Color Flow: ON" : "Color Flow: OFF"}</span>
        </button>

        {/* 7 Famous Monuments Showcase Tour */}
        <button
          className="header-icon-btn monument-tour-btn"
          onClick={onOpenMonumentsTour}
          title="Explore 7 World Monuments Loading Screen Showcase"
          aria-label="View 7 Wonders Showcase"
        >
          <Compass size={17} style={{ color: 'var(--primary-600)' }} />
        </button>

        {/* Theme Mode Toggle (Light / Dark) */}
        <button
          className="header-icon-btn theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={17} className="sun-icon" /> : <Moon size={17} />}
        </button>

        {/* Portal Customizer & Theme Settings */}
        <button
          className="header-icon-btn settings-toggle-btn"
          onClick={onOpenCustomizer}
          title="Open Portal Customizer & Theme Settings"
          aria-label="Open settings"
        >
          <Sliders size={17} />
        </button>

        {/* Notifications Icon with popover */}
        <div className="notification-wrapper">
          <button
            className="header-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
          >
            <Bell size={18} />
            {notifications.some(n => n.unread) && <span className="notification-dot" />}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <span className="notifications-title">Notifications</span>
                <button className="mark-read-btn" onClick={markAllRead}>
                  Mark all as read
                </button>
              </div>
              <div className="notifications-list">
                {notifications.map(item => (
                  <div key={item.id} className={`notification-item ${item.unread ? 'unread' : ''}`}>
                    <div className="item-dot" />
                    <div className="item-content">
                      <p className="item-text">{item.title}</p>
                      <span className="item-time">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Chip */}
        <div
          className="header-avatar-badge"
          onClick={onOpenEditProfile}
          style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}
          title={workspace === 'admin' ? `${adminUser?.name || 'Olivia Chen'} (Click to edit persona)` : `${teacherUser?.name || 'Daniel Reed'} (Click to edit persona)`}
        >
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

        {/* Logout Button */}
        {onLogout && (
          <button
            type="button"
            className="header-icon-btn logout-btn"
            onClick={onLogout}
            title="Sign out of account"
            aria-label="Sign out"
            style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
