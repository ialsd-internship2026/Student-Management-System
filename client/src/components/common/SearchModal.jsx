import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, GraduationCap, ArrowRight, User } from 'lucide-react';

export default function SearchModal({
  isOpen,
  onClose,
  courses,
  students,
  onSelectCourse,
  onSelectStudent
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open handled by parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.code.toLowerCase().includes(query.toLowerCase()) ||
    c.teacher.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog search-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-header">
          <Search size={18} className="search-palette-icon" />
          <input
            type="text"
            className="search-palette-input"
            placeholder="Search courses, students, grades, or faculty..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="esc-key" onClick={onClose}>ESC</kbd>
        </div>

        <div className="search-results-body">
          {/* Courses matches */}
          <div className="result-category-title">Courses</div>
          {filteredCourses.length > 0 ? (
            filteredCourses.map(course => (
              <div
                key={course.id}
                className="search-result-item"
                onClick={() => {
                  onSelectCourse(course);
                  onClose();
                }}
              >
                <div className="result-item-left">
                  <div className="result-icon-box purple">
                    <BookOpen size={15} />
                  </div>
                  <div>
                    <div className="result-item-title">{course.name}</div>
                    <div className="result-item-sub">{course.code} · {course.teacher}</div>
                  </div>
                </div>
                <span className="badge badge-active">{course.status}</span>
              </div>
            ))
          ) : (
            <div className="no-result-text">No courses match "{query}"</div>
          )}

          {/* Students matches */}
          <div className="result-category-title" style={{ marginTop: '16px' }}>
            Students & Results
          </div>
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => (
              <div
                key={student.id}
                className="search-result-item"
                onClick={() => {
                  onSelectStudent(student);
                  onClose();
                }}
              >
                <div className="result-item-left">
                  <div className="result-icon-box blue" style={{ overflow: 'hidden', padding: 0 }}>
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <GraduationCap size={15} />
                    )}
                  </div>
                  <div>
                    <div className="result-item-title">{student.name}</div>
                    <div className="result-item-sub">{student.id} · {student.section}</div>
                  </div>
                </div>
                <div className="student-quick-stat">
                  <span>Score: {student.score}%</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            ))
          ) : (
            <div className="no-result-text">No students match "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}
