import React, { useState, useEffect } from 'react';
import { X, Check, TrendingUp } from 'lucide-react';

export default function EditTrendModal({ isOpen, onClose, student, onSaveTrend }) {
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    if (student?.trend) {
      setTrendData([...student.trend]);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleScoreChange = (idx, newScore) => {
    setTrendData(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], score: Number(newScore) };
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveTrend(trendData);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="modal-title">Edit Performance Trend Points</h2>
              <p className="modal-subtitle">Update weekly score trajectory data for {student.name}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="trend-inputs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {trendData.map((pt, idx) => (
              <div key={idx} className="form-group">
                <label className="form-label">{pt.date}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="text-input"
                    value={pt.score}
                    onChange={(e) => handleScoreChange(idx, e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Update Chart</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
