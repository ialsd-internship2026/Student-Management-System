import React, { useState } from 'react';
import { X, Plus, UserPlus } from 'lucide-react';
import PhotoUploader from '../../../components/common/PhotoUploader';
import { SAMPLE_TEACHER_PHOTOS } from '../../../data/portalData';

export default function AddTeacherModal({
  isOpen,
  onClose,
  onAddTeacher,
  departments = ['Mathematics', 'Science', 'Technology', 'Humanities', 'Arts'],
  onAddDepartment
}) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'Faculty Member',
    department: departments[0] || 'Mathematics',
    email: '',
    avatar: '',
    photo: '',
    assignedClass: '',
    room: '',
    phone: '',
    officeHours: ''
  });

  const [isAddingNewDept, setIsAddingNewDept] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const initials = formData.name
      .trim()
      .split(/\s+/)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const email = formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@aster.edu`;

    onAddTeacher({
      name: formData.name.trim(),
      role: formData.role.trim(),
      department: formData.department,
      email,
      avatar: initials,
      photo: formData.photo || '',
      assignedClass: formData.assignedClass,
      room: formData.room ? formData.room.trim() : '',
      phone: formData.phone ? formData.phone.trim() : '',
      officeHours: formData.officeHours ? formData.officeHours.trim() : ''
    });

    onClose();
  };

  const handleQuickAddDept = (e) => {
    e.preventDefault();
    if (!newDeptInput.trim()) return;
    const trimmed = newDeptInput.trim();
    if (onAddDepartment) {
      onAddDepartment(trimmed);
    }
    setFormData(prev => ({ ...prev, department: trimmed }));
    setNewDeptInput('');
    setIsAddingNewDept(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="modal-title">Add Faculty Member</h2>
              <p className="modal-subtitle">Enroll teacher or instructor into academic department.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Photo Uploader */}
          <PhotoUploader
            photo={formData.photo}
            onPhotoChange={(newPhoto) => setFormData(prev => ({ ...prev, photo: newPhoto }))}
            initials={formData.name ? formData.name.slice(0, 2).toUpperCase() : 'T'}
            label="Faculty Photo (Optional)"
            presetPhotos={SAMPLE_TEACHER_PHOTOS}
            idPrefix="teacher-add"
          />

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Dr. Robert Chen"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>Department</label>
                {!isAddingNewDept && (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-600)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    onClick={() => setIsAddingNewDept(true)}
                  >
                    <Plus size={11} />
                    <span>New Dept</span>
                  </button>
                )}
              </div>

              {!isAddingNewDept ? (
                <select
                  className="select-input"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    className="text-input"
                    style={{ fontSize: '12px' }}
                    placeholder="New department..."
                    value={newDeptInput}
                    onChange={(e) => setNewDeptInput(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ padding: '2px 8px' }}
                    onClick={handleQuickAddDept}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 6px' }}
                    onClick={() => setIsAddingNewDept(false)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Role / Title</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Senior Lecturer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Official Email</label>
            <input
              type="email"
              className="text-input"
              placeholder="e.g. r.chen@aster.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Assigned Class Teacher Section</label>
              <select
                className="select-input"
                value={formData.assignedClass}
                onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
              >
                <option value="">None / Subject Faculty Only</option>
                <option value="Grade 10-A">Grade 10-A</option>
                <option value="Grade 10-B">Grade 10-B</option>
                <option value="Grade 11-A">Grade 11-A</option>
                <option value="Grade 11-B">Grade 11-B</option>
                <option value="Grade 12-A">Grade 12-A</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Faculty Office / Room</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Room 204 or Lab 3"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. +1 (555) 234-5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Office Hours</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Mon & Wed 2:00 - 4:00 PM"
                value={formData.officeHours}
                onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              <span>Add Faculty Member</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
