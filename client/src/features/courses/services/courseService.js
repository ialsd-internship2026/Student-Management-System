import { adminAPI } from '../../../services/api';

export const courseService = {
  getCourses: (params) => adminAPI.getCourses(params),
  createCourse: (data) => adminAPI.createCourse(data),
  updateCourse: (id, data) => adminAPI.updateCourse(id, data),
  launchCourse: (id) => adminAPI.launchCourse(id),
  getClasses: () => adminAPI.getClasses(),
  createSection: (data) => adminAPI.createSection(data),
  updateSection: (id, data) => adminAPI.updateSection(id, data)
};

export default courseService;
