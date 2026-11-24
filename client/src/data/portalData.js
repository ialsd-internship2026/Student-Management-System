// Aster Institute Portal Data
// Clean data configuration without hardcoded dummy records.
// All courses, sections, students, teachers, announcements, and timetables
// are loaded dynamically from the Express/MongoDB backend API.

export const INITIAL_COURSES = [];
export const INITIAL_SECTIONS = [];
export const INITIAL_DEPARTMENTS = ['Mathematics', 'Science', 'English', 'Computer Science'];
export const TEACHERS_LIST = [];
export const CLASS_AVERAGE_TREND = [];
export const INITIAL_STUDENTS = [];
export const INITIAL_ANNOUNCEMENTS = [];
export const TIMETABLE_DATA = [];

// Sample avatar photo presets for UI photo pickers
export const SAMPLE_STUDENT_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80'
];

export const SAMPLE_TEACHER_PHOTOS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80'
];
