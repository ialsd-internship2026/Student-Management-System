import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { TIMETABLE_DATA } from '../../../data/portalData';
import EditScheduleModal from './EditScheduleModal';

const FALLBACK_PERIODS = [
  { period: 'Period 1 (08:30 - 09:15)', mon: 'Mathematics', tue: 'Physics', wed: 'Literature', thu: 'Chemistry', fri: 'English' },
  { period: 'Period 2 (09:20 - 10:05)', mon: 'Chemistry', tue: 'Geometry', wed: 'Physics', thu: 'History', fri: 'Physical Ed' },
  { period: 'Period 3 (10:20 - 11:05)', mon: 'English', tue: 'Biology', wed: 'Algebra', thu: 'Arts', fri: 'Computer Science' },
  { period: 'Period 4 (11:10 - 11:55)', mon: 'Physical Ed', tue: 'History', wed: 'Geometry', thu: 'Algebra', fri: 'Physics' },
  { period: 'Period 5 (12:45 - 01:30)', mon: 'Computer Science', tue: 'Physical Ed', wed: 'Biology', thu: 'English', fri: 'History' },
  { period: 'Period 6 (01:35 - 02:20)', mon: 'Academic Advising', tue: 'Library', wed: 'Study Hall', thu: 'Faculty Hours', fri: 'Weekly Assembly' }
];

const DEFAULT_TIMETABLES = {
  'Grade 10-A': (TIMETABLE_DATA && TIMETABLE_DATA.length > 0) ? TIMETABLE_DATA : FALLBACK_PERIODS,
  'Grade 10-B': [
    { period: 'Period 1 (08:30 - 09:15)', mon: 'World History', tue: 'Algebra II', wed: 'Literature', thu: 'Chemistry Lab', fri: 'English Literature' },
    { period: 'Period 2 (09:20 - 10:05)', mon: 'Chemistry Lab', tue: 'Geometry', wed: 'Physics I', thu: 'World History', fri: 'Physical Education' },
    { period: 'Period 3 (10:20 - 11:05)', mon: 'English Literature', tue: 'Biology', wed: 'Algebra II', thu: 'Music / Art', fri: 'Computer Science' },
    { period: 'Period 4 (11:10 - 11:55)', mon: 'Physical Education', tue: 'World History', wed: 'Geometry', thu: 'Algebra II', fri: 'Physics I' },
    { period: 'Period 5 (12:45 - 01:30)', mon: 'Computer Science', tue: 'Physical Education', wed: 'Biology', thu: 'English Literature', fri: 'World History' },
    { period: 'Period 6 (01:35 - 02:20)', mon: 'Academic Advising', tue: 'Library Research', wed: 'Study Hall', thu: 'Faculty Office Hours', fri: 'Weekly Assembly' },
  ],
  'Grade 11-A': [
    { period: 'Period 1 (08:30 - 09:15)', mon: 'AP Calculus AB', tue: 'AP Physics C', wed: 'World Literature', thu: 'Organic Chemistry', fri: 'AP Calculus AB' },
    { period: 'Period 2 (09:20 - 10:05)', mon: 'Organic Chemistry', tue: 'AP Calculus AB', wed: 'AP US History', thu: 'AP Physics C', fri: 'Economics' },
    { period: 'Period 3 (10:20 - 11:05)', mon: 'AP US History', tue: 'Organic Chemistry', wed: 'AP Calculus AB', thu: 'Computer Science II', fri: 'World Literature' },
    { period: 'Period 4 (11:10 - 11:55)', mon: 'AP Physics C', tue: 'Computer Science II', wed: 'Economics', thu: 'AP US History', fri: 'AP Physics C' },
    { period: 'Period 5 (12:45 - 01:30)', mon: 'Economics', tue: 'World Literature', wed: 'Computer Science II', thu: 'Organic Chemistry', fri: 'Study Seminar' },
    { period: 'Period 6 (01:35 - 02:20)', mon: 'College Prep Advisory', tue: 'Lab Practicum', wed: 'Library Research', thu: 'Faculty Office Hours', fri: 'Honors Colloquium' },
  ]
};

export default function ScheduleView({
  workspace,
  sections = [],
  showToast,
  timetableBySection: propTimetableBySection,
  setTimetableBySection: propSetTimetableBySection
}) {
  const [activeSection, setActiveSection] = useState('Grade 10-A');
  const [internalTimetableBySection, setInternalTimetableBySection] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_timetables_by_section');
      return saved ? JSON.parse(saved) : DEFAULT_TIMETABLES;
    } catch (e) {
      return DEFAULT_TIMETABLES;
    }
  });

  const timetableBySection = propTimetableBySection || internalTimetableBySection;
  const setTimetableBySection = propSetTimetableBySection || setInternalTimetableBySection;

  useEffect(() => {
    if (!propTimetableBySection) {
      localStorage.setItem('portal_timetables_by_section', JSON.stringify(internalTimetableBySection));
    }
  }, [internalTimetableBySection, propTimetableBySection]);

  const timetable = timetableBySection[activeSection] || DEFAULT_TIMETABLES['Grade 10-A'] || TIMETABLE_DATA;

  // Extract unique available sections list
  const availableSections = sections.length > 0
    ? sections.map(s => s.name || s.section)
    : ['Grade 10-A', 'Grade 10-B', 'Grade 11-A'];
  const allSectionNames = Array.from(new Set([
    ...availableSections,
    'Grade 10-A', 'Grade 10-B', 'Grade 11-A'
  ]));

  const [editingBlock, setEditingBlock] = useState(null);

  const handleBlockClick = (rowIdx, dayKey, currentSubject, dayLabel, period) => {
    setEditingBlock({
      rowIdx,
      dayKey,
      day: dayLabel,
      period,
      subject: currentSubject,
      room: activeSection.includes('11') ? 'Lab 3' : 'Room 204'
    });
  };

  const handleSaveBlock = (updated) => {
    setTimetableBySection(prev => {
      const currentList = prev[activeSection] || DEFAULT_TIMETABLES[activeSection] || TIMETABLE_DATA;
      const copy = [...currentList];
      copy[updated.rowIdx] = {
        ...copy[updated.rowIdx],
        [updated.dayKey]: updated.subject,
        period: updated.period || copy[updated.rowIdx].period
      };
      return {
        ...prev,
        [activeSection]: copy
      };
    });
    if (showToast) {
      showToast(`Updated ${activeSection} · ${updated.day} period to "${updated.subject}".`);
    }
  };

  const handleAddPeriodRow = () => {
    setTimetableBySection(prev => {
      const currentList = prev[activeSection] || DEFAULT_TIMETABLES[activeSection] || TIMETABLE_DATA;
      const newPeriodNum = currentList.length + 1;
      const newRow = {
        period: `Period ${newPeriodNum} (14:30 - 15:30)`,
        mon: 'Elective Workshop',
        tue: 'Lab Practicum',
        wed: 'Academic Mentorship',
        thu: 'Independent Study',
        fri: 'Weekly Review'
      };
      return {
        ...prev,
        [activeSection]: [...currentList, newRow]
      };
    });
    if (showToast) showToast(`Added Period ${timetable.length + 1} to ${activeSection} timetable.`);
  };

  const handleDeletePeriodRow = (rowIdx, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Delete this period from ${activeSection} timetable?`)) {
      setTimetableBySection(prev => {
        const currentList = prev[activeSection] || DEFAULT_TIMETABLES[activeSection] || TIMETABLE_DATA;
        const copy = currentList.filter((_, idx) => idx !== rowIdx);
        return {
          ...prev,
          [activeSection]: copy
        };
      });
      if (showToast) showToast(`Removed period from ${activeSection}.`);
    }
  };

  return (
    <div className="schedule-view-layout">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1 className="view-title">
            {workspace === 'admin' ? 'Schedule Management' : 'Class Schedule'}
          </h1>
          <p className="view-subtitle">
            Weekly academic timetable, room assignments, and instructional blocks. (Click any block to edit)
          </p>
        </div>

        <div className="view-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="select-input"
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
          >
            {allSectionNames.map((secName) => (
              <option key={secName} value={secName}>
                Schedule: {secName}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ padding: '6px 12px', fontSize: '12px', gap: '5px' }}
            onClick={handleAddPeriodRow}
            title="Add a new period slot to this section timetable"
          >
            <Plus size={14} />
            <span>Add Period</span>
          </button>
        </div>
      </div>

      {/* Timetable Card */}
      <div className="timetable-card">
        <div className="timetable-header-strip">
          <div className="timetable-term-label">
            <Calendar size={15} />
            <span>Week 6 (Oct 05 - Oct 09, 2026) · Regular Schedule</span>
          </div>
          <div className="timetable-legend">
            <span className="legend-chip core">Core Course</span>
            <span className="legend-chip elective">Lab / Elective</span>
            <span className="legend-chip admin">Faculty Block</span>
          </div>
        </div>

        <div className="timetable-table-wrapper">
          <table className="timetable-table">
            <thead>
              <tr>
                <th className="period-col">TIME & PERIOD</th>
                <th>MONDAY</th>
                <th>TUESDAY</th>
                <th>WEDNESDAY</th>
                <th>THURSDAY</th>
                <th>FRIDAY</th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((row, idx) => (
                <tr key={idx}>
                  <td className="period-cell" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                        onClick={() => handleBlockClick(idx, 'mon', row.mon, 'Monday', row.period)}
                        title="Click to edit period timing label"
                      >
                        <Clock size={13} className="period-icon" />
                        <span style={{ fontWeight: 600 }}>{row.period}</span>
                        <Pencil size={11} style={{ opacity: 0.6, marginLeft: '3px' }} />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeletePeriodRow(idx, e)}
                        title="Delete period row"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)', padding: '2px' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div
                      className="timetable-block core-block clickable-block"
                      onClick={() => handleBlockClick(idx, 'mon', row.mon, 'Monday', row.period)}
                      title="Click to edit Monday period"
                    >
                      <div className="block-title">{row.mon}</div>
                      <div className="block-room"><MapPin size={11} /> Room 204</div>
                    </div>
                  </td>
                  <td>
                    <div
                      className="timetable-block lab-block clickable-block"
                      onClick={() => handleBlockClick(idx, 'tue', row.tue, 'Tuesday', row.period)}
                      title="Click to edit Tuesday period"
                    >
                      <div className="block-title">{row.tue}</div>
                      <div className="block-room"><MapPin size={11} /> Room 206</div>
                    </div>
                  </td>
                  <td>
                    <div
                      className="timetable-block core-block clickable-block"
                      onClick={() => handleBlockClick(idx, 'wed', row.wed, 'Wednesday', row.period)}
                      title="Click to edit Wednesday period"
                    >
                      <div className="block-title">{row.wed}</div>
                      <div className="block-room"><MapPin size={11} /> Lab 3</div>
                    </div>
                  </td>
                  <td>
                    <div
                      className="timetable-block core-block clickable-block"
                      onClick={() => handleBlockClick(idx, 'thu', row.thu, 'Thursday', row.period)}
                      title="Click to edit Thursday period"
                    >
                      <div className="block-title">{row.thu}</div>
                      <div className="block-room"><MapPin size={11} /> Room 204</div>
                    </div>
                  </td>
                  <td>
                    <div
                      className="timetable-block admin-block clickable-block"
                      onClick={() => handleBlockClick(idx, 'fri', row.fri, 'Friday', row.period)}
                      title="Click to edit Friday period"
                    >
                      <div className="block-title">{row.fri}</div>
                      <div className="block-room"><MapPin size={11} /> Room 102</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Schedule Modal */}
      <EditScheduleModal
        isOpen={Boolean(editingBlock)}
        onClose={() => setEditingBlock(null)}
        blockData={editingBlock}
        onSaveBlock={handleSaveBlock}
      />
    </div>
  );
}
