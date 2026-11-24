/**
 * Data Model Transformers
 * Transforms MongoDB / Express API response schemas into client UI consumption format.
 */

export function guessIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('math') || n.includes('calculus') || n.includes('algebra')) return 'sigma';
  if (n.includes('phys')) return 'atom';
  if (n.includes('comp') || n.includes('code') || n.includes('cs')) return 'code';
  if (n.includes('bio')) return 'leaf';
  if (n.includes('chem')) return 'flask';
  if (n.includes('hist')) return 'landmark';
  if (n.includes('art') || n.includes('design')) return 'palette';
  return 'book';
}

export function transformCourse(c) {
  const teacherName = c.teacherId?.name || (typeof c.teacherId === 'string' ? c.teacherId : 'Unassigned');
  return {
    id: c._id || c.id,
    name: c.name,
    code: c.code,
    type: c.type || 'Core course',
    iconType: guessIcon(c.name),
    teacher: teacherName,
    teacherObjectId: c.teacherId?._id || c.teacherId || null,
    sections: ['Grade 10-A', 'Grade 10-B'],
    grade: c.grade || 'Grade 10',
    term: c.term || 'Fall term 2026',
    studentsCount: c.studentsCount || 0,
    status: (c.status || 'draft').charAt(0).toUpperCase() + (c.status || 'draft').slice(1),
    credits: c.credits ? `${c.credits} credits` : '3 credits',
    description: c.description || '',
    room: c.room || '204',
    capacity: c.capacity || 36,
    attendanceMin: c.attendanceMinimumPercent ? `${c.attendanceMinimumPercent}%` : '85%',
    elements: {
      attendance: c.studentElementsVisibility?.attendanceSchedule ?? true,
      growth: c.studentElementsVisibility?.growthPerformance ?? true,
      examResults: c.studentElementsVisibility?.examResults ?? true,
      resources: c.studentElementsVisibility?.learningResources ?? true
    }
  };
}

export function transformSection(cls) {
  const teacherNames = Array.isArray(cls.teachers)
    ? cls.teachers.map(t => t.name).join(', ')
    : Array.isArray(cls.teacherIds)
    ? cls.teacherIds.map(t => (typeof t === 'object' ? t.name : t)).join(', ')
    : 'Unassigned';

  return {
    id: cls._id || cls.id,
    section: cls.name,
    name: cls.name,
    term: cls.term || cls.academicTerm || 'Fall term 2026',
    capacity: cls.capacity || 30,
    room: cls.room || 'Room 204',
    teacher: teacherNames || 'Unassigned',
    studentCount: cls.studentCount || (Array.isArray(cls.studentIds) ? cls.studentIds.length : 0)
  };
}

export function transformStudent(s) {
  const className = s.class?.name || (typeof s.classId === 'object' ? s.classId?.name : '') || 'Grade 10-A';
  const score = s.overallScorePercent ?? 85;
  const att = s.attendancePercent ?? 92;
  const status = score >= 90 ? 'Excelling' : score < 75 ? 'Needs support' : 'On track';

  return {
    id: s.studentCode || s._id || s.id,
    _id: s._id || s.id,
    name: s.name,
    studentCode: s.studentCode || '',
    section: className,
    classId: s.class?._id || s.classId?._id || s.classId || null,
    status,
    attendance: att,
    score,
    growth: s.growth ?? 5,
    rank: s.classRank ? `${s.classRank} / 30` : '12 / 30',
    enrollmentDate: s.enrollmentDate,
    photo: s.photo || s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=4f46e5&color=fff&size=256`,
    initials: s.name ? s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST',
    exams: s.exams || [],
    trend: s.trend || [
      { assessment: 'Diagnostic test', date: 'Sep 15', score: Math.max(50, score - 8) },
      { assessment: 'Weekly quiz 02', date: 'Sep 29', score: Math.max(50, score - 4) },
      { assessment: 'Unit assessment 01', date: 'Oct 13', score },
      { assessment: 'Midterm preview', date: 'Oct 27', score: Math.min(100, score + 3) }
    ],
    nextExam: s.nextExam || 'Mathematics Midterm Assessment · 12 Oct',
    feedback: s.feedback || {
      author: "Faculty feedback",
      date: 'Recent',
      text: "Consistently engaged in problem solving. Solid comprehension of core principles."
    }
  };
}

export function transformTeacher(t) {
  const subjects = t.subjects || [];
  const primarySubject = subjects[0] || 'General';
  const assigned = Array.isArray(t.assignedClassIds)
    ? t.assignedClassIds.map(c => (typeof c === 'object' ? c.name : c))
    : [];

  return {
    id: t._id || t.id,
    name: t.name,
    email: t.email,
    role: `${primarySubject} Faculty`,
    department: t.department || primarySubject,
    subjects,
    assignedClasses: assigned,
    assignedClass: assigned[0] || 'Grade 10-A',
    photo: t.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=7c3aed&color=fff&size=256`,
    initials: t.name ? t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'TC',
    active: t.active !== false
  };
}
