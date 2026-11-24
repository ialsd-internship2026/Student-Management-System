import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Rocket,
  Info,
  X,
  Check,
  ChevronRight,
  BookOpen,
  Atom,
  Binary,
  BookMarked,
  Leaf,
  BarChart3,
  FlaskConical,
  Landmark,
  Palette,
  TrendingUp,
  Globe2,
  Feather,
  Sparkles,
  ArrowRight,
  Trash2,
  Lock,
  Copy
} from 'lucide-react';

import EditSectionModal from './EditSectionModal';
import EditCourseModal from './EditCourseModal';

export default function CoursesSectionsView({
  courses,
  setCourses,
  sections,
  setSections,
  teachers,
  onOpenCreateCourse,
  onOpenAddSection,
  showToast,
  selectedCourseId: propSelectedCourseId,
  setSelectedCourseId: propSetSelectedCourseId
}) {
  // Filters & State
  const [selectedGrade, setSelectedGrade] = useState('All grades');
  const [selectedTerm, setSelectedTerm] = useState('Fall term 2026');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'draft' | 'archived'
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [showAllSections, setShowAllSections] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState(null);
  const [courseToEdit, setCourseToEdit] = useState(null);

  // Selected course for editing drawer
  const [internalCourseId, setInternalCourseId] = useState('mat-101');
  const selectedCourseId = propSelectedCourseId || internalCourseId;
  const setSelectedCourseId = propSetSelectedCourseId || setInternalCourseId;
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Form state for right drawer
  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const [editFormData, setEditFormData] = useState({
    name: selectedCourse?.name || '',
    code: selectedCourse?.code || '',
    credits: selectedCourse?.credits || '4 credits',
    description: selectedCourse?.description || '',
    teacher: selectedCourse?.teacher || 'Daniel Reed',
    status: selectedCourse?.status || 'Active',
    section: 'Grade 10 - Section A',
    capacity: selectedCourse?.capacity || 36,
    attendanceMin: selectedCourse?.attendanceMin || '85%',
    term: 'Fall 2026 · 16 weeks',
    elements: {
      attendance: selectedCourse?.elements?.attendance ?? true,
      growth: selectedCourse?.elements?.growth ?? true,
      examResults: selectedCourse?.elements?.examResults ?? true,
      resources: selectedCourse?.elements?.resources ?? true
    }
  });

  // When selectedCourse or courses list updates, synchronize form
  useEffect(() => {
    if (selectedCourse) {
      setEditFormData({
        name: selectedCourse.name || '',
        code: selectedCourse.code || '',
        credits: selectedCourse.credits || '4 credits',
        description: selectedCourse.description || '',
        teacher: selectedCourse.teacher || 'Daniel Reed',
        status: selectedCourse.status || 'Active',
        section: `${selectedCourse.grade || 'Grade 10'} - Section ${(Array.isArray(selectedCourse.sections) ? selectedCourse.sections[0]?.split('-')[1] : null) || 'A'}`,
        capacity: selectedCourse.capacity || 36,
        attendanceMin: selectedCourse.attendanceMin || '85%',
        term: 'Fall 2026 · 16 weeks',
        elements: {
          attendance: selectedCourse.elements?.attendance ?? true,
          growth: selectedCourse.elements?.growth ?? true,
          examResults: selectedCourse.elements?.examResults ?? true,
          resources: selectedCourse.elements?.resources ?? true
        }
      });
    }
  }, [selectedCourseId, courses]);

  // When user clicks a course card
  const handleSelectCourse = (course) => {
    setSelectedCourseId(course.id);
    setIsDrawerOpen(true);
  };

  // Launch course handler for Draft
  const handleLaunchCourse = (courseId, e) => {
    if (e) e.stopPropagation();
    setCourses(prev =>
      prev.map(c => (c.id === courseId ? { ...c, status: 'Active', studentsCount: 64 } : c))
    );
    showToast('Course launched successfully! Syllabus and section enrollments are now live.');
  };

  // Quick Duplicate course handler
  const handleDuplicateCourse = (course, e) => {
    if (e) e.stopPropagation();
    const newCourse = {
      ...course,
      id: `${course.id}-copy-${Date.now().toString().slice(-4)}`,
      name: `${course.name} (Copy)`,
      code: `${course.code}-C`,
      status: 'Draft',
      studentsCount: 0
    };
    setCourses(prev => [newCourse, ...prev]);
    showToast(`Duplicated course as "${newCourse.name}" (Draft).`);
  };

  // Quick Toggle Course Status
  const handleToggleCourseStatus = (courseId, newStatus, e) => {
    if (e) e.stopPropagation();
    setCourses(prev =>
      prev.map(c => (c.id === courseId ? { ...c, status: newStatus } : c))
    );
    showToast(`Updated course status to "${newStatus}".`);
  };

  // Filter courses
  const filteredCourses = courses.filter(c => {
    if (selectedGrade !== 'All grades' && c.grade !== selectedGrade) return false;
    if (activeTab === 'active' && c.status !== 'Active') return false;
    if (activeTab === 'draft' && c.status !== 'Draft') return false;
    if (activeTab === 'archived' && c.status !== 'Archived') return false;
    return true;
  });

  const totalFiltered = filteredCourses.length;
  const displayedCourses = filteredCourses.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Tab counts
  const allCount = courses.length;
  const activeCount = courses.filter(c => c.status === 'Active').length;
  const draftCount = courses.filter(c => c.status === 'Draft').length;
  const archivedCount = courses.filter(c => c.status === 'Archived').length;

  // Toggle drawer element setting
  const toggleElement = (key) => {
    setEditFormData(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [key]: !prev.elements[key]
      }
    }));
  };

  // Save changes from side drawer
  const handleSaveChanges = (e) => {
    e.preventDefault();
    setCourses(prev =>
      prev.map(c => {
        if (c.id === selectedCourseId) {
          return {
            ...c,
            name: editFormData.name,
            code: editFormData.code,
            credits: editFormData.credits,
            description: editFormData.description,
            teacher: editFormData.teacher,
            status: editFormData.status,
            capacity: Number(editFormData.capacity),
            attendanceMin: editFormData.attendanceMin,
            elements: { ...editFormData.elements }
          };
        }
        return c;
      })
    );

    // Also update class sections table if section matches
    setSections(prev =>
      prev.map(s => {
        const secSearch = editFormData.section ? editFormData.section.replace(' - Section ', '-') : '';
        if (secSearch && s.section.includes(secSearch)) {
          return {
            ...s,
            classTeacher: editFormData.teacher,
            capacity: Number(editFormData.capacity) || s.capacity
          };
        }
        return s;
      })
    );

    showToast(`✓ Changes saved for ${editFormData.name} · ${editFormData.section}`);
  };

  // Delete course
  const handleDeleteCourse = (courseId) => {
    if (window.confirm(`Are you sure you want to delete "${selectedCourse.name}" from the curriculum?`)) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setIsDrawerOpen(false);
      showToast(`Course "${selectedCourse.name}" has been deleted.`);
    }
  };

  // Icon renderer
  const renderCourseIcon = (iconType) => {
    switch (iconType) {
      case 'sigma':
        return <span className="sigma-math-icon">Σ</span>;
      case 'atom':
        return <Atom size={19} className="icon-svg icon-atom" />;
      case 'code':
        return <Binary size={19} className="icon-svg icon-code" />;
      case 'book':
        return <BookMarked size={19} className="icon-svg icon-book" />;
      case 'leaf':
        return <Leaf size={19} className="icon-svg icon-leaf" />;
      case 'chart':
        return <BarChart3 size={19} className="icon-svg icon-chart" />;
      case 'flask':
        return <FlaskConical size={19} className="icon-svg icon-flask" />;
      case 'landmark':
        return <Landmark size={19} className="icon-svg icon-landmark" />;
      case 'palette':
        return <Palette size={19} className="icon-svg icon-palette" />;
      case 'trending':
        return <TrendingUp size={19} className="icon-svg icon-trending" />;
      case 'globe':
        return <Globe2 size={19} className="icon-svg icon-globe" />;
      case 'feather':
        return <Feather size={19} className="icon-svg icon-feather" />;
      default:
        return <BookOpen size={19} className="icon-svg" />;
    }
  };

  const sectionsToShow = showAllSections ? sections : sections.slice(0, 3);

  return (
    <div className={`courses-view-layout ${isDrawerOpen ? 'drawer-visible' : 'drawer-hidden'}`}>
      {/* Main Left Content Area */}
      <div className="courses-main-column">
        {/* Top View Title & Actions */}
        <div className="view-header">
          <div className="view-title-group">
            <h1 className="view-title">Courses & sections</h1>
            <p className="view-subtitle">Shape your curriculum and give every section the right tools.</p>
          </div>

          <div className="view-actions">
            <button className="btn btn-secondary" onClick={onOpenAddSection}>
              <Plus size={16} />
              <span>Add section</span>
            </button>
            <button className="btn btn-primary" onClick={onOpenCreateCourse}>
              <Plus size={16} />
              <span>Create course</span>
            </button>
          </div>
        </div>

        {/* Filters and Tags Bar */}
        <div className="filters-row">
          <div className="filter-selects-group">
            <select
              className="select-input custom-filter-select"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="All grades">All grades</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>

            <select
              className="select-input custom-filter-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="Fall term 2026">Fall term 2026</option>
              <option value="Spring term 2027">Spring term 2027</option>
            </select>
          </div>

          <div className="institute-access-chip">
            Institute-wide access
          </div>
        </div>

        {/* Status Tabs Navigation */}
        <div className="status-tabs-row">
          <button
            className={`status-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveTab('all'); setPage(1); }}
          >
            All courses · {allCount}
          </button>
          <button
            className={`status-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => { setActiveTab('active'); setPage(1); }}
          >
            Active · {activeCount}
          </button>
          <button
            className={`status-tab-btn ${activeTab === 'draft' ? 'active' : ''}`}
            onClick={() => { setActiveTab('draft'); setPage(1); }}
          >
            Draft · {draftCount}
          </button>
          <button
            className={`status-tab-btn ${activeTab === 'archived' ? 'active' : ''}`}
            onClick={() => { setActiveTab('archived'); setPage(1); }}
          >
            Archived · {archivedCount}
          </button>
        </div>

        {/* Course Cards Grid */}
        <div className="courses-cards-grid">
          {displayedCourses.map((course) => {
            const isSelected = selectedCourseId === course.id && isDrawerOpen;
            return (
              <div
                key={course.id}
                className={`course-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectCourse(course)}
              >
                <div className="card-top-row">
                  <div className="course-icon-box">
                    {renderCourseIcon(course.iconType)}
                  </div>
                  <div className="course-header-meta">
                    <h3 className="course-name">{course.name}</h3>
                    <div className="course-code-tag">
                      {course.code} · {course.type}
                    </div>
                  </div>
                  <div className="card-status-badge-wrap">
                    <select
                      className={`badge-status-select ${
                        course.status === 'Active'
                          ? 'badge-active'
                          : course.status === 'Draft'
                          ? 'badge-draft'
                          : 'badge-archived'
                      }`}
                      value={course.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleToggleCourseStatus(course.id, e.target.value, e)}
                      title="Quick change course status"
                    >
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="card-body">
                  <div className="teacher-sections-line">
                    {course.teacher} · {course.sections.join(' · ')}
                  </div>
                  <div className="card-bottom-row">
                    <span className="students-count-text">
                      {course.studentsCount > 0 ? `${course.studentsCount} students` : 'No enrolments yet'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        className="btn-card-duplicate"
                        onClick={(e) => handleDuplicateCourse(course, e)}
                        title="Duplicate course"
                      >
                        <Copy size={13} />
                      </button>

                      {course.status === 'Draft' ? (
                        <button
                          className="btn-launch-course"
                          onClick={(e) => handleLaunchCourse(course.id, e)}
                        >
                          <Rocket size={14} />
                          <span>Launch course</span>
                        </button>
                      ) : (
                        <button
                          className="btn-edit-course"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCourse(course);
                            setCourseToEdit(course);
                          }}
                          title={`Edit ${course.name} and assign faculty`}
                        >
                          <Pencil size={13} />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Showing and Next Page Footer */}
        <div className="courses-pagination-row">
          <span className="pagination-info">
            Showing {displayedCourses.length} of {totalFiltered} courses
          </span>
          {totalFiltered > itemsPerPage && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(page === 1 ? 2 : 1)}
            >
              {page === 1 ? 'Next page' : 'Previous page'}
            </button>
          )}
        </div>

        {/* Announcement / Ready to launch Notice Banner */}
        {courses.some(c => c.status === 'Draft') && (
          <div className="launch-notice-banner">
            <div className="banner-content">
              <Rocket size={17} className="banner-rocket-icon" />
              <span>
                <strong>Data science</strong> is ready to launch. Its syllabus, teacher assignments, and section settings are complete.
              </span>
            </div>
            <button
              className="banner-action-link"
              onClick={() => handleLaunchCourse('ds-201')}
            >
              Launch now
            </button>
          </div>
        )}

        {/* Class Sections Section */}
        <div className="class-sections-container">
          <div className="sections-header-row">
            <div>
              <h2 className="sections-title">Class sections</h2>
              <p className="sections-subtitle">24 active sections across the institute</p>
            </div>
            <button
              className="sections-view-all-btn"
              onClick={() => setShowAllSections(!showAllSections)}
            >
              {showAllSections ? 'Show less' : 'View all'}
            </button>
          </div>

          <div className="sections-table-wrapper">
            <table className="sections-table">
              <thead>
                <tr>
                  <th>SECTION</th>
                  <th>CLASS TEACHER</th>
                  <th>STUDENTS</th>
                  <th>ROOM</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {sectionsToShow.map((sec) => (
                  <tr
                    key={sec.id}
                    className={sec.isEditing ? 'editing-row' : ''}
                    onClick={() => {
                      setSections(prev =>
                        prev.map(s => ({ ...s, isEditing: s.id === sec.id }))
                      );
                      setEditFormData(prev => ({
                        ...prev,
                        section: sec.section,
                        capacity: sec.capacity
                      }));
                      setIsDrawerOpen(true);
                    }}
                  >
                    <td
                      className="section-name-cell clickable-cell"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSectionToEdit(sec);
                      }}
                      title="Click to edit section"
                    >
                      {sec.section}
                    </td>
                    <td
                      className="teacher-cell teacher-clickable-cell"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSectionToEdit(sec);
                      }}
                      title={`Click to edit Class Teacher (${sec.classTeacher})`}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <span style={{ fontWeight: 600 }}>{sec.classTeacher}</span>
                        <span style={{ color: 'var(--primary-600)', opacity: 0.8 }} title="Edit Class Teacher">
                          <Pencil size={11} />
                        </span>
                      </div>
                    </td>
                    <td className="students-cell">
                      {sec.studentsEnrolled} / {sec.capacity}
                    </td>
                    <td
                      className="room-cell clickable-cell"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSectionToEdit(sec);
                      }}
                      title="Click to change room"
                    >
                      {sec.room}
                    </td>
                    <td>
                      <span className="badge badge-active">{sec.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {sec.isEditing && (
                          <span className="action-editing-pill">Editing</span>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSectionToEdit(sec);
                          }}
                          title={`Edit ${sec.section} Class Teacher & Settings`}
                        >
                          <Pencil size={11} />
                          <span>Edit</span>
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Drawer: Edit Course & Section */}
      {isDrawerOpen && selectedCourse && (
        <aside className="edit-drawer-panel">
          <div className="drawer-header">
            <div>
              <h2 className="drawer-title">Edit course & section</h2>
              <div className="drawer-subtitle">
                {selectedCourse.name} · {editFormData.section}
              </div>
            </div>
            <button
              className="drawer-close-btn"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close edit drawer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="drawer-badge-row">
            <span className="badge badge-active">
              <Check size={12} />
              Published course
            </span>
          </div>

          <form className="drawer-form" onSubmit={handleSaveChanges}>
            {/* Course Name */}
            <div className="form-group">
              <label className="form-label">Course name *</label>
              <input
                type="text"
                className="text-input"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>

            {/* Course Code, Credits & Status */}
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Course code *</label>
                <input
                  type="text"
                  className="text-input"
                  value={editFormData.code}
                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Credits</label>
                <select
                  className="select-input"
                  value={editFormData.credits}
                  onChange={(e) => setEditFormData({ ...editFormData, credits: e.target.value })}
                >
                  <option value="2 credits">2 credits</option>
                  <option value="3 credits">3 credits</option>
                  <option value="4 credits">4 credits</option>
                  <option value="5 credits">5 credits</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lifecycle Status</label>
              <select
                className="select-input"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option value="Active">Active (Published to class sections)</option>
                <option value="Draft">Draft (In syllabus preparation)</option>
                <option value="Archived">Archived (Past academic year)</option>
              </select>
            </div>

            {/* Course Description */}
            <div className="form-group">
              <label className="form-label">Course description</label>
              <textarea
                className="textarea-input"
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>

            {/* Lead Teacher */}
            <div className="form-group">
              <label className="form-label">Lead teacher *</label>
              <input
                type="text"
                list="drawer-lead-teachers-list"
                className="text-input"
                value={editFormData.teacher}
                onChange={(e) => setEditFormData({ ...editFormData, teacher: e.target.value })}
                placeholder="Type or select faculty teacher"
                required
              />
              <datalist id="drawer-lead-teachers-list">
                {teachers.map(t => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.department || t.role})
                  </option>
                ))}
              </datalist>
            </div>

            {/* Section Settings Divider */}
            <div className="form-section-title">Section settings</div>

            {/* Section Select */}
            <div className="form-group">
              <label className="form-label">Section *</label>
              <select
                className="select-input"
                value={editFormData.section}
                onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
              >
                <option value="Grade 10 - Section A">Grade 10 - Section A</option>
                <option value="Grade 10 - Section B">Grade 10 - Section B</option>
                <option value="Grade 11 - Section A">Grade 11 - Section A</option>
                <option value="Grade 11 - Section B">Grade 11 - Section B</option>
                <option value="Grade 12 - Section A">Grade 12 - Section A</option>
              </select>
            </div>

            {/* Capacity & Attendance Min */}
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <select
                  className="select-input"
                  value={editFormData.capacity}
                  onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
                >
                  <option value="30">30 students</option>
                  <option value="32">32 students</option>
                  <option value="34">34 students</option>
                  <option value="36">36 students</option>
                  <option value="40">40 students</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Attendance minimum</label>
                <select
                  className="select-input"
                  value={editFormData.attendanceMin}
                  onChange={(e) => setEditFormData({ ...editFormData, attendanceMin: e.target.value })}
                >
                  <option value="75%">75%</option>
                  <option value="80%">80%</option>
                  <option value="85%">85%</option>
                  <option value="90%">90%</option>
                </select>
              </div>
            </div>

            {/* Academic Term */}
            <div className="form-group">
              <label className="form-label">Academic term</label>
              <select
                className="select-input"
                value={editFormData.term}
                onChange={(e) => setEditFormData({ ...editFormData, term: e.target.value })}
              >
                <option value="Fall 2026 · 16 weeks">Fall 2026 · 16 weeks</option>
                <option value="Spring 2027 · 16 weeks">Spring 2027 · 16 weeks</option>
              </select>
            </div>

            {/* Student Section Elements (Toggles) */}
            <div className="form-section-title">Student section elements</div>

            <div className="toggle-list">
              <div className="toggle-item">
                <div className="toggle-info">
                  <div className="toggle-label">Attendance & schedule</div>
                  <div className="toggle-desc">Visible to enrolled students</div>
                </div>
                <button
                  type="button"
                  className={`switch-btn ${editFormData.elements.attendance ? 'on' : 'off'}`}
                  onClick={() => toggleElement('attendance')}
                  aria-label="Toggle attendance visibility"
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <div className="toggle-label">Growth & performance</div>
                  <div className="toggle-desc">Show progress charts</div>
                </div>
                <button
                  type="button"
                  className={`switch-btn ${editFormData.elements.growth ? 'on' : 'off'}`}
                  onClick={() => toggleElement('growth')}
                  aria-label="Toggle growth visibility"
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <div className="toggle-label">Exam results</div>
                  <div className="toggle-desc">Visible after teacher publishes</div>
                </div>
                <button
                  type="button"
                  className={`switch-btn ${editFormData.elements.examResults ? 'on' : 'off'}`}
                  onClick={() => toggleElement('examResults')}
                  aria-label="Toggle exam results visibility"
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <div className="toggle-label">Learning resources</div>
                  <div className="toggle-desc">Show course materials</div>
                </div>
                <button
                  type="button"
                  className={`switch-btn ${editFormData.elements.resources ? 'on' : 'off'}`}
                  onClick={() => toggleElement('resources')}
                  aria-label="Toggle learning resources visibility"
                >
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="drawer-info-callout">
              <Info size={16} className="callout-icon" />
              <div className="callout-text">
                Course details apply to both sections. Element settings apply to 10-A only.
              </div>
            </div>

            {/* Footer Actions */}
            <div className="drawer-footer-actions">
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteCourse(selectedCourse.id)}
                title="Delete this course"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDrawerOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Check size={16} />
                <span>Save changes</span>
              </button>
            </div>

            <div className="drawer-footnote">
              Changes won't affect existing exam records.
            </div>
          </form>
        </aside>
      )}

      {/* Edit Course Modal (Opens instantly when clicking Edit on any course card) */}
      <EditCourseModal
        isOpen={Boolean(courseToEdit)}
        onClose={() => setCourseToEdit(null)}
        course={courseToEdit}
        teachers={teachers}
        onSaveCourse={(updatedCourse) => {
          setCourses(prev => prev.map(c => (c.id === updatedCourse.id ? updatedCourse : c)));
          // Synchronize side drawer form if this course is active
          if (selectedCourseId === updatedCourse.id) {
            setEditFormData(prev => ({
              ...prev,
              name: updatedCourse.name,
              code: updatedCourse.code,
              credits: updatedCourse.credits,
              teacher: updatedCourse.teacher,
              status: updatedCourse.status,
              description: updatedCourse.description,
              capacity: updatedCourse.capacity,
              attendanceMin: updatedCourse.attendanceMin,
              elements: { ...updatedCourse.elements }
            }));
          }
          // Sync teacher to matching sections
          setSections(prev =>
            prev.map(s => {
              if (updatedCourse.sections.some(secCode => s.section.includes(secCode))) {
                return { ...s, classTeacher: updatedCourse.teacher };
              }
              return s;
            })
          );
          showToast(`✓ Saved changes for ${updatedCourse.name}`);
        }}
        onDeleteCourse={handleDeleteCourse}
      />

      {/* Edit Section Modal (Opens when clicking Edit or Class Teacher in sections table) */}
      <EditSectionModal
        isOpen={Boolean(sectionToEdit)}
        onClose={() => setSectionToEdit(null)}
        section={sectionToEdit}
        teachers={teachers}
        onSaveSection={(updatedSec) => {
          setSections(prev => prev.map(s => s.id === updatedSec.id ? updatedSec : s));
          // Also sync class teacher to any matching courses
          setCourses(prev =>
            prev.map(c => {
              const secShort = updatedSec.section.split(' ')[1] || '';
              if (Array.isArray(c.sections) && c.sections.some(sc => updatedSec.section.includes(sc) || sc === secShort)) {
                return { ...c, teacher: updatedSec.classTeacher };
              }
              return c;
            })
          );
          showToast(`✓ Updated ${updatedSec.section} (Class Teacher: ${updatedSec.classTeacher})`);
        }}
        onDeleteSection={(secId) => {
          setSections(prev => prev.filter(s => s.id !== secId));
          showToast('Section removed.');
        }}
      />
    </div>
  );
}
