import React, { useState, useEffect } from 'react';
import { X, Check, Users, Mail, BookOpen, Plus } from 'lucide-react';
import PhotoUploader from '../../../components/common/PhotoUploader';
import { SAMPLE_TEACHER_PHOTOS } from '../../../data/portalData';

export default function EditTeacherModal({
  isOpen,
  onClose,
  teacher,
  onSaveTeacher,
  departments = ['Mathematics', 'Science', 'Technology', 'Humanities', 'Arts'],
  onAddDepartment
}) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: 'Mathematics',
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

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || '',
        role: teacher.role || '',
        department: teacher.department || departments[0] || 'Mathematics',
        email: teacher.email || '',
        avatar: teacher.avatar || '',
        photo: teacher.photo || '',
        assignedClass: teacher.assignedClass || '',
        room: teacher.room || '',
        phone: teacher.phone || '',
        officeHours: teacher.officeHours || ''
      });
    }
  }, [teacher, departments]);

  if (!isOpen || !teacher) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const autoAvatar = formData.name
      .trim()
      .split(/\s+/)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    onSaveTeacher({
      ...teacher,
      name: formData.name.trim(),
      role: formData.role.trim(),
      department: formData.department,
      email: formData.email.trim(),
      avatar: formData.avatar || autoAvatar,
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
              <Users size={18} />
            </div>
            <div>
              <h2 className="modal-title">Edit Faculty Details</h2>
              <p className="modal-subtitle">Update educator photo, name, title, and assigned department.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Teacher Photo Uploader */}
          <PhotoUploader
            photo={formData.photo}
            onPhotoChange={(newPhoto) => setFormData(prev => ({ ...prev, photo: newPhoto }))}
            initials={formData.avatar || 'T'}
            label="Faculty Profile Photo"
            presetPhotos={SAMPLE_TEACHER_PHOTOS}
            idPrefix="teacher-edit"
          />

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="text-input"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                const autoAvatar = name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                setFormData({ ...formData, name, avatar: autoAvatar });
              }}
              placeholder="e.g. Daniel Reed or Sarah Kim"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Title & Role *</label>
            <input
              type="text"
              className="text-input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g. Mathematics faculty & 10-A Head"
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
                    placeholder="New department name..."
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
              <label className="form-label">Avatar Initials</label>
              <input
                type="text"
                maxLength={3}
                className="text-input"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value.toUpperCase() })}
                placeholder="e.g. DR"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="text-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. d.reed@aster.edu"
              required
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
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="e.g. Room 204 or Lab 3"
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="text-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +1 (555) 234-5678"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Office Hours</label>
              <input
                type="text"
                className="text-input"
                value={formData.officeHours}
                onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                placeholder="e.g. Mon & Wed 2:00 - 4:00 PM"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Save Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
