import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Sliders } from 'lucide-react';

export default function EditTermWidgetModal({ isOpen, onClose, widgetData, onSaveWidget }) {
  const [title, setTitle] = useState('');
  const [meta, setMeta] = useState('');
  const [dates, setDates] = useState('');
  const [percentage, setPercentage] = useState(37.5);

  useEffect(() => {
    if (widgetData) {
      setTitle(widgetData.title || 'A little progress, every day.');
      setMeta(widgetData.meta || 'Fall term 2026 Week 6 of 16');
      setDates(widgetData.dates || '31 Aug – 18 Dec');
      setPercentage(widgetData.percentage ?? 37.5);
    }
  }, [widgetData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveWidget({
      title,
      meta,
      dates,
      percentage: Number(percentage)
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
              <h2 className="modal-title">Customize Term Progress Widget</h2>
              <p className="modal-subtitle">Modify sidebar motivation quote and term calendar progression.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Motivational Headline</label>
            <input
              type="text"
              className="text-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A little progress, every day."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Term Week Progression</label>
            <input
              type="text"
              className="text-input"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="e.g. Fall term 2026 Week 6 of 16"
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Date Span Label</label>
              <input
                type="text"
                className="text-input"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                placeholder="e.g. 31 Aug – 18 Dec"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Progress Bar (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="text-input"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Update Widget</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
