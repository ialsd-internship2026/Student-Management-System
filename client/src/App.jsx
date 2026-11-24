import React, { useState, useEffect, useCallback } from 'react';

// Layouts & Pages
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// Common Components & Modals
import Toast from './components/common/Toast';
import SearchModal from './components/common/SearchModal';
import ReportModal from './components/common/ReportModal';
import MonumentsLoadingScreen from './components/common/MonumentsLoadingScreen';

// Feature Modals
import CreateCourseModal from './features/courses/components/CreateCourseModal';
import AddSectionModal from './features/courses/components/AddSectionModal';
import EditAnnouncementModal from './features/overview/components/EditAnnouncementModal';
import EditTermWidgetModal from './features/overview/components/EditTermWidgetModal';
import EditProfileModal from './layouts/EditProfileModal';
import PortalCustomizerDrawer from './layouts/PortalCustomizerDrawer';

// Auth & Services
import { useAuth } from './context/AuthContext';
import { adminAPI, teacherAPI } from './services/api';
import { transformCourse, transformSection, transformStudent, transformTeacher } from './utils/transformers';

export default function App() {
  const { user, profile, loading: authLoading, isAuthenticated, role, login, logout } = useAuth();

  // Theme state (light / dark)
  const [theme, setTheme] = useState(() => localStorage.getItem('portal_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('portal_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    showToast(`Switched to ${theme === 'light' ? 'Dark' : 'Light'} Mode`);
  };

  // Branding state
  const [branding, setBranding] = useState({ name: 'aster', tagline: 'INSTITUTE' });

  // Workspace: 'admin' | 'teacher'
  const [workspace, setWorkspace] = useState('admin');

  // Sync workspace with authenticated role
  useEffect(() => {
    if (role === 'teacher') {
      setWorkspace('teacher');
      setActiveNav('students');
    } else if (role === 'admin') {
      setWorkspace('admin');
      setActiveNav('courses');
    }
  }, [role]);

  const VALID_NAV_ITEMS = ['overview', 'schedule', 'courses', 'attendance', 'students', 'teachers', 'resources'];

  const [activeNav, setActiveNav] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '').trim().toLowerCase();
      if (VALID_NAV_ITEMS.includes(hash)) return hash;
    }
    return role === 'teacher' ? 'students' : 'courses';
  });

  const handleNavChange = (nav) => {
    setActiveNav(nav);
    if (typeof window !== 'undefined') {
      window.location.hash = nav;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.replace('#', '').trim().toLowerCase();
        if (VALID_NAV_ITEMS.includes(hash)) {
          setActiveNav(hash);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState('');
  const [activeStudentId, setActiveStudentId] = useState('');

  // Academic Term state
  const [academicTerm, setAcademicTerm] = useState('Fall 2026');

  // Term progress widget state
  const [termWidget, setTermWidget] = useState({
    title: 'A little progress, every day.',
    meta: 'Fall term 2026 Week 6 of 16',
    dates: '31 Aug – 18 Dec',
    percentage: 37.5
  });

  // Announcements state
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'Fall Term Midterm Assessments',
      body: 'Midterm schedules and room assignments have been finalized. Please ensure all student rosters are locked.',
      date: '12 Oct 2026',
      tag: 'Academic'
    },
    {
      id: 2,
      title: 'Faculty Department Meeting',
      body: 'Quarterly review session scheduled in Faculty Lounge B at 15:30 on Friday.',
      date: '16 Oct 2026',
      tag: 'Faculty'
    }
  ]);

  // Upcoming assessment notice state
  const [upcomingNotice, setUpcomingNotice] = useState('Mathematics Midterm Assessment scheduled for 12 October in Hall B & Lab 3.');

  // Primary accent color theme
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');

  // Real backend data states
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState(['Mathematics', 'Science', 'English', 'Computer Science']);
  const [timetables, setTimetables] = useState(null);

  // User personas
  const adminUser = {
    name: user?.role === 'admin' ? user?.name : 'Admin Office',
    role: user?.role === 'admin' ? `${profile?.department || 'Institute'} Administrator` : 'Institute Administrator',
    email: user?.role === 'admin' ? user?.email : 'admin@aster.edu',
    initials: (user?.role === 'admin' && user?.name) ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AO',
    photo: `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.role === 'admin' && user?.name) ? user.name : 'Admin')}&background=4f46e5&color=fff&size=256`
  };

  const teacherUser = {
    name: user?.role === 'teacher' ? user?.name : (teachers[0]?.name || 'Sarah Jenkins'),
    role: user?.role === 'teacher' ? `${profile?.subjects?.[0] || 'Mathematics'} faculty & Head` : 'Faculty Member',
    department: (user?.role === 'teacher' && profile?.subjects?.[0]) || 'Mathematics',
    assignedClass: (user?.role === 'teacher' && profile?.assignedClassIds?.[0]?.name) || (sections[0]?.name || 'Grade 10-A'),
    email: user?.role === 'teacher' ? user?.email : 'teacher@aster.edu',
    initials: (user?.role === 'teacher' && user?.name) ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SJ',
    photo: `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.role === 'teacher' && user?.name) ? user.name : 'Faculty')}&background=7c3aed&color=fff&size=256`
  };

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isTermWidgetModalOpen, setIsTermWidgetModalOpen] = useState(false);
  const [isLoadingScreen, setIsLoadingScreen] = useState(false);
  const [isMonumentsTourOpen, setIsMonumentsTourOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => setToastMessage(msg);

  // Color Flow state
  const [isColorFlowActive, setIsColorFlowActive] = useState(false);

  // =========================================================================
  // FETCH REAL DATA FROM BACKEND API
  // =========================================================================
  const loadBackendData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      if (workspace === 'admin') {
        const [coursesRes, classesRes, studentsRes, teachersRes] = await Promise.all([
          adminAPI.getCourses().catch(() => ({ courses: [] })),
          adminAPI.getClasses().catch(() => ({ classes: [] })),
          adminAPI.getStudents({ limit: 100 }).catch(() => ({ students: [] })),
          adminAPI.getTeachers().catch(() => ({ teachers: [] }))
        ]);

        const loadedCourses = (coursesRes.courses || []).map(transformCourse);
        const loadedSections = (classesRes.classes || []).map(transformSection);
        const loadedStudents = (studentsRes.students || []).map(transformStudent);
        const loadedTeachers = (teachersRes.teachers || []).map(transformTeacher);

        setCourses(loadedCourses);
        setSections(loadedSections);
        setStudents(loadedStudents);
        setTeachers(loadedTeachers);

        if (loadedCourses.length > 0 && !activeCourseId) setActiveCourseId(loadedCourses[0].id);
        if (loadedStudents.length > 0 && !activeStudentId) setActiveStudentId(loadedStudents[0].id);

        const depts = [...new Set(loadedTeachers.map(t => t.department).filter(Boolean))];
        if (depts.length > 0) setDepartments(depts);

      } else {
        const [classesRes] = await Promise.all([
          teacherAPI.getClasses().catch(() => ({ classes: [] }))
        ]);

        const teacherClasses = classesRes.classes || [];
        const loadedSections = teacherClasses.map(transformSection);
        setSections(loadedSections);

        if (teacherClasses.length > 0) {
          const firstClassId = teacherClasses[0]._id;
          const studentsRes = await teacherAPI.getStudents({ classId: firstClassId, limit: 100 }).catch(() => ({ students: [] }));
          const loadedStudents = (studentsRes.students || []).map(s => transformStudent({ ...s, class: teacherClasses[0] }));
          setStudents(loadedStudents);
          if (loadedStudents.length > 0 && !activeStudentId) setActiveStudentId(loadedStudents[0].id);
        }
      }
    } catch (err) {
      console.error('[App] Failed to load data from backend:', err);
      showToast('Notice: Loaded with offline fallback.');
    }
  }, [isAuthenticated, workspace]);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // Rename department handler
  const handleRenameDepartment = (oldName, newName) => {
    setDepartments(prev => prev.map(d => (d === oldName ? newName : d)));
    setTeachers(prev => prev.map(t => (t.department === oldName ? { ...t, department: newName } : t)));
    setCourses(prev => prev.map(c => (c.department === oldName ? { ...c, department: newName } : c)));
    showToast(`Renamed department "${oldName}" to "${newName}".`);
  };

  const handleUpdateAnnouncement = (updatedAnn) => {
    setAnnouncements(prev => prev.map(a => (a.id === updatedAnn.id ? updatedAnn : a)));
    showToast(`Updated announcement: "${updatedAnn.title}"`);
  };

  const toggleColorFlow = () => {
    setIsColorFlowActive(prev => {
      const next = !prev;
      showToast(next ? '🌈 Color Flow: Active' : '⏸ Color Flow: Paused');
      return next;
    });
  };

  const handleSaveProfile = (newProfile) => {
    showToast(`Profile updated to ${newProfile.name}`);
  };

  // Switch workspace
  const handleWorkspaceChange = (newWorkspace) => {
    setWorkspace(newWorkspace);
    if (newWorkspace === 'teacher') {
      setActiveNav('students');
      showToast('Switched to Teacher Workspace');
    } else {
      setActiveNav('courses');
      showToast('Switched to Admin Workspace');
    }
  };

  const handleOpenAppWindow = () => {
    window.open(window.location.href, '_blank', 'popup=yes,width=1400,height=900');
    showToast('Opened standalone app window.');
  };

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Course & Section CRUD
  const handleAddCourse = async (newCourse) => {
    try {
      const payload = {
        code: newCourse.code,
        name: newCourse.name,
        term: newCourse.term || academicTerm,
        credits: parseInt(newCourse.credits, 10) || 3,
        description: newCourse.description || ''
      };
      const res = await adminAPI.createCourse(payload);
      const created = transformCourse(res.course || { ...newCourse, _id: Date.now() });
      setCourses(prev => [created, ...prev]);
      showToast(`✓ Course "${newCourse.name}" saved to MongoDB.`);
    } catch (err) {
      const localCourse = transformCourse({ ...newCourse, _id: `local-${Date.now()}` });
      setCourses(prev => [localCourse, ...prev]);
      showToast(`Course created: ${err.message}`);
    }
  };

  const handleAddSection = async (newSection) => {
    try {
      const payload = {
        name: newSection.section || newSection.name,
        capacity: Number(newSection.capacity) || 30,
        term: academicTerm,
        academicTerm: academicTerm
      };
      const res = await adminAPI.createSection(payload);
      const created = transformSection(res.section || { ...newSection, _id: Date.now() });
      setSections(prev => [...prev, created]);
      showToast(`✓ Class Section "${payload.name}" saved to MongoDB.`);
    } catch (err) {
      setSections(prev => [...prev, newSection]);
      showToast(`Section added: ${err.message}`);
    }
  };

  const handleAddDepartment = (newDeptName) => {
    if (!newDeptName) return;
    if (departments.some(d => d.toLowerCase() === newDeptName.toLowerCase())) {
      showToast(`Department "${newDeptName}" already exists.`);
      return;
    }
    setDepartments(prev => [...prev, newDeptName]);
    showToast(`✓ Added academic department "${newDeptName}".`);
  };

  const handleDeleteDepartment = (deptName) => {
    setDepartments(prev => prev.filter(d => d !== deptName));
    showToast(`Removed department "${deptName}".`);
  };

  const handleAddAnnouncement = (newAnn) => {
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const handleDeleteAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    showToast('Announcement removed.');
  };

  // Auth Guard
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#4f46e5', fontWeight: 600 }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎓 Aster Institute</div>
          <div>Loading portal...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <MainLayout
      workspace={workspace}
      onWorkspaceChange={handleWorkspaceChange}
      activeNav={activeNav}
      onNavChange={handleNavChange}
      theme={theme}
      onToggleTheme={toggleTheme}
      branding={branding}
      onUpdateBranding={(newB) => {
        setBranding(newB);
        showToast(`Institute brand updated to ${newB.name} ${newB.tagline}`);
      }}
      academicTerm={academicTerm}
      onSelectTerm={(newTerm) => {
        setAcademicTerm(newTerm);
        showToast(`Switched active academic term to ${newTerm}`);
      }}
      termWidget={termWidget}
      onOpenEditTermWidget={() => setIsTermWidgetModalOpen(true)}
      onOpenCustomizer={() => setIsCustomizerOpen(true)}
      adminUser={adminUser}
      teacherUser={teacherUser}
      onOpenEditProfile={() => setIsEditProfileOpen(true)}
      onOpenMonumentsTour={() => setIsMonumentsTourOpen(true)}
      isColorFlowActive={isColorFlowActive}
      onToggleColorFlow={toggleColorFlow}
      onOpenAppWindow={handleOpenAppWindow}
      onOpenSearch={() => setIsSearchOpen(true)}
      onLogout={logout}
      mobileSidebarOpen={mobileSidebarOpen}
      setMobileSidebarOpen={setMobileSidebarOpen}
    >
      <DashboardPage
        activeNav={activeNav}
        workspace={workspace}
        courses={courses}
        setCourses={setCourses}
        sections={sections}
        setSections={setSections}
        students={students}
        setStudents={setStudents}
        teachers={teachers}
        setTeachers={setTeachers}
        departments={departments}
        announcements={announcements}
        upcomingNotice={upcomingNotice}
        timetables={timetables}
        setTimetables={setTimetables}
        activeCourseId={activeCourseId}
        setActiveCourseId={setActiveCourseId}
        activeStudentId={activeStudentId}
        setSelectedStudentId={setActiveStudentId}
        teacherUser={teacherUser}
        showToast={showToast}
        onNavigate={handleNavChange}
        onOpenCreateCourse={() => setIsCreateCourseOpen(true)}
        onOpenAddSection={() => setIsAddSectionOpen(true)}
        onOpenReportModal={() => setIsReportOpen(true)}
        onAddAnnouncement={handleAddAnnouncement}
        onUpdateAnnouncement={handleUpdateAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
        onUpdateUpcomingNotice={setUpcomingNotice}
        onOpenEditTermWidget={() => setIsTermWidgetModalOpen(true)}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onAddDepartment={handleAddDepartment}
        onRenameDepartment={handleRenameDepartment}
        onDeleteDepartment={handleDeleteDepartment}
      />

      {/* Dialog Modals */}
      <CreateCourseModal
        isOpen={isCreateCourseOpen}
        onClose={() => setIsCreateCourseOpen(false)}
        onAddCourse={handleAddCourse}
        teachers={teachers}
      />

      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
        onAddSection={handleAddSection}
        teachers={teachers}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        courses={courses}
        students={students}
        onSelectCourse={(course) => {
          setActiveCourseId(course.id);
          setActiveNav('courses');
        }}
        onSelectStudent={(student) => {
          setActiveStudentId(student.id);
          setActiveNav('students');
        }}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        students={students}
        showToast={showToast}
      />

      <PortalCustomizerDrawer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        branding={branding}
        onUpdateBranding={(newB) => {
          setBranding(newB);
          showToast(`Brand updated to ${newB.name} ${newB.tagline}`);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        primaryColor={primaryColor}
        onChangePrimaryColor={(col) => {
          setPrimaryColor(col);
          showToast(`Color theme updated`);
        }}
        adminUser={adminUser}
        onUpdateAdminUser={() => showToast(`Admin profile updated`)}
        teacherUser={teacherUser}
        onUpdateTeacherUser={() => showToast(`Teacher profile updated`)}
        defaultNav={activeNav}
        onChangeDefaultNav={(newNav) => {
          setActiveNav(newNav);
          showToast(`Landing view set to ${newNav}`);
        }}
        onSaveAsDefault={() => showToast('Preferences saved.')}
        onResetDefaults={loadBackendData}
        courses={courses}
        students={students}
        sections={sections}
        showToast={showToast}
        onOpenMonumentsTour={() => setIsMonumentsTourOpen(true)}
        isColorFlowActive={isColorFlowActive}
        onToggleColorFlow={toggleColorFlow}
      />

      <EditTermWidgetModal
        isOpen={isTermWidgetModalOpen}
        onClose={() => setIsTermWidgetModalOpen(false)}
        widgetData={termWidget}
        onSaveWidget={(newW) => {
          setTermWidget(newW);
          showToast('Updated term progress widget.');
        }}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        workspace={workspace}
        userProfile={workspace === 'teacher' ? teacherUser : adminUser}
        onSaveProfile={handleSaveProfile}
        departments={departments}
      />

      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {isLoadingScreen && (
        <MonumentsLoadingScreen onFinish={() => setIsLoadingScreen(false)} />
      )}

      {isMonumentsTourOpen && (
        <MonumentsLoadingScreen
          isStandaloneModal={true}
          onClose={() => setIsMonumentsTourOpen(false)}
        />
      )}
    </MainLayout>
  );
}
