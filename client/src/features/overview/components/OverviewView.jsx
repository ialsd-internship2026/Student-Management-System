import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  Award,
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Check,
  X
} from 'lucide-react';
import EditAnnouncementModal from './EditAnnouncementModal';

export default function OverviewView({
  workspace,
  courses,
  students,
  onNavigate,
  announcements = [],
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  upcomingNotice = 'Mathematics Midterm Assessment scheduled for 12 October in Hall B & Lab 3.',
  onUpdateUpcomingNotice,
  showToast,
  onOpenEditTermWidget,
  onOpenCustomizer,
  onOpenEditProfile
}) {
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState(null);
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [noticeInput, setNoticeInput] = useState(upcomingNotice);

  const activeCoursesCount = courses.filter(c => c.status === 'Active').length;
  const draftCoursesCount = courses.filter(c => c.status === 'Draft').length;
  const avgAttendance = Math.round(
    students.reduce((acc, s) => acc + s.attendance, 0) / (students.length || 1)
  );
  const avgScore = Math.round(
    students.reduce((acc, s) => acc + s.score, 0) / (students.length || 1)
  );

  const handleSaveNotice = (e) => {
    e.preventDefault();
    if (onUpdateUpcomingNotice) {
      onUpdateUpcomingNotice(noticeInput);
    }
    setIsEditingNotice(false);
    if (showToast) showToast('Updated upcoming institute assessment notice.');
  };

  return (
    <div className="overview-container">
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1 className="view-title">
            {workspace === 'admin' ? 'Institute Overview' : 'Teacher Dashboard'}
          </h1>
          <p className="view-subtitle">
            {workspace === 'admin'
              ? 'Academic health, curriculum readiness, and institute statistics.'
              : 'Weekly classes overview, student trajectory, and upcoming assessments.'}
          </p>
        </div>

        <div className="overview-status-pill">
          <span className="live-dot" />
          <span>Fall 2026 Term · Week 6 of 16</span>
        </div>
      </div>

      {/* Admin Universal Quick Edit Controls */}
      {workspace === 'admin' && (
        <div
          className="admin-universal-edit-bar"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '16px'
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Pencil size={13} />
            <span>Admin Edit Center:</span>
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '3px 9px', gap: '4px' }}
            onClick={() => onNavigate('courses')}
            title="Edit curriculum courses, syllabus, and capacities"
          >
            <span>📚 Edit Courses</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '3px 9px', gap: '4px' }}
            onClick={() => onNavigate('teachers')}
            title="Edit teachers, department assignments, and class teachers"
          >
            <span>👩‍🏫 Edit Teachers & Depts</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '3px 9px', gap: '4px' }}
            onClick={() => onNavigate('students')}
            title="Edit student records, grades, and exams"
          >
            <span>🎓 Edit Students & Scores</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '3px 9px', gap: '4px' }}
            onClick={() => onNavigate('attendance')}
            title="Edit student attendance & mark roll-call"
          >
            <span>📋 Edit Attendance</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '3px 9px', gap: '4px' }}
            onClick={() => onNavigate('schedule')}
            title="Edit weekly schedule periods and timetables"
          >
            <span>📅 Edit Timetable</span>
          </button>
          {onOpenEditTermWidget && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '3px 9px', gap: '4px' }}
              onClick={onOpenEditTermWidget}
              title="Edit Academic Term Progress Widget"
            >
              <span>⏱️ Edit Term Widget</span>
            </button>
          )}
          {onOpenCustomizer && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '3px 9px', gap: '4px' }}
              onClick={onOpenCustomizer}
              title="Edit colors, themes, and branding"
            >
              <span>🎨 Edit Theme & Colors</span>
            </button>
          )}
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="overview-stats-grid">
        <div className="stat-card" onClick={() => onNavigate('courses')}>
          <div className="stat-icon-wrapper purple">
            <BookOpen size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-title">Active Courses</div>
            <div className="stat-number-row">
              <span className="stat-number">{activeCoursesCount}</span>
              {draftCoursesCount > 0 && (
                <span className="stat-badge draft">+{draftCoursesCount} Draft</span>
              )}
            </div>
            <div className="stat-desc">Across Grade 10 - Grade 12</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('students')}>
          <div className="stat-icon-wrapper green">
            <GraduationCap size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-title">Enrolled Students</div>
            <div className="stat-number-row">
              <span className="stat-number">{students.length}</span>
              <span className="stat-badge success">+12% vs last term</span>
            </div>
            <div className="stat-desc">Grade 10-A Cohort tracked</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('attendance')}>
          <div className="stat-icon-wrapper blue">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-title">Average Attendance</div>
            <div className="stat-number-row">
              <span className="stat-number">{avgAttendance}%</span>
              <span className="stat-badge success">Target: 85%</span>
            </div>
            <div className="stat-desc">Above institute threshold</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('students')}>
          <div className="stat-icon-wrapper amber">
            <Award size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-title">Cohort Mean Score</div>
            <div className="stat-number-row">
              <span className="stat-number">{avgScore}%</span>
              <span className="stat-badge purple">+8.4 pts growth</span>
            </div>
            <div className="stat-desc">Based on Unit test 02</div>
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="overview-sections-grid">
        {/* Left Column: Quick Action Cards & Next Deadlines */}
        <div className="overview-card">
          <div className="card-top">
            <h2 className="card-heading">Curriculum & Class Sections</h2>
            <button className="link-btn" onClick={() => onNavigate('courses')}>
              Manage <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="course-progress-list">
            {courses.slice(0, 4).map(c => (
              <div key={c.id} className="course-progress-item" onClick={() => onNavigate('courses')}>
                <div className="item-title-group">
                  <span className="item-name">{c.name}</span>
                  <span className="item-code">{c.code} · {c.teacher}</span>
                </div>
                <div className="item-stats">
                  <span className={`badge ${c.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>
                    {c.status}
                  </span>
                  <span className="item-students">{c.studentsCount} students</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Institute Notices & Timeline */}
        <div className="overview-card">
          <div className="card-top">
            <div>
              <h2 className="card-heading">Announcements & Milestones</h2>
              <span className="sub-tag">Academic Calendar</span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsAddAnnouncementOpen(true)}
              style={{ padding: '3px 9px', fontSize: '11px', gap: '4px' }}
              title="Publish a new announcement notice"
            >
              <Plus size={12} />
              <span>Add Notice</span>
            </button>
          </div>

          <div className="announcements-list">
            {announcements.map(a => (
              <div key={a.id} className="announcement-item announcement-item-actionable">
                <div className="announcement-bullet" />
                <div className="announcement-info">
                  <div className="announcement-title">{a.title}</div>
                  <div className="announcement-meta">
                    <span>{a.date}</span> · <span>{a.author}</span>
                  </div>
                </div>
                <div className="announcement-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    className="announcement-edit-btn"
                    onClick={() => {
                      setAnnouncementToEdit(a);
                      setIsAddAnnouncementOpen(true);
                    }}
                    title="Edit announcement title and date"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--slate-400)' }}
                  >
                    <Pencil size={12} />
                  </button>
                  {onDeleteAnnouncement && (
                    <button
                      className="announcement-delete-btn"
                      onClick={() => onDeleteAnnouncement(a.id)}
                      title="Remove this announcement"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Upcoming Exam Callout with Inline Edit Option */}
            <div className="upcoming-exam-callout">
              <div className="callout-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} />
                  <span>Next Institute Assessment</span>
                </div>
                {!isEditingNotice ? (
                  <button
                    className="callout-edit-icon-btn"
                    onClick={() => {
                      setNoticeInput(upcomingNotice);
                      setIsEditingNotice(true);
                    }}
                    title="Edit assessment notice"
                  >
                    <Pencil size={12} />
                  </button>
                ) : null}
              </div>

              {!isEditingNotice ? (
                <p className="callout-body">{upcomingNotice}</p>
              ) : (
                <form onSubmit={handleSaveNotice} style={{ marginTop: '8px' }}>
                  <textarea
                    className="text-input"
                    rows={2}
                    style={{ fontSize: '12px', width: '100%', resize: 'vertical' }}
                    value={noticeInput}
                    onChange={(e) => setNoticeInput(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsEditingNotice(false)}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      Save Notice
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Announcement Modal */}
      <EditAnnouncementModal
        isOpen={isAddAnnouncementOpen}
        announcementToEdit={announcementToEdit}
        onClose={() => {
          setIsAddAnnouncementOpen(false);
          setAnnouncementToEdit(null);
        }}
        onAddAnnouncement={(newAnn) => {
          if (onAddAnnouncement) onAddAnnouncement(newAnn);
          if (showToast) showToast(`Published announcement: "${newAnn.title}"`);
        }}
        onSaveAnnouncement={(updatedAnn) => {
          if (onUpdateAnnouncement) onUpdateAnnouncement(updatedAnn);
          if (showToast) showToast(`Updated announcement: "${updatedAnn.title}"`);
        }}
      />
    </div>
  );
}
