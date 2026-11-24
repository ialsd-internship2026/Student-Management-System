import React, { useState } from 'react';
import {
  Download,
  Search,
  Heart,
  TrendingUp,
  Award,
  Calendar,
  ChevronRight,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  Check,
  Send,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Table,
  User,
  GraduationCap,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';
import { CLASS_AVERAGE_TREND } from '../../../data/portalData';
import EditStudentModal from './EditStudentModal';
import AddStudentModal from './AddStudentModal';
import AddExamModal from './AddExamModal';
import EditExamModal from './EditExamModal';
import EditTrendModal from './EditTrendModal';

export default function StudentsResultsView({
  students,
  setStudents,
  onOpenReportModal,
  showToast,
  workspace = 'admin',
  teacherUser,
  sections = [],
  selectedStudentId: propSelectedStudentId,
  setSelectedStudentId: propSetSelectedStudentId
}) {
  const [internalStudentId, setInternalStudentId] = useState('AST-1024');
  const selectedStudentId = propSelectedStudentId || internalStudentId;
  const setSelectedStudentId = propSetSelectedStudentId || setInternalStudentId;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState(() => {
    if (workspace === 'teacher' && teacherUser?.assignedClass) {
      return teacherUser.assignedClass;
    }
    return 'All classes';
  });
  const [performanceFilter, setPerformanceFilter] = useState('All performance levels');
  const [studentPage, setStudentPage] = useState(1);
  const studentsPerPage = 8;

  // View Mode: 'detail' (Student Profile) vs 'gradebook' (Class Gradebook batch grading)
  const [viewMode, setViewMode] = useState('detail');

  // Modals state
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isEditExamOpen, setIsEditExamOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState({ exam: null, index: -1 });
  const [isEditTrendOpen, setIsEditTrendOpen] = useState(false);

  // Next exam inline editing
  const [isEditingNextExam, setIsEditingNextExam] = useState(false);
  const [nextExamInput, setNextExamInput] = useState('');

  // Inline student rename
  const [isEditingStudentName, setIsEditingStudentName] = useState(false);
  const [inlineStudentName, setInlineStudentName] = useState('');

  // Class teacher feedback state
  const [newFeedbackText, setNewFeedbackText] = useState('');
  const [feedbackAuthor, setFeedbackAuthor] = useState(
    teacherUser?.name ? `${teacherUser.name.split(' ')[0]}'s feedback` : "Daniel's feedback"
  );
  const [feedbackDate, setFeedbackDate] = useState('Today');
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);

  // Extract unique available sections list
  const availableSections = sections.length > 0
    ? sections.map(s => s.name || s.section)
    : ['Grade 10-A', 'Grade 10-B', 'Grade 11-A'];
  const allSectionNames = Array.from(new Set([
    ...availableSections,
    ...students.map(s => s.section).filter(Boolean)
  ]));

  // Preset Remarks for Class Teacher
  const PRESET_REMARKS = [
    "🌟 Excellent algebra reasoning, Maya. Keep showing each step of your working as we move into quadratic equations.",
    "📈 Demonstrates consistent score growth since August. Strong participation in analytical problem solving.",
    "⚠️ Needs to complete pending homework assignments and revise linear coordinate geometry formulas.",
    "🎯 Outstanding test performance! Strongly recommended for the Mathematics Olympiad clinic.",
    "💡 Active contributor in group problem-solving sessions and lab exercises."
  ];

  // Filter students based on search, section and performance
  const filteredStudents = students.filter(student => {
    // Search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = student.name.toLowerCase().includes(q);
      const matchId = student.id.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }

    // Dynamic Section filter
    if (selectedClass !== 'All classes' && selectedClass !== 'All Sections') {
      const targetSec = selectedClass.includes('·') ? selectedClass.split('·')[0].trim() : selectedClass;
      if (student.section && student.section !== targetSec && !targetSec.includes(student.section)) {
        return false;
      }
    }

    // Performance filter
    if (performanceFilter === 'Needs support' && student.status !== 'Needs support') return false;
    if (performanceFilter === 'On track' && student.status !== 'On track') return false;
    if (performanceFilter === 'Excelling' && student.status !== 'Excelling') return false;

    return true;
  });

  // Active student object (safely resolved)
  const selectedStudent = students.find(s => s.id === selectedStudentId) || filteredStudents[0] || students[0] || {};

  const totalFiltered = filteredStudents.length;
  const paginatedStudents = filteredStudents.slice(
    (studentPage - 1) * studentsPerPage,
    studentPage * studentsPerPage
  );

  const needsSupportCount = students.filter(s => s.status === 'Needs support').length;

  // Add new student
  const handleAddStudent = (newSt) => {
    setStudents(prev => [newSt, ...prev]);
    setSelectedStudentId(newSt.id);
    showToast(`Enrolled student ${newSt.name} (${newSt.id})`);
  };

  // Update existing student
  const handleSaveStudent = (updatedSt, originalId = updatedSt.id) => {
    setStudents(prev => prev.map(s => (s.id === originalId ? updatedSt : s)));
    if (selectedStudentId === originalId) {
      setSelectedStudentId(updatedSt.id);
    }
    showToast(`✓ Updated profile for ${updatedSt.name} (${updatedSt.id})`);
  };

  // Quick rename student inline
  const handleQuickRenameStudent = (e) => {
    e.preventDefault();
    if (!inlineStudentName.trim()) return;
    const trimmed = inlineStudentName.trim();
    const newInitials = trimmed
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    setStudents(prev =>
      prev.map(s => {
        if (s.id === selectedStudentId) {
          return {
            ...s,
            name: trimmed,
            initials: newInitials
          };
        }
        return s;
      })
    );
    setIsEditingStudentName(false);
    showToast(`Renamed student to "${trimmed}".`);
  };

  // Delete student
  const handleDeleteStudent = (studentId) => {
    if (window.confirm(`Are you sure you want to remove ${selectedStudent.name}?`)) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      const remaining = students.filter(s => s.id !== studentId);
      if (remaining.length > 0) {
        setSelectedStudentId(remaining[0].id);
      }
      showToast(`Student record removed.`);
    }
  };

  // Quick steppers for attendance and score (Class Teacher grading)
  const handleAdjustScore = (studentId, delta) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          const newScore = Math.max(0, Math.min(100, s.score + delta));
          const newStatus = newScore >= 90 ? 'Excelling' : newScore >= 75 ? 'On track' : 'Needs support';
          return {
            ...s,
            score: newScore,
            status: newStatus
          };
        }
        return s;
      })
    );
    showToast('Score updated.');
  };

  const handleAdjustAttendance = (studentId, delta) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            attendance: Math.max(0, Math.min(100, s.attendance + delta))
          };
        }
        return s;
      })
    );
    showToast('Attendance updated.');
  };

  const handleQuickStatusChange = (studentId, newStatus) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
    showToast(`Performance status set to ${newStatus}`);
  };

  // Add exam result to current student
  const handleAddExam = (newExam) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id === selectedStudentId) {
          return {
            ...s,
            exams: [newExam, ...(s.exams || [])]
          };
        }
        return s;
      })
    );
    showToast(`Recorded ${newExam.subject} assessment for ${selectedStudent.name}`);
  };

  // Save edited exam
  const handleSaveExam = (updatedExam, examIndex) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id === selectedStudentId) {
          const copy = [...(s.exams || [])];
          copy[examIndex] = updatedExam;
          return {
            ...s,
            exams: copy
          };
        }
        return s;
      })
    );
    showToast(`Updated ${updatedExam.subject} assessment for ${selectedStudent.name}`);
  };

  // Delete exam
  const handleDeleteExam = (examIndex) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id === selectedStudentId) {
          const copy = (s.exams || []).filter((_, i) => i !== examIndex);
          return {
            ...s,
            exams: copy
          };
        }
        return s;
      })
    );
    showToast('Assessment result deleted.');
  };

  // Save next exam notice
  const handleSaveNextExam = (e) => {
    e.preventDefault();
    setStudents(prev =>
      prev.map(s => {
        if (s.id === selectedStudentId) {
          return {
            ...s,
            nextExam: nextExamInput
          };
        }
        return s;
      })
    );
    setIsEditingNextExam(false);
    showToast('Next assessment schedule updated.');
  };

  // Save updated trend points
  const handleSaveTrend = (newTrend) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id === selectedStudentId) {
          const latestScore = newTrend[newTrend.length - 1]?.score ?? s.score;
          return {
            ...s,
            trend: newTrend,
            score: latestScore
          };
        }
        return s;
      })
    );
    showToast(`Updated performance trajectory chart for ${selectedStudent.name}`);
  };

  // Submit new feedback
  const handleAddFeedback = (e) => {
    e.preventDefault();
    if (!newFeedbackText.trim()) return;

    setStudents(prev =>
      prev.map(s => {
        if (s.id === selectedStudentId) {
          return {
            ...s,
            feedback: {
              author: feedbackAuthor.trim() || "Daniel's feedback",
              date: feedbackDate.trim() || 'Today',
              text: newFeedbackText
            }
          };
        }
        return s;
      })
    );
    showToast(`Class teacher remarks saved for ${selectedStudent.name}`);
    setIsAddingFeedback(false);
  };

  // Chart coordinates calculation (SVG)
  const chartWidth = 560;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  const trendBaseline = CLASS_AVERAGE_TREND && CLASS_AVERAGE_TREND.length > 0
    ? CLASS_AVERAGE_TREND
    : [
        { date: 'Sep 15', avg: 82 },
        { date: 'Sep 29', avg: 84 },
        { date: 'Oct 13', avg: 85 },
        { date: 'Oct 27', avg: 87 }
      ];

  const dates = trendBaseline.map(d => d.date);
  const totalSteps = Math.max(1, dates.length - 1);
  const getX = (index) => paddingX + (index * (chartWidth - paddingX * 2)) / totalSteps;
  const getY = (val) => {
    const minVal = 55;
    const maxVal = 100;
    const normalized = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
    return chartHeight - paddingY - normalized * (chartHeight - paddingY * 2);
  };

  // Student trend points
  const studentPoints = selectedStudent.trend || [];
  const studentPathD = studentPoints.length > 0
    ? studentPoints.reduce((acc, curr, idx) => {
        const x = getX(idx);
        const y = getY(curr.score);
        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, '')
    : '';

  const classAvgPathD = trendBaseline.reduce((acc, curr, idx) => {
    const x = getX(idx);
    const y = getY(curr.avg);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="students-results-layout">
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="view-title">Students & results</h1>
            <span className="badge badge-active" style={{ fontSize: '11px' }}>
              <GraduationCap size={12} />
              Class Teacher Suite
            </span>
          </div>
          <p className="view-subtitle">Understand the whole class. Grade assessments. Support each learner.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View Mode Toggle: Student Detail vs Class Gradebook */}
          <div className="view-mode-toggle-group">
            <button
              className={`btn-mode-tab ${viewMode === 'detail' ? 'active' : ''}`}
              onClick={() => setViewMode('detail')}
              title="Individual student profile and trajectory"
            >
              <User size={13} />
              <span>Student Profile</span>
            </button>
            <button
              className={`btn-mode-tab ${viewMode === 'gradebook' ? 'active' : ''}`}
              onClick={() => setViewMode('gradebook')}
              title="Full class spreadsheet gradebook"
            >
              <Table size={13} />
              <span>Class Gradebook</span>
            </button>
          </div>

          <button className="btn btn-secondary" onClick={onOpenReportModal}>
            <Download size={16} />
            <span>Export class report</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="filters-row">
        <div className="filter-selects-group">
          <select
            className="select-input custom-filter-select"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setStudentPage(1);
            }}
          >
            <option value="All classes">All classes ({students.length} students)</option>
            {allSectionNames.map(secName => {
              const count = students.filter(s => s.section === secName).length;
              return (
                <option key={secName} value={secName}>
                  {secName} · {count} students
                </option>
              );
            })}
          </select>

          <select
            className="select-input custom-filter-select"
            value={performanceFilter}
            onChange={(e) => {
              setPerformanceFilter(e.target.value);
              setStudentPage(1);
            }}
          >
            <option value="All performance levels">All performance levels</option>
            <option value="Needs support">Needs support ({needsSupportCount})</option>
            <option value="On track">On track</option>
            <option value="Excelling">Excelling</option>
          </select>
        </div>

        <div className="classes-assigned-tag">
          {workspace === 'teacher'
            ? `Your classes · ${teacherUser?.assignedClass || 'Grade 10-A'} (${teacherUser?.name || 'Daniel Reed'})`
            : `Admin view · All Sections (${students.length} students enrolled)`}
        </div>
      </div>

      {/* VIEW MODE 1: CLASS GRADEBOOK (Spreadsheet grading for entire cohort) */}
      {viewMode === 'gradebook' && (
        <div className="gradebook-card">
          <div className="gradebook-header">
            <div className="gradebook-title-wrap">
              <h2>{selectedClass === 'All classes' ? 'Institute Cohort' : selectedClass.split('·')[0].trim()} Master Gradebook</h2>
              <p>Direct inline grading and attendance register. Click +/- to adjust marks or change status instantly.</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsAddStudentOpen(true)}
            >
              <Plus size={14} />
              <span>Enroll Student</span>
            </button>
          </div>

          <div className="gradebook-table-wrapper">
            <table className="gradebook-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>SECTION</th>
                  <th>ATTENDANCE</th>
                  <th>OVERALL SCORE</th>
                  <th>GROWTH</th>
                  <th>STATUS</th>
                  <th>CLASS RANK</th>
                  <th>LATEST EXAM</th>
                  <th style={{ textAlign: 'right' }}>QUICK ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <div className="gradebook-student-cell">
                        <div className="student-avatar-circle" style={{ width: '28px', height: '28px', fontSize: '11px', overflow: 'hidden' }}>
                          {st.photo ? (
                            <img src={st.photo} alt={st.name} className="student-avatar-img" />
                          ) : (
                            st.initials
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{st.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--slate-400)' }}>{st.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{st.section}</td>
                    <td>
                      <div className="gradebook-score-control">
                        <button
                          className="score-stepper-btn"
                          onClick={() => handleAdjustAttendance(st.id, -1)}
                          title="Decrement attendance"
                        >
                          -
                        </button>
                        <span className="score-value-text">{st.attendance}%</span>
                        <button
                          className="score-stepper-btn"
                          onClick={() => handleAdjustAttendance(st.id, 1)}
                          title="Increment attendance"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="gradebook-score-control">
                        <button
                          className="score-stepper-btn"
                          onClick={() => handleAdjustScore(st.id, -1)}
                          title="Decrement score"
                        >
                          -
                        </button>
                        <span className="score-value-text">{st.score}%</span>
                        <button
                          className="score-stepper-btn"
                          onClick={() => handleAdjustScore(st.id, 1)}
                          title="Increment score"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>+{st.growth} pts</td>
                    <td>
                      <select
                        className={`gradebook-status-select ${
                          st.status === 'Excelling'
                            ? 'badge-blue'
                            : st.status === 'Needs support'
                            ? 'badge-draft'
                            : 'badge-active'
                        }`}
                        value={st.status}
                        onChange={(e) => handleQuickStatusChange(st.id, e.target.value)}
                      >
                        <option value="On track">On track</option>
                        <option value="Needs support">Needs support</option>
                        <option value="Excelling">Excelling</option>
                      </select>
                    </td>
                    <td>{st.rank}</td>
                    <td style={{ fontSize: '12px', color: 'var(--slate-600)' }}>
                      {st.exams?.[0] ? `${st.exams[0].subject}: ${st.exams[0].score}` : 'Pending'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => {
                            setSelectedStudentId(st.id);
                            setViewMode('detail');
                          }}
                          title="View detailed student profile"
                        >
                          Profile
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => {
                            setStudentToEdit(st);
                            setIsEditStudentOpen(true);
                          }}
                          title="Edit full student record"
                        >
                          <Pencil size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: STUDENT PROFILE VIEW (Detailed trajectory & Maya Patel exam cards) */}
      {viewMode === 'detail' && (
        <div className="students-view-grid">
          {/* Left Column: Student Selection List */}
          <div className="students-list-panel">
            <div className="panel-inner-header-row">
              <div>
                <h2 className="panel-title">{selectedClass === 'All classes' ? 'All Institute' : selectedClass.split('·')[0].trim()} students</h2>
                <p className="panel-subtitle">Select a student to explore their progress</p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsAddStudentOpen(true)}
                title="Enroll a new student"
              >
                <Plus size={14} />
                <span>Add student</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="student-search-box">
              <Search size={15} className="student-search-icon" />
              <input
                type="text"
                className="student-search-input"
                placeholder="Search students by name or ID"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setStudentPage(1);
                }}
              />
            </div>

            {/* Student Table / Cards */}
            <div className="students-table-wrapper">
              <table className="students-list-table">
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>ATTEND.</th>
                    <th>SCORE</th>
                    <th>GROWTH</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((st) => {
                    const isSelected = selectedStudentId === st.id;
                    return (
                      <tr
                        key={st.id}
                        className={`student-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedStudentId(st.id)}
                      >
                        <td className="student-cell-profile">
                          <div className="student-avatar-circle">
                            {st.photo ? (
                              <img src={st.photo} alt={st.name} className="student-avatar-img" />
                            ) : (
                              st.initials
                            )}
                          </div>
                          <div className="student-id-name">
                            <span className="student-row-name">{st.name}</span>
                            <span className="student-row-id">{st.id}</span>
                          </div>
                        </td>
                        <td className="metric-cell">{st.attendance}%</td>
                        <td className="metric-cell">{st.score}%</td>
                        <td className="metric-cell growth-positive" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <span>+{st.growth} pts</span>
                            <button
                              type="button"
                              className="btn-edit-next-exam"
                              style={{ padding: '2px', opacity: 0.7 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentId(st.id);
                                setStudentToEdit(st);
                                setIsEditStudentOpen(true);
                              }}
                              title={`Edit ${st.name} record`}
                            >
                              <Pencil size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="students-pagination-bar">
              <span className="pagination-text">
                {totalFiltered > 0
                  ? `${(studentPage - 1) * studentsPerPage + 1}–${Math.min(studentPage * studentsPerPage, totalFiltered)} of ${totalFiltered} students`
                  : '0 students'}
              </span>
              {totalFiltered > studentsPerPage && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={studentPage === 1}
                    onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={studentPage * studentsPerPage >= totalFiltered}
                    onClick={() => setStudentPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Needs Support Alert Banner */}
            <div
              className="needs-support-alert-card"
              onClick={() => setPerformanceFilter('Needs support')}
              title="Click to filter to students needing support"
            >
              <div className="alert-heart-icon-box">
                <Heart size={16} className="heart-icon" />
              </div>
              <div className="alert-text">
                <strong>{needsSupportCount} students</strong> in your classes need support. Filter by performance level to plan interventions.
              </div>
            </div>
          </div>

          {/* Right Column: Selected Student Detail Dashboard */}
          <div className="student-detail-panel">
            {selectedStudent && (
              <>
                {/* Profile Card */}
                <div className="student-hero-card">
                  <div className="hero-top-row">
                    <div className="hero-left-info">
                      <div className="hero-avatar">
                        {selectedStudent.photo ? (
                          <img src={selectedStudent.photo} alt={selectedStudent.name} className="hero-avatar-img" />
                        ) : (
                          selectedStudent.initials
                        )}
                      </div>
                      <div>
                        {!isEditingStudentName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2
                              className="hero-name"
                              onClick={() => {
                                setInlineStudentName(selectedStudent.name);
                                setIsEditingStudentName(true);
                              }}
                              style={{ cursor: 'pointer' }}
                              title="Click to rename student"
                            >
                              {selectedStudent.name}
                            </h2>
                            <button
                              type="button"
                              className="btn-edit-next-exam"
                              onClick={() => {
                                setInlineStudentName(selectedStudent.name);
                                setIsEditingStudentName(true);
                              }}
                              title="Rename student"
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleQuickRenameStudent} style={{ display: 'flex', gap: '6px', alignItems: 'center', margin: '3px 0' }}>
                            <input
                              type="text"
                              className="text-input"
                              style={{ fontSize: '15px', fontWeight: 700, padding: '2px 8px', height: '28px', width: '220px' }}
                              value={inlineStudentName}
                              onChange={(e) => setInlineStudentName(e.target.value)}
                              required
                              autoFocus
                            />
                            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 6px', fontSize: '11px' }}
                              onClick={() => setIsEditingStudentName(false)}
                            >
                              Cancel
                            </button>
                          </form>
                        )}
                        <div className="hero-meta">
                          {selectedStudent.id} · {selectedStudent.section} · {selectedStudent.term}
                        </div>
                      </div>
                    </div>
                    <div className="hero-actions-right">
                      <select
                        className={`badge ${
                          selectedStudent.status === 'Excelling'
                            ? 'badge-blue'
                            : selectedStudent.status === 'Needs support'
                            ? 'badge-draft'
                            : 'badge-active'
                        }`}
                        style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                        value={selectedStudent.status}
                        onChange={(e) => handleQuickStatusChange(selectedStudent.id, e.target.value)}
                        title="Change status"
                      >
                        <option value="On track">On track</option>
                        <option value="Needs support">Needs support</option>
                        <option value="Excelling">Excelling</option>
                      </select>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setStudentToEdit(selectedStudent);
                          setIsEditStudentOpen(true);
                        }}
                        title="Edit student profile and performance stats"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteStudent(selectedStudent.id)}
                        title="Remove student record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* 4 KPI Metrics with Quick Steppers */}
                  <div className="hero-metrics-grid">
                    <div className="metric-tile">
                      <div className="metric-label">Attendance</div>
                      <div className="metric-value-row">
                        <span className="metric-value">{selectedStudent.attendance}%</span>
                        <div className="hero-quick-steppers">
                          <button
                            className="mini-stepper-btn"
                            onClick={() => handleAdjustAttendance(selectedStudent.id, -1)}
                            title="-1% attendance"
                          >
                            -
                          </button>
                          <button
                            className="mini-stepper-btn"
                            onClick={() => handleAdjustAttendance(selectedStudent.id, 1)}
                            title="+1% attendance"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="metric-tile">
                      <div className="metric-label">Overall score</div>
                      <div className="metric-value-row">
                        <span className="metric-value">{selectedStudent.score}%</span>
                        <div className="hero-quick-steppers">
                          <button
                            className="mini-stepper-btn"
                            onClick={() => handleAdjustScore(selectedStudent.id, -1)}
                            title="-1 pt score"
                          >
                            -
                          </button>
                          <button
                            className="mini-stepper-btn"
                            onClick={() => handleAdjustScore(selectedStudent.id, 1)}
                            title="+1 pt score"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="metric-tile">
                      <div className="metric-label">Growth</div>
                      <div className="metric-value metric-growth">+{selectedStudent.growth} pts</div>
                    </div>

                    <div className="metric-tile">
                      <div className="metric-label">Class rank</div>
                      <div className="metric-value">{selectedStudent.rank}</div>
                    </div>
                  </div>
                </div>

                {/* Individual Growth & Performance Chart Card */}
                <div className="performance-chart-card">
                  <div className="chart-header-row">
                    <div>
                      <h3 className="card-section-title">Individual growth & performance</h3>
                      <div className="card-section-subtitle">
                        {selectedStudent.name} · Compared with Grade 10-A
                      </div>
                    </div>
                    <div className="chart-legend-row">
                      <div className="legend-item">
                        <span className="legend-indicator solid-purple" />
                        <span>Overall score</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-indicator dashed-green" />
                        <span>Class average</span>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsEditTrendOpen(true)}
                        style={{ padding: '3px 8px', fontSize: '11px', gap: '4px', marginLeft: '6px' }}
                        title="Directly edit weekly score points"
                      >
                        <Pencil size={11} />
                        <span>Edit Trend</span>
                      </button>
                    </div>
                  </div>

                  <div className="chart-score-summary">
                    <span className="summary-score">{selectedStudent.score}%</span>
                    <span className="summary-growth">+{selectedStudent.growth} pts since August</span>
                  </div>

                  {/* SVG Line Chart */}
                  <div className="svg-chart-container">
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="growth-line-chart"
                      preserveAspectRatio="none"
                    >
                      {/* Y-axis guidelines */}
                      <line x1={paddingX} y1={getY(100)} x2={chartWidth - paddingX} y2={getY(100)} className="grid-line" />
                      <text x={paddingX - 10} y={getY(100) + 4} className="grid-label">100%</text>

                      <line x1={paddingX} y1={getY(80)} x2={chartWidth - paddingX} y2={getY(80)} className="grid-line" />
                      <text x={paddingX - 10} y={getY(80) + 4} className="grid-label">80%</text>

                      <line x1={paddingX} y1={getY(60)} x2={chartWidth - paddingX} y2={getY(60)} className="grid-line" />
                      <text x={paddingX - 10} y={getY(60) + 4} className="grid-label">60%</text>

                      {/* Class Average Trend (Dashed Line) */}
                      <path
                        d={classAvgPathD}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="trend-class-avg"
                      />

                      {/* Student Overall Score Trend (Solid Purple Line) */}
                      <path
                        d={studentPathD}
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="2.5"
                        className="trend-student-score"
                      />

                      {/* Data Points */}
                      {studentPoints.map((pt, idx) => {
                        const x = getX(idx);
                        const y = getY(pt.score);
                        return (
                          <g key={idx}>
                            <circle
                              cx={x}
                              cy={y}
                              r={hoveredPoint === idx ? 6 : 4}
                              className="chart-dot"
                              onMouseEnter={() => setHoveredPoint(idx)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                            {/* X-axis date labels */}
                            <text x={x} y={chartHeight - 4} textAnchor="middle" className="x-axis-label">
                              {pt.date}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Tooltip on hover */}
                    {hoveredPoint !== null && (
                      <div
                        className="chart-hover-tooltip"
                        style={{
                          left: `${(getX(hoveredPoint) / chartWidth) * 100}%`,
                          top: `${getY(studentPoints[hoveredPoint].score) - 45}px`
                        }}
                      >
                        <div className="tooltip-date">{studentPoints[hoveredPoint].date}</div>
                        <div className="tooltip-student">Score: <strong>{studentPoints[hoveredPoint].score}%</strong></div>
                        <div className="tooltip-avg">Class Avg: {CLASS_AVERAGE_TREND[hoveredPoint]?.avg}%</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exam Results Table Card with Full Row Editing */}
                <div className="exam-results-card">
                  <div className="card-header-row">
                    <div>
                      <h3 className="card-section-title">{selectedStudent.name}'s exam results</h3>
                      <div className="card-section-subtitle">Published assessments from current courses</div>
                    </div>
                    <div className="card-header-actions-group">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsAddExamOpen(true)}
                        title="Add assessment"
                      >
                        <Plus size={13} />
                        <span>Add exam</span>
                      </button>
                      <button
                        className="card-action-link"
                        onClick={() => onOpenReportModal()}
                      >
                        Full report
                      </button>
                    </div>
                  </div>

                  <div className="exam-table-wrapper">
                    <table className="exam-results-table">
                      <thead>
                        <tr>
                          <th>SUBJECT</th>
                          <th>ASSESSMENT</th>
                          <th>SCORE</th>
                          <th>GRADE</th>
                          <th style={{ textAlign: 'right' }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudent.exams?.map((ex, i) => (
                          <tr key={i}>
                            <td className="exam-subject-cell">{ex.subject}</td>
                            <td className="exam-assessment-cell">{ex.assessment}</td>
                            <td className="exam-score-cell">{ex.score}</td>
                            <td>
                              <span
                                className={`badge-grade ${
                                  ex.grade === 'A+'
                                    ? 'badge-grade-aplus'
                                    : ex.grade === 'A'
                                    ? 'badge-grade-a'
                                    : ex.grade?.startsWith('B')
                                    ? 'badge-grade-b'
                                    : 'badge-grade-c'
                                }`}
                              >
                                {ex.grade}
                              </span>
                            </td>
                            <td className="exam-action-cell">
                              <button
                                className="btn-exam-row-edit"
                                onClick={() => {
                                  setExamToEdit({ exam: ex, index: i });
                                  setIsEditExamOpen(true);
                                }}
                                title="Edit mark & grade"
                              >
                                <Pencil size={11} />
                                <span>Edit</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Next Exam Notice with Inline Edit */}
                  <div className="next-exam-notice">
                    <Calendar size={14} className="notice-cal-icon" />
                    {!isEditingNextExam ? (
                      <>
                        <span>Next exam: {selectedStudent.nextExam}</span>
                        <button
                          className="btn-edit-next-exam"
                          onClick={() => {
                            setNextExamInput(selectedStudent.nextExam || 'Mathematics midterm · 12 October');
                            setIsEditingNextExam(true);
                          }}
                          title="Edit next exam date & topic"
                        >
                          <Pencil size={12} />
                        </button>
                      </>
                    ) : (
                      <form onSubmit={handleSaveNextExam} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="text-input"
                          style={{ padding: '2px 6px', fontSize: '11px', height: '26px', width: '240px' }}
                          value={nextExamInput}
                          onChange={(e) => setNextExamInput(e.target.value)}
                          placeholder="e.g. Physics practical · 18 October"
                          required
                          autoFocus
                        />
                        <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 6px', fontSize: '11px' }}
                          onClick={() => setIsEditingNextExam(false)}
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Class Teacher Feedback Card with Preset Remark Suggestions */}
                <div className="teacher-feedback-card">
                  <div className="feedback-card-header">
                    <div className="feedback-card-title">
                      <MessageSquare size={15} />
                      <span>{selectedStudent.feedback?.author || 'Teacher feedback'} · {selectedStudent.feedback?.date || 'Today'}</span>
                    </div>
                    {!isAddingFeedback && (
                      <button
                        className="edit-feedback-btn"
                        onClick={() => {
                          setNewFeedbackText(selectedStudent.feedback?.text || '');
                          setFeedbackAuthor(selectedStudent.feedback?.author || "Daniel's feedback");
                          setFeedbackDate(selectedStudent.feedback?.date || 'Today');
                          setIsAddingFeedback(true);
                        }}
                      >
                        Update note
                      </button>
                    )}
                  </div>

                  {!isAddingFeedback ? (
                    <p className="feedback-quote-text">
                      "{selectedStudent.feedback?.text}"
                    </p>
                  ) : (
                    <form onSubmit={handleAddFeedback} className="feedback-edit-form">
                      {/* Preset Remark Suggestions */}
                      <div style={{ fontSize: '11px', color: 'var(--slate-600)', fontWeight: 600 }}>
                        Quick Remark Presets (click to insert):
                      </div>
                      <div className="preset-remarks-container">
                        {PRESET_REMARKS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="preset-pill-btn"
                            onClick={() => setNewFeedbackText(preset)}
                          >
                            {preset.slice(0, 35)}...
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                        <div>
                          <label style={{ fontSize: '10.5px', color: 'var(--slate-500)', fontWeight: 600 }}>Teacher Name / Signature</label>
                          <input
                            type="text"
                            className="text-input"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            value={feedbackAuthor}
                            onChange={(e) => setFeedbackAuthor(e.target.value)}
                            placeholder="e.g. Daniel Reed (Class Teacher)"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10.5px', color: 'var(--slate-500)', fontWeight: 600 }}>Date Label</label>
                          <input
                            type="text"
                            className="text-input"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            value={feedbackDate}
                            onChange={(e) => setFeedbackDate(e.target.value)}
                            placeholder="e.g. 28 Sep or Today"
                          />
                        </div>
                      </div>

                      <textarea
                        className="textarea-input"
                        value={newFeedbackText}
                        onChange={(e) => setNewFeedbackText(e.target.value)}
                        placeholder="Add instructor observation, academic commendation, or intervention note..."
                        rows={3}
                        required
                        autoFocus
                      />

                      <div className="feedback-form-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setIsAddingFeedback(false)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-sm">
                          <Send size={13} />
                          <span>Save note</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={isEditStudentOpen}
        onClose={() => {
          setIsEditStudentOpen(false);
          setStudentToEdit(null);
        }}
        student={studentToEdit || selectedStudent}
        onSaveStudent={handleSaveStudent}
        onDeleteStudent={handleDeleteStudent}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onAddStudent={handleAddStudent}
      />

      {/* Add Exam Modal */}
      <AddExamModal
        isOpen={isAddExamOpen}
        onClose={() => setIsAddExamOpen(false)}
        studentName={selectedStudent.name}
        onAddExam={handleAddExam}
      />

      {/* Edit Exam Modal */}
      <EditExamModal
        isOpen={isEditExamOpen}
        onClose={() => {
          setIsEditExamOpen(false);
          setExamToEdit({ exam: null, index: -1 });
        }}
        exam={examToEdit.exam}
        examIndex={examToEdit.index}
        onSaveExam={handleSaveExam}
        onDeleteExam={handleDeleteExam}
        studentName={selectedStudent.name}
      />

      {/* Edit Trend Points Modal */}
      <EditTrendModal
        isOpen={isEditTrendOpen}
        onClose={() => setIsEditTrendOpen(false)}
        student={selectedStudent}
        onSaveTrend={handleSaveTrend}
      />
    </div>
  );
}
