import { adminAPI, teacherAPI } from '../../../services/api';

export const studentService = {
  getAdminStudents: (params) => adminAPI.getStudents(params),
  createStudent: (data) => adminAPI.createStudent(data),
  updateStudent: (id, data) => adminAPI.updateStudent(id, data),
  archiveStudent: (id) => adminAPI.archiveStudent(id),
  restoreStudent: (id) => adminAPI.restoreStudent(id),
  getTeacherStudents: (params) => teacherAPI.getStudents(params),
  getStudentDetail: (id) => teacherAPI.getStudentDetail(id),
  getStudentResults: (id) => teacherAPI.getStudentResults(id),
  addFeedback: (id, text) => teacherAPI.addFeedback(id, text)
};

export default studentService;
