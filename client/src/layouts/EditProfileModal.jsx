import React, { useState, useEffect } from 'react';
import { X, Check, User, ShieldCheck, GraduationCap } from 'lucide-react';
import PhotoUploader from '../components/common/PhotoUploader';
import { SAMPLE_TEACHER_PHOTOS } from '../data/portalData';

export default function EditProfileModal({
  isOpen,
  onClose,
  workspace,
  userProfile,
  onSaveProfile,
  departments = ['Mathematics', 'Science', 'Technology', 'Humanities', 'Arts']
}) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: '',
    assignedClass: '',
    email: '',
    initials: '',
    photo: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || (workspace === 'admin' ? 'Olivia Chen' : 'Daniel Reed'),
        role: userProfile.role || (workspace === 'admin' ? 'Institute administrator' : 'Mathematics faculty'),
        department: userProfile.department || (workspace === 'admin' ? 'Administration' : 'Mathematics'),
        assignedClass: userProfile.assignedClass || 'Grade 10-A',
        email: userProfile.email || (workspace === 'admin' ? 'o.chen@aster.edu' : 'd.reed@aster.edu'),
        initials: userProfile.initials || (workspace === 'admin' ? 'OC' : 'DR'),
        photo: userProfile.photo || ''
      });
    }
  }, [userProfile, workspace]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const autoInitials = formData.name
      .trim()
      .split(/\s+/)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    onSaveProfile({
      ...userProfile,
      name: formData.name,
      role: formData.role,
      department: formData.department,
      assignedClass: formData.assignedClass,
      email: formData.email,
      initials: formData.initials || autoInitials,
      photo: formData.photo || ''
    });
    onClose();
  };

  const isTeacher = workspace === 'teacher';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              {isTeacher ? <GraduationCap size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div>
              <h2 className="modal-title">
                Edit {isTeacher ? 'Class Teacher' : 'Administrator'} Profile
              </h2>
              <p className="modal-subtitle">
                Update account identity, profile photo, and institutional permissions.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Persona Profile Photo */}
          <PhotoUploader
            photo={formData.photo}
            onPhotoChange={(newPhoto) => setFormData(prev => ({ ...prev, photo: newPhoto }))}
            initials={formData.initials || (isTeacher ? 'DR' : 'OC')}
            label="Persona Profile Photo"
            presetPhotos={SAMPLE_TEACHER_PHOTOS}
            idPrefix="persona-edit"
          />

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="text-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar Initials</label>
              <input
                type="text"
                maxLength={3}
                className="text-input"
                value={formData.initials}
                onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase() })}
                placeholder={isTeacher ? 'DR' : 'OC'}
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Role / Title *</label>
              <input
                type="text"
                className="text-input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department / Unit</label>
              <input
                type="text"
                list="persona-departments-list"
                className="text-input"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
              <datalist id="persona-departments-list">
                <option value="Administration" />
                {departments.map(d => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>

          {isTeacher && (
            <div className="form-group">
              <label className="form-label">Assigned Head Class</label>
              <select
                className="select-input"
                value={formData.assignedClass}
                onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
              >
                <option value="Grade 10-A">Grade 10-A</option>
                <option value="Grade 10-B">Grade 10-B</option>
                <option value="Grade 11-A">Grade 11-A</option>
                <option value="Grade 11-B">Grade 11-B</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Official Email</label>
            <input
              type="email"
              className="text-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
