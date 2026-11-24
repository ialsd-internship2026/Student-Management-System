import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  Search,
  Filter,
  Users,
  Pencil,
  Plus,
  ArrowUpDown,
  Download
} from 'lucide-react';
import EditStudentModal from '../../students/components/EditStudentModal';
import AddStudentModal from '../../students/components/AddStudentModal';

export default function AttendanceView({ students, setStudents, sections = [], showToast }) {
  const [selectedDate, setSelectedDate] = useState('2026-10-06');
  const [selectedSection, setSelectedSection] = useState('Grade 10-A');
  const [search, setSearch] = useState('');

  // Modals for editing/adding students directly from Attendance view
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // Initial attendance status map keyed by student id
  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const saved = localStorage.getItem(`portal_attendance_daily_2026-10-06`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const map = {};
    students.forEach((s) => {
      map[s.id] = s.attendance >= 85 ? 'present' : s.attendance >= 75 ? 'late' : 'absent';
    });
    return map;
  });

  // Load date-specific attendance records when selectedDate changes
  useEffect(() => {
    const savedForDate = localStorage.getItem(`portal_attendance_daily_${selectedDate}`);
    if (savedForDate) {
      try {
        setAttendanceRecords(JSON.parse(savedForDate));
        return;
      } catch (e) {}
    }
    // Fallback to baseline based on each student's current attendance
    const map = {};
    students.forEach((s) => {
      map[s.id] = s.attendance >= 85 ? 'present' : s.attendance >= 75 ? 'late' : 'absent';
    });
    setAttendanceRecords(map);
  }, [selectedDate]);

  // Extract unique available sections list
  const availableSections = sections.length > 0
    ? sections.map(s => s.name || s.section)
    : ['Grade 10-A', 'Grade 10-B', 'Grade 11-A'];
  const allSectionNames = Array.from(new Set([
    ...availableSections,
    ...students.map(s => s.section).filter(Boolean)
  ]));

  // Consistent status resolver (used everywhere so table and summary pills never mismatch)
  const getStudentStatus = (studentId, currentAttendance) => {
    if (attendanceRecords[studentId]) return attendanceRecords[studentId];
    return currentAttendance >= 85 ? 'present' : currentAttendance >= 75 ? 'late' : 'absent';
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => {
      const updated = {
        ...prev,
        [studentId]: status
      };
      localStorage.setItem(`portal_attendance_daily_${selectedDate}`, JSON.stringify(updated));
      return updated;
    });
  };

  const markAll = (status) => {
    const updated = { ...attendanceRecords };
    filteredStudents.forEach(s => {
      updated[s.id] = status;
    });
    setAttendanceRecords(updated);
    localStorage.setItem(`portal_attendance_daily_${selectedDate}`, JSON.stringify(updated));
    showToast(`Marked ${filteredStudents.length} students as ${status}`);
  };

  // Adjust attendance percentage (+1 or -1) directly on the row
  const handleAdjustAttendance = (studentId, delta) => {
    if (!setStudents) return;
    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          const newAtt = Math.max(0, Math.min(100, s.attendance + delta));
          return { ...s, attendance: newAtt };
        }
        return s;
      })
    );
  };

  // Save records permanently to React state, localStorage, and disk project files via /api/save-defaults
  const handleSave = async () => {
    const updatedStudents = students.map(s => {
      const rec = getStudentStatus(s.id, s.attendance);
      let newAtt = s.attendance;
      if (rec === 'absent' && s.attendance > 10) newAtt = Math.max(0, s.attendance - 1);
      if (rec === 'present' && s.attendance < 100) newAtt = Math.min(100, s.attendance + 1);
      return {
        ...s,
        attendance: newAtt
      };
    });

    if (setStudents) {
      setStudents(updatedStudents);
    }

    localStorage.setItem('portal_students', JSON.stringify(updatedStudents));
    localStorage.setItem(`portal_attendance_daily_${selectedDate}`, JSON.stringify(attendanceRecords));

    // Persist permanently into project folder via backend endpoint
    try {
      const master = JSON.parse(localStorage.getItem('portal_master_default') || '{}');
      const payload = {
        ...master,
        students: updatedStudents,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('portal_master_default', JSON.stringify(payload));

      const resp = await fetch('/api/save-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        showToast(`✓ Saved Attendance for ${selectedSection} (${selectedDate}) permanently to project files in folder!`);
        return;
      }
    } catch (e) {
      console.warn('Backend save:', e);
    }

    showToast(`✓ Attendance for ${selectedSection} on ${selectedDate} saved & student records updated.`);
  };

  // Handle saving an edited student from the inline modal
  const handleSaveStudent = async (updatedSt, originalId = updatedSt.id) => {
    const updatedList = students.map(s => (s.id === originalId ? updatedSt : s));
    if (setStudents) setStudents(updatedList);
    localStorage.setItem('portal_students', JSON.stringify(updatedList));

    try {
      const master = JSON.parse(localStorage.getItem('portal_master_default') || '{}');
      const payload = { ...master, students: updatedList };
      localStorage.setItem('portal_master_default', JSON.stringify(payload));
      await fetch('/api/save-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}

    showToast(`✓ Updated profile for ${updatedSt.name} (${updatedSt.id})`);
  };

  // Handle adding a new student from the inline modal
  const handleAddStudent = async (newSt) => {
    const updatedList = [newSt, ...students];
    if (setStudents) setStudents(updatedList);
    localStorage.setItem('portal_students', JSON.stringify(updatedList));

    try {
      const master = JSON.parse(localStorage.getItem('portal_master_default') || '{}');
      const payload = { ...master, students: updatedList };
      localStorage.setItem('portal_master_default', JSON.stringify(payload));
      await fetch('/api/save-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}

    showToast(`Enrolled new student ${newSt.name} into ${newSt.section}`);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.id.toLowerCase().includes(search.toLowerCase());
    const matchesSection = selectedSection === 'All' || s.section === selectedSection || s.class === selectedSection;
    return matchesSearch && matchesSection;
  });

  const total = filteredStudents.length;
  const presentCount = filteredStudents.filter(s => getStudentStatus(s.id, s.attendance) === 'present').length;
  const lateCount = filteredStudents.filter(s => getStudentStatus(s.id, s.attendance) === 'late').length;
  const absentCount = filteredStudents.filter(s => getStudentStatus(s.id, s.attendance) === 'absent').length;

  return (
    <div className="attendance-view-layout">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1 className="view-title">Attendance Sheet</h1>
          <p className="view-subtitle">Daily roll call and section-level attendance registration. Changes save permanently into project folder.</p>
        </div>

        <div className="view-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsAddStudentOpen(true)}
            title="Enroll a student directly into this section"
          >
            <Plus size={14} />
            <span>Add Student</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => markAll('present')}>
            Mark all present
          </button>
          <button className="btn btn-primary" onClick={handleSave} title="Save records permanently into project folder">
            <Save size={16} />
            <span>Save records</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Summary */}
      <div className="attendance-controls-card">
        <div className="controls-row">
          <div className="control-field">
            <label className="control-label">Academic Section</label>
            <select
              className="select-input"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="All">All Sections ({students.length} students)</option>
              {allSectionNames.map((secName) => {
                const count = students.filter(s => s.section === secName || s.class === secName).length;
                return (
                  <option key={secName} value={secName}>
                    {secName} ({count} students)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="control-field">
            <label className="control-label">Roll Call Date</label>
            <input
              type="date"
              className="text-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="control-field search-field">
            <label className="control-label">Find Student</label>
            <div className="attend-search-wrap">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                className="text-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="attendance-summary-pills">
          <div className="summary-pill pill-present">
            <CheckCircle size={15} />
            <span>Present: <strong>{presentCount}</strong> / {total}</span>
          </div>
          <div className="summary-pill pill-late">
            <Clock size={15} />
            <span>Late: <strong>{lateCount}</strong></span>
          </div>
          <div className="summary-pill pill-absent">
            <XCircle size={15} />
            <span>Absent: <strong>{absentCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="attendance-table-card">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>STUDENT</th>
              <th>SECTION</th>
              <th>TERM ATTENDANCE</th>
              <th>STATUS</th>
              <th>MARK ROLL CALL</th>
              <th style={{ textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((st) => {
              const currentStatus = getStudentStatus(st.id, st.attendance);
              return (
                <tr key={st.id}>
                  <td>
                    <div className="attend-student-cell">
                      <div className="attend-avatar">
                        {st.photo && (
                          <img
                            src={st.photo}
                            alt={st.name}
                            className="attend-avatar-img"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <span className="attend-avatar-initials">{st.initials}</span>
                      </div>
                      <div>
                        <div className="attend-name">{st.name}</div>
                        <div className="attend-id">{st.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                      {st.section || 'Grade 10-A'}
                    </span>
                  </td>
                  <td>
                    <div className="term-attend-bar-wrap">
                      <div className="term-attend-track">
                        <div
                          className="term-attend-fill"
                          style={{
                            width: `${st.attendance}%`,
                            backgroundColor: st.attendance >= 85 ? '#10b981' : st.attendance >= 75 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="term-attend-text">{st.attendance}%</span>
                      <div className="attend-quick-adjust-group">
                        <button
                          type="button"
                          className="btn-attend-adj"
                          onClick={() => handleAdjustAttendance(st.id, -1)}
                          title="Decrease attendance by 1%"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          className="btn-attend-adj"
                          onClick={() => handleAdjustAttendance(st.id, 1)}
                          title="Increase attendance by 1%"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        currentStatus === 'present'
                          ? 'badge-active'
                          : currentStatus === 'late'
                          ? 'badge-draft'
                          : 'badge-archived'
                      }`}
                    >
                      {currentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="status-buttons-group">
                      <button
                        className={`status-btn btn-pres ${currentStatus === 'present' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(st.id, 'present')}
                        title="Mark Present"
                      >
                        Present
                      </button>
                      <button
                        className={`status-btn btn-lat ${currentStatus === 'late' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(st.id, 'late')}
                        title="Mark Late"
                      >
                        Late
                      </button>
                      <button
                        className={`status-btn btn-abs ${currentStatus === 'absent' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(st.id, 'absent')}
                        title="Mark Absent"
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: '11.5px', gap: '4px' }}
                      onClick={() => {
                        setStudentToEdit(st);
                        setIsEditStudentOpen(true);
                      }}
                      title="Edit student profile and photo"
                    >
                      <Pencil size={11} />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Student Modal */}
      {studentToEdit && (
        <EditStudentModal
          isOpen={isEditStudentOpen}
          onClose={() => {
            setIsEditStudentOpen(false);
            setStudentToEdit(null);
          }}
          student={studentToEdit}
          onSaveStudent={handleSaveStudent}
          onDeleteStudent={(id) => {
            const remaining = students.filter(s => s.id !== id);
            if (setStudents) setStudents(remaining);
            localStorage.setItem('portal_students', JSON.stringify(remaining));
            setIsEditStudentOpen(false);
            showToast('Student record removed.');
          }}
        />
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onAddStudent={handleAddStudent}
      />
    </div>
  );
}