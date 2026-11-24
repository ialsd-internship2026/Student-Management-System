import React, { useState, useEffect } from 'react';
import { X, Check, Clock, Calendar } from 'lucide-react';

export default function EditScheduleModal({ isOpen, onClose, blockData, onSaveBlock }) {
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('Room 204');
  const [periodLabel, setPeriodLabel] = useState('');

  useEffect(() => {
    if (blockData) {
      setSubject(blockData.subject || '');
      setRoom(blockData.room || 'Room 204');
      setPeriodLabel(blockData.period || '');
    }
  }, [blockData]);

  if (!isOpen || !blockData) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveBlock({
      ...blockData,
      subject: subject.trim(),
      room: room.trim(),
      period: periodLabel.trim() || blockData.period
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="modal-title">Edit Timetable Period</h2>
              <p className="modal-subtitle">{blockData.day} · {blockData.period}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Period / Time Slot *</label>
            <input
              type="text"
              className="text-input"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="e.g. Period 1 (08:30 - 09:30)"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subject & Section *</label>
            <input
              type="text"
              className="text-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Mathematics (10-A) or Physics Lab"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Room / Lab *</label>
            <input
              type="text"
              className="text-input"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Room 204 or Lab 3"
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Update Period</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
