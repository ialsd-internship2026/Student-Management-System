import React, { useState, useEffect } from 'react';
import { X, Check, BookOpen, Trash2 } from 'lucide-react';

export default function EditExamModal({
  isOpen,
  onClose,
  exam,
  examIndex,
  onSaveExam,
  onDeleteExam,
  studentName
}) {
  const [formData, setFormData] = useState({
    subject: 'Mathematics',
    assessment: 'Unit test 02',
    score: 92,
    maxScore: 100,
    grade: 'A+'
  });

  useEffect(() => {
    if (exam) {
      const parts = (exam.score || '90 / 100').split('/');
      const parsedScore = parseInt(parts[0]?.trim() || '90', 10);
      const parsedMax = parseInt(parts[1]?.trim() || '100', 10);
      setFormData({
        subject: exam.subject || 'Mathematics',
        assessment: exam.assessment || 'Assessment',
        score: isNaN(parsedScore) ? 90 : parsedScore,
        maxScore: isNaN(parsedMax) ? 100 : parsedMax,
        grade: exam.grade || 'A'
      });
    }
  }, [exam]);

  if (!isOpen || !exam) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveExam({
      subject: formData.subject,
      assessment: formData.assessment,
      score: `${formData.score} / ${formData.maxScore}`,
      grade: formData.grade
    }, examIndex);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Delete ${formData.subject} assessment score for ${studentName}?`)) {
      onDeleteExam(examIndex);
      onClose();
    }
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
              <h2 className="modal-title">Edit Assessment Score</h2>
              <p className="modal-subtitle">Update marks and grade for {studentName}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select
              className="select-input"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Computer science">Computer science</option>
              <option value="English">English</option>
              <option value="Biology">Biology</option>
              <option value="Chemistry">Chemistry</option>
              <option value="World History">World History</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assessment Title *</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Unit test 02 or Midterm Practical"
              value={formData.assessment}
              onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Marks (out of {formData.maxScore})</label>
              <input
                type="number"
                min="0"
                max="100"
                className="text-input"
                value={formData.score}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  const autoGrade = s >= 92 ? 'A+' : s >= 84 ? 'A' : s >= 75 ? 'B+' : s >= 65 ? 'B' : s >= 50 ? 'C+' : 'D';
                  setFormData({ ...formData, score: s, grade: autoGrade });
                }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Letter Grade</label>
              <select
                className="select-input"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              >
                <option value="A+">A+ (Distinction)</option>
                <option value="A">A (Excellent)</option>
                <option value="B+">B+ (Very Good)</option>
                <option value="B">B (Good)</option>
                <option value="C+">C+ (Satisfactory)</option>
                <option value="C">C (Pass)</option>
                <option value="D">D (Remedial)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              title="Remove this exam result"
            >
              <Trash2 size={14} />
              <span>Delete Result</span>
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Check size={16} />
                <span>Save Grade</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
