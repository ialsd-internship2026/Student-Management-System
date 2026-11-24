import React, { useState, useEffect } from 'react';
import { Mail, BookOpen, Award, Plus, Search, Filter, Trash2, Pencil, Building2 } from 'lucide-react';
import { TEACHERS_LIST, INITIAL_DEPARTMENTS } from '../../../data/portalData';
import AddTeacherModal from './AddTeacherModal';
import EditTeacherModal from './EditTeacherModal';
import ManageDepartmentsModal from './ManageDepartmentsModal';

export default function TeachersView({
  courses,
  setCourses,
  showToast,
  teachers: propTeachers,
  setTeachers: propSetTeachers,
  departments = INITIAL_DEPARTMENTS,
  onAddDepartment,
  onRenameDepartment,
  onDeleteDepartment
}) {
  const [internalTeachers, setInternalTeachers] = useState(() => {
    const saved = localStorage.getItem('portal_teachers');
    return saved ? JSON.parse(saved) : TEACHERS_LIST;
  });

  const teachers = propTeachers || internalTeachers;
  const setTeachers = propSetTeachers || setInternalTeachers;

  useEffect(() => {
    if (!propTeachers) {
      localStorage.setItem('portal_teachers', JSON.stringify(internalTeachers));
    }
  }, [internalTeachers, propTeachers]);

  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isEditTeacherOpen, setIsEditTeacherOpen] = useState(false);
  const [isManageDeptOpen, setIsManageDeptOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState(null);

  const filteredTeachers = teachers.filter(t => {
    if (departmentFilter !== 'All' && t.department !== departmentFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAddTeacher = (newT) => {
    setTeachers(prev => [newT, ...prev]);
    showToast(`Added faculty member ${newT.name}`);
  };

  const handleSaveTeacher = (updatedT) => {
    const oldName = teacherToEdit?.name;
    setTeachers(prev => prev.map(t => (t.name === oldName ? updatedT : t)));
    if (setCourses && oldName && oldName !== updatedT.name) {
      setCourses(prev =>
        prev.map(c => (c.teacher === oldName ? { ...c, teacher: updatedT.name } : c))
      );
    }
    showToast(`Updated faculty details for ${updatedT.name}`);
  };

  const handleDeleteTeacher = (name) => {
    if (window.confirm(`Remove faculty member ${name}?`)) {
      setTeachers(prev => prev.filter(t => t.name !== name));
      if (setCourses) {
        setCourses(prev =>
          prev.map(c => (c.teacher === name ? { ...c, teacher: 'Unassigned' } : c))
        );
      }
      showToast(`Faculty member removed.`);
    }
  };

  return (
    <div className="teachers-view-layout">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1 className="view-title">Teachers & Faculty</h1>
          <p className="view-subtitle">Institute educators, department leads, and course assignment roster.</p>
        </div>

        <div className="view-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsManageDeptOpen(true)}
            title="Add or organize departments"
          >
            <Building2 size={16} />
            <span>Manage Departments</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setIsAddTeacherOpen(true)}
          >
            <Plus size={16} />
            <span>Add faculty member</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="teachers-filters-bar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="text-input"
            placeholder="Search teachers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="department-tabs">
          {['All', ...departments].map(dept => (
            <button
              key={dept}
              className={`dept-tab-btn ${departmentFilter === dept ? 'active' : ''}`}
              onClick={() => setDepartmentFilter(dept)}
            >
              {dept}
            </button>
          ))}
          <button
            type="button"
            className="dept-tab-btn"
            style={{ borderStyle: 'dashed', color: 'var(--primary-600)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            onClick={() => setIsManageDeptOpen(true)}
            title="Add new department"
          >
            <Plus size={12} />
            <span>Dept</span>
          </button>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="teachers-grid">
        {filteredTeachers.map(teacher => {
          const assignedCourses = courses.filter(c => c.teacher === teacher.name);
          return (
            <div key={teacher.name} className="teacher-card">
              <div className="teacher-card-top">
                <div className="teacher-avatar">
                  {teacher.photo && (
                    <img
                      src={teacher.photo}
                      alt={teacher.name}
                      className="teacher-photo-img"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <span>{teacher.avatar}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="teacher-name">{teacher.name}</h3>
                  <div className="teacher-role">{teacher.role}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    className="teacher-edit-btn"
                    onClick={() => {
                      setTeacherToEdit(teacher);
                      setIsEditTeacherOpen(true);
                    }}
                    title="Edit faculty details and photo"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="teacher-delete-btn"
                    onClick={() => handleDeleteTeacher(teacher.name)}
                    title="Remove faculty member"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="teacher-card-body">
                <div className="teacher-meta-item">
                  <span className="meta-label">Department:</span>
                  <span className="badge badge-purple">{teacher.department}</span>
                </div>

                {teacher.assignedClass && (
                  <div className="teacher-meta-item">
                    <span className="meta-label">Class Teacher:</span>
                    <span className="badge badge-active" style={{ fontSize: '11px' }}>
                      {teacher.assignedClass}
                    </span>
                  </div>
                )}

                {teacher.room && (
                  <div className="teacher-meta-item">
                    <span className="meta-label">Office / Room:</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                      {teacher.room}
                    </span>
                  </div>
                )}

                {teacher.phone && (
                  <div className="teacher-meta-item">
                    <span className="meta-label">Phone:</span>
                    <span style={{ fontSize: '12px', color: 'var(--slate-600)' }}>
                      {teacher.phone}
                    </span>
                  </div>
                )}

                <div className="teacher-meta-item">
                  <span className="meta-label">Assigned:</span>
                  <span className="meta-courses-count">
                    {assignedCourses.length} {assignedCourses.length === 1 ? 'course' : 'courses'}
                  </span>
                </div>

                {assignedCourses.length > 0 && (
                  <div className="assigned-courses-pills">
                    {assignedCourses.map(c => (
                      <span key={c.id} className="course-pill">
                        {c.name} ({c.code})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="teacher-card-footer">
                <a href={`mailto:${teacher.email}`} className="email-link">
                  <Mail size={13} />
                  <span>{teacher.email}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Teacher Modal */}
      <AddTeacherModal
        isOpen={isAddTeacherOpen}
        onClose={() => setIsAddTeacherOpen(false)}
        onAddTeacher={handleAddTeacher}
        departments={departments}
        onAddDepartment={onAddDepartment}
      />

      {/* Edit Teacher Modal */}
      <EditTeacherModal
        isOpen={isEditTeacherOpen}
        onClose={() => {
          setIsEditTeacherOpen(false);
          setTeacherToEdit(null);
        }}
        teacher={teacherToEdit}
        onSaveTeacher={handleSaveTeacher}
        departments={departments}
        onAddDepartment={onAddDepartment}
      />

      {/* Manage Departments Modal */}
      <ManageDepartmentsModal
        isOpen={isManageDeptOpen}
        onClose={() => setIsManageDeptOpen(false)}
        departments={departments}
        onAddDepartment={onAddDepartment}
        onRenameDepartment={onRenameDepartment}
        onDeleteDepartment={onDeleteDepartment}
        teachers={teachers}
      />
    </div>
  );
}
