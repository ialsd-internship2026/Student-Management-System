import React, { useState, useEffect } from 'react';
import { X, Plus, Bell, Check, Pencil } from 'lucide-react';

export default function EditAnnouncementModal({
  isOpen,
  onClose,
  onAddAnnouncement,
  onSaveAnnouncement,
  announcementToEdit = null
}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('Academic Office');
  const [date, setDate] = useState('Today');

  const isEditing = Boolean(announcementToEdit);

  useEffect(() => {
    if (announcementToEdit) {
      setTitle(announcementToEdit.title || '');
      setAuthor(announcementToEdit.author || 'Academic Office');
      setDate(announcementToEdit.date || 'Today');
    } else {
      setTitle('');
      setAuthor('Academic Office');
      setDate('Today');
    }
  }, [announcementToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && onSaveAnnouncement) {
      onSaveAnnouncement({
        ...announcementToEdit,
        title: title.trim(),
        author,
        date: date.trim()
      });
    } else if (onAddAnnouncement) {
      onAddAnnouncement({
        id: `ann-${Date.now()}`,
        title: title.trim(),
        author,
        date: date.trim()
      });
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              {isEditing ? <Pencil size={18} /> : <Bell size={18} />}
            </div>
            <div>
              <h2 className="modal-title">
                {isEditing ? 'Edit Announcement Notice' : 'Publish New Announcement'}
              </h2>
              <p className="modal-subtitle">
                {isEditing
                  ? 'Update announcement wording, issuing department, or milestone date.'
                  : 'Post milestone, faculty briefing, or academic notice.'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Announcement Title *</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Science Fair Registration Open"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Issuing Department</label>
              <select
                className="select-input"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              >
                <option value="Academic Office">Academic Office</option>
                <option value="Principal Office">Principal Office</option>
                <option value="Student Support">Student Support</option>
                <option value="Examination Board">Examination Board</option>
                <option value="Mathematics Department">Mathematics Department</option>
                <option value="Science Department">Science Department</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date Label</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Oct 10, 2026 or Today"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? <Check size={16} /> : <Plus size={16} />}
              <span>{isEditing ? 'Save Changes' : 'Publish Notice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
