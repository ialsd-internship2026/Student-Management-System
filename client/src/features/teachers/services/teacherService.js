import { adminAPI } from '../../../services/api';

export const teacherService = {
  getTeachers: (params) => adminAPI.getTeachers(params),
  createTeacher: (data) => adminAPI.createTeacher(data),
  updateTeacher: (id, data) => adminAPI.updateTeacher(id, data),
  deactivateTeacher: (id) => adminAPI.deactivateTeacher(id),
  activateTeacher: (id) => adminAPI.activateTeacher(id)
};

export default teacherService;
