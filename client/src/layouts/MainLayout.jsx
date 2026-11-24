import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({
  children,
  workspace,
  onWorkspaceChange,
  activeNav,
  onNavChange,
  theme,
  onToggleTheme,
  branding,
  onUpdateBranding,
  academicTerm,
  onSelectTerm,
  termWidget,
  onOpenEditTermWidget,
  onOpenCustomizer,
  adminUser,
  teacherUser,
  onOpenEditProfile,
  onOpenMonumentsTour,
  isColorFlowActive,
  onToggleColorFlow,
  onOpenAppWindow,
  onOpenSearch,
  onLogout,
  mobileSidebarOpen,
  setMobileSidebarOpen
}) {
  return (
    <div className={`app-container ${isColorFlowActive ? 'color-flow-active' : ''}`}>
      <div className={`ambient-full-backdrop ${isColorFlowActive ? 'active' : ''}`} />

      {/* Sidebar Navigation */}
      <Sidebar
        workspace={workspace}
        onWorkspaceChange={onWorkspaceChange}
        activeNav={activeNav}
        onNavChange={onNavChange}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        branding={branding}
        onUpdateBranding={onUpdateBranding}
        isEditSession={true}
        termWidget={termWidget}
        onOpenEditTermWidget={onOpenEditTermWidget}
        onOpenCustomizer={onOpenCustomizer}
        adminUser={adminUser}
        teacherUser={teacherUser}
        onOpenEditProfile={onOpenEditProfile}
        onLogout={onLogout}
      />

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        <Header
          workspace={workspace}
          onWorkspaceChange={onWorkspaceChange}
          activeNav={activeNav}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenSearch={onOpenSearch}
          theme={theme}
          onToggleTheme={onToggleTheme}
          academicTerm={academicTerm}
          onSelectTerm={onSelectTerm}
          onOpenCustomizer={onOpenCustomizer}
          adminUser={adminUser}
          teacherUser={teacherUser}
          onOpenEditProfile={onOpenEditProfile}
          onOpenMonumentsTour={onOpenMonumentsTour}
          isColorFlowActive={isColorFlowActive}
          onToggleColorFlow={onToggleColorFlow}
          diskSyncStatus="synced"
          lastSavedTime="Live DB"
          onOpenAppWindow={onOpenAppWindow}
          onLogout={onLogout}
        />

        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
