import React, { useState, useEffect } from 'react';
import { X, Check, BookOpen, Trash2, Atom, Layers, ToggleLeft, ToggleRight } from 'lucide-react';

export default function EditCourseModal({
  isOpen,
  onClose,
  course,
  onSaveCourse,
  onDeleteCourse,
  teachers = []
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Core course',
    grade: 'Grade 10',
    credits: '4 credits',
    teacher: 'Daniel Reed',
    sections: '10-A, 10-B',
    status: 'Active',
    room: '204',
    capacity: 36,
    attendanceMin: '85%',
    description: '',
    elements: {
      attendance: true,
      growth: true,
      examResults: true,
      resources: true
    }
  });

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || '',
        code: course.code || '',
        type: course.type || 'Core course',
        grade: course.grade || 'Grade 10',
        credits: course.credits || '4 credits',
        teacher: course.teacher || 'Daniel Reed',
        sections: Array.isArray(course.sections) ? course.sections.join(', ') : (course.sections || '10-A, 10-B'),
        status: course.status || 'Active',
        room: course.room || '204',
        capacity: course.capacity || 36,
        attendanceMin: course.attendanceMin || '85%',
        description: course.description || '',
        elements: {
          attendance: course.elements?.attendance ?? true,
          growth: course.elements?.growth ?? true,
          examResults: course.elements?.examResults ?? true,
          resources: course.elements?.resources ?? true
        }
      });
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    const sectionsArray = formData.sections
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    onSaveCourse({
      ...course,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      type: formData.type,
      grade: formData.grade,
      credits: formData.credits,
      teacher: formData.teacher.trim(),
      sections: sectionsArray.length > 0 ? sectionsArray : ['10-A'],
      status: formData.status,
      room: formData.room.trim(),
      capacity: Number(formData.capacity),
      attendanceMin: formData.attendanceMin,
      description: formData.description.trim(),
      elements: { ...formData.elements }
    });
    onClose();
  };

  const toggleElement = (key) => {
    setFormData(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [key]: !prev.elements[key]
      }
    }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="modal-title">Edit Course & Section</h2>
              <p className="modal-subtitle">Update syllabus, lead faculty teacher, and class section settings.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Course Name *</label>
              <input
                type="text"
                className="text-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Mathematics"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Course Code *</label>
              <input
                type="text"
                className="text-input"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. MAT-101"
                required
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Lead / Class Teacher *</label>
              <input
                type="text"
                list="course-modal-teachers-list"
                className="text-input"
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                placeholder="Type or select faculty name"
                required
              />
              <datalist id="course-modal-teachers-list">
                {teachers.map(t => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.department || t.role})
                  </option>
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Credits</label>
              <select
                className="select-input"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
              >
                <option value="2 credits">2 credits</option>
                <option value="3 credits">3 credits</option>
                <option value="4 credits">4 credits</option>
                <option value="5 credits">5 credits</option>
              </select>
            </div>
          </div>

          <div className="form-row-3col">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="select-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Grade Tier</label>
              <select
                className="select-input"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              >
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Room / Hall</label>
              <input
                type="text"
                className="text-input"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="e.g. 204 or Lab 3"
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Assigned Sections (comma-separated)</label>
              <input
                type="text"
                className="text-input"
                value={formData.sections}
                onChange={(e) => setFormData({ ...formData, sections: e.target.value })}
                placeholder="e.g. 10-A, 10-B"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Student Capacity</label>
              <select
                className="select-input"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              >
                <option value="30">30 students</option>
                <option value="32">32 students</option>
                <option value="34">34 students</option>
                <option value="36">36 students</option>
                <option value="40">40 students</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Course Description</label>
            <textarea
              className="textarea-input"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Overview of curriculum syllabus and analytical targets..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Active Student Section Elements</label>
            <div className="modal-toggles-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div
                className={`modal-toggle-chip ${formData.elements.attendance ? 'active' : ''}`}
                onClick={() => toggleElement('attendance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  background: formData.elements.attendance ? 'var(--primary-50)' : 'var(--bg-card)',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Attendance & Schedule</span>
                <span style={{ fontSize: '11px', color: formData.elements.attendance ? 'var(--primary-600)' : 'var(--slate-400)', fontWeight: 700 }}>
                  {formData.elements.attendance ? 'ON' : 'OFF'}
                </span>
              </div>

              <div
                className={`modal-toggle-chip ${formData.elements.growth ? 'active' : ''}`}
                onClick={() => toggleElement('growth')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  background: formData.elements.growth ? 'var(--primary-50)' : 'var(--bg-card)',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Growth Charts</span>
                <span style={{ fontSize: '11px', color: formData.elements.growth ? 'var(--primary-600)' : 'var(--slate-400)', fontWeight: 700 }}>
                  {formData.elements.growth ? 'ON' : 'OFF'}
                </span>
              </div>

              <div
                className={`modal-toggle-chip ${formData.elements.examResults ? 'active' : ''}`}
                onClick={() => toggleElement('examResults')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  background: formData.elements.examResults ? 'var(--primary-50)' : 'var(--bg-card)',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Exam Results Table</span>
                <span style={{ fontSize: '11px', color: formData.elements.examResults ? 'var(--primary-600)' : 'var(--slate-400)', fontWeight: 700 }}>
                  {formData.elements.examResults ? 'ON' : 'OFF'}
                </span>
              </div>

              <div
                className={`modal-toggle-chip ${formData.elements.resources ? 'active' : ''}`}
                onClick={() => toggleElement('resources')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  background: formData.elements.resources ? 'var(--primary-50)' : 'var(--bg-card)',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Learning Resources</span>
                <span style={{ fontSize: '11px', color: formData.elements.resources ? 'var(--primary-600)' : 'var(--slate-400)', fontWeight: 700 }}>
                  {formData.elements.resources ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {onDeleteCourse && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (window.confirm(`Delete "${course.name}" from curriculum?`)) {
                    onDeleteCourse(course.id);
                    onClose();
                  }
                }}
                title="Delete this course"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Save Course</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
