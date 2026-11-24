import React, { useState, useEffect } from 'react';
import { X, Check, Layers, Trash2 } from 'lucide-react';

export default function EditSectionModal({
  isOpen,
  onClose,
  section,
  onSaveSection,
  onDeleteSection,
  teachers
}) {
  const [formData, setFormData] = useState({
    section: '',
    classTeacher: '',
    capacity: 36,
    room: '',
    status: 'Active'
  });

  useEffect(() => {
    if (section) {
      setFormData({
        section: section.section || '',
        classTeacher: section.classTeacher || '',
        capacity: section.capacity || 36,
        room: section.room || '',
        status: section.status || 'Active'
      });
    }
  }, [section]);

  if (!isOpen || !section) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSection({
      ...section,
      section: formData.section,
      classTeacher: formData.classTeacher,
      capacity: Number(formData.capacity),
      room: formData.room,
      status: formData.status
    });
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
              <h2 className="modal-title">Edit Class Section</h2>
              <p className="modal-subtitle">Modify section parameters, assigned hall, and faculty head.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Section Identifier *</label>
              <input
                type="text"
                className="text-input"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Class Status</label>
              <select
                className="select-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Class Teacher Name *</label>
            <input
              type="text"
              list="section-teachers-list"
              className="text-input"
              value={formData.classTeacher}
              onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
              placeholder="Select or type custom faculty name"
              required
            />
            <datalist id="section-teachers-list">
              {teachers.map(t => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.department})
                </option>
              ))}
            </datalist>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Room / Hall *</label>
              <input
                type="text"
                className="text-input"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                required
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

          <div className="modal-footer">
            {onDeleteSection && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (window.confirm(`Delete section ${section.section}?`)) {
                    onDeleteSection(section.id);
                    onClose();
                  }
                }}
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
              <span>Save Section</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
