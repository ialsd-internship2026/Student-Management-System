import React, { useState } from 'react';
import { X, Plus, BookOpen } from 'lucide-react';

export default function CreateCourseModal({ isOpen, onClose, onAddCourse, teachers }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Core course',
    grade: 'Grade 10',
    credits: '4 credits',
    teacher: teachers[0]?.name || 'Daniel Reed',
    capacity: 36,
    attendanceMin: '85%',
    description: '',
    iconType: 'sigma'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

      const gradePart = formData.grade?.includes(' ') ? formData.grade.split(' ')[1] : (formData.grade || '10');
      const newCourse = {
        id: `course-${Date.now()}`,
        name: formData.name,
        code: formData.code.toUpperCase(),
        type: formData.type,
        iconType: formData.iconType,
        teacher: formData.teacher,
        sections: [`${gradePart}-A`],
      grade: formData.grade,
      term: 'Fall term 2026',
      studentsCount: 0,
      status: 'Draft',
      credits: formData.credits,
      description: formData.description || 'Curriculum overview for newly proposed course.',
      room: '204',
      capacity: Number(formData.capacity),
      attendanceMin: formData.attendanceMin,
      elements: {
        attendance: true,
        growth: true,
        examResults: false,
        resources: true
      }
    };

    onAddCourse(newCourse);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="modal-title">Create New Course</h2>
              <p className="modal-subtitle">Define curriculum parameters, grade tier, and lead faculty.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Course Name *</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Environmental Science & Sustainability"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Course Code *</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. ENV-202"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Course Type</label>
              <select
                className="select-input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Core course">Core course</option>
                <option value="Elective">Elective</option>
                <option value="Honors / AP">Honors / AP</option>
              </select>
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Target Grade</label>
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

          <div className="form-group">
            <label className="form-label">Lead Faculty *</label>
            <select
              className="select-input"
              value={formData.teacher}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
            >
              {teachers.map(t => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.department})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Course Description</label>
            <textarea
              className="textarea-input"
              rows={3}
              placeholder="Outline course learning objectives, weekly schedule, and prerequisites..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              <span>Create Course (Draft)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
