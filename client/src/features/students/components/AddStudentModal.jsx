import React, { useState } from 'react';
import { X, Plus, UserPlus } from 'lucide-react';
import PhotoUploader from '../../../components/common/PhotoUploader';
import { SAMPLE_STUDENT_PHOTOS } from '../../../data/portalData';

export default function AddStudentModal({ isOpen, onClose, onAddStudent }) {
  const [formData, setFormData] = useState({
    name: '',
    id: `AST-${1030 + Math.floor(Math.random() * 90)}`,
    photo: '',
    section: 'Grade 10-A',
    attendance: 92,
    score: 86,
    growth: 8,
    rank: '15 / 33',
    status: 'On track'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const newStudent = {
      id: formData.id,
      name: formData.name,
      photo: formData.photo || '',
      initials: formData.name
        .trim()
        .split(/\s+/)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      section: formData.section,
      term: 'Fall term 2026',
      attendance: Number(formData.attendance),
      score: Number(formData.score),
      growth: Number(formData.growth),
      rank: formData.rank,
      status: formData.status,
      feedback: {
        author: "Daniel's feedback",
        date: 'Today',
        text: 'Welcome to Grade 10-A. Initial diagnostic scores recorded.'
      },
      trend: [
        { date: 'Aug 24', score: Number(formData.score) - 8 },
        { date: 'Aug 31', score: Number(formData.score) - 6 },
        { date: 'Sep 07', score: Number(formData.score) - 4 },
        { date: 'Sep 14', score: Number(formData.score) - 2 },
        { date: 'Sep 21', score: Number(formData.score) - 1 },
        { date: 'Sep 28', score: Number(formData.score) },
        { date: 'Oct 05', score: Number(formData.score) }
      ],
      exams: [
        { subject: 'Mathematics', assessment: 'Unit test 02', score: `${formData.score} / 100`, grade: Number(formData.score) >= 90 ? 'A+' : Number(formData.score) >= 80 ? 'A' : 'B' },
        { subject: 'Physics', assessment: 'Unit test 02', score: `${Number(formData.score) - 2} / 100`, grade: 'A' },
        { subject: 'Computer science', assessment: 'Practical 01', score: `${Number(formData.score) + 2} / 100`, grade: 'A+' }
      ],
      nextExam: 'Mathematics midterm · 12 October'
    };

    onAddStudent(newStudent);
    onClose();
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
              <h2 className="modal-title">Add New Student</h2>
              <p className="modal-subtitle">Enroll student into cohort, upload photo, and initialize performance.</p>
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
            initials={formData.name ? formData.name.slice(0, 2).toUpperCase() : 'ST'}
            label="Student Photo (Optional)"
            presetPhotos={SAMPLE_STUDENT_PHOTOS}
            idPrefix="student-add"
          />

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Samantha Wu"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student ID *</label>
              <input
                type="text"
                className="text-input"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Class Section</label>
              <select
                className="select-input"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              >
                <option value="Grade 10-A">Grade 10-A</option>
                <option value="Grade 10-B">Grade 10-B</option>
                <option value="Grade 11-A">Grade 11-A</option>
                <option value="Grade 11-B">Grade 11-B</option>
                <option value="Grade 12-A">Grade 12-A</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Performance Status</label>
              <select
                className="select-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="On track">On track</option>
                <option value="Needs support">Needs support</option>
                <option value="Excelling">Excelling</option>
              </select>
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Attendance (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="text-input"
                value={formData.attendance}
                onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="text-input"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              <span>Enroll Student</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
