import React, { useState } from 'react';
import { X, Plus, BookOpen } from 'lucide-react';

export default function AddExamModal({ isOpen, onClose, onAddExam, studentName }) {
  const [formData, setFormData] = useState({
    subject: 'Mathematics',
    assessment: 'Midterm Quiz',
    score: 90,
    maxScore: 100,
    grade: 'A+'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddExam({
      subject: formData.subject,
      assessment: formData.assessment,
      score: `${formData.score} / ${formData.maxScore}`,
      grade: formData.grade
    });
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
              <h2 className="modal-title">Record Assessment Result</h2>
              <p className="modal-subtitle">Add published assessment score for {studentName}</p>
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
              placeholder="e.g. Midterm Examination or Unit Test 03"
              value={formData.assessment}
              onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Marks Obtained</label>
              <input
                type="number"
                min="0"
                max="100"
                className="text-input"
                value={formData.score}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  const autoGrade = s >= 92 ? 'A+' : s >= 84 ? 'A' : s >= 75 ? 'B+' : s >= 65 ? 'B' : 'C+';
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
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B+">B+</option>
                <option value="B">B</option>
                <option value="C+">C+</option>
                <option value="C">C</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              <span>Add Exam Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
