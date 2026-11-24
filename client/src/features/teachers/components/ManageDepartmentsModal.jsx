import React, { useState } from 'react';
import { X, Plus, Building2, Trash2, Check, Layers, Pencil } from 'lucide-react';

export default function ManageDepartmentsModal({
  isOpen,
  onClose,
  departments = [],
  onAddDepartment,
  onRenameDepartment,
  onDeleteDepartment,
  teachers = []
}) {
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDeptName, setEditingDeptName] = useState(null);
  const [deptRenameInput, setDeptRenameInput] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    const trimmed = newDeptName.trim();
    if (departments.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Department "${trimmed}" already exists.`);
      return;
    }

    onAddDepartment(trimmed);
    setNewDeptName('');
  };

  const handleSaveRename = (oldName) => {
    const trimmed = deptRenameInput.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingDeptName(null);
      return;
    }

    if (onRenameDepartment) {
      onRenameDepartment(oldName, trimmed);
    } else {
      if (onDeleteDepartment) onDeleteDepartment(oldName);
      if (onAddDepartment) onAddDepartment(trimmed);
    }
    setEditingDeptName(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="modal-title">Manage Institute Departments</h2>
              <p className="modal-subtitle">Add or organize academic faculties for educator assignments.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Add New Department Inline Form */}
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Robotics & AI, Business Studies, Music..."
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              style={{ flex: 1 }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              <Plus size={15} />
              <span>Add Department</span>
            </button>
          </form>

          {/* Department List */}
          <div>
            <div className="form-section-title" style={{ marginTop: '4px', marginBottom: '8px' }}>
              Current Departments ({departments.length})
            </div>

            <div
              className="dept-manage-list"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '8px'
              }}
            >
              {departments.map((dept) => {
                const teacherCount = teachers.filter(t => t.department === dept).length;
                return (
                  <div
                    key={dept}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    {editingDeptName === dept ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, marginRight: '10px' }}>
                        <input
                          type="text"
                          className="text-input"
                          style={{ fontSize: '13px', padding: '3px 8px' }}
                          value={deptRenameInput}
                          onChange={(e) => setDeptRenameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(dept);
                            if (e.key === 'Escape') setEditingDeptName(null);
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '3px 8px' }}
                          onClick={() => handleSaveRename(dept)}
                          title="Save department name"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 6px' }}
                          onClick={() => setEditingDeptName(null)}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Layers size={15} style={{ color: 'var(--primary-600)' }} />
                        <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--slate-800)' }}>
                          {dept}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--slate-400)',
                            backgroundColor: 'var(--slate-100)',
                            padding: '1px 6px',
                            borderRadius: '10px'
                          }}
                        >
                          {teacherCount} {teacherCount === 1 ? 'educator' : 'educators'}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {editingDeptName !== dept && (
                        <button
                          type="button"
                          className="btn-card-duplicate"
                          onClick={() => {
                            setEditingDeptName(dept);
                            setDeptRenameInput(dept);
                          }}
                          title={`Rename ${dept} department`}
                          style={{ padding: '4px', color: 'var(--slate-600)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Pencil size={13} />
                        </button>
                      )}

                      {onDeleteDepartment && (
                        <button
                          type="button"
                          className="btn-card-duplicate"
                          onClick={() => {
                            if (window.confirm(`Delete department "${dept}"?`)) {
                              onDeleteDepartment(dept);
                            }
                          }}
                          title={`Delete ${dept} department`}
                          style={{ padding: '4px', color: 'var(--slate-400)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '8px' }}>
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-primary" onClick={onClose}>
              <Check size={16} />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
