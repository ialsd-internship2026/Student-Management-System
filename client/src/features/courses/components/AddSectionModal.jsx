import React, { useState } from 'react';
import { X, Plus, Layers } from 'lucide-react';

export default function AddSectionModal({ isOpen, onClose, onAddSection, teachers }) {
  const [formData, setFormData] = useState({
    grade: 'Grade 10',
    sectionLetter: 'C',
    classTeacher: teachers[0]?.name || 'Daniel Reed',
    room: '208',
    capacity: 36
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const sectionName = `${formData.grade}-${formData.sectionLetter.toUpperCase()}`;

    const newSection = {
      id: `sec-${Date.now()}`,
      section: sectionName,
      classTeacher: formData.classTeacher,
      studentsEnrolled: 0,
      capacity: Number(formData.capacity),
      room: formData.room,
      status: 'Active',
      isEditing: false
    };

    onAddSection(newSection);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="modal-title">Add Class Section</h2>
              <p className="modal-subtitle">Provision an additional cohort section and assign classroom & teacher.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Grade</label>
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
              <label className="form-label">Section Identifier</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. C or D"
                value={formData.sectionLetter}
                maxLength={2}
                onChange={(e) => setFormData({ ...formData, sectionLetter: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Class Teacher *</label>
            <select
              className="select-input"
              value={formData.classTeacher}
              onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
            >
              {teachers.map(t => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.department})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Classroom / Hall</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Room 212"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student Capacity</label>
              <select
                className="select-input"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              >
                <option value="30">30 students</option>
                <option value="32">32 students</option>
                <option value="36">36 students</option>
                <option value="40">40 students</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              <span>Add Section</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
