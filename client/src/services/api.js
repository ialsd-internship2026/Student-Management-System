/**
 * API Service Layer
 * Centralized HTTP client for Aster SMS backend with JWT authentication.
 */

const BASE_URL = '/api';

// Token helpers in localStorage
export const getToken = () => localStorage.getItem('auth_token');
export const setToken = (token) => localStorage.setItem('auth_token', token);
export const clearToken = () => localStorage.removeItem('auth_token');

// Base HTTP request wrapper
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  // Handle CSV file download responses
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'export.csv';
    return { ok: res.ok, status: res.status, blob, filename };
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    let msg = data.message;
    if (!msg) {
      if (res.status === 502 || res.status === 504) {
        msg = 'Backend server is offline (port 8080). Please start the backend server (cd server && npm start).';
      } else if (res.status === 503) {
        msg = 'Backend service temporarily unavailable. Please check server logs.';
      } else {
        msg = `Request failed with status ${res.status}`;
      }
    }
    const error = new Error(msg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Helpers for HTTP verbs
const get = (url) => request(url, { method: 'GET' });
const post = (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) });
const put = (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) });
const del = (url) => request(url, { method: 'DELETE' });

// Query string helper
function qs(params) {
  if (!params || typeof params !== 'object') return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

// =========================================================================
// AUTH API
// =========================================================================
export const authAPI = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (userData) => post('/auth/register', userData),
  logout: () => post('/auth/logout', {}),
  me: () => get('/auth/me')
};

// =========================================================================
// ADMIN API
// =========================================================================
export const adminAPI = {
  // Overview & Classes
  getOverview: (params) => get(`/admin/overview${qs(params)}`),
  getClasses: () => get('/admin/classes'),

  // Schedule Management
  getSchedule: (params) => get(`/admin/schedule${qs(params)}`),
  createSession: (data) => post('/admin/schedule/sessions', data),
  updateSession: (id, data, applyTo = 'this') => put(`/admin/schedule/sessions/${id}?applyTo=${applyTo}`, data),
  deleteSession: (id, applyTo = 'this') => del(`/admin/schedule/sessions/${id}?applyTo=${applyTo}`),
  scheduleAssessment: (data) => post('/admin/schedule/assessments', data),
  exportSchedule: () => request('/admin/schedule/export'),

  // Courses & Sections
  getCourses: (params) => get(`/admin/courses${qs(params)}`),
  createCourse: (data) => post('/admin/courses', data),
  updateCourse: (id, data) => put(`/admin/courses/${id}`, data),
  launchCourse: (id) => post(`/admin/courses/${id}/launch`, {}),
  createSection: (data) => post('/admin/sections', data),
  updateSection: (id, data) => put(`/admin/sections/${id}`, data),

  // Students Directory
  getStudents: (params) => get(`/admin/students${qs(params)}`),
  createStudent: (data) => post('/admin/students', data),
  updateStudent: (id, data) => put(`/admin/students/${id}`, data),
  archiveStudent: (id) => put(`/admin/students/${id}/archive`, {}),
  restoreStudent: (id) => put(`/admin/students/${id}/restore`, {}),

  // Teachers Directory
  getTeachers: (params) => get(`/admin/teachers${qs(params)}`),
  createTeacher: (data) => post('/admin/teachers', data),
  updateTeacher: (id, data) => put(`/admin/teachers/${id}`, data),
  deactivateTeacher: (id) => put(`/admin/teachers/${id}/deactivate`, {}),
  activateTeacher: (id) => put(`/admin/teachers/${id}/activate`, {}),

  // Export
  exportDirectory: (type = 'students') => request(`/admin/directory/export?type=${type}`)
};

// =========================================================================
// TEACHER API
// =========================================================================
export const teacherAPI = {
  // Classes assigned to teacher
  getClasses: () => get('/teacher/classes'),

  // Teacher dashboard overview
  getOverview: (params) => get(`/teacher/overview${qs(params)}`),

  // Attendance
  getAttendance: (params) => get(`/teacher/attendance${qs(params)}`),
  saveAttendance: (data) => post('/teacher/attendance', data),
  submitAttendance: (id) => put(`/teacher/attendance/${id}/submit`, {}),

  // Students & Results
  getStudents: (params) => get(`/teacher/students${qs(params)}`),
  getStudentDetail: (id) => get(`/teacher/students/${id}`),
  getStudentResults: (id) => get(`/teacher/students/${id}/results`),
  addFeedback: (id, text) => post(`/teacher/students/${id}/feedback`, { text }),

  // Class CSV Export
  exportClass: (id) => request(`/teacher/classes/${id}/export`)
};

// =========================================================================
// STUDENT API
// =========================================================================
export const studentAPI = {
  getOverview: () => get('/student/overview'),
  getSchedule: () => get('/student/schedule'),
  getAttendance: () => get('/student/attendance'),
  getResults: () => get('/student/results'),
  getCourses: () => get('/student/courses'),
  getCourseDetail: (id) => get(`/student/courses/${id}`),
  getResources: () => get('/student/resources'),
  getAnnouncements: () => get('/student/announcements'),
  getProfile: () => get('/student/profile')
};

export default { authAPI, adminAPI, teacherAPI, studentAPI };
