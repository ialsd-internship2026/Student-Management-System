import React, { useState, useEffect } from 'react';
import { X, Check, GraduationCap, Trash2 } from 'lucide-react';
import PhotoUploader from '../../../components/common/PhotoUploader';
import { SAMPLE_STUDENT_PHOTOS } from '../../../data/portalData';

export default function EditStudentModal({
  isOpen,
  onClose,
  student,
  onSaveStudent,
  onDeleteStudent
}) {
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    photo: '',
    section: 'Grade 10-A',
    term: 'Fall term 2026',
    attendance: 90,
    score: 85,
    growth: 10,
    rank: '6 / 32',
    status: 'On track',
    nextExam: '',
    feedbackText: '',
    feedbackAuthor: "Daniel's feedback"
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        id: student.id || '',
        photo: student.photo || '',
        section: student.section || 'Grade 10-A',
        term: student.term || 'Fall term 2026',
        attendance: student.attendance ?? 90,
        score: student.score ?? 85,
        growth: student.growth ?? 10,
        rank: student.rank || '6 / 32',
        status: student.status || 'On track',
        nextExam: student.nextExam || '',
        feedbackText: student.feedback?.text || '',
        feedbackAuthor: student.feedback?.author || "Daniel's feedback"
      });
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.id.trim()) return;

    const initials = formData.name
      .trim()
      .split(/\s+/)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    onSaveStudent({
      ...student,
      name: formData.name.trim(),
      id: formData.id.trim(),
      photo: formData.photo || '',
      section: formData.section,
      term: formData.term,
      attendance: Number(formData.attendance),
      score: Number(formData.score),
      growth: Number(formData.growth),
      rank: formData.rank.trim(),
      status: formData.status,
      initials: initials || 'ST',
      nextExam: formData.nextExam ? formData.nextExam.trim() : (student.nextExam || ''),
      feedback: {
        author: formData.feedbackAuthor || student.feedback?.author || "Daniel's feedback",
        date: student.feedback?.date || 'Today',
        text: formData.feedbackText ? formData.feedbackText.trim() : (student.feedback?.text || '')
      }
    }, student.id); // Pass original student.id to safely support renaming student ID
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <GraduationCap size={18} />
            </div>
            <div>
              <h2 className="modal-title">Edit Student Profile & Stats</h2>
              <p className="modal-subtitle">Modify learner identity, photo, performance metrics, and standing.</p>
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
            label="Student Profile Photo"
            presetPhotos={SAMPLE_STUDENT_PHOTOS}
            idPrefix="student-edit"
          />

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="text-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Maya Patel"
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
                placeholder="e.g. AST-1024"
                required
              />
            </div>
          </div>

          <div className="form-row-3col">
            <div className="form-group">
              <label className="form-label">Assigned Class Section</label>
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

            <div className="form-group">
              <label className="form-label">Academic Term</label>
              <select
                className="select-input"
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
              >
                <option value="Fall term 2026">Fall term 2026</option>
                <option value="Spring term 2027">Spring term 2027</option>
              </select>
            </div>
          </div>

          {/* 4 Core Hero KPIs */}
          <div className="form-section-title">Core Performance Metrics</div>
          <div className="form-row-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Attendance (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="text-input"
                value={formData.attendance}
                onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Overall Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="text-input"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Growth (pts)</label>
              <input
                type="number"
                className="text-input"
                value={formData.growth}
                onChange={(e) => setFormData({ ...formData, growth: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Class Rank</label>
              <input
                type="text"
                className="text-input"
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                placeholder="e.g. 6 / 32"
                required
              />
            </div>
          </div>

          {/* Academic Notes & Feedback Section */}
          <div className="form-section-title" style={{ marginTop: '12px' }}>Next Assessment & Faculty Remarks</div>
          <div className="form-group">
            <label className="form-label">Upcoming Assessment Notice</label>
            <input
              type="text"
              className="text-input"
              value={formData.nextExam}
              onChange={(e) => setFormData({ ...formData, nextExam: e.target.value })}
              placeholder="e.g. Mathematics midterm · 12 October"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Class Teacher Feedback / Remarks</label>
              <input
                type="text"
                className="text-input"
                style={{ width: '160px', fontSize: '11px', padding: '2px 6px', height: '26px' }}
                value={formData.feedbackAuthor}
                onChange={(e) => setFormData({ ...formData, feedbackAuthor: e.target.value })}
                placeholder="Author label"
              />
            </div>
            <textarea
              className="text-input"
              rows={2}
              style={{ width: '100%', resize: 'vertical', fontSize: '12px' }}
              value={formData.feedbackText}
              onChange={(e) => setFormData({ ...formData, feedbackText: e.target.value })}
              placeholder="Enter personalized feedback or remedial notes for this student..."
            />
          </div>

          <div className="modal-footer">
            {onDeleteStudent && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (window.confirm(`Delete record for ${student.name}?`)) {
                    onDeleteStudent(student.id);
                    onClose();
                  }
                }}
                title="Remove student record"
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
              <span>Save Student</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
